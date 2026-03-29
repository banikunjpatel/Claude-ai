"""Tests for the activity library, daily selection, and completion endpoints.

All tests use the ``http_client`` + ``mock_db`` fixtures (in-memory MongoDB).
Seed fixtures insert the minimal reference data (skill category, age band,
activity, child) before each test that requires it.
"""

import pytest
import pytest_asyncio
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from tests.conftest import FAKE_USER_ID


# ── Seed fixtures ─────────────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def reference_data(mock_db):
    """Seed one skill category, one age band, and one published activity."""
    skill_cat_id = ObjectId()
    age_band_id = ObjectId()
    activity_id = ObjectId()

    await mock_db["skill_categories"].insert_one({
        "_id": skill_cat_id,
        "slug": "communication",
        "display_name": "Communication",
        "description": "Talk and listen skills",
        "icon_name": "chat",
        "colour_hex": "#4A90D9",
        "sort_order": 1,
        "is_active": True,
    })

    await mock_db["age_bands"].insert_one({
        "_id": age_band_id,
        "label": "5–6",
        "min_age_years": 5,
        "max_age_years": 6,
        "sort_order": 3,
    })

    await mock_db["activities"].insert_one({
        "_id": activity_id,
        "title": "Story Time",
        "slug": "story-time",
        "status": "published",
        "skill_category_id": skill_cat_id,
        "age_band_id": age_band_id,
        "coaching_prompt": "Ask your child to make up a story.",
        "follow_up_questions": ["What happened next?"],
        "parent_tip": "Use expressive voices.",
        "time_estimate_minutes": 5,
    })

    return {
        "skill_cat_id": str(skill_cat_id),
        "age_band_id": str(age_band_id),
        "activity_id": str(activity_id),
        "activity_oid": activity_id,
    }


@pytest_asyncio.fixture()
async def child_with_activity(mock_db, reference_data):
    """Seed a child belonging to FAKE_USER_ID, aged 5–6, skill-matched."""
    child_id = ObjectId()
    now = datetime.now(timezone.utc)

    await mock_db["children"].insert_one({
        "_id": child_id,
        "parent_id": FAKE_USER_ID,
        "display_name": "Test Child",
        "name": "Test Child",
        "date_of_birth": "2019-01-01",   # ~6 years old — matches 5–6 band
        "avatar_id": 0,
        "skill_focuses": ["communication"],
        "streak": 0,
        "total_completions": 0,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    })

    # Add subscription so entitlement = full access
    await mock_db["subscriptions"].insert_one({
        "user_id": FAKE_USER_ID,
        "status": "trial",
        "plan_type": "individual",
        "current_period_end": datetime.now(timezone.utc) + timedelta(days=7),
    })

    return {**reference_data, "child_id": str(child_id)}


# ── Reference data endpoints ──────────────────────────────────────────────────

def test_list_skill_categories(http_client: TestClient, reference_data):
    """GET /api/v1/skill-categories returns the seeded category."""
    response = http_client.get("/api/v1/skill-categories")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    slugs = [c["slug"] for c in body["data"]]
    assert "communication" in slugs


def test_list_age_bands(http_client: TestClient, reference_data):
    """GET /api/v1/age-bands returns the seeded age band."""
    response = http_client.get("/api/v1/age-bands")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    labels = [b["label"] for b in body["data"]]
    assert "5–6" in labels


# ── Activity library ──────────────────────────────────────────────────────────

def test_list_activities_empty(http_client: TestClient):
    """GET /api/v1/activities returns empty list when no activities are seeded."""
    response = http_client.get("/api/v1/activities")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"] == []


def test_list_activities_returns_seeded(http_client: TestClient, reference_data):
    """GET /api/v1/activities returns the seeded activity."""
    response = http_client.get("/api/v1/activities")
    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 1
    assert body["data"][0]["title"] == "Story Time"


def test_list_activities_locked_without_subscription(http_client: TestClient, reference_data):
    """Without a subscription, activities have isLocked=True and no coaching content."""
    body = http_client.get("/api/v1/activities").json()
    act = body["data"][0]
    assert act["isLocked"] is True
    assert act["coachingPrompt"] is None


def test_list_activities_unlocked_with_subscription(http_client: TestClient, child_with_activity):
    """With an active subscription, activities have isLocked=False."""
    body = http_client.get("/api/v1/activities").json()
    act = body["data"][0]
    assert act["isLocked"] is False
    assert act["coachingPrompt"] is not None


# ── Today's selection ──────────────────────────────────────────────────────────

def test_today_activity_returns_selection(http_client: TestClient, child_with_activity):
    """GET /api/v1/activities/today/{child_id} returns today's activity."""
    child_id = child_with_activity["child_id"]
    response = http_client.get(f"/api/v1/activities/today/{child_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "activity" in body["data"]
    assert body["data"]["activity"]["title"] == "Story Time"
    assert body["data"]["is_completed_today"] is False


def test_today_activity_wrong_parent_returns_404(http_client: TestClient):
    """GET /api/v1/activities/today/{id} returns 404 for a child owned by another parent."""
    response = http_client.get(f"/api/v1/activities/today/{ObjectId()}")
    assert response.status_code == 404


# ── Complete activity ─────────────────────────────────────────────────────────

def test_complete_activity_returns_streak(http_client: TestClient, child_with_activity):
    """POST /api/v1/activities/{id}/complete records completion and returns streak."""
    activity_id = child_with_activity["activity_id"]
    child_id = child_with_activity["child_id"]

    response = http_client.post(
        f"/api/v1/activities/{activity_id}/complete",
        json={"child_id": child_id, "reaction": "😊"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["current_streak_days"] == 1
    assert data["longest_streak_days"] == 1
    assert data["total_completions"] == 1
    assert "completion_id" in data


def test_complete_activity_idempotent_returns_409(http_client: TestClient, child_with_activity):
    """Second completion of same activity on same day returns 409."""
    activity_id = child_with_activity["activity_id"]
    child_id = child_with_activity["child_id"]
    payload = {"child_id": child_id}

    http_client.post(f"/api/v1/activities/{activity_id}/complete", json=payload)
    second = http_client.post(f"/api/v1/activities/{activity_id}/complete", json=payload)

    assert second.status_code == 409
    body = second.json()
    assert body["error"]["code"] == "ACTIVITY_ALREADY_COMPLETED"


def test_complete_activity_updates_is_completed_today(http_client: TestClient, child_with_activity):
    """After completion, GET today returns is_completed_today=True."""
    activity_id = child_with_activity["activity_id"]
    child_id = child_with_activity["child_id"]

    # First trigger a selection so the same activity is today's pick
    http_client.get(f"/api/v1/activities/today/{child_id}")

    http_client.post(
        f"/api/v1/activities/{activity_id}/complete",
        json={"child_id": child_id},
    )

    today = http_client.get(f"/api/v1/activities/today/{child_id}").json()
    assert today["data"]["is_completed_today"] is True


# ── Completion history ────────────────────────────────────────────────────────

def test_get_completions_empty(http_client: TestClient, child_with_activity):
    """GET /children/{id}/completions returns empty list with no completions."""
    child_id = child_with_activity["child_id"]
    response = http_client.get(f"/api/v1/children/{child_id}/completions")
    assert response.status_code == 200
    body = response.json()
    assert body["data"] == []
    assert body["meta"]["next_cursor"] is None


def test_get_completions_after_completion(http_client: TestClient, child_with_activity):
    """After completing an activity, GET completions returns one item."""
    activity_id = child_with_activity["activity_id"]
    child_id = child_with_activity["child_id"]

    http_client.post(
        f"/api/v1/activities/{activity_id}/complete",
        json={"child_id": child_id, "reaction": "⭐"},
    )

    response = http_client.get(f"/api/v1/children/{child_id}/completions")
    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 1
    item = body["data"][0]
    assert item["childId"] == child_id
    assert item["parentReaction"] == "⭐"
    assert "completedAt" in item


def test_get_completions_wrong_parent_returns_404(http_client: TestClient):
    """GET completions for a non-existent child returns 404."""
    fake_id = str(ObjectId())
    response = http_client.get(f"/api/v1/children/{fake_id}/completions")
    assert response.status_code == 404


def test_list_activities_filter_by_skill_category(http_client: TestClient, reference_data):
    """GET /activities?skill_category=communication filters correctly."""
    response = http_client.get("/api/v1/activities?skill_category=communication")
    assert response.status_code == 200
    body = response.json()
    # The one seeded activity is in the 'communication' category
    assert len(body["data"]) == 1

    # Non-existent slug returns empty list
    response2 = http_client.get("/api/v1/activities?skill_category=nonexistent-slug")
    assert response2.status_code == 200
    assert response2.json()["data"] == []


def test_get_single_activity_no_subscription_403(http_client: TestClient, reference_data):
    """GET /activities/{id} for a free-tier user returns 403 when not today's selection."""
    activity_id = reference_data["activity_id"]
    response = http_client.get(f"/api/v1/activities/{activity_id}")
    assert response.status_code == 403
    body = response.json()
    assert body["detail"]["code"] == "SUBSCRIPTION_REQUIRED"


def test_get_single_activity_with_subscription(http_client: TestClient, child_with_activity):
    """GET /activities/{id} with active subscription returns the activity."""
    activity_id = child_with_activity["activity_id"]
    response = http_client.get(f"/api/v1/activities/{activity_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["id"] == activity_id
    assert body["data"]["isLocked"] is False
