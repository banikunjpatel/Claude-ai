"""Pydantic v2 models representing auth-layer data structures.

These are the canonical types passed between the JWT layer, the dependency
layer, and route handlers.  They are intentionally separate from the MongoDB
user document so that route handlers can stay fast — a token verification does
not require a database round-trip.
"""

from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class UserClaims(BaseModel):
    """Decoded, validated claims extracted from a Supabase JWT.

    This is the type returned by ``get_current_user`` and its variants.
    It contains only the data embedded in the token — no MongoDB lookup needed.

    Attributes:
        user_id:   Supabase UUID (``sub`` claim) — primary key throughout the app.
        email:     User's email address from the token.
        role:      ``"parent"`` | ``"admin"`` — derived from ``app_metadata.role``
                   or defaulted to ``"parent"`` for standard authenticated users.
        full_name: Optional display name from ``user_metadata.full_name``.
    """

    model_config = ConfigDict(frozen=True)

    user_id: str
    email: str
    role: str = "parent"
    full_name: Optional[str] = None


class TokenResponse(BaseModel):
    """Shape of the token payload returned to clients after login or refresh.

    Mirrors the Supabase Auth token response structure so the mobile clients
    can use it directly.
    """

    model_config = ConfigDict(frozen=True)

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
