"""Shared FastAPI dependency functions injected into route handlers via Depends().

Provides:
- get_db()                — Motor database handle
- get_current_user()      — verified UserClaims (raises 401 on failure)
- get_current_parent()    — UserClaims for parent role (raises 403 otherwise)
- get_current_admin()     — UserClaims for admin role (raises 403 otherwise)
- get_optional_user()     — UserClaims or None (no raise on missing/invalid token)

Auth dependencies are re-exported from app.auth.dependencies so that route
modules have a single canonical import path:

    from app.dependencies import get_db, get_current_user
"""

import logging

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database

# Re-export all auth dependencies from the canonical auth module
from app.auth.dependencies import (  # noqa: F401  (re-export)
    get_current_admin,
    get_current_parent,
    get_current_user,
    get_optional_user,
    oauth2_scheme,
)

logger = logging.getLogger(__name__)


# ── Database ──────────────────────────────────────────────────────────────────

async def get_db() -> AsyncIOMotorDatabase:
    """Return the active Motor database handle.

    This thin wrapper allows tests to override the dependency with a test
    database via ``app.dependency_overrides[get_db] = ...``.
    """
    return get_database()
