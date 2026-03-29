"""Tests for the subscription and entitlement endpoints.

Uses in-memory ``mock_db`` + ``http_client`` fixtures.  Stripe-dependent
endpoints return 501 when STRIPE_SECRET_KEY is not configured; we test that
behaviour to exercise the code paths without needing a real Stripe key.
"""

import pytest
import pytest_asyncio
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from tests.conftest import FAKE_USER_ID


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _seed_trial_subscription(mock_db):
    """Insert a trial subscription for FAKE_USER_ID."""
    now = datetime.now(timezone.utc)
    await mock_db["subscriptions"].insert_one({
        "user_id": FAKE_USER_ID,
        "platform": "web",
        "plan_type": "individual",
        "status": "trial",
        "current_period_start": now,
        "current_period_end": now + timedelta(days=7),
        "trial_end": now + timedelta(days=7),
        "cancel_at_period_end": False,
        "external_subscription_id": None,
        "created_at": now,
        "updated_at": now,
    })


# ── Entitlement endpoint ──────────────────────────────────────────────────────

def test_entitlement_no_subscription_returns_expired(http_client: TestClient):
    """Without any subscription, entitlement.status == 'expired'."""
    response = http_client.get("/api/v1/subscription/entitlement")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["status"] == "expired"
    assert data["hasFullAccess"] is False
    assert data["isInTrial"] is False


@pytest.mark.asyncio
async def test_entitlement_with_trial_returns_trial(http_client: TestClient, mock_db):
    """With an active trial subscription, entitlement.status == 'trial'."""
    await _seed_trial_subscription(mock_db)

    response = http_client.get("/api/v1/subscription/entitlement")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "trial"
    assert data["hasFullAccess"] is True
    assert data["isInTrial"] is True
    assert data["trialDaysRemaining"] is not None


# ── Trial creation endpoint ───────────────────────────────────────────────────

def test_start_trial_creates_subscription(http_client: TestClient):
    """POST /subscription/trial creates a new trial and returns 201."""
    response = http_client.post(
        "/api/v1/subscription/trial",
        json={"planType": "individual"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["status"] == "trial"
    assert body["data"]["planType"] == "individual"


@pytest.mark.asyncio
async def test_start_trial_idempotent(http_client: TestClient, mock_db):
    """POST /subscription/trial returns 200 (not 409) when subscription already exists."""
    await _seed_trial_subscription(mock_db)

    response = http_client.post(
        "/api/v1/subscription/trial",
        json={"planType": "individual"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["status"] == "trial"


# ── Subscription /me endpoint ─────────────────────────────────────────────────

def test_subscription_me_no_subscription_returns_404(http_client: TestClient):
    """GET /subscription/me returns 404 when no subscription record exists."""
    response = http_client.get("/api/v1/subscription/me")
    assert response.status_code == 404
    body = response.json()
    assert body["detail"]["code"] == "SUBSCRIPTION_NOT_FOUND"


@pytest.mark.asyncio
async def test_subscription_me_with_trial(http_client: TestClient, mock_db):
    """GET /subscription/me returns computed fields for a trial subscription."""
    await _seed_trial_subscription(mock_db)

    response = http_client.get("/api/v1/subscription/me")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "trial"
    assert data["isEntitled"] is True
    assert data["canAccessFullLibrary"] is True
    assert data["maxChildren"] == 1
    assert data["trialDaysRemaining"] > 0


# ── Raw subscription endpoint ─────────────────────────────────────────────────

def test_get_subscription_no_subscription_returns_404(http_client: TestClient):
    """GET /subscription returns 404 when no record exists."""
    response = http_client.get("/api/v1/subscription")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_subscription_returns_raw_document(http_client: TestClient, mock_db):
    """GET /subscription returns the raw subscription document."""
    await _seed_trial_subscription(mock_db)

    response = http_client.get("/api/v1/subscription")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "trial"
    assert data["planType"] == "individual"
    assert "id" in data


# ── Stripe endpoints (501 fallback without key) ───────────────────────────────

def test_checkout_without_stripe_key_returns_501(http_client: TestClient):
    """POST /subscription/checkout returns 501 when STRIPE_SECRET_KEY is not set."""
    from unittest.mock import patch
    from app.config import settings

    # Temporarily clear the Stripe key so the 501 branch is exercised
    with patch.object(settings, "STRIPE_SECRET_KEY", ""):
        response = http_client.post(
            "/api/v1/subscription/checkout",
            json={
                "planType": "individual",
                "successUrl": "https://example.com/success",
                "cancelUrl": "https://example.com/cancel",
            },
        )
    assert response.status_code == 501


def test_portal_without_stripe_key_returns_501(http_client: TestClient):
    """POST /subscription/portal returns 501 when STRIPE_SECRET_KEY is not set."""
    from unittest.mock import patch
    from app.config import settings

    with patch.object(settings, "STRIPE_SECRET_KEY", ""):
        response = http_client.post(
            "/api/v1/subscription/portal",
            json={"returnUrl": "https://example.com/account"},
        )
    assert response.status_code == 501


# ── Cancel endpoint ───────────────────────────────────────────────────────────

def test_cancel_no_subscription_returns_404(http_client: TestClient):
    """POST /subscription/cancel returns 404 when no active subscription exists."""
    response = http_client.post("/api/v1/subscription/cancel")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_cancel_sets_cancel_at_period_end(http_client: TestClient, mock_db):
    """POST /subscription/cancel marks cancel_at_period_end=True."""
    await _seed_trial_subscription(mock_db)

    response = http_client.post("/api/v1/subscription/cancel")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify flag was set in DB
    doc = await mock_db["subscriptions"].find_one({"user_id": FAKE_USER_ID})
    assert doc["cancel_at_period_end"] is True
