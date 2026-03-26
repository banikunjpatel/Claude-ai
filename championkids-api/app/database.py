"""MongoDB connection management and collection helpers using Motor async driver.

Creates a single AsyncIOMotorClient at startup and exposes typed collection
accessors. The public entry-point for index creation is ``create_all_indexes(db)``
which is idempotent and called on every application startup.

Validation query examples (all use covered indexes — include as reference):

    # One selection per child per day
    await db.daily_activity_selections.find_one(
        {"child_id": child_id, "selected_for_date": today}
    )

    # Entitlement check — hits (user_id) unique index then (status, current_period_end)
    await db.subscriptions.find_one(
        {
            "user_id": user_id,
            "status": {"$in": ["trial", "active", "grace"]},
            "current_period_end": {"$gt": datetime.utcnow()},
        }
    )

    # Primary activity selection query — hits compound (skill_category_id, age_band_id, status)
    await db.activities.find(
        {"skill_category_id": cat_id, "age_band_id": band_id, "status": "published"}
    ).to_list(None)

    # Deduplication window — hits (child_id, activity_id) compound index
    await db.activity_completions.find(
        {"child_id": child_id, "activity_id": {"$in": candidate_ids}}
    ).to_list(None)
"""

import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, TEXT, IndexModel

from app.config import settings

logger = logging.getLogger(__name__)

# Module-level client — initialised in connect_db(), closed in close_db()
_client: Optional[AsyncIOMotorClient] = None


# ── Connection lifecycle ──────────────────────────────────────────────────────

async def connect_db() -> None:
    """Create the Motor client singleton and verify the connection."""
    global _client
    _client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        serverSelectionTimeoutMS=5000,
    )
    # Force a round-trip to confirm connectivity before the app starts serving
    await _client.admin.command("ping")
    logger.info(
        "MongoDB connected: db=%s", settings.MONGODB_DB_NAME
    )


async def close_db() -> None:
    """Close the Motor client cleanly on shutdown."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed.")


# ── Accessors ─────────────────────────────────────────────────────────────────

def get_database() -> AsyncIOMotorDatabase:
    """Return the active Motor database instance.

    Raises RuntimeError if called before connect_db().
    """
    if _client is None:
        raise RuntimeError(
            "Database client not initialised. Call connect_db() first."
        )
    return _client[settings.MONGODB_DB_NAME]


def get_collection(name: str):
    """Return a named collection from the active database."""
    return get_database()[name]


# ── Index creation ────────────────────────────────────────────────────────────

async def create_all_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create (or verify) every Phase 1 index across all collections.

    This function is **idempotent** — MongoDB skips index creation when an
    index with the same name already exists with matching options.  It is
    safe to call on every application startup.

    Index naming convention:
        uq_<collection>_<field>        — unique single-field index
        idx_<collection>_<field(s)>    — non-unique index
        text_<collection>_<field>      — text search index

    Args:
        db: An active AsyncIOMotorDatabase instance.
    """

    # ── users ─────────────────────────────────────────────────────────────────
    await db["users"].create_indexes([
        IndexModel(
            [("email", ASCENDING)],
            unique=True,
            name="uq_users_email",
        ),
        IndexModel(
            [("referral_code", ASCENDING)],
            unique=True,
            sparse=True,          # users without a referral_code are excluded
            name="uq_users_referral_code",
        ),
        IndexModel(
            [("referred_by", ASCENDING)],
            sparse=True,
            name="idx_users_referred_by",
        ),
        IndexModel(
            [("deleted_at", ASCENDING)],
            sparse=True,          # only documents where deleted_at is set
            name="idx_users_deleted_at",
        ),
    ])

    # ── children ──────────────────────────────────────────────────────────────
    await db["children"].create_indexes([
        IndexModel(
            [("parent_id", ASCENDING)],
            name="idx_children_parent_id",
        ),
        # Primary query: "get all active children for a parent"
        IndexModel(
            [("parent_id", ASCENDING), ("deleted_at", ASCENDING)],
            name="idx_children_parent_deleted",
        ),
    ])

    # ── skill_categories ──────────────────────────────────────────────────────
    await db["skill_categories"].create_indexes([
        IndexModel(
            [("slug", ASCENDING)],
            unique=True,
            name="uq_skill_categories_slug",
        ),
        # CMS ordering: active categories sorted by position
        IndexModel(
            [("is_active", ASCENDING), ("sort_order", ASCENDING)],
            name="idx_skill_categories_active_order",
        ),
    ])

    # ── age_bands ─────────────────────────────────────────────────────────────
    await db["age_bands"].create_indexes([
        IndexModel(
            [("min_age_years", ASCENDING), ("max_age_years", ASCENDING)],
            name="idx_age_bands_min_max",
        ),
        IndexModel(
            [("sort_order", ASCENDING)],
            name="idx_age_bands_sort_order",
        ),
    ])

    # ── activities ────────────────────────────────────────────────────────────
    await db["activities"].create_indexes([
        # Primary selection query — category + band + status
        IndexModel(
            [
                ("skill_category_id", ASCENDING),
                ("age_band_id", ASCENDING),
                ("status", ASCENDING),
            ],
            name="idx_activities_category_band_status",
        ),
        # Admin CMS: ordered list of published activities
        IndexModel(
            [("status", ASCENDING), ("published_at", DESCENDING)],
            name="idx_activities_status_published",
        ),
        # Simple status filter (fallback queries)
        IndexModel(
            [("status", ASCENDING)],
            name="idx_activities_status",
        ),
        # Full-text search on title for admin search bar
        IndexModel(
            [("title", TEXT)],
            name="text_activities_title",
        ),
    ])

    # ── activity_completions ──────────────────────────────────────────────────
    await db["activity_completions"].create_indexes([
        # Streak calculation and history feed
        IndexModel(
            [("child_id", ASCENDING), ("completed_at", DESCENDING)],
            name="idx_completions_child_completed_at",
        ),
        # Completions per activity (analytics)
        IndexModel(
            [("activity_id", ASCENDING)],
            name="idx_completions_activity_id",
        ),
        # Deduplication: has this child completed this activity recently?
        IndexModel(
            [("child_id", ASCENDING), ("activity_id", ASCENDING)],
            name="idx_completions_child_activity",
        ),
    ])

    # ── daily_activity_selections ─────────────────────────────────────────────
    await db["daily_activity_selections"].create_indexes([
        # Enforces one selection per child per calendar day
        IndexModel(
            [("child_id", ASCENDING), ("selected_for_date", ASCENDING)],
            unique=True,
            name="uq_daily_selections_child_date",
        ),
        # Nightly cron: find all selections for a given date
        IndexModel(
            [("selected_for_date", ASCENDING)],
            name="idx_daily_selections_date",
        ),
    ])

    # ── streaks ───────────────────────────────────────────────────────────────
    await db["streaks"].create_indexes([
        IndexModel(
            [("child_id", ASCENDING)],
            unique=True,
            name="uq_streaks_child_id",
        ),
    ])

    # ── subscriptions ─────────────────────────────────────────────────────────
    await db["subscriptions"].create_indexes([
        IndexModel(
            [("user_id", ASCENDING)],
            unique=True,
            name="uq_subscriptions_user_id",
        ),
        # Entitlement check: is this subscription currently active?
        IndexModel(
            [("status", ASCENDING), ("current_period_end", ASCENDING)],
            name="idx_subscriptions_status_period",
        ),
        # Webhook lookup: match incoming event to a subscription record
        IndexModel(
            [("external_subscription_id", ASCENDING)],
            sparse=True,
            name="idx_subscriptions_external_id",
        ),
    ])

    # ── subscription_events ───────────────────────────────────────────────────
    await db["subscription_events"].create_indexes([
        IndexModel(
            [("user_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_sub_events_user_created",
        ),
        IndexModel(
            [("platform", ASCENDING), ("created_at", DESCENDING)],
            name="idx_sub_events_platform_created",
        ),
    ])

    # ── devices ───────────────────────────────────────────────────────────────
    await db["devices"].create_indexes([
        IndexModel(
            [("user_id", ASCENDING)],
            name="idx_devices_user_id",
        ),
        IndexModel(
            [("fcm_token", ASCENDING)],
            unique=True,
            name="uq_devices_fcm_token",
        ),
    ])

    # ── admin_alerts ──────────────────────────────────────────────────────────
    await db["admin_alerts"].create_indexes([
        IndexModel(
            [("alert_type", ASCENDING), ("resolved", ASCENDING)],
            name="idx_admin_alerts_type_resolved",
        ),
        IndexModel(
            [("triggered_at", DESCENDING)],
            name="idx_admin_alerts_triggered_at",
        ),
    ])

    # ── age_band_transitions ──────────────────────────────────────────────────
    await db["age_band_transitions"].create_indexes([
        IndexModel(
            [("child_id", ASCENDING)],
            name="idx_age_band_transitions_child_id",
        ),
        IndexModel(
            [("transitioned_on", DESCENDING)],
            name="idx_age_band_transitions_date",
        ),
    ])

    # ── child_skill_focuses ───────────────────────────────────────────────────
    await db["child_skill_focuses"].create_indexes([
        # One focus record per (child, skill) pair
        IndexModel(
            [("child_id", ASCENDING), ("skill_category_id", ASCENDING)],
            unique=True,
            name="uq_child_skill_focuses_child_skill",
        ),
        # Ordered retrieval of a child's skill priorities
        IndexModel(
            [("child_id", ASCENDING), ("priority_order", ASCENDING)],
            name="idx_child_skill_focuses_child_priority",
        ),
    ])

    logger.info("MongoDB indexes created / verified.")


# ── Legacy shim ───────────────────────────────────────────────────────────────

async def create_indexes() -> None:
    """Backwards-compatible shim — delegates to create_all_indexes(db).

    Prefer calling create_all_indexes(db) directly so callers supply their own
    database handle (easier to test).
    """
    db = get_database()
    await create_all_indexes(db)
