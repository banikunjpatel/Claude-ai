"""Seed 10 sample activities for development and agent validation.

These are NOT the full 200+ content library — that is seeded via the admin CMS
in Week 11.  These 10 activities cover 5 age bands (2 activities each) and are
sufficient to exercise the daily selection agent, deduplication logic, and
streak calculation agent end-to-end.

Coverage:
  1–2  band: Emotional Intelligence · Creativity
  3–4  band: Communication · Resilience
  5–6  band: Critical Thinking · Social Skills
  7–8  band: Leadership · Creativity
  9–10 band: Critical Thinking · Communication

Idempotency: upsert on ``slug`` — safe to run multiple times.

Usage:
    python -m app.scripts.seed_sample_activities
"""

import asyncio
import logging
import re
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


# ── Helpers ───────────────────────────────────────────────────────────────────

def _slugify(title: str) -> str:
    """Convert a title to a URL-safe slug."""
    slug = title.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug.strip("-")


# ── Raw activity definitions ──────────────────────────────────────────────────
# Each entry uses human-readable keys; the seed function resolves ObjectIds.

_ACTIVITIES_RAW = [
    # ── 1–2 band ─────────────────────────────────────────────────────────────
    {
        "title": "How Are You Feeling?",
        "age_band_label": "1–2",
        "skill_slug": "emotional-intelligence",
        "coaching_prompt": (
            "Hold up three fingers and name a feeling for each one: happy, sad, angry. "
            "Pull a matching face for each one and encourage your child to copy you. "
            "Then point to their face and ask, 'Which one are you right now?' "
            "Accept any response — pointing, sounds, or words all count."
        ),
        "follow_up_questions": [
            "Can you show me your happy face?",
            "What makes you feel cosy and safe?",
        ],
        "parent_tip": (
            "At this age, naming feelings is the skill — you are building vocabulary "
            "they will use for years. There is no wrong answer."
        ),
        "variation": (
            "Use a mirror so your child can watch their own face change expression."
        ),
    },
    {
        "title": "Build a Tower, Knock It Down",
        "age_band_label": "1–2",
        "skill_slug": "creativity",
        "coaching_prompt": (
            "Gather a mix of soft objects — cushions, fabric blocks, plastic cups. "
            "Build a tower together, adding one item at a time and narrating what you do: "
            "'Now your turn. What should go next?' "
            "When it falls, cheer loudly and rebuild. "
            "Swap roles: let your child be the architect while you follow their instructions."
        ),
        "follow_up_questions": [
            "What should we put on top this time?",
            "What happens if we put the big one at the top?",
        ],
        "parent_tip": (
            "The knock-down moment is as valuable as the build — it teaches cause-and-effect "
            "and models that failure leads straight to another attempt."
        ),
        "variation": None,
    },

    # ── 3–4 band ─────────────────────────────────────────────────────────────
    {
        "title": "Tell Me About Your Day",
        "age_band_label": "3–4",
        "skill_slug": "communication",
        "coaching_prompt": (
            "At dinner or bedtime, ask your child to tell you about one thing that happened today. "
            "Listen without interrupting for 60 seconds — even if the story wanders. "
            "Then ask one genuine follow-up question based on what they said. "
            "Finish by sharing one thing from your own day using the same structure: "
            "what happened, how it felt, what you did next."
        ),
        "follow_up_questions": [
            "And then what happened?",
            "How did that make you feel inside?",
        ],
        "parent_tip": (
            "Children this age often retell events out of order. "
            "Resist tidying the story — follow their thread and they will learn sequencing "
            "naturally over time."
        ),
        "variation": (
            "Use a 'talking object' (a spoon, a stone) — only the person holding it speaks."
        ),
    },
    {
        "title": "The Try-Again Game",
        "age_band_label": "3–4",
        "skill_slug": "resilience",
        "coaching_prompt": (
            "Choose a simple challenge your child finds hard: stacking five blocks, "
            "doing up a button, pouring water into a cup. "
            "When they struggle or stop, say 'That was a hard try — let's try again.' "
            "Count each attempt out loud together ('That's try number three!'). "
            "Celebrate the number of tries, not just success. "
            "Model it yourself: try something and get it wrong on purpose, then try again."
        ),
        "follow_up_questions": [
            "What will you do differently on the next try?",
            "How did it feel when it finally worked?",
        ],
        "parent_tip": (
            "Praising the attempt — not the outcome — builds a growth mindset. "
            "Say 'You kept going!' not 'You did it!'."
        ),
        "variation": None,
    },

    # ── 5–6 band ─────────────────────────────────────────────────────────────
    {
        "title": "Why Does That Float?",
        "age_band_label": "5–6",
        "skill_slug": "critical-thinking",
        "coaching_prompt": (
            "Fill a bowl or the bath with water. Collect 6–8 objects of different sizes "
            "and materials — a coin, a leaf, a grape, a sponge, a toy car. "
            "Before each object goes in, ask: 'Will this float or sink? Why do you think so?' "
            "After testing: 'Were you right? What surprised you?' "
            "Do not correct wrong predictions — ask them to explain what they noticed."
        ),
        "follow_up_questions": [
            "What do all the floating things have in common?",
            "If you could change one thing about the coin, could you make it float?",
        ],
        "parent_tip": (
            "The goal is not the right answer — it is the habit of predicting, testing, "
            "and revising. Wrong predictions are the best part."
        ),
        "variation": (
            "Use aluminium foil: shape it flat (sinks) then into a boat (floats). "
            "Ask why the same material behaves differently."
        ),
    },
    {
        "title": "The Compliment Circle",
        "age_band_label": "5–6",
        "skill_slug": "social-skills",
        "coaching_prompt": (
            "Sit together and take turns giving each other a specific compliment — "
            "not 'you're nice' but something they actually observed: "
            "'I noticed you shared your crayons with your brother today.' "
            "Coach your child: 'Think of something kind you saw someone do this week.' "
            "After each compliment, the receiver says only 'Thank you' — no deflecting. "
            "Do at least three rounds each."
        ),
        "follow_up_questions": [
            "How does it feel to hear something kind about yourself?",
            "What is the difference between 'you're nice' and what you just said?",
        ],
        "parent_tip": (
            "Specific compliments build the skill of noticing others. "
            "This is the foundation of empathy in action."
        ),
        "variation": (
            "Write compliments on sticky notes and leave them around the house for "
            "family members to find."
        ),
    },

    # ── 7–8 band ─────────────────────────────────────────────────────────────
    {
        "title": "Run the Dinner Plan",
        "age_band_label": "7–8",
        "skill_slug": "leadership",
        "coaching_prompt": (
            "Hand your child full responsibility for planning tonight's dinner — "
            "within constraints you set (budget: £10, must include one vegetable). "
            "They decide the menu, write a shopping list, and direct any help they need from you. "
            "Your job is to ask questions, not to take over: "
            "'What happens if we don't have that ingredient?' "
            "'Who needs to do what and when?' "
            "Let them feel the weight of real responsibility — including if something doesn't go perfectly."
        ),
        "follow_up_questions": [
            "What was the hardest decision you had to make?",
            "What would you do differently next time?",
        ],
        "parent_tip": (
            "Leadership is learned through real stakes. The dinner does not need to be perfect "
            "— the decision-making experience is the point."
        ),
        "variation": None,
    },
    {
        "title": "Invent a Creature",
        "age_band_label": "7–8",
        "skill_slug": "creativity",
        "coaching_prompt": (
            "Give your child a blank sheet of paper and a simple constraint: "
            "'Design a creature that lives underground and only comes out in rain.' "
            "They draw it, name it, and answer five questions you ask: "
            "What does it eat? How does it communicate? What is its biggest enemy? "
            "What special ability does it have? What is one thing it cannot do? "
            "Then you design one too — swap and critique each other's with one 'I like...' "
            "and one 'What if...' each."
        ),
        "follow_up_questions": [
            "Why did you give it that particular ability?",
            "What would change about your creature if it had to live in the desert instead?",
        ],
        "parent_tip": (
            "Constraints fuel creativity — an open brief ('draw anything') is harder than "
            "a specific challenge. Add more constraints if your child gets stuck."
        ),
        "variation": (
            "Write a one-paragraph origin story for the creature together."
        ),
    },

    # ── 9–10 band ────────────────────────────────────────────────────────────
    {
        "title": "Spot the Assumption",
        "age_band_label": "9–10",
        "skill_slug": "critical-thinking",
        "coaching_prompt": (
            "Choose a short news headline, an advert, or a rule from school. "
            "Read it aloud together and ask: 'What does this assume is true?' "
            "List every hidden assumption you can find — aim for at least three. "
            "Then ask: 'What if one of those assumptions is wrong? "
            "Does the whole thing still make sense?' "
            "Share your own thinking too — model the process of questioning out loud."
        ),
        "follow_up_questions": [
            "Which assumption is the most important one to question?",
            "Who benefits if people believe this without questioning it?",
        ],
        "parent_tip": (
            "You do not need a complex topic. A cereal-box health claim or a school rule "
            "works perfectly and makes the skill feel immediately practical."
        ),
        "variation": (
            "Try it with a family rule your child has always accepted — prepare for "
            "a lively discussion."
        ),
    },
    {
        "title": "Explain It to Me",
        "age_band_label": "9–10",
        "skill_slug": "communication",
        "coaching_prompt": (
            "Ask your child to pick something they know well — a game, a subject at school, "
            "a hobby — and explain it to you as if you have never heard of it. "
            "Your job is to ask the questions a genuine beginner would ask: "
            "'Wait, why does that rule exist?' 'What happens if you break that rule?' "
            "Give them two rounds: explain once, get your questions, then explain again "
            "incorporating what they learned from your confusion."
        ),
        "follow_up_questions": [
            "What was the hardest part to explain clearly?",
            "What did my questions tell you about what you assumed I already knew?",
        ],
        "parent_tip": (
            "The Feynman technique — explaining something simply to test your own understanding "
            "— is one of the most powerful learning tools that exists. You are teaching "
            "metacognition, not just communication."
        ),
        "variation": (
            "Record the first explanation on your phone, then play it back after the second "
            "to hear the difference."
        ),
    },
]


# ── Seed logic ────────────────────────────────────────────────────────────────

async def _resolve_refs(
    db: AsyncIOMotorDatabase,
) -> tuple[dict[str, ObjectId], dict[str, ObjectId]]:
    """Return lookup maps: slug → ObjectId for categories, label → ObjectId for age bands."""
    cats = {}
    async for doc in db["skill_categories"].find({}, {"slug": 1}):
        cats[doc["slug"]] = doc["_id"]

    bands = {}
    async for doc in db["age_bands"].find({}, {"label": 1}):
        bands[doc["label"]] = doc["_id"]

    return cats, bands


async def seed_activities(db: AsyncIOMotorDatabase) -> int:
    """Upsert all sample activities. Returns total activities now in the collection."""
    cats, bands = await _resolve_refs(db)

    missing_cats = {a["skill_slug"] for a in _ACTIVITIES_RAW} - cats.keys()
    missing_bands = {a["age_band_label"] for a in _ACTIVITIES_RAW} - bands.keys()
    if missing_cats or missing_bands:
        raise RuntimeError(
            f"Reference data missing — run seed_reference_data first. "
            f"Missing categories: {missing_cats}. Missing bands: {missing_bands}."
        )

    now = datetime.now(timezone.utc)
    ops = []

    for raw in _ACTIVITIES_RAW:
        slug = _slugify(raw["title"])
        doc = {
            "title": raw["title"],
            "slug": slug,
            "skill_category_id": cats[raw["skill_slug"]],
            "age_band_id": bands[raw["age_band_label"]],
            "coaching_prompt": raw["coaching_prompt"],
            "follow_up_questions": raw["follow_up_questions"],
            "parent_tip": raw.get("parent_tip"),
            "variation": raw.get("variation"),
            "time_estimate_minutes": 5,
            "status": "published",
            "created_by": None,
            "published_at": now,
            "audio_url": None,
            "created_at": now,
            "updated_at": now,
        }
        ops.append(
            UpdateOne(
                {"slug": slug},
                {"$setOnInsert": {"_id": ObjectId()}, "$set": doc},
                upsert=True,
            )
        )

    await db["activities"].bulk_write(ops, ordered=False)
    return await db["activities"].count_documents({})


async def run(db: AsyncIOMotorDatabase) -> None:
    total = await seed_activities(db)
    print(f"Seeded {total} activities")
    logger.info("Activity seed complete — %d total activities in collection.", total)


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
