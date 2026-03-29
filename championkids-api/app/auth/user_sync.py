"""MongoDB user-document helpers: upsert, lookup, soft-delete.

The ``_id`` field for user documents is the Supabase UUID string — NOT a
bson.ObjectId.  This keeps user lookups O(1) without a secondary index and
makes the link between Supabase Auth and our MongoDB explicit.

User document shape
-------------------
{
    "_id": str,                 ← Supabase UUID
    "email": str,
    "full_name": str,
    "avatar_url": str | None,
    "created_at": datetime,     ← UTC
    "updated_at": datetime,     ← UTC
    "deleted_at": datetime | None,
    "referral_code": str,       ← 8-char uppercase, no ambiguous chars
    "referred_by": str | None,  ← user_id of referrer, if any
}
"""

import logging
import random
import string
from datetime import datetime, timezone
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


# ── Referral code generation ──────────────────────────────────────────────────

# A-Z minus visually ambiguous letters {I, O}; digits 2-9 (exclude 0 and 1)
_REFERRAL_ALPHABET: str = (
    "ABCDEFGHJKLMNPQRSTUVWXYZ"  # 24 letters (I and O removed)
    "23456789"                   # 8 digits   (0 and 1 removed)
)
_REFERRAL_CODE_LENGTH: int = 8


def generate_referral_code() -> str:
    """Generate an 8-character uppercase alphanumeric referral code.

    The alphabet excludes characters that are visually ambiguous:
    ``0`` (zero), ``O`` (letter O), ``I`` (letter I), ``1`` (one).

    Returns:
        A random string such as ``"CHK7M9XR"``.

    Example:
        >>> code = generate_referral_code()
        >>> assert len(code) == 8
        >>> assert all(c in _REFERRAL_ALPHABET for c in code)
    """
    return "".join(random.choices(_REFERRAL_ALPHABET, k=_REFERRAL_CODE_LENGTH))


# ── User document helpers ─────────────────────────────────────────────────────

async def get_or_create_mongo_user(
    supabase_user_id: str,
    email: str,
    full_name: str,
    db: AsyncIOMotorDatabase,
    referred_by: Optional[str] = None,
) -> dict:
    """Upsert a user document keyed on the Supabase UUID.

    On **insert** (first login / signup):
      - Generates a unique referral code.
      - Records ``created_at`` and ``updated_at``.
      - Stores ``referred_by`` if provided.

    On **update** (subsequent logins):
      - Bumps ``updated_at`` only.
      - Does NOT overwrite ``referral_code``, ``created_at``, or ``referred_by``.

    Args:
        supabase_user_id: The Supabase ``sub`` UUID.
        email:            User's email (kept in sync with Supabase).
        full_name:        Display name from JWT ``user_metadata``.
        db:               Active Motor database handle.
        referred_by:      Optional user_id of the referrer (set only on first insert).

    Returns:
        The full user document as a dict (after upsert).
    """
    now = datetime.now(timezone.utc)

    # Attempt to find an existing document first (avoids generating a referral code
    # that we will immediately discard on the happy path of existing users)
    existing = await db["users"].find_one({"_id": supabase_user_id})
    if existing:
        await db["users"].update_one(
            {"_id": supabase_user_id},
            {
                "$set": {
                    "email": email,
                    "full_name": full_name,
                    "updated_at": now,
                }
            },
        )
        return await db["users"].find_one({"_id": supabase_user_id})  # type: ignore[return-value]

    # New user — generate a referral code and insert
    referral_code = await _unique_referral_code(db)
    insert_doc = {
        "_id": supabase_user_id,
        "email": email,
        "full_name": full_name,
        "avatar_url": None,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
        "referral_code": referral_code,
        "referred_by": referred_by,
    }
    await db["users"].insert_one(insert_doc)
    logger.info("Created MongoDB user: user_id=%s", supabase_user_id)
    return insert_doc


async def _unique_referral_code(db: AsyncIOMotorDatabase, max_attempts: int = 10) -> str:
    """Generate a referral code that does not already exist in the database.

    In practice collisions are extremely rare (32^8 ≈ 1 trillion combinations)
    but we guard against them for correctness.

    Raises:
        RuntimeError: if a unique code cannot be generated within ``max_attempts``.
    """
    for _ in range(max_attempts):
        code = generate_referral_code()
        collision = await db["users"].find_one({"referral_code": code}, {"_id": 1})
        if collision is None:
            return code
    raise RuntimeError(
        f"Could not generate a unique referral code after {max_attempts} attempts."
    )


async def get_mongo_user(
    user_id: str,
    db: AsyncIOMotorDatabase,
) -> Optional[dict]:
    """Fetch a user document by Supabase UUID.

    Soft-deleted users (``deleted_at`` is set) are treated as non-existent.

    Args:
        user_id: The Supabase UUID (``_id`` in MongoDB).
        db:      Active Motor database handle.

    Returns:
        User document dict, or ``None`` if not found or soft-deleted.
    """
    doc = await db["users"].find_one({"_id": user_id, "deleted_at": None})
    return doc


async def soft_delete_mongo_user(
    user_id: str,
    db: AsyncIOMotorDatabase,
) -> None:
    """Soft-delete a user and all of their children records.

    Sets ``deleted_at`` to the current UTC time on the user document and on
    every child document whose ``parent_id`` matches.  Hard deletion from
    MongoDB and from Supabase Auth is handled separately by the account-deletion
    flow in the router layer.

    Args:
        user_id: The Supabase UUID of the user to delete.
        db:      Active Motor database handle.
    """
    now = datetime.now(timezone.utc)

    user_result = await db["users"].update_one(
        {"_id": user_id, "deleted_at": None},
        {"$set": {"deleted_at": now, "updated_at": now}},
    )

    children_result = await db["children"].update_many(
        {"parent_id": user_id, "deleted_at": None},
        {"$set": {"deleted_at": now, "updated_at": now}},
    )

    logger.info(
        "Soft-deleted user_id=%s (matched=%d) and %d children.",
        user_id,
        user_result.matched_count,
        children_result.modified_count,
    )
