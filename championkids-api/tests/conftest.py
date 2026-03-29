"""Pytest fixtures shared across the entire test suite.

Test isolation strategy
-----------------------
- ``test_db`` / ``test_client``  — session-scoped, use a real MongoDB test database.
  These fixtures back the existing test_auth.py and test_health.py tests.
- ``mock_db`` / ``http_client``  — function-scoped, use mongomock_motor (in-memory).
  These fixtures back the new integration test files (children, activities, progress).
  Each test gets a completely fresh database with no shared state.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.auth.models import UserClaims
from app.config import settings
from app.dependencies import get_db
from app.main import app

# ── Shared test constants ─────────────────────────────────────────────────────

TEST_DB_NAME = "championkids_test"

# Fake authenticated parent used by all HTTP integration tests
FAKE_USER_ID = "test-parent-00000000-0001"
FAKE_USER = UserClaims(
    user_id=FAKE_USER_ID,
    email="test@championkids.example",
    role="parent",
    full_name="Test Parent",
)


# ── Event loop (session-scoped) ───────────────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    """Provide a single asyncio event loop for the entire test session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


# ── Real MongoDB fixtures (for test_auth.py, test_health.py) ──────────────────

@pytest_asyncio.fixture(scope="session")
async def test_motor_client() -> AsyncGenerator[AsyncIOMotorClient, None]:
    """Create a Motor client pointed at the test cluster."""
    client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000, tz_aware=True)
    yield client
    client.close()


@pytest_asyncio.fixture(scope="session")
async def test_db(test_motor_client: AsyncIOMotorClient) -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """Return the test database and drop it at session teardown."""
    db = test_motor_client[TEST_DB_NAME]
    yield db
    try:
        await test_motor_client.drop_database(TEST_DB_NAME)
    except Exception:
        pass


@pytest.fixture(scope="session")
def test_client(test_db: AsyncIOMotorDatabase) -> Generator[TestClient, None, None]:
    """Return a synchronous TestClient with get_db overridden to use test_db."""

    async def _override_get_db() -> AsyncIOMotorDatabase:
        return test_db

    app.dependency_overrides[get_db] = _override_get_db

    with TestClient(app, raise_server_exceptions=False) as client:
        yield client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="session")
async def seed_data(test_db: AsyncIOMotorDatabase) -> dict:
    """Insert minimal reference data required by most tests.

    Returns a dict of inserted IDs so tests can reference them without
    hard-coding ObjectId strings.
    """
    from bson import ObjectId

    age_band_id = ObjectId()
    skill_category_id = ObjectId()
    activity_id = ObjectId()

    await test_db["age_bands"].insert_one({
        "_id": age_band_id,
        "label": "3–4",
        "min_age": 3,
        "max_age": 4,
    })

    await test_db["skill_categories"].insert_one({
        "_id": skill_category_id,
        "name": "Communication",
        "slug": "communication",
    })

    await test_db["activities"].insert_one({
        "_id": activity_id,
        "title": "Tell Me a Story",
        "age_band_id": age_band_id,
        "skill_category_id": skill_category_id,
        "status": "published",
        "coaching_prompt": "Ask your child to make up a short story about their favourite animal.",
        "duration_minutes": 5,
    })

    return {
        "age_band_id": str(age_band_id),
        "skill_category_id": str(skill_category_id),
        "activity_id": str(activity_id),
    }


# ── In-memory database (for test_children, test_activities, test_progress) ────

@pytest.fixture()
def mock_db():
    """Return a fresh in-memory mongomock database.

    Function-scoped: each test gets a completely isolated database with no
    documents.  Any data needed must be seeded by the test or a helper fixture.

    ``tz_aware=True`` mirrors the production Motor client setting so that
    datetime comparisons inside route handlers work without offset errors.
    """
    client = AsyncMongoMockClient(tz_aware=True)
    return client["championkids_mock"]


@pytest.fixture()
def http_client(mock_db):
    """TestClient with get_current_user overridden and get_database patched.

    - get_current_user → returns FAKE_USER (no JWT required)
    - get_database in each router module → returns mock_db (in-memory)

    This fixture is function-scoped so every test starts with a clean slate.
    """
    from app.auth.dependencies import get_current_user as _get_current_user

    async def _fake_current_user():
        return FAKE_USER

    app.dependency_overrides[_get_current_user] = _fake_current_user

    # Patch get_database at each call site (it is imported by-reference into
    # each module, so we must patch the name in each module's namespace).
    # Also patch the lifespan helpers so each function-scoped TestClient:
    #   - does not make a real MongoDB ping (connect_db/close_db)
    #   - does not try to create indexes on the mock DB via app.main
    #   - does not start/stop the APScheduler (avoids "event loop is closed" on teardown)
    module_patches = [
        # Router and agent DB references
        patch("app.routers.children.get_database", return_value=mock_db),
        patch("app.routers.activities.get_database", return_value=mock_db),
        patch("app.routers.progress.get_database", return_value=mock_db),
        patch("app.routers.subscriptions.get_database", return_value=mock_db),
        patch("app.agents.entitlement.dependencies.get_database", return_value=mock_db),
        # Lifespan: skip real MongoDB connection and APScheduler lifecycle
        patch("app.main.connect_db", new_callable=AsyncMock),
        patch("app.main.close_db", new_callable=AsyncMock),
        patch("app.main.create_all_indexes", new_callable=AsyncMock),
        patch("app.main.get_database", return_value=mock_db),
        patch("app.main.start_scheduler"),
        patch("app.main.stop_scheduler"),
    ]

    for p in module_patches:
        p.start()

    with TestClient(app, raise_server_exceptions=False) as client:
        yield client

    for p in module_patches:
        p.stop()

    app.dependency_overrides.pop(_get_current_user, None)
