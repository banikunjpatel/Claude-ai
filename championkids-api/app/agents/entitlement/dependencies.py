"""Entitlement dependency helpers for the activities router.

Provides two building blocks:

get_entitlement(user_id, db)
    Async utility function.  Queries the subscriptions collection and returns
    a plain dict describing the user's access level.  Call directly when you
    need the full entitlement dict (e.g. to add ``is_locked`` to a list).

require_full_access
    FastAPI ``Depends``-compatible dependency.  Raises HTTP 403 immediately
    if the user does not have an active subscription.  Use on routes where
    partial access is not an option.

Entitlement states
------------------
    trial / active / grace  →  has_full_access = True
    anything else           →  has_full_access = False

The ``today`` endpoint bypasses entitlement entirely — it is always free.
"""

import logging
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.auth.models import UserClaims
from app.database import get_database

logger = logging.getLogger(__name__)


async def get_entitlement(user_id: str, db) -> dict:
    """Return the entitlement state for *user_id*.

    Args:
        user_id: Supabase user UUID.
        db:      Active AsyncIOMotorDatabase instance.

    Returns:
        {
            "has_full_access":        bool,
            "can_access_full_library": bool,  # same value for now
            "status":    str | None,          # e.g. "trial", "active"
            "plan_type": str | None,          # e.g. "individual", "family"
        }
    """
    now = datetime.now(timezone.utc)
    doc = await db["subscriptions"].find_one({
        "user_id": user_id,
        "status": {"$in": ["trial", "active", "grace"]},
        "current_period_end": {"$gt": now},
    })

    if not doc:
        return {
            "has_full_access": False,
            "can_access_full_library": False,
            "status": None,
            "plan_type": None,
        }

    return {
        "has_full_access": True,
        "can_access_full_library": True,
        "status": doc.get("status"),
        "plan_type": doc.get("plan_type"),
    }


async def require_full_access(
    current_user: UserClaims = Depends(get_current_user),
) -> UserClaims:
    """FastAPI dependency — raise 403 if the user lacks an active subscription.

    Usage::

        @router.get("/activities/{id}")
        async def get_activity(
            activity_id: str,
            current_user: UserClaims = Depends(require_full_access),
        ):
            ...

    Raises:
        HTTP 403 SUBSCRIPTION_REQUIRED if entitlement.has_full_access is False.

    Returns:
        The authenticated UserClaims (passthrough when access is granted).
    """
    db = get_database()
    entitlement = await get_entitlement(current_user.user_id, db)
    if not entitlement["has_full_access"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "SUBSCRIPTION_REQUIRED",
                "message": "An active subscription is required to access this content.",
                "statusCode": 403,
            },
        )
    return current_user
