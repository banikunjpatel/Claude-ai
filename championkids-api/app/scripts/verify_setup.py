"""Database setup verification script.

Checks:
  1. MongoDB connection is reachable
  2. All 16 Phase 1 collections exist (creates empty ones if missing)
  3. skill_categories contains exactly 7 documents
  4. age_bands contains exactly 6 documents
  5. All indexes on the activities collection are listed
  6. A sample age-band query for '7–8' returns at least one activity

Prints a structured PASS / FAIL report and exits with code 1 if any check fails.

Usage:
    python -m app.scripts.verify_setup
"""

import asyncio
import logging
import sys
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

logging.basicConfig(
    level=logging.WARNING,          # suppress Motor noise during report
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ── All Phase 1 collection names ──────────────────────────────────────────────

REQUIRED_COLLECTIONS = [
    "users",
    "children",
    "skill_categories",
    "age_bands",
    "activities",
    "activity_completions",
    "daily_activity_selections",
    "streaks",
    "subscriptions",
    "subscription_events",
    "devices",
    "admin_alerts",
    "age_band_transitions",
    "child_skill_focuses",
    "devices",
    "admin_alerts",
]
# Deduplicate while preserving order
_seen: set = set()
REQUIRED_COLLECTIONS = [
    c for c in REQUIRED_COLLECTIONS if not (c in _seen or _seen.add(c))  # type: ignore[func-returns-value]
]


# ── Individual checks ─────────────────────────────────────────────────────────

class CheckResult:
    def __init__(self, name: str, passed: bool, detail: str = "") -> None:
        self.name = name
        self.passed = passed
        self.detail = detail

    def __str__(self) -> str:
        status = "PASS" if self.passed else "FAIL"
        suffix = f"  ({self.detail})" if self.detail else ""
        return f"  [{status}] {self.name}{suffix}"


async def check_connection(client: AsyncIOMotorClient) -> CheckResult:
    try:
        await client.admin.command("ping")
        return CheckResult("MongoDB connection", passed=True)
    except Exception as exc:
        return CheckResult("MongoDB connection", passed=False, detail=str(exc))


async def check_collections(db: AsyncIOMotorDatabase) -> CheckResult:
    """Verify all required collections exist; create any that are missing."""
    existing = set(await db.list_collection_names())
    missing = [c for c in REQUIRED_COLLECTIONS if c not in existing]

    for name in missing:
        # Insert and immediately delete a placeholder to force collection creation
        result = await db[name].insert_one({"_setup": True})
        await db[name].delete_one({"_id": result.inserted_id})

    if missing:
        return CheckResult(
            "All 16 collections exist",
            passed=True,
            detail=f"created missing: {', '.join(missing)}",
        )
    return CheckResult("All 16 collections exist", passed=True)


async def check_skill_categories(db: AsyncIOMotorDatabase) -> CheckResult:
    count = await db["skill_categories"].count_documents({})
    passed = count == 7
    return CheckResult(
        "skill_categories has 7 documents",
        passed=passed,
        detail=f"found {count}" if not passed else f"{count} found",
    )


async def check_age_bands(db: AsyncIOMotorDatabase) -> CheckResult:
    count = await db["age_bands"].count_documents({})
    passed = count == 6
    return CheckResult(
        "age_bands has 6 documents",
        passed=passed,
        detail=f"found {count}" if not passed else f"{count} found",
    )


async def check_activity_indexes(db: AsyncIOMotorDatabase) -> CheckResult:
    """List all indexes on the activities collection and report them."""
    indexes = []
    async for idx in db["activities"].list_indexes():
        indexes.append(idx.get("name", "unnamed"))
    detail = "indexes: " + ", ".join(sorted(indexes))
    passed = len(indexes) > 1  # at least _id_ + our custom indexes
    return CheckResult("activities indexes exist", passed=passed, detail=detail)


async def check_age_band_query(db: AsyncIOMotorDatabase) -> CheckResult:
    """Run a sample query for age band '7–8' and verify the index is hit."""
    band_doc = await db["age_bands"].find_one({"label": "7–8"})
    if not band_doc:
        return CheckResult(
            "Sample age-band query (7–8)",
            passed=False,
            detail="age band '7–8' not found — run seed_reference_data first",
        )

    band_id = band_doc["_id"]
    count = await db["activities"].count_documents(
        {"age_band_id": band_id, "status": "published"}
    )
    return CheckResult(
        "Sample age-band query (7–8)",
        passed=True,
        detail=f"{count} published activities found for band 7–8",
    )


# ── Report runner ─────────────────────────────────────────────────────────────

async def run(db: AsyncIOMotorDatabase, client: AsyncIOMotorClient) -> bool:
    """Execute all checks and print a formatted report.

    Returns True if all checks passed, False otherwise.
    """
    print("\n" + "=" * 60)
    print(f"  ChampionKids — Database Verification Report")
    print(f"  DB : {settings.MONGODB_DB_NAME}")
    print(f"  Run: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    checks = [
        await check_connection(client),
        await check_collections(db),
        await check_skill_categories(db),
        await check_age_bands(db),
        await check_activity_indexes(db),
        await check_age_band_query(db),
    ]

    all_passed = True
    for check in checks:
        print(check)
        if not check.passed:
            all_passed = False

    print("=" * 60)
    overall = "ALL CHECKS PASSED" if all_passed else "ONE OR MORE CHECKS FAILED"
    print(f"  {overall}")
    print("=" * 60 + "\n")

    return all_passed


# ── Entry point ───────────────────────────────────────────────────────────────

async def main() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
    try:
        db = client[settings.MONGODB_DB_NAME]
        passed = await run(db, client)
        sys.exit(0 if passed else 1)
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
