"""FastAPI dependency functions for authentication and authorisation.

Import these in route modules via ``Depends()``:

    from app.auth.dependencies import get_current_user, get_current_admin

Dependency graph
----------------
oauth2_scheme
    └─ get_current_user   (requires valid JWT, returns UserClaims)
           ├─ get_current_parent   (role == "parent" only)
           └─ get_current_admin    (role == "admin" only)
    └─ get_optional_user  (returns None for missing/invalid token — no raise)
"""

import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.auth.jwt import extract_user_from_payload, verify_supabase_token
from app.auth.models import UserClaims

logger = logging.getLogger(__name__)

# OAuth2 bearer scheme — tokenUrl shown in OpenAPI docs; actual auth is Supabase
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,   # let our dependency handle the 401 with a clean message
)


# ── Core auth dependency ───────────────────────────────────────────────────────

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
) -> UserClaims:
    """Require a valid Supabase Bearer token and return the decoded UserClaims.

    This dependency is intentionally **database-free** — it only verifies the
    JWT signature and extracts claims.  Any MongoDB lookup should be done inside
    the route handler or in a more specialised dependency built on top of this.

    Args:
        token: Bearer token from the ``Authorization`` header (injected by FastAPI).

    Returns:
        ``UserClaims`` with ``user_id``, ``email``, ``role``, ``full_name``.

    Raises:
        HTTP 401: if token is absent, expired, or has an invalid signature.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = await verify_supabase_token(token)
    return extract_user_from_payload(payload)


# ── Role-scoped dependencies ───────────────────────────────────────────────────

async def get_current_parent(
    current_user: UserClaims = Depends(get_current_user),
) -> UserClaims:
    """Require an authenticated user with ``role == "parent"``.

    Raises:
        HTTP 401: if the token is invalid (via ``get_current_user``).
        HTTP 403: if the authenticated user is not a parent.
    """
    if current_user.role != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Parent access required.",
        )
    return current_user


async def get_current_admin(
    current_user: UserClaims = Depends(get_current_user),
) -> UserClaims:
    """Require an authenticated user with ``role == "admin"``.

    Admin role is set via ``app_metadata.role = "admin"`` in Supabase's Admin API.
    This is a server-side-only assignment — clients cannot self-assign this role.

    Raises:
        HTTP 401: if the token is invalid (via ``get_current_user``).
        HTTP 403: if the authenticated user is not an admin.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user


# ── Optional auth dependency ───────────────────────────────────────────────────

async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[UserClaims]:
    """Attempt token verification but return ``None`` instead of raising.

    Use this on routes that serve both authenticated and anonymous users with
    different response shapes (e.g. a public activity preview that shows more
    detail when logged in).

    Returns:
        ``UserClaims`` for a valid token, ``None`` for missing or invalid token.
    """
    if not token:
        return None
    try:
        payload = await verify_supabase_token(token)
        return extract_user_from_payload(payload)
    except HTTPException:
        return None
