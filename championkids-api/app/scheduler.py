"""APScheduler AsyncIOScheduler singleton shared across all Phase 1 agents.

Agents import ``scheduler`` directly to register their cron jobs.
The lifecycle (start / stop) is managed by the FastAPI lifespan handler in main.py.
"""

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor

logger = logging.getLogger(__name__)

# Shared scheduler instance — one per process
scheduler = AsyncIOScheduler(
    jobstores={"default": MemoryJobStore()},
    executors={"default": AsyncIOExecutor()},
    job_defaults={
        # Allow a job that fires up to 1 hour late to still run
        "misfire_grace_time": 3600,
        # Do not run missed executions that piled up while the server was down
        "coalesce": True,
        "max_instances": 1,
    },
)


def start_scheduler() -> None:
    """Start the scheduler if it is not already running."""
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started.")
    else:
        logger.debug("APScheduler already running — skipping start.")


def stop_scheduler() -> None:
    """Gracefully shut down the scheduler on application exit."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped.")
