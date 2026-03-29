"""Daily Selection Agent (Agent 1).

Picks one personalised activity for a child for today and persists the
selection in ``daily_activity_selections``.

Algorithm
---------
1.  Resolve the child's age band from their date_of_birth.
2.  Load the child's skill_focuses (slugs → ObjectIds).
3.  Build a deduplication set: activity_ids completed in the last 14 days.
4.  Try skill-focused candidates first (published + age band + focus category
    + not recently completed).
5.  Fall back to any published activity in the age band (ignoring focus).
6.  Last resort: any published activity regardless of age band.
7.  If still nothing: raise ValueError("NO_ACTIVITY_AVAILABLE").
8.  Insert a ``daily_activity_selections`` document and return the activity doc.

Public API
----------
    chosen_doc = await generate_for_child(child_id, db)
"""

import logging
import random
from datetime import date, datetime, timedelta, timezone

from bson import ObjectId

logger = logging.getLogger(__name__)

DEDUPLICATION_DAYS = 14  # window to avoid repeating activities


async def generate_for_child(child_id: str, db) -> dict:
    """Select and persist today's activity for a child.

    Args:
        child_id: String representation of the child's MongoDB ObjectId.
        db:       Active AsyncIOMotorDatabase instance.

    Returns:
        The chosen activity document (raw MongoDB dict, not yet enriched).

    Raises:
        ValueError("NO_ACTIVITY_AVAILABLE")  if no published activities exist.
        ValueError("Child not found")         if child_id is invalid.
    """
    # ── 1. Validate child ────────────────────────────────────────────────────
    try:
        child_oid = ObjectId(child_id)
    except Exception:
        raise ValueError("Child not found")

    child = await db["children"].find_one({"_id": child_oid, "deleted_at": None})
    if not child:
        raise ValueError("Child not found")

    # ── 2. Resolve age band ──────────────────────────────────────────────────
    age_band = None
    dob_str = child.get("date_of_birth", "")
    if dob_str:
        try:
            dob = date.fromisoformat(dob_str)
            age = (date.today() - dob).days / 365.25
            age_band = await db["age_bands"].find_one(
                {"min_age_years": {"$lte": age}, "max_age_years": {"$gte": age}}
            )
        except ValueError:
            logger.warning("Invalid date_of_birth '%s' for child %s", dob_str, child_id)

    # ── 3. Resolve skill focus category ObjectIds ────────────────────────────
    focus_cat_ids: list = []
    skill_focuses: list[str] = child.get("skill_focuses", [])
    if skill_focuses:
        async for cat in db["skill_categories"].find(
            {"slug": {"$in": skill_focuses}}, {"_id": 1}
        ):
            focus_cat_ids.append(cat["_id"])

    # ── 4. Deduplication window ───────────────────────────────────────────────
    cutoff = datetime.now(timezone.utc) - timedelta(days=DEDUPLICATION_DAYS)
    recent_docs = await db["activity_completions"].find(
        {"child_id": child_id, "completed_at": {"$gte": cutoff}},
        {"activity_id": 1},
    ).to_list(500)
    recent_ids: list = [c["activity_id"] for c in recent_docs]

    # ── 5. Build base query ───────────────────────────────────────────────────
    base_query: dict = {"status": "published"}
    if age_band:
        base_query["age_band_id"] = age_band["_id"]
    if recent_ids:
        base_query["_id"] = {"$nin": recent_ids}

    # ── 6. Try skill-focused candidates first ────────────────────────────────
    chosen: dict | None = None

    if focus_cat_ids:
        focused_q = {**base_query, "skill_category_id": {"$in": focus_cat_ids}}
        focused = await db["activities"].find(focused_q).to_list(200)
        if focused:
            chosen = random.choice(focused)
            logger.debug(
                "Daily selection: skill-focused pick '%s' for child %s",
                chosen.get("title"), child_id,
            )

    # ── 7. Any activity in age band (ignore focus) ───────────────────────────
    if chosen is None:
        any_in_band = await db["activities"].find(base_query).to_list(200)
        if any_in_band:
            chosen = random.choice(any_in_band)
            logger.debug(
                "Daily selection: age-band fallback '%s' for child %s",
                chosen.get("title"), child_id,
            )

    # ── 8. Last resort: any published activity ────────────────────────────────
    if chosen is None:
        last_resort_q: dict = {"status": "published"}
        if recent_ids:
            last_resort_q["_id"] = {"$nin": recent_ids}
        any_published = await db["activities"].find(last_resort_q).to_list(200)
        if any_published:
            chosen = random.choice(any_published)
            logger.debug(
                "Daily selection: global fallback '%s' for child %s",
                chosen.get("title"), child_id,
            )

    if chosen is None:
        raise ValueError("NO_ACTIVITY_AVAILABLE")

    # ── 9. Persist selection ──────────────────────────────────────────────────
    today_str = date.today().isoformat()
    now = datetime.now(timezone.utc)
    sel: dict = {
        "child_id": child_id,
        "activity_id": chosen["_id"],
        "selected_for_date": today_str,
        "was_shown": True,   # being returned right now
        "was_completed": False,
        "completed_at": None,
        "created_at": now,
    }
    result = await db["daily_activity_selections"].insert_one(sel)
    sel["_id"] = result.inserted_id

    logger.info(
        "Daily selection created: child=%s activity=%s date=%s",
        child_id, str(chosen["_id"]), today_str,
    )
    return chosen
