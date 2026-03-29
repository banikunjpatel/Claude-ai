"""FastAPI application factory for the ChampionKids API.

Startup sequence (managed by the lifespan context manager):
  1. Initialise Sentry error tracking
  2. Connect to MongoDB and create all Phase 1 indexes
  3. Start the APScheduler instance

Shutdown sequence:
  1. Stop APScheduler
  2. Close the MongoDB connection
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import sentry_sdk
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import close_db, connect_db, create_all_indexes, get_database
from app.exceptions import register_exception_handlers
from app.middleware import register_middleware
from app.scheduler import start_scheduler, stop_scheduler

logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown side-effects."""
    # ── Startup ──
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            traces_sample_rate=0.1 if settings.is_production else 1.0,
        )
        logger.info("Sentry initialised (environment=%s).", settings.ENVIRONMENT)

    await connect_db()
    await create_all_indexes(get_database())
    logger.info("MongoDB connected. Indexes verified.")
    start_scheduler()

    logger.info(
        "ChampionKids API started — environment=%s", settings.ENVIRONMENT
    )

    yield  # ← application runs here

    # ── Shutdown ──
    stop_scheduler()
    await close_db()
    logger.info("ChampionKids API shutdown complete.")


# ── App factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    """Construct and configure the FastAPI application."""
    app = FastAPI(
        title="ChampionKids API",
        version="1.0.0",
        description=(
            "Backend API for ChampionKids — a parent coaching app that delivers "
            "daily 5-minute activity cards to build 21st century skills in children aged 1–12."
        ),
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )

    register_middleware(app)
    register_exception_handlers(app)

    # ── Feature routers ───────────────────────────────────────────────────────
    from app.routers import auth, children, activities, subscriptions, progress

    # Progress and activities are mounted before children so that more-specific
    # paths like /children/{id}/progress are matched before /children/{id}.
    app.include_router(auth.router,          prefix="/api/v1")
    app.include_router(progress.router,      prefix="/api/v1")
    app.include_router(activities.router,    prefix="/api/v1")
    app.include_router(subscriptions.router, prefix="/api/v1")
    app.include_router(children.router,      prefix="/api/v1")

    # ── Health endpoints ──────────────────────────────────────────────────────

    def _health_payload() -> dict:
        return {
            "status": "ok",
            "environment": settings.ENVIRONMENT,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @app.get("/health", tags=["Health"], summary="Root health check")
    async def health_check():
        return JSONResponse(content=_health_payload())

    @app.get("/api/v1/health", tags=["Health"], summary="Versioned health check")
    async def health_check_v1():
        return JSONResponse(content=_health_payload())

    # Routers for features are mounted here as they are developed (Weeks 5–6).
    # Example:
    #   from app.routers import auth, children, activities
    #   app.include_router(auth.router, prefix="/api/v1")
    #   app.include_router(children.router, prefix="/api/v1")
    #   app.include_router(activities.router, prefix="/api/v1")

    return app


app = create_app()
