"""Fallback Agent (Agent 5).

Replaces an archived daily selection with a fresh published activity.

This is called by the today endpoint when the stored selection points to an
activity whose status has since been changed to "archived" (e.g. the content
team pulled the activity mid-day).

Algorithm
---------
1.  Read the current (archived) selection to know which activity to exclude.
2.  Resolve the child's age band for relevance.
3.  Find a random published replacement in the same age band (not the
    archived one).
4.  Fall back to any published activity if no age-band match is found.
5.  Update the ``daily_activity_selections`` document in place.
6.  Return the replacement activity document.

Public API
----------
    new_doc = await replace_archived_selection(child_id, today_str, db)
    # Returns None if no replacement is available at all.
"""

import logging
import random
from datetime import date, datetime, timezone
from typing import Optional

from bson import ObjectId

logger = logging.getLogger(__name__)


async def replace_archived_selection(
    child_id: str,
    today: str,
    db,
) -> Optional[dict]:
    """Replace today's archived selection with a published activity.

    Args:
        child_id: String child ID.
        today:    ISO date string for today ("YYYY-MM-DD").
        db:       Active AsyncIOMotorDatabase instance.

    Returns:
        The replacement activity document, or None if nothing is available.
    """
    # ── Find existing selection ───────────────────────────────────────────────
    selection = await db["daily_activity_selections"].find_one(
        {"child_id": child_id, "selected_for_date": today}
    )
    archived_id = selection["activity_id"] if selection else None

    # ── Resolve child's age band ──────────────────────────────────────────────
    age_band = None
    try:
        child_oid = ObjectId(child_id)
        child = await db["children"].find_one({"_id": child_oid, "deleted_at": None})
        if child:
            dob_str = child.get("date_of_birth", "")
            if dob_str:
                dob = date.fromisoformat(dob_str)
                age = (date.today() - dob).days / 365.25
                age_band = await db["age_bands"].find_one(
                    {"min_age_years": {"$lte": age}, "max_age_years": {"$gte": age}}
                )
    except Exception:
        logger.warning("Could not resolve age band for child %s during fallback", child_id)

    # ── Build query for a replacement ─────────────────────────────────────────
    query: dict = {"status": "published"}
    if archived_id:
        query["_id"] = {"$ne": archived_id}
    if age_band:
        query["age_band_id"] = age_band["_id"]

    candidates = await db["activities"].find(query).to_list(200)

    if not candidates:
        # Retry without age-band restriction
        fallback_q: dict = {"status": "published"}
        if archived_id:
            fallback_q["_id"] = {"$ne": archived_id}
        candidates = await db["activities"].find(fallback_q).to_list(200)

    if not candidates:
        logger.error(
            "Fallback agent: no replacement found for child=%s date=%s", child_id, today
        )
        return None

    replacement = random.choice(candidates)
    now = datetime.now(timezone.utc)

    # ── Update or insert selection record ─────────────────────────────────────
    if selection:
        await db["daily_activity_selections"].update_one(
            {"_id": selection["_id"]},
            {"$set": {
                "activity_id": replacement["_id"],
                "was_shown": True,
                "updated_at": now,
            }},
        )
        logger.info(
            "Fallback replaced archived selection: child=%s old=%s new=%s",
            child_id, str(archived_id), str(replacement["_id"]),
        )
    else:
        await db["daily_activity_selections"].insert_one({
            "child_id": child_id,
            "activity_id": replacement["_id"],
            "selected_for_date": today,
            "was_shown": True,
            "was_completed": False,
            "completed_at": None,
            "created_at": now,
        })

    return replacement
