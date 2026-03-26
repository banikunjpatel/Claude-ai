"""Shared Pydantic v2 response models used across all API routers.

All API responses are wrapped in either APIResponse[T] (success) or
ErrorResponse (failure) to guarantee a consistent envelope shape.
"""

from __future__ import annotations

from typing import Annotated, Any, Generic, Optional, TypeVar

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, field_serializer, field_validator
from pydantic.functional_validators import BeforeValidator

T = TypeVar("T")


# ── ObjectId handling ─────────────────────────────────────────────────────────

def _coerce_object_id(v: Any) -> str:
    """Convert a bson.ObjectId (or any value) to its string representation."""
    if isinstance(v, ObjectId):
        return str(v)
    return str(v)


ObjectIdStr = Annotated[str, BeforeValidator(_coerce_object_id)]
"""A string type that automatically converts bson.ObjectId values to str.

Usage in a model field:
    id: ObjectIdStr = Field(alias="_id")
"""


# ── Pagination ────────────────────────────────────────────────────────────────

class PaginationMeta(BaseModel):
    """Metadata attached to paginated list responses."""

    model_config = ConfigDict(populate_by_name=True)

    page: Optional[int] = None
    limit: int
    total: Optional[int] = None
    next_cursor: Optional[str] = None


# ── Success envelope ──────────────────────────────────────────────────────────

class APIResponse(BaseModel, Generic[T]):
    """Standard success response envelope.

    Example:
        return APIResponse(data={"user_id": "abc"})
        return APIResponse(data=user_obj, meta=PaginationMeta(limit=20, total=150))
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    success: bool = True
    data: T
    meta: Optional[dict[str, Any]] = None


# ── Error envelope ────────────────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    """The inner ``error`` object within an error response."""

    model_config = ConfigDict(populate_by_name=True)

    code: str
    message: str
    statusCode: int  # noqa: N815  (matches JSON spec casing)


class ErrorResponse(BaseModel):
    """Standard error response envelope.

    This is built automatically by the exception handlers in exceptions.py;
    it is also exported here for use in OpenAPI response schemas.
    """

    success: bool = False
    error: ErrorDetail
