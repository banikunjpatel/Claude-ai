"""Unit tests for the streak, daily-selection, and fallback agents.

These tests call agent functions directly with an in-memory mongomock database
— no HTTP layer, no real MongoDB, no JWT.
"""

import pytest
import pytest_asyncio
from bson import ObjectId
from datetime import date, datetime, timedelta, timezone

from mongomock_motor import AsyncMongoMockClient

from app.agents.streak.agent import StreakResult, update_streak_on_completion
from app.agents.daily_selection.agent import generate_for_child
from app.agents.fallback.agent import replace_archived_selection


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def db():
    """Provide a fresh in-memory database for each agent test."""
    client = AsyncMongoMockClient()
    yield client["test"]


async def _insert_child(db, parent_id: str = "parent-001", dob: str = "2019-01-01") -> str:
    """Helper: insert a minimal child doc and return its string ID."""
    child_oid = ObjectId()
    now = datetime.now(timezone.utc)
    await db["children"].insert_one({
        "_id": child_oid,
        "parent_id": parent_id,
        "display_name": "Test Child",
        "name": "Test Child",
        "date_of_birth": dob,
        "skill_focuses": [],
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
    })
    return str(child_oid)


async def _insert_activity(db, age_band_id=None, skill_cat_id=None) -> ObjectId:
    """Helper: insert a published activity and return its ObjectId."""
    act_id = ObjectId()
    doc = {
        "_id": act_id,
        "title": "Agent Test Activity",
        "status": "published",
        "coaching_prompt": "Do this activity.",
        "time_estimate_minutes": 5,
    }
    if age_band_id:
        doc["age_band_id"] = age_band_id
    if skill_cat_id:
        doc["skill_category_id"] = skill_cat_id
    await db["activities"].insert_one(doc)
    return act_id


# ── Streak agent tests ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_streak_first_completion_creates_doc(db):
    """First completion creates a streak document with current=1, longest=1."""
    child_id = await _insert_child(db)
    now = datetime.now(timezone.utc)

    await db["activity_completions"].insert_one({
        "child_id": child_id,
        "activity_id": ObjectId(),
        "completed_at": now,
    })

    result = await update_streak_on_completion(child_id, now, db)

    assert isinstance(result, StreakResult)
    assert result.current_streak_days == 1
    assert result.longest_streak_days == 1
    assert result.is_new_streak_record is True
    assert result.total_completions == 1


@pytest.mark.asyncio
async def test_streak_consecutive_days_extends(db):
    """Completion yesterday then today extends the streak to 2."""
    child_id = await _insert_child(db)
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    today = datetime.now(timezone.utc)

    # Seed the streak doc as if yesterday was completed
    await db["streaks"].insert_one({
        "child_id": child_id,
        "current_streak_days": 1,
        "longest_streak_days": 1,
        "last_activity_date": yesterday.date().isoformat(),
    })

    # Today's completion
    await db["activity_completions"].insert_one({
        "child_id": child_id,
        "activity_id": ObjectId(),
        "completed_at": today,
    })

    result = await update_streak_on_completion(child_id, today, db)

    assert result.current_streak_days == 2
    assert result.longest_streak_days == 2
    assert result.is_new_streak_record is True


@pytest.mark.asyncio
async def test_streak_gap_resets_to_one(db):
    """A gap of more than one day resets the streak to 1."""
    child_id = await _insert_child(db)
    three_days_ago = datetime.now(timezone.utc) - timedelta(days=3)
    today = datetime.now(timezone.utc)

    await db["streaks"].insert_one({
        "child_id": child_id,
        "current_streak_days": 5,
        "longest_streak_days": 5,
        "last_activity_date": three_days_ago.date().isoformat(),
    })

    await db["activity_completions"].insert_one({
        "child_id": child_id,
        "activity_id": ObjectId(),
        "completed_at": today,
    })

    result = await update_streak_on_completion(child_id, today, db)

    assert result.current_streak_days == 1
    assert result.longest_streak_days == 5   # longest preserved
    assert result.is_new_streak_record is False


@pytest.mark.asyncio
async def test_streak_same_day_is_idempotent(db):
    """Two completions on the same day do not double-count the streak."""
    child_id = await _insert_child(db)
    today = datetime.now(timezone.utc)

    # First completion
    await db["activity_completions"].insert_one({
        "child_id": child_id,
        "activity_id": ObjectId(),
        "completed_at": today,
    })
    result1 = await update_streak_on_completion(child_id, today, db)
    assert result1.current_streak_days == 1

    # Second completion same day
    await db["activity_completions"].insert_one({
        "child_id": child_id,
        "activity_id": ObjectId(),
        "completed_at": today,
    })
    result2 = await update_streak_on_completion(child_id, today, db)
    assert result2.current_streak_days == 1   # unchanged
    assert result2.is_new_streak_record is False


@pytest.mark.asyncio
async def test_streak_total_completions_counts_all(db):
    """total_completions reflects the live count from activity_completions."""
    child_id = await _insert_child(db)
    now = datetime.now(timezone.utc)

    for _ in range(3):
        await db["activity_completions"].insert_one({
            "child_id": child_id,
            "activity_id": ObjectId(),
            "completed_at": now,
        })

    result = await update_streak_on_completion(child_id, now, db)
    assert result.total_completions == 3


# ── Daily selection agent tests ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_daily_selection_picks_activity(db):
    """generate_for_child returns a published activity for a valid child."""
    await _insert_activity(db)  # no age-band filter needed
    child_id = await _insert_child(db)

    result = await generate_for_child(child_id, db)

    assert result is not None
    assert result["title"] == "Agent Test Activity"
    assert result["status"] == "published"


@pytest.mark.asyncio
async def test_daily_selection_persists_selection(db):
    """generate_for_child inserts a daily_activity_selections document."""
    await _insert_activity(db)
    child_id = await _insert_child(db)

    await generate_for_child(child_id, db)

    today_str = date.today().isoformat()
    sel = await db["daily_activity_selections"].find_one({
        "child_id": child_id,
        "selected_for_date": today_str,
    })
    assert sel is not None
    assert sel["was_shown"] is True
    assert sel["was_completed"] is False


@pytest.mark.asyncio
async def test_daily_selection_no_activities_raises(db):
    """generate_for_child raises ValueError('NO_ACTIVITY_AVAILABLE') when DB is empty."""
    child_id = await _insert_child(db)

    with pytest.raises(ValueError, match="NO_ACTIVITY_AVAILABLE"):
        await generate_for_child(child_id, db)


@pytest.mark.asyncio
async def test_daily_selection_invalid_child_raises(db):
    """generate_for_child raises ValueError for a non-existent child_id."""
    await _insert_activity(db)

    with pytest.raises(ValueError, match="Child not found"):
        await generate_for_child(str(ObjectId()), db)


@pytest.mark.asyncio
async def test_daily_selection_deduplication(db):
    """Activities completed within 14 days are excluded from selection."""
    act_id = await _insert_activity(db)
    child_id = await _insert_child(db)

    # Record a recent completion for the only activity
    recent = datetime.now(timezone.utc) - timedelta(days=3)
    await db["activity_completions"].insert_one({
        "child_id": child_id,
        "activity_id": act_id,
        "completed_at": recent,
    })

    # With only one activity and it being recently completed, no selection possible
    with pytest.raises(ValueError, match="NO_ACTIVITY_AVAILABLE"):
        await generate_for_child(child_id, db)


# ── Fallback agent tests ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_fallback_replaces_archived_selection(db):
    """replace_archived_selection returns a published replacement activity."""
    archived_id = ObjectId()
    replacement_id = ObjectId()
    child_id = await _insert_child(db)
    today = date.today().isoformat()

    # Insert archived selection
    await db["daily_activity_selections"].insert_one({
        "child_id": child_id,
        "activity_id": archived_id,
        "selected_for_date": today,
        "was_shown": True,
        "was_completed": False,
    })

    # Insert a published replacement
    await db["activities"].insert_one({
        "_id": replacement_id,
        "title": "Replacement Activity",
        "status": "published",
        "time_estimate_minutes": 5,
    })

    result = await replace_archived_selection(child_id, today, db)

    assert result is not None
    assert result["_id"] == replacement_id
    assert result["status"] == "published"

    # Selection document should be updated to point at the replacement
    updated_sel = await db["daily_activity_selections"].find_one({"child_id": child_id})
    assert updated_sel["activity_id"] == replacement_id


@pytest.mark.asyncio
async def test_fallback_returns_none_when_no_replacement(db):
    """replace_archived_selection returns None when no published activities exist."""
    archived_id = ObjectId()
    child_id = await _insert_child(db)
    today = date.today().isoformat()

    await db["daily_activity_selections"].insert_one({
        "child_id": child_id,
        "activity_id": archived_id,
        "selected_for_date": today,
    })
    # No published activities inserted

    result = await replace_archived_selection(child_id, today, db)
    assert result is None


@pytest.mark.asyncio
async def test_fallback_inserts_selection_when_none_exists(db):
    """replace_archived_selection creates a new selection doc when none exists."""
    child_id = await _insert_child(db)
    today = date.today().isoformat()

    await db["activities"].insert_one({
        "_id": ObjectId(),
        "title": "Fresh Activity",
        "status": "published",
        "time_estimate_minutes": 5,
    })

    result = await replace_archived_selection(child_id, today, db)

    assert result is not None
    sel = await db["daily_activity_selections"].find_one({"child_id": child_id})
    assert sel is not None
    assert sel["was_shown"] is True
