"""Progress, streak, and skill-breakdown endpoints.

New routes (spec v2)
------
GET  /progress/{child_id}/summary    Aggregated stats via asyncio.gather
GET  /progress/{child_id}/history    Paginated history with entitlement gating

Legacy routes (kept for backward compatibility with existing frontend hooks)
------
GET  /children/{child_id}/streak             Current and longest streak
GET  /children/{child_id}/progress/skills    Per-skill-category breakdown
GET  /children/{child_id}/progress           Full progress summary
"""

import asyncio
import base64
import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse

from app.auth.dependencies import get_current_user
from app.auth.models import UserClaims
from app.database import get_database
from app.agents.entitlement.dependencies import get_entitlement

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Progress"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _dt(val) -> Optional[str]:
    if val is None:
        return None
    return val.isoformat() if isinstance(val, datetime) else str(val)


async def _verify_child(db, child_id: str, parent_id: str) -> dict:
    """Return the child doc or raise 404.  Excludes soft-deleted children."""
    if not ObjectId.is_valid(child_id):
        raise HTTPException(status_code=404, detail="Child not found.")
    doc = await db["children"].find_one(
        {"_id": ObjectId(child_id), "parent_id": parent_id, "deleted_at": None}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Child not found.")
    return doc


def _week_start_utc() -> datetime:
    """Return midnight UTC of the most recent Monday."""
    today = datetime.now(timezone.utc).date()
    monday = today - timedelta(days=today.weekday())   # weekday() == 0 for Monday
    return datetime(monday.year, monday.month, monday.day, tzinfo=timezone.utc)


def _encode_cursor(oid: ObjectId) -> str:
    return base64.b64encode(str(oid).encode()).decode()


def _decode_cursor(cursor: str) -> Optional[ObjectId]:
    try:
        decoded = base64.b64decode(cursor.encode()).decode()
        if ObjectId.is_valid(decoded):
            return ObjectId(decoded)
    except Exception:
        pass
    return None


# ── Legacy helper for old streak shape ────────────────────────────────────────

def _streak_shape_legacy(streak_doc: Optional[dict], child_id: str) -> dict:
    """Old camelCase shape — used only by the legacy /children/{id}/progress routes."""
    if not streak_doc:
        return {
            "childId": child_id,
            "currentStreak": 0,
            "longestStreak": 0,
            "lastCompletedDate": None,
        }
    # Streak agent now uses current_streak_days / longest_streak_days / last_activity_date
    return {
        "childId": child_id,
        "currentStreak": streak_doc.get("current_streak_days", streak_doc.get("current_streak", 0)),
        "longestStreak": streak_doc.get("longest_streak_days", streak_doc.get("longest_streak", 0)),
        "lastCompletedDate": streak_doc.get("last_activity_date", streak_doc.get("last_completed_date")),
    }


# ── New summary endpoint ───────────────────────────────────────────────────────

@router.get("/progress/{child_id}/summary")
async def get_progress_summary_v2(
    child_id: str,
    current_user: UserClaims = Depends(get_current_user),
):
    """Return aggregated progress stats for a child.

    Runs four MongoDB queries in parallel via asyncio.gather:
      1. streaks.find_one
      2. activity_completions.count_documents (total)
      3. activity_completions aggregate (by-skill breakdown)
      4. activity_completions.count_documents (this week)
    """
    db = get_database()
    await _verify_child(db, child_id, current_user.user_id)

    week_start = _week_start_utc()

    # ── By-skill aggregation pipeline ─────────────────────────────────────────
    skill_pipeline = [
        {"$match": {"child_id": child_id}},
        {"$lookup": {
            "from": "activities",
            "localField": "activity_id",
            "foreignField": "_id",
            "as": "activity",
        }},
        {"$unwind": "$activity"},
        {"$lookup": {
            "from": "skill_categories",
            "localField": "activity.skill_category_id",
            "foreignField": "_id",
            "as": "skill",
        }},
        {"$unwind": "$skill"},
        {"$group": {
            "_id": "$skill.slug",
            "count": {"$sum": 1},
            "skill_name": {"$first": "$skill.display_name"},
            "icon_name": {"$first": "$skill.icon_name"},
            "colour_hex": {"$first": "$skill.colour_hex"},
        }},
        {"$sort": {"count": -1}},
    ]

    # ── Run all four queries in parallel ──────────────────────────────────────
    streak_doc, total, by_skill_raw, this_week = await asyncio.gather(
        db["streaks"].find_one({"child_id": child_id}),
        db["activity_completions"].count_documents({"child_id": child_id}),
        db["activity_completions"].aggregate(skill_pipeline).to_list(None),
        db["activity_completions"].count_documents({
            "child_id": child_id,
            "completed_at": {"$gte": week_start},
        }),
    )

    # ── Shape streak data ─────────────────────────────────────────────────────
    current_streak = 0
    longest_streak = 0
    last_activity_date = None
    if streak_doc:
        current_streak = streak_doc.get("current_streak_days", 0)
        longest_streak = streak_doc.get("longest_streak_days", 0)
        last_activity_date = streak_doc.get("last_activity_date")

    # ── Shape by_skill ────────────────────────────────────────────────────────
    by_skill = [
        {
            "slug": row["_id"],
            "name": row.get("skill_name", row["_id"]),
            "count": row["count"],
            "icon_name": row.get("icon_name", ""),
            "colour_hex": row.get("colour_hex", "#9C51B6"),
        }
        for row in by_skill_raw
    ]

    return JSONResponse(content={"success": True, "data": {
        "child_id": child_id,
        "current_streak_days": current_streak,
        "longest_streak_days": longest_streak,
        "last_activity_date": last_activity_date,
        "total_completions": total,
        "completions_this_week": this_week,
        "by_skill": by_skill,
        "skills_explored": len(by_skill),
    }})


# ── New history endpoint ───────────────────────────────────────────────────────

@router.get("/progress/{child_id}/history")
async def get_progress_history(
    child_id: str,
    cursor: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    current_user: UserClaims = Depends(get_current_user),
):
    """Return paginated completion history for a child.

    Entitlement gating:
      - Free tier: only completions from the last 7 days are returned;
        ``meta.is_history_limited`` is set to ``true`` as a hint to show the
        "Upgrade to see full history" banner.
      - Trial / active / grace: full history, no date restriction.
    """
    db = get_database()
    await _verify_child(db, child_id, current_user.user_id)

    # ── Entitlement check ─────────────────────────────────────────────────────
    entitlement = await get_entitlement(current_user.user_id, db)
    is_limited = not entitlement["can_access_full_library"]

    filter_q: dict = {"child_id": child_id}

    if is_limited:
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        filter_q["completed_at"] = {"$gte": cutoff}

    if cursor:
        cursor_oid = _decode_cursor(cursor)
        if cursor_oid:
            existing = filter_q.get("_id", {})
            filter_q["_id"] = {**existing, "$lt": cursor_oid}

    # ── Aggregate with activity + skill lookups ───────────────────────────────
    hist_pipeline = [
        {"$match": filter_q},
        {"$sort": {"completed_at": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "activities",
            "localField": "activity_id",
            "foreignField": "_id",
            "as": "activity",
        }},
        {"$unwind": {"path": "$activity", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {
            "from": "skill_categories",
            "localField": "activity.skill_category_id",
            "foreignField": "_id",
            "as": "skill",
        }},
        {"$unwind": {"path": "$skill", "preserveNullAndEmptyArrays": True}},
    ]

    docs = await db["activity_completions"].aggregate(hist_pipeline).to_list(None)

    items = [
        {
            "id": str(d["_id"]),
            "activity_id": str(d.get("activity_id", "")),
            "activity_title": d.get("activity", {}).get("title", "") if d.get("activity") else "",
            "skill_slug": d.get("skill", {}).get("slug", "") if d.get("skill") else "",
            "skill_name": d.get("skill", {}).get("display_name", "") if d.get("skill") else "",
            "skill_colour": d.get("skill", {}).get("colour_hex", "") if d.get("skill") else "",
            "completed_at": _dt(d.get("completed_at")) or "",
            "parent_reaction": d.get("parent_reaction"),
        }
        for d in docs
    ]

    next_cursor = _encode_cursor(docs[-1]["_id"]) if len(docs) == limit else None

    return JSONResponse(content={
        "success": True,
        "data": items,
        "meta": {
            "limit": limit,
            "next_cursor": next_cursor,
            "is_history_limited": is_limited,
        },
    })


# ── Legacy routes (backward-compat) ───────────────────────────────────────────

@router.get("/children/{child_id}/streak")
async def get_streak(
    child_id: str,
    current_user: UserClaims = Depends(get_current_user),
):
    db = get_database()
    await _verify_child(db, child_id, current_user.user_id)
    streak_doc = await db["streaks"].find_one({"child_id": child_id})
    return JSONResponse(content={
        "success": True,
        "data": _streak_shape_legacy(streak_doc, child_id),
    })


@router.get("/children/{child_id}/progress/skills")
async def get_skill_breakdown(
    child_id: str,
    current_user: UserClaims = Depends(get_current_user),
):
    db = get_database()
    await _verify_child(db, child_id, current_user.user_id)

    completions = await db["activity_completions"].find(
        {"child_id": child_id}
    ).to_list(2000)

    act_ids = list({c.get("activity_id") for c in completions if c.get("activity_id")})
    activities: dict = {}
    if act_ids:
        acts = await db["activities"].find({"_id": {"$in": act_ids}}).to_list(2000)
        activities = {str(a["_id"]): a for a in acts}

    cat_counts: dict[str, int] = {}
    cat_minutes: dict[str, int] = {}
    for c in completions:
        act = activities.get(str(c.get("activity_id", "")))
        if not act:
            continue
        cat_id = str(act.get("skill_category_id", ""))
        cat_counts[cat_id] = cat_counts.get(cat_id, 0) + 1
        cat_minutes[cat_id] = cat_minutes.get(cat_id, 0) + act.get("time_estimate_minutes", 5)

    cat_oids = [ObjectId(cid) for cid in cat_counts if ObjectId.is_valid(cid)]
    categories: dict = {}
    if cat_oids:
        cats = await db["skill_categories"].find({"_id": {"$in": cat_oids}}).to_list(20)
        categories = {str(c["_id"]): c for c in cats}

    breakdown = [
        {
            "skillCategoryId": cat_id,
            "skillCategoryName": categories.get(cat_id, {}).get("display_name", cat_id),
            "colourHex": categories.get(cat_id, {}).get("colour_hex", "#9C51B6"),
            "completedCount": count,
            "totalMinutes": cat_minutes.get(cat_id, 0),
        }
        for cat_id, count in cat_counts.items()
    ]

    return JSONResponse(content={"success": True, "data": breakdown})


@router.get("/children/{child_id}/progress")
async def get_progress_legacy(
    child_id: str,
    current_user: UserClaims = Depends(get_current_user),
):
    db = get_database()
    await _verify_child(db, child_id, current_user.user_id)

    completions = await db["activity_completions"].find(
        {"child_id": child_id}
    ).to_list(2000)

    act_ids = list({c.get("activity_id") for c in completions if c.get("activity_id")})
    activities: dict = {}
    if act_ids:
        acts = await db["activities"].find({"_id": {"$in": act_ids}}).to_list(2000)
        activities = {str(a["_id"]): a for a in acts}

    total_activities = len(completions)
    total_minutes = sum(
        activities.get(str(c.get("activity_id", "")), {}).get("time_estimate_minutes", 5)
        for c in completions
    )

    streak_doc = await db["streaks"].find_one({"child_id": child_id})
    streak = _streak_shape_legacy(streak_doc, child_id)

    today = date.today()
    weekly: dict[str, int] = {
        (today - timedelta(days=i)).isoformat(): 0 for i in range(6, -1, -1)
    }
    for c in completions:
        completed_at = c.get("completed_at")
        if completed_at:
            d = (
                completed_at.date().isoformat()
                if isinstance(completed_at, datetime)
                else str(completed_at)[:10]
            )
            if d in weekly:
                weekly[d] += 1
    weekly_activity = [{"date": d, "count": cnt} for d, cnt in weekly.items()]

    cat_counts: dict[str, int] = {}
    cat_minutes_map: dict[str, int] = {}
    for c in completions:
        act = activities.get(str(c.get("activity_id", "")))
        if not act:
            continue
        cat_id = str(act.get("skill_category_id", ""))
        cat_counts[cat_id] = cat_counts.get(cat_id, 0) + 1
        cat_minutes_map[cat_id] = cat_minutes_map.get(cat_id, 0) + act.get("time_estimate_minutes", 5)

    cat_oids = [ObjectId(cid) for cid in cat_counts if ObjectId.is_valid(cid)]
    categories: dict = {}
    if cat_oids:
        cats = await db["skill_categories"].find({"_id": {"$in": cat_oids}}).to_list(20)
        categories = {str(c["_id"]): c for c in cats}

    skill_breakdown = [
        {
            "skillCategoryId": cat_id,
            "skillCategoryName": categories.get(cat_id, {}).get("display_name", cat_id),
            "colourHex": categories.get(cat_id, {}).get("colour_hex", "#9C51B6"),
            "completedCount": count,
            "totalMinutes": cat_minutes_map.get(cat_id, 0),
        }
        for cat_id, count in cat_counts.items()
    ]

    return JSONResponse(content={"success": True, "data": {
        "childId": child_id,
        "totalActivities": total_activities,
        "totalMinutes": total_minutes,
        "streak": streak,
        "skillBreakdown": skill_breakdown,
        "weeklyActivity": weekly_activity,
    }})
