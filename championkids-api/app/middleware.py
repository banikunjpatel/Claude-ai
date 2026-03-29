"""FastAPI middleware: CORS, structured request logging, and rate limiting.

Middleware is registered in app/main.py via add_middleware() and the SlowAPI
limiter is attached to the app state so that route decorators can reference it.
"""

import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.config import settings

logger = logging.getLogger(__name__)


# ── SlowAPI limiter (shared instance) ────────────────────────────────────────

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.API_RATE_LIMIT_PER_MINUTE}/minute"],
)


# ── Request logging middleware ────────────────────────────────────────────────

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log method, path, status code, and wall-clock duration for every request."""

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        response: Response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        logger.info(
            "%s %s %s %.1fms",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        # Expose timing in response header (useful for client-side monitoring)
        response.headers["X-Response-Time-Ms"] = f"{duration_ms:.1f}"
        return response


# ── Registration helper ───────────────────────────────────────────────────────

def register_middleware(app: FastAPI) -> None:
    """Attach all middleware to the FastAPI application.

    Order matters: middleware added last runs first (outermost wrapper).
    The registration order here is:
      1. CORS (outermost — must handle pre-flight before anything else)
      2. Request logging (next layer)
    SlowAPI is wired via app.state.limiter + exception handler, not as ASGI middleware.
    """
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request logging
    app.add_middleware(RequestLoggingMiddleware)

    # SlowAPI — attach limiter to app state and register the 429 handler
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
