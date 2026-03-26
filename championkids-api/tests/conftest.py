"""Pytest fixtures shared across the entire test suite.

Test isolation strategy:
- A separate MongoDB database (championkids_test) is created per test session.
- The FastAPI ``get_db`` dependency is overridden to point at the test database.
- Seed fixtures insert the minimal documents needed for selection / streak logic.
- All collections are dropped at the end of the session to avoid stale data.
"""

import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings
from app.dependencies import get_db
from app.main import app

# ── Test database name ────────────────────────────────────────────────────────
TEST_DB_NAME = "championkids_test"


# ── Event loop (session-scoped) ───────────────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    """Provide a single asyncio event loop for the entire test session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


# ── Test Motor client and database ────────────────────────────────────────────

@pytest_asyncio.fixture(scope="session")
async def test_motor_client() -> AsyncGenerator[AsyncIOMotorClient, None]:
    """Create a Motor client pointed at the test cluster."""
    client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
    yield client
    client.close()


@pytest_asyncio.fixture(scope="session")
async def test_db(test_motor_client: AsyncIOMotorClient) -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """Return the test database and drop it at session teardown."""
    db = test_motor_client[TEST_DB_NAME]
    yield db
    # Teardown: remove all test data
    await test_motor_client.drop_database(TEST_DB_NAME)


# ── Dependency override ───────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def test_client(test_db: AsyncIOMotorDatabase) -> Generator[TestClient, None, None]:
    """Return a synchronous TestClient with get_db overridden to use test_db."""

    async def _override_get_db() -> AsyncIOMotorDatabase:
        return test_db

    app.dependency_overrides[get_db] = _override_get_db

    with TestClient(app, raise_server_exceptions=False) as client:
        yield client

    app.dependency_overrides.clear()


# ── Seed data ─────────────────────────────────────────────────────────────────

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
