"""Custom exception classes and global FastAPI exception handlers.

Every error returned by the API conforms to the standard envelope:

    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable message",
            "statusCode": 403
        }
    }
"""

import logging
from typing import Any

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


# ── Base ─────────────────────────────────────────────────────────────────────

class AppError(Exception):
    """Base class for all application-level errors.

    Subclasses set ``status_code`` and ``code`` at the class level so that the
    global handler can build a standard envelope without any extra logic.
    """

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = "INTERNAL_ERROR"

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self._default_message()
        super().__init__(self.message)

    def _default_message(self) -> str:
        return "An unexpected error occurred."

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": False,
            "error": {
                "code": self.code,
                "message": self.message,
                "statusCode": self.status_code,
            },
        }


# ── Domain errors ─────────────────────────────────────────────────────────────

class SubscriptionRequiredError(AppError):
    """Raised when a feature requires an active paid subscription."""

    status_code = status.HTTP_403_FORBIDDEN
    code = "SUBSCRIPTION_REQUIRED"

    def _default_message(self) -> str:
        return "An active subscription is required to access this resource."


class ChildLimitReachedError(AppError):
    """Raised when the parent has reached their plan's child-profile limit."""

    status_code = status.HTTP_403_FORBIDDEN
    code = "CHILD_LIMIT_REACHED"

    def _default_message(self) -> str:
        return "You have reached the maximum number of child profiles for your plan."


class ActivityAlreadyCompletedError(AppError):
    """Raised when a parent attempts to complete an activity a second time today."""

    status_code = status.HTTP_409_CONFLICT
    code = "ACTIVITY_ALREADY_COMPLETED"

    def _default_message(self) -> str:
        return "This activity has already been completed today."


class InvalidReferralCodeError(AppError):
    """Raised when a supplied referral code does not match any active user."""

    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    code = "INVALID_REFERRAL_CODE"

    def _default_message(self) -> str:
        return "The referral code provided is invalid or has expired."


class TrialAlreadyUsedError(AppError):
    """Raised when a user attempts to start a second free trial."""

    status_code = status.HTTP_409_CONFLICT
    code = "TRIAL_ALREADY_USED"

    def _default_message(self) -> str:
        return "A free trial has already been used on this account."


class EntitlementSyncFailedError(AppError):
    """Raised when the entitlement record cannot be written after a payment event."""

    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    code = "ENTITLEMENT_SYNC_FAILED"

    def _default_message(self) -> str:
        return "Failed to synchronise subscription entitlements. Please try again."


class NoActivityAvailableError(AppError):
    """Raised when the selection engine cannot find a suitable activity."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    code = "NO_ACTIVITY_AVAILABLE"

    def _default_message(self) -> str:
        return "No activity is available for this child right now. Please try again later."


# ── Handlers ──────────────────────────────────────────────────────────────────

def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "statusCode": status_code,
            },
        },
    )


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Handle all AppError subclasses and return the standard error envelope."""
    logger.warning(
        "AppError [%s] %s — %s %s",
        exc.code,
        exc.message,
        request.method,
        request.url.path,
    )
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())


async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Convert Pydantic validation errors into the standard error envelope."""
    details = exc.errors()
    message = "; ".join(
        f"{'.'.join(str(loc) for loc in e['loc'])}: {e['msg']}" for e in details
    )
    logger.info("Validation error on %s %s: %s", request.method, request.url.path, message)
    return _error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code="VALIDATION_ERROR",
        message=message,
    )


async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for unhandled exceptions — logs the traceback and returns 500."""
    logger.exception(
        "Unhandled exception on %s %s", request.method, request.url.path, exc_info=exc
    )
    return _error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_ERROR",
        message="An unexpected error occurred. Please try again later.",
    )


def register_exception_handlers(app: Any) -> None:
    """Attach all exception handlers to a FastAPI application instance."""
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, generic_error_handler)
