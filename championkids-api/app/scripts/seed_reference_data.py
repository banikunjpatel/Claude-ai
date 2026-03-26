"""Seed the two static reference collections required by all Phase 1 agents.

Collections written:
  - skill_categories  (7 documents — one per skill domain)
  - age_bands         (6 documents — one per age grouping)

This script is **idempotent**: it uses upsert on the natural key (slug / label)
so it is safe to run multiple times against the same database without creating
duplicates.
    
Usage:
    python -m app.scripts.seed_reference_data
"""

import asyncio
import logging
import sys
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import UpdateOne

from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ── Reference data ────────────────────────────────────────────────────────────

SKILL_CATEGORIES = [
    {
        "slug": "communication",
        "display_name": "Communication",
        "description": (
            "The ability to express thoughts clearly, listen actively, "
            "and adapt communication style to context."
        ),
        "icon_name": "chat-bubble",
        "colour_hex": "#4ECDC4",
        "sort_order": 1,
        "is_active": True,
    },
    {
        "slug": "leadership",
        "display_name": "Leadership",
        "description": (
            "The capacity to guide, inspire, and take responsibility "
            "— starting with leading oneself."
        ),
        "icon_name": "star",
        "colour_hex": "#FFE66D",
        "sort_order": 2,
        "is_active": True,
    },
    {
        "slug": "critical-thinking",
        "display_name": "Critical Thinking",
        "description": (
            "The habit of questioning assumptions, evaluating evidence, "
            "and reasoning toward well-grounded conclusions."
        ),
        "icon_name": "lightbulb",
        "colour_hex": "#6C5CE7",
        "sort_order": 3,
        "is_active": True,
    },
    {
        "slug": "creativity",
        "display_name": "Creativity",
        "description": (
            "The practice of generating original ideas, making unexpected "
            "connections, and approaching problems with imagination."
        ),
        "icon_name": "paint-brush",
        "colour_hex": "#FD79A8",
        "sort_order": 4,
        "is_active": True,
    },
    {
        "slug": "resilience",
        "display_name": "Resilience",
        "description": (
            "The ability to bounce back from setbacks, manage frustration, "
            "and persist through difficulty."
        ),
        "icon_name": "shield",
        "colour_hex": "#00B894",
        "sort_order": 5,
        "is_active": True,
    },
    {
        "slug": "social-skills",
        "display_name": "Social Skills",
        "description": (
            "The behaviours that build positive relationships: turn-taking, "
            "empathy in action, cooperation, and conflict resolution."
        ),
        "icon_name": "people",
        "colour_hex": "#E17055",
        "sort_order": 6,
        "is_active": True,
    },
    {
        "slug": "emotional-intelligence",
        "display_name": "Emotional Intelligence",
        "description": (
            "The ability to recognise, name, understand, and regulate one's "
            "own emotions, and to empathise with others."
        ),
        "icon_name": "heart",
        "colour_hex": "#74B9FF",
        "sort_order": 7,
        "is_active": True,
    },
]

AGE_BANDS = [
    {"label": "1–2", "min_age_years": 1, "max_age_years": 2, "sort_order": 1},
    {"label": "3–4", "min_age_years": 3, "max_age_years": 4, "sort_order": 2},
    {"label": "5–6", "min_age_years": 5, "max_age_years": 6, "sort_order": 3},
    {"label": "7–8", "min_age_years": 7, "max_age_years": 8, "sort_order": 4},
    {"label": "9–10", "min_age_years": 9, "max_age_years": 10, "sort_order": 5},
    {"label": "11–12", "min_age_years": 11, "max_age_years": 12, "sort_order": 6},
]


# ── Seed logic ────────────────────────────────────────────────────────────────

async def seed_skill_categories(db: AsyncIOMotorDatabase) -> int:
    """Upsert all skill category documents. Returns number of categories written."""
    now = datetime.now(timezone.utc)
    ops = []
    for cat in SKILL_CATEGORIES:
        doc = {**cat, "created_at": now, "updated_at": now}
        ops.append(
            UpdateOne(
                {"slug": cat["slug"]},
                {"$setOnInsert": {"_id": ObjectId()}, "$set": doc},
                upsert=True,
            )
        )
    result = await db["skill_categories"].bulk_write(ops, ordered=False)
    return result.upserted_count + result.modified_count


async def seed_age_bands(db: AsyncIOMotorDatabase) -> int:
    """Upsert all age band documents. Returns number of bands written."""
    now = datetime.now(timezone.utc)
    ops = []
    for band in AGE_BANDS:
        doc = {**band, "created_at": now, "updated_at": now}
        ops.append(
            UpdateOne(
                {"label": band["label"]},
                {"$setOnInsert": {"_id": ObjectId()}, "$set": doc},
                upsert=True,
            )
        )
    result = await db["age_bands"].bulk_write(ops, ordered=False)
    return result.upserted_count + result.modified_count


async def run(db: AsyncIOMotorDatabase) -> None:
    """Execute the full reference-data seed and print a summary."""
    cats_written = await seed_skill_categories(db)
    bands_written = await seed_age_bands(db)

    # Always report the total that now exists in the DB (not just written count)
    total_cats = await db["skill_categories"].count_documents({})
    total_bands = await db["age_bands"].count_documents({})

    print(f"Seeded {total_cats} skill categories, {total_bands} age bands")
    logger.info(
        "Reference seed complete — %d skill categories, %d age bands "
        "(%d cats written this run, %d bands written this run)",
        total_cats,
        total_bands,
        cats_written,
        bands_written,
    )


# ── Entry point ───────────────────────────────────────────────────────────────

async def main() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
    try:
        await client.admin.command("ping")
        db = client[settings.MONGODB_DB_NAME]
        await run(db)
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
