"""Activity library, daily selections, completions, and reference data.

Routes
------
GET    /skill-categories                       Reference data (no auth)
GET    /age-bands                              Reference data (no auth)
GET    /activities/today/{child_id}            Today's daily selection — always free
GET    /activities                             Activity library with filters + cursor pagination
GET    /activities/{activity_id}               Single activity (entitlement checked)
POST   /activities/{activity_id}/complete      Mark activity done + update streak
GET    /children/{child_id}/completions        Completion history for a child

Agent wiring
------------
Agent 1  app.agents.daily_selection.agent   generate_for_child()
Agent 2  app.agents.streak.agent            update_streak_on_completion()
Agent 5  app.agents.fallback.agent          replace_archived_selection()
         app.agents.entitlement.dependencies get_entitlement()
"""

import base64
import logging
from datetime import date, datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.auth.models import UserClaims
from app.database import get_database

# ── Agent imports ──────────────────────────────────────────────────────────────
from app.agents.daily_selection.agent import generate_for_child
from app.agents.streak.agent import update_streak_on_completion
from app.agents.fallback.agent import replace_archived_selection
from app.agents.entitlement.dependencies import get_entitlement

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Activities"])


# ── Request bodies ─────────────────────────────────────────────────────────────

class CompleteActivityBody(BaseModel):
    child_id: str
    reaction: Optional[str] = None   # optional emoji, e.g. "😊"
    note: Optional[str] = None       # optional parent note (Phase 2)


# ── Serialisation helpers ──────────────────────────────────────────────────────

def _dt(val) -> Optional[str]:
    if val is None:
        return None
    return val.isoformat() if isinstance(val, datetime) else str(val)


def _skill_cat_shape(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "slug": doc.get("slug", ""),
        "displayName": doc.get("display_name", ""),
        "description": doc.get("description", ""),
        "iconName": doc.get("icon_name", ""),
        "colourHex": doc.get("colour_hex", ""),
        "sortOrder": doc.get("sort_order", 0),
        "isActive": doc.get("is_active", True),
    }


def _age_band_shape(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "label": doc.get("label", ""),
        "minAgeYears": doc.get("min_age_years", 0),
        "maxAgeYears": doc.get("max_age_years", 0),
        "sortOrder": doc.get("sort_order", 0),
    }


def _activity_shape(
    doc: dict,
    skill_cat: Optional[dict] = None,
    age_band: Optional[dict] = None,
    is_locked: bool = False,
) -> dict:
    """Serialise an activity document.

    When ``is_locked`` is True (free-tier browse), coaching content is
    omitted — only title, metadata, and the lock flag are returned.
    """
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "slug": doc.get("slug", ""),
        "skillCategoryId": str(doc.get("skill_category_id", "")),
        "skillCategory": _skill_cat_shape(skill_cat) if skill_cat else None,
        "ageBandId": str(doc.get("age_band_id", "")),
        "ageBand": _age_band_shape(age_band) if age_band else None,
        # Coaching content — omitted for locked activities
        "coachingPrompt": doc.get("coaching_prompt", "") if not is_locked else None,
        "followUpQuestions": doc.get("follow_up_questions", []) if not is_locked else [],
        "parentTip": doc.get("parent_tip") if not is_locked else None,
        "variation": doc.get("variation") if not is_locked else None,
        # Metadata always visible
        "timeEstimateMinutes": doc.get("time_estimate_minutes", 5),
        "status": doc.get("status", "published"),
        "publishedAt": _dt(doc.get("published_at")),
        "audioUrl": doc.get("audio_url"),
        "isLocked": is_locked,
        "createdAt": _dt(doc.get("created_at")) or "",
        "updatedAt": _dt(doc.get("updated_at")) or "",
    }


async def _enrich_activity(
    doc: dict,
    db,
    is_locked: bool = False,
) -> dict:
    """Attach resolved skill_category and age_band sub-documents."""
    skill_cat = None
    age_band = None
    cat_id = doc.get("skill_category_id")
    band_id = doc.get("age_band_id")
    if cat_id:
        skill_cat = await db["skill_categories"].find_one({"_id": cat_id})
    if band_id:
        age_band = await db["age_bands"].find_one({"_id": band_id})
    return _activity_shape(doc, skill_cat, age_band, is_locked=is_locked)


# ── Cursor helpers ─────────────────────────────────────────────────────────────

def _encode_cursor(oid: ObjectId) -> str:
    """Encode a MongoDB ObjectId as a URL-safe base64 cursor string."""
    return base64.b64encode(str(oid).encode()).decode()


def _decode_cursor(cursor: str) -> Optional[ObjectId]:
    """Decode a base64 cursor back to an ObjectId; return None on any error."""
    try:
        decoded = base64.b64decode(cursor.encode()).decode()
        if ObjectId.is_valid(decoded):
            return ObjectId(decoded)
    except Exception:
        pass
    return None


def _today_start_utc() -> datetime:
    """Return midnight UTC for today as a timezone-aware datetime."""
    d = date.today()
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)


# ── Reference data ─────────────────────────────────────────────────────────────

@router.get("/skill-categories")
async def list_skill_categories():
    """Return all active skill categories ordered by sort_order."""
    db = get_database()
    docs = await db["skill_categories"].find({"is_active": True}).sort("sort_order", 1).to_list(50)
    return JSONResponse(content={"success": True, "data": [_skill_cat_shape(d) for d in docs]})


@router.get("/age-bands")
async def list_age_bands():
    """Return all age bands ordered by sort_order."""
    db = get_database()
    docs = await db["age_bands"].find({}).sort("sort_order", 1).to_list(20)
    return JSONResponse(content={"success": True, "data": [_age_band_shape(d) for d in docs]})


# ── Daily selection ────────────────────────────────────────────────────────────

@router.get("/activities/today/{child_id}")
async def get_today_activity(
    child_id: str,
    current_user: UserClaims = Depends(get_current_user),
):
    """Return today's personalised activity for a child.

    - Always accessible regardless of subscription status.
    - Creates a new selection via Agent 1 if none exists for today.
    - Replaces archived selections via Agent 5 (fallback).
    - Returns 503 NO_ACTIVITY_AVAILABLE if the database has no activities at all.
    """
    db = get_database()

    # ── Verify child belongs to this parent ───────────────────────────────────
    try:
        child_oid = ObjectId(child_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Child not found.")

    child = await db["children"].find_one(
        {"_id": child_oid, "parent_id": current_user.user_id, "deleted_at": None}
    )
    if not child:
        raise HTTPException(status_code=404, detail="Child not found.")

    today_str = date.today().isoformat()

    # ── Check for existing selection ──────────────────────────────────────────
    existing_sel = await db["daily_activity_selections"].find_one(
        {"child_id": child_id, "selected_for_date": today_str}
    )

    act_doc: Optional[dict] = None

    if existing_sel:
        act_doc = await db["activities"].find_one({"_id": existing_sel["activity_id"]})

        if act_doc and act_doc.get("status") == "archived":
            # Content was archived mid-day → get a replacement via Agent 5
            logger.info(
                "Activity %s is archived; invoking fallback agent for child=%s",
                str(act_doc["_id"]), child_id,
            )
            act_doc = await replace_archived_selection(child_id, today_str, db)

        if act_doc:
            # Mark as shown
            await db["daily_activity_selections"].update_one(
                {"_id": existing_sel["_id"]},
                {"$set": {"was_shown": True}},
            )
    else:
        # No selection yet today → generate via Agent 1
        try:
            act_doc = await generate_for_child(child_id, db)
        except ValueError as exc:
            msg = str(exc)
            if "NO_ACTIVITY_AVAILABLE" in msg:
                return JSONResponse(
                    status_code=503,
                    content={
                        "success": False,
                        "error": {
                            "code": "NO_ACTIVITY_AVAILABLE",
                            "message": "No activities available. Check back soon.",
                            "statusCode": 503,
                        },
                    },
                )
            raise HTTPException(status_code=404, detail=msg)

    if not act_doc:
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": {
                    "code": "NO_ACTIVITY_AVAILABLE",
                    "message": "No activities available. Check back soon.",
                    "statusCode": 503,
                },
            },
        )

    # ── Check completion status for today ─────────────────────────────────────
    completed_today = (
        await db["activity_completions"].find_one({
            "child_id": child_id,
            "activity_id": act_doc["_id"],
            "completed_at": {"$gte": _today_start_utc()},
        })
    ) is not None

    enriched = await _enrich_activity(act_doc, db)

    return JSONResponse(content={
        "success": True,
        "data": {
            "activity": enriched,
            "is_completed_today": completed_today,
            "selected_for_date": today_str,
        },
    })


# ── Activity library ───────────────────────────────────────────────────────────

@router.get("/activities")
async def list_activities(
    skill_category: Optional[str] = Query(None, description="Skill category slug (e.g. 'communication')"),
    age_band: Optional[str] = Query(None, description="Age band label (e.g. '7–8')"),
    search: Optional[str] = Query(None, description="Full-text search on title (min 3 chars)"),
    cursor: Optional[str] = Query(None, description="Base64-encoded last _id from previous page"),
    limit: int = Query(20, ge=1, le=50),
    current_user: UserClaims = Depends(get_current_user),
):
    """Browse the activity library with optional filters and cursor pagination.

    Free-tier users receive all activities but with coaching content omitted
    and ``isLocked: true`` on each item.
    """
    db = get_database()

    # Entitlement — determines whether coaching content is hidden
    entitlement = await get_entitlement(current_user.user_id, db)
    can_access = entitlement["can_access_full_library"]

    # ── Build query ───────────────────────────────────────────────────────────
    query: dict = {"status": "published"}

    if skill_category:
        cat_doc = await db["skill_categories"].find_one({"slug": skill_category})
        if not cat_doc:
            return JSONResponse(content={
                "success": True,
                "data": [],
                "meta": {"limit": limit, "next_cursor": None, "total": None},
            })
        query["skill_category_id"] = cat_doc["_id"]

    if age_band:
        band_doc = await db["age_bands"].find_one({"label": age_band})
        if not band_doc:
            return JSONResponse(content={
                "success": True,
                "data": [],
                "meta": {"limit": limit, "next_cursor": None, "total": None},
            })
        query["age_band_id"] = band_doc["_id"]

    if search and len(search) >= 3:
        query["$text"] = {"$search": search}

    if cursor:
        cursor_oid = _decode_cursor(cursor)
        if cursor_oid:
            query["_id"] = {"$gt": cursor_oid}

    # ── Execute + paginate ────────────────────────────────────────────────────
    docs = await db["activities"].find(query).sort("_id", 1).limit(limit).to_list(limit)

    next_cursor = _encode_cursor(docs[-1]["_id"]) if len(docs) == limit else None
    items = [await _enrich_activity(d, db, is_locked=not can_access) for d in docs]

    return JSONResponse(content={
        "success": True,
        "data": items,
        "meta": {
            "limit": limit,
            "next_cursor": next_cursor,
            "total": None,   # full count is expensive; omitted by design
        },
    })


@router.get("/activities/{activity_id}")
async def get_activity(
    activity_id: str,
    child_id: Optional[str] = Query(None, description="Provide to check today's selection entitlement"),
    current_user: UserClaims = Depends(get_current_user),
):
    """Return a single published activity.

    Free-tier users may access an activity if it is today's daily selection
    for one of their children.  All other library activities require an active
    subscription.
    """
    db = get_database()

    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=404, detail="Activity not found.")

    act_oid = ObjectId(activity_id)
    doc = await db["activities"].find_one({"_id": act_oid, "status": "published"})
    if not doc:
        raise HTTPException(status_code=404, detail="Activity not found.")

    # ── Entitlement check ─────────────────────────────────────────────────────
    entitlement = await get_entitlement(current_user.user_id, db)
    if not entitlement["can_access_full_library"]:
        # Free tier: allow only if this is today's daily selection for any child
        today_str = date.today().isoformat()
        children_docs = await db["children"].find(
            {"parent_id": current_user.user_id, "deleted_at": None},
            {"_id": 1},
        ).to_list(20)
        child_ids = [str(c["_id"]) for c in children_docs]

        is_todays_selection = False
        if child_ids:
            sel = await db["daily_activity_selections"].find_one({
                "child_id": {"$in": child_ids},
                "activity_id": act_oid,
                "selected_for_date": today_str,
            })
            is_todays_selection = sel is not None

        if not is_todays_selection:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "SUBSCRIPTION_REQUIRED",
                    "message": "An active subscription is required to access this activity.",
                    "statusCode": 403,
                },
            )

    return JSONResponse(content={"success": True, "data": await _enrich_activity(doc, db)})


# ── Completions ────────────────────────────────────────────────────────────────

@router.post("/activities/{activity_id}/complete")
async def complete_activity(
    activity_id: str,
    body: CompleteActivityBody,
    current_user: UserClaims = Depends(get_current_user),
):
    """Record a parent-child activity completion and update the streak.

    Idempotent per child per UTC calendar day: a second call for the same
    (child, activity, day) returns 409 ACTIVITY_ALREADY_COMPLETED with the
    current streak so the client can display it.
    """
    db = get_database()

    # ── Validate activity ─────────────────────────────────────────────────────
    if not ObjectId.is_valid(activity_id):
        raise HTTPException(status_code=404, detail="Activity not found.")
    act_oid = ObjectId(activity_id)
    activity = await db["activities"].find_one({"_id": act_oid})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found.")

    # ── Verify child belongs to authenticated parent ───────────────────────────
    child_id = body.child_id
    if not ObjectId.is_valid(child_id):
        raise HTTPException(status_code=404, detail="Child not found.")
    child = await db["children"].find_one(
        {"_id": ObjectId(child_id), "parent_id": current_user.user_id, "deleted_at": None}
    )
    if not child:
        raise HTTPException(status_code=404, detail="Child not found.")

    # ── Idempotency: already completed today? ──────────────────────────────────
    today_start = _today_start_utc()
    existing = await db["activity_completions"].find_one({
        "child_id": child_id,
        "activity_id": act_oid,
        "completed_at": {"$gte": today_start},
    })
    if existing:
        streak_doc = await db["streaks"].find_one({"child_id": child_id})
        current_streak = streak_doc.get("current_streak_days", 0) if streak_doc else 0
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "error": {
                    "code": "ACTIVITY_ALREADY_COMPLETED",
                    "message": "This activity has already been completed today.",
                    "statusCode": 409,
                    "current_streak": current_streak,
                },
            },
        )

    now = datetime.now(timezone.utc)

    # ── Insert completion record ───────────────────────────────────────────────
    completion: dict = {
        "child_id": child_id,
        "activity_id": act_oid,
        "completed_at": now,
        "parent_reaction": body.reaction,
        "parent_note": body.note,
    }
    result = await db["activity_completions"].insert_one(completion)
    completion["_id"] = result.inserted_id

    # ── Mark daily selection as completed ─────────────────────────────────────
    await db["daily_activity_selections"].update_one(
        {
            "child_id": child_id,
            "selected_for_date": date.today().isoformat(),
            "activity_id": act_oid,
        },
        {"$set": {"was_completed": True, "completed_at": now}},
    )

    # ── Update streak via Agent 2 ─────────────────────────────────────────────
    streak_result = await update_streak_on_completion(child_id, now, db)

    # Phase 2 placeholder: badge evaluation
    logger.debug(
        "Badge check (Phase 2): child=%s streak=%d total=%d",
        child_id, streak_result.current_streak_days, streak_result.total_completions,
    )

    return JSONResponse(content={
        "success": True,
        "data": {
            "completion_id": str(completion["_id"]),
            "current_streak_days": streak_result.current_streak_days,
            "longest_streak_days": streak_result.longest_streak_days,
            "is_new_streak_record": streak_result.is_new_streak_record,
            "total_completions": streak_result.total_completions,
        },
    })


@router.get("/children/{child_id}/completions")
async def get_completions(
    child_id: str,
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None, description="Base64-encoded cursor (_id) for pagination"),
    current_user: UserClaims = Depends(get_current_user),
):
    """Return paginated completion history for a child (newest first)."""
    db = get_database()

    if not ObjectId.is_valid(child_id):
        raise HTTPException(status_code=404, detail="Child not found.")
    child = await db["children"].find_one(
        {"_id": ObjectId(child_id), "parent_id": current_user.user_id}
    )
    if not child:
        raise HTTPException(status_code=404, detail="Child not found.")

    query: dict = {"child_id": child_id}
    if cursor:
        cursor_oid = _decode_cursor(cursor)
        if cursor_oid:
            query["_id"] = {"$lt": cursor_oid}   # older items (reverse chron)

    docs = await (
        db["activity_completions"]
        .find(query)
        .sort("completed_at", -1)
        .limit(limit)
        .to_list(limit)
    )

    items = []
    for d in docs:
        act = await db["activities"].find_one({"_id": d.get("activity_id")})
        enriched = await _enrich_activity(act, db) if act else None
        items.append({
            "id": str(d["_id"]),
            "childId": d.get("child_id", ""),
            "activityId": str(d.get("activity_id", "")),
            "activity": enriched,
            "completedAt": _dt(d.get("completed_at")) or "",
            "parentReaction": d.get("parent_reaction"),
            "parentNote": d.get("parent_note"),
        })

    next_cursor = _encode_cursor(docs[-1]["_id"]) if len(docs) == limit else None

    return JSONResponse(content={
        "success": True,
        "data": items,
        "meta": {
            "limit": limit,
            "next_cursor": next_cursor,
        },
    })
