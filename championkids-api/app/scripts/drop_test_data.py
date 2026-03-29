"""Safe cleanup script for development databases.

Drops transactional collections that accumulate during local testing:
  - activity_completions
  - daily_activity_selections
  - streaks
  - users
  - children
  - subscriptions
  - subscription_events
  - devices

PRESERVES reference data:
  - activities
  - skill_categories
  - age_bands

SAFETY GUARD:
  This script REFUSES to run if ENVIRONMENT == "production".
  It also prompts for confirmation before dropping any data.

Usage:
    python -m app.scripts.drop_test_data
    python -m app.scripts.drop_test_data --yes   # skip confirmation prompt
"""

import asyncio
import logging
import sys

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# Collections that will be dropped
TRANSACTIONAL_COLLECTIONS = [
    "activity_completions",
    "daily_activity_selections",
    "streaks",
    "users",
    "children",
    "subscriptions",
    "subscription_events",
    "devices",
]

# Collections explicitly kept (documented here for clarity)
PRESERVED_COLLECTIONS = [
    "activities",
    "skill_categories",
    "age_bands",
]


# ── Guard ─────────────────────────────────────────────────────────────────────

def _abort_if_production() -> None:
    """Exit immediately if running against the production environment."""
    if settings.ENVIRONMENT == "production":
        print(
            "\n[ABORTED] drop_test_data.py will NEVER run against a production "
            "environment.\nSet ENVIRONMENT to 'development' or 'staging' to use "
            "this script.\n"
        )
        sys.exit(1)


def _confirm_or_abort(skip_prompt: bool) -> None:
    """Print a summary of what will be dropped and ask for confirmation."""
    print("\n" + "!" * 60)
    print("  WARNING: This will permanently delete data.")
    print(f"  Database   : {settings.MONGODB_DB_NAME}")
    print(f"  Environment: {settings.ENVIRONMENT}")
    print("  Collections to DROP:")
    for col in TRANSACTIONAL_COLLECTIONS:
        print(f"    - {col}")
    print("  Collections PRESERVED:")
    for col in PRESERVED_COLLECTIONS:
        print(f"    + {col}")
    print("!" * 60)

    if skip_prompt:
        print("  --yes flag detected, skipping confirmation.\n")
        return

    answer = input("\n  Type 'drop' to confirm, anything else to cancel: ").strip()
    if answer != "drop":
        print("  Cancelled — no data was deleted.\n")
        sys.exit(0)


# ── Drop logic ────────────────────────────────────────────────────────────────

async def drop_collections(db: AsyncIOMotorDatabase) -> dict[str, int]:
    """Drop each transactional collection and return a map of name → docs deleted."""
    results: dict[str, int] = {}
    for name in TRANSACTIONAL_COLLECTIONS:
        # Count before drop so we can report meaningfully
        count = await db[name].count_documents({})
        await db[name].drop()
        results[name] = count
        logger.info("Dropped collection '%s' (%d documents).", name, count)
    return results


async def run(db: AsyncIOMotorDatabase, skip_prompt: bool = False) -> None:
    _abort_if_production()
    _confirm_or_abort(skip_prompt)

    print("\nDropping collections…")
    results = await drop_collections(db)

    print("\nDone. Summary:")
    total = 0
    for name, count in results.items():
        print(f"  {name}: {count} documents removed")
        total += count
    print(f"\n  Total documents removed: {total}")
    print(f"  Reference data preserved: {', '.join(PRESERVED_COLLECTIONS)}\n")


# ── Entry point ───────────────────────────────────────────────────────────────

async def main() -> None:
    skip = "--yes" in sys.argv

    client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
    try:
        await client.admin.command("ping")
        db = client[settings.MONGODB_DB_NAME]
        await run(db, skip_prompt=skip)
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
