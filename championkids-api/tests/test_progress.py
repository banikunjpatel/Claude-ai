"""Tests for the progress summary and history endpoints.

Uses the in-memory ``mock_db`` + ``http_client`` fixtures so every test
starts with a completely empty database.
"""

import pytest
import pytest_asyncio
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from tests.conftest import FAKE_USER_ID


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _make_child(mock_db) -> str:
    """Insert a minimal child document and return its string ID."""
    child_id = ObjectId()
    now = datetime.now(timezone.utc)
    await mock_db["children"].insert_one({
        "_id": child_id,
        "parent_id": FAKE_USER_ID,
        "display_name": "Progress Child",
        "name": "Progress Child",
        "date_of_birth": "2018-01-01",
        "avatar_id": 0,
        "skill_focuses": [],
        "streak": 0,
        "total_completions": 0,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    })
    return str(child_id)


async def _make_activity(mock_db) -> ObjectId:
    """Insert a minimal published activity and return its ObjectId."""
    skill_cat_id = ObjectId()
    act_id = ObjectId()

    await mock_db["skill_categories"].insert_one({
        "_id": skill_cat_id,
        "slug": "focus",
        "display_name": "Focus",
        "icon_name": "brain",
        "colour_hex": "#FF6B35",
    })

    await mock_db["activities"].insert_one({
        "_id": act_id,
        "title": "Focus Activity",
        "status": "published",
        "skill_category_id": skill_cat_id,
        "coaching_prompt": "Pay attention!",
        "time_estimate_minutes": 5,
    })

    return act_id


# ── Summary endpoint ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_progress_summary_wrong_child_returns_404(http_client: TestClient, mock_db):
    """GET /progress/{id}/summary with a non-existent child returns 404."""
    fake_id = str(ObjectId())
    response = http_client.get(f"/api/v1/progress/{fake_id}/summary")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_progress_summary_empty(http_client: TestClient, mock_db):
    """Progress summary for a child with zero completions returns all zeros."""
    child_id = await _make_child(mock_db)

    response = http_client.get(f"/api/v1/progress/{child_id}/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["total_completions"] == 0
    assert data["current_streak_days"] == 0
    assert data["longest_streak_days"] == 0
    assert data["completions_this_week"] == 0
    assert data["by_skill"] == []
    assert data["skills_explored"] == 0


@pytest.mark.asyncio
async def test_progress_summary_after_completion(http_client: TestClient, mock_db):
    """After inserting a completion, total_completions increments and by_skill is populated."""
    child_id = await _make_child(mock_db)
    act_id = await _make_activity(mock_db)

    now = datetime.now(timezone.utc)
    await mock_db["activity_completions"].insert_one({
        "child_id": child_id,
        "activity_id": act_id,
        "completed_at": now,
    })

    # Insert a streak document
    await mock_db["streaks"].insert_one({
        "child_id": child_id,
        "current_streak_days": 1,
        "longest_streak_days": 1,
        "last_activity_date": now.date().isoformat(),
    })

    response = http_client.get(f"/api/v1/progress/{child_id}/summary")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total_completions"] == 1
    assert data["current_streak_days"] == 1
    assert data["skills_explored"] == 1
    assert len(data["by_skill"]) == 1
    assert data["by_skill"][0]["count"] == 1


# ── History endpoint ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_progress_history_empty(http_client: TestClient, mock_db):
    """History endpoint returns an empty list for a child with no completions."""
    child_id = await _make_child(mock_db)

    response = http_client.get(f"/api/v1/progress/{child_id}/history")
    assert response.status_code == 200
    body = response.json()
    assert body["data"] == []
    assert body["meta"]["next_cursor"] is None


@pytest.mark.asyncio
async def test_progress_history_after_completion(http_client: TestClient, mock_db):
    """After a completion, history returns one item with correct fields."""
    child_id = await _make_child(mock_db)
    act_id = await _make_activity(mock_db)

    now = datetime.now(timezone.utc)
    await mock_db["activity_completions"].insert_one({
        "child_id": child_id,
        "activity_id": act_id,
        "completed_at": now,
        "parent_reaction": "😊",
    })

    # Subscription needed to avoid history gating (free tier = 7 days only)
    await mock_db["subscriptions"].insert_one({
        "user_id": FAKE_USER_ID,
        "status": "trial",
        "plan_type": "individual",
        "current_period_end": datetime.now(timezone.utc) + timedelta(days=7),
    })

    response = http_client.get(f"/api/v1/progress/{child_id}/history")
    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 1
    item = body["data"][0]
    assert "id" in item
    assert item["parent_reaction"] == "😊"


@pytest.mark.asyncio
async def test_progress_summary_child_invalid_id_returns_404(http_client: TestClient, mock_db):
    """Non-ObjectId child_id returns 404."""
    response = http_client.get("/api/v1/progress/not-valid/summary")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_progress_history_free_tier_gating(http_client: TestClient, mock_db):
    """Free-tier users get is_history_limited=True and only see recent 7 days."""
    child_id = await _make_child(mock_db)
    act_id = await _make_activity(mock_db)

    now = datetime.now(timezone.utc)
    old_date = now - timedelta(days=30)

    # Old completion (>7 days ago) — should be hidden for free tier
    await mock_db["activity_completions"].insert_one({
        "child_id": child_id,
        "activity_id": act_id,
        "completed_at": old_date,
    })

    # No subscription inserted — free tier
    response = http_client.get(f"/api/v1/progress/{child_id}/history")
    assert response.status_code == 200
    body = response.json()
    assert body["meta"]["is_history_limited"] is True
    assert body["data"] == []  # old completion filtered out


# ── Legacy endpoints ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_legacy_streak_endpoint_empty(http_client: TestClient, mock_db):
    """GET /children/{id}/streak returns zeros for a child with no streak."""
    child_id = await _make_child(mock_db)

    response = http_client.get(f"/api/v1/children/{child_id}/streak")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["currentStreak"] == 0
    assert data["longestStreak"] == 0
    assert data["lastCompletedDate"] is None


@pytest.mark.asyncio
async def test_legacy_streak_endpoint_with_data(http_client: TestClient, mock_db):
    """GET /children/{id}/streak returns actual streak values."""
    child_id = await _make_child(mock_db)
    now = datetime.now(timezone.utc)

    await mock_db["streaks"].insert_one({
        "child_id": child_id,
        "current_streak_days": 3,
        "longest_streak_days": 7,
        "last_activity_date": now.date().isoformat(),
    })

    response = http_client.get(f"/api/v1/children/{child_id}/streak")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["currentStreak"] == 3
    assert data["longestStreak"] == 7


@pytest.mark.asyncio
async def test_legacy_progress_endpoint_empty(http_client: TestClient, mock_db):
    """GET /children/{id}/progress returns zeros for a child with no completions."""
    child_id = await _make_child(mock_db)

    response = http_client.get(f"/api/v1/children/{child_id}/progress")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["totalActivities"] == 0
    assert data["totalMinutes"] == 0
    assert data["skillBreakdown"] == []
    assert len(data["weeklyActivity"]) == 7  # one entry per day of the week


@pytest.mark.asyncio
async def test_legacy_skill_breakdown_endpoint(http_client: TestClient, mock_db):
    """GET /children/{id}/progress/skills returns empty list with no completions."""
    child_id = await _make_child(mock_db)

    response = http_client.get(f"/api/v1/children/{child_id}/progress/skills")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"] == []
