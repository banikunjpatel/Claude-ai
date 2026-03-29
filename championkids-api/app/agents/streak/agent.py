"""Streak Agent (Agent 2).

Maintains per-child streak counters in the ``streaks`` collection and
returns a structured ``StreakResult`` after each completion.

Streak rules
------------
- If the child's last recorded activity date is **today**: already counted,
  return current values unchanged.
- If the last date is **yesterday**: streak continues — increment by 1.
- Otherwise: streak resets to 1.
- ``longest_streak_days`` is updated whenever ``current_streak_days``
  exceeds the previous longest.
- ``total_completions`` is a live count from ``activity_completions``.

Public API
----------
    result = await update_streak_on_completion(child_id, completed_at, db)
    result.current_streak_days   # int
    result.longest_streak_days   # int
    result.is_new_streak_record  # bool
    result.total_completions     # int
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)


@dataclass
class StreakResult:
    current_streak_days: int
    longest_streak_days: int
    is_new_streak_record: bool
    total_completions: int


async def update_streak_on_completion(
    child_id: str,
    completed_at: datetime,
    db,
) -> StreakResult:
    """Update the streak document for a child and return a StreakResult.

    Args:
        child_id:     String child ID (used as the ``child_id`` key in streaks).
        completed_at: Timezone-aware datetime of the completion event.
        db:           Active AsyncIOMotorDatabase instance.

    Returns:
        StreakResult with current/longest streak days, new-record flag, and
        total lifetime completions for this child.
    """
    today_str = completed_at.date().isoformat()
    yesterday_str = (completed_at.date() - timedelta(days=1)).isoformat()

    # Total lifetime completions (includes the one just inserted)
    total = await db["activity_completions"].count_documents({"child_id": child_id})

    streak_doc = await db["streaks"].find_one({"child_id": child_id})

    # ── First ever completion ─────────────────────────────────────────────────
    if not streak_doc:
        await db["streaks"].insert_one({
            "child_id": child_id,
            "current_streak_days": 1,
            "longest_streak_days": 1,
            "last_activity_date": today_str,
        })
        logger.info("Streak created: child=%s streak=1", child_id)
        return StreakResult(
            current_streak_days=1,
            longest_streak_days=1,
            is_new_streak_record=True,
            total_completions=total,
        )

    last_date = streak_doc.get("last_activity_date")
    current = streak_doc.get("current_streak_days", 0)
    longest = streak_doc.get("longest_streak_days", 0)

    # ── Already counted today (idempotent) ────────────────────────────────────
    if last_date == today_str:
        logger.debug("Streak already counted today for child=%s", child_id)
        return StreakResult(
            current_streak_days=current,
            longest_streak_days=longest,
            is_new_streak_record=False,
            total_completions=total,
        )

    # ── Extend or reset ───────────────────────────────────────────────────────
    new_streak = (current + 1) if last_date == yesterday_str else 1
    new_longest = max(longest, new_streak)
    is_new_record = new_longest > longest

    await db["streaks"].update_one(
        {"child_id": child_id},
        {"$set": {
            "current_streak_days": new_streak,
            "longest_streak_days": new_longest,
            "last_activity_date": today_str,
        }},
    )

    logger.info(
        "Streak updated: child=%s streak=%d longest=%d new_record=%s",
        child_id, new_streak, new_longest, is_new_record,
    )
    return StreakResult(
        current_streak_days=new_streak,
        longest_streak_days=new_longest,
        is_new_streak_record=is_new_record,
        total_completions=total,
    )
