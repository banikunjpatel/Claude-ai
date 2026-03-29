"""Thin async wrapper around the Supabase Auth REST API.

All calls use ``httpx.AsyncClient`` (never the synchronous ``requests`` library).
Supabase error codes and HTTP status codes are mapped to appropriate FastAPI
HTTPExceptions so callers can treat all failures uniformly.

SECURITY RULES enforced here
-----------------------------
- ``SUPABASE_SERVICE_ROLE_KEY`` is only used for admin operations (delete_user).
  It is never returned to clients in any response.
- Raw tokens are never logged — we log only user IDs and email (hashed for PII).
- ``send_password_reset`` never raises on unknown email to prevent user enumeration.
"""

import logging
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)


# ── Shared HTTP helpers ───────────────────────────────────────────────────────

def _supabase_url(path: str) -> str:
    """Build a full Supabase Auth URL from a path fragment."""
    return f"{settings.SUPABASE_URL.rstrip('/')}{path}"


def _anon_headers() -> dict[str, str]:
    """Headers required for public Supabase Auth endpoints."""
    return {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }


def _service_headers() -> dict[str, str]:
    """Headers that carry the service role key — NEVER sent to clients."""
    return {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


def _bearer_headers(access_token: str) -> dict[str, str]:
    """Headers for endpoints that require a user's own access token."""
    return {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


async def _post(
    url: str,
    body: dict[str, Any],
    headers: dict[str, str],
    timeout: float = 10.0,
) -> httpx.Response:
    """Execute an async POST and return the raw response."""
    async with httpx.AsyncClient(timeout=timeout) as client:
        return await client.post(url, json=body, headers=headers)


async def _put(
    url: str,
    body: dict[str, Any],
    headers: dict[str, str],
    timeout: float = 10.0,
) -> httpx.Response:
    async with httpx.AsyncClient(timeout=timeout) as client:
        return await client.put(url, json=body, headers=headers)


async def _delete(
    url: str,
    headers: dict[str, str],
    timeout: float = 10.0,
) -> httpx.Response:
    async with httpx.AsyncClient(timeout=timeout) as client:
        return await client.delete(url, headers=headers)


# ── Public Auth operations ────────────────────────────────────────────────────

async def signup_with_email(
    email: str,
    password: str,
    full_name: str,
) -> dict:
    """Register a new user via Supabase email/password signup.

    Args:
        email:     User's email address.
        password:  Chosen password (plaintext; Supabase hashes it).
        full_name: Display name stored in ``user_metadata``.

    Returns:
        Dict containing ``access_token``, ``refresh_token``, and
        ``user`` (with ``id`` and ``email``).

    Raises:
        HTTPException 409: email is already registered.
        HTTPException 422: Supabase rejected the request for another reason.
        HTTPException 503: Supabase is unreachable.
    """
    url = _supabase_url("/auth/v1/signup")
    body = {"email": email, "password": password, "data": {"full_name": full_name}}

    try:
        response = await _post(url, body, _anon_headers())
    except httpx.RequestError as exc:
        logger.error("Supabase signup unreachable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable. Please try again.",
        )

    if response.status_code == 200:
        data = response.json()
        # Supabase returns 200 with an access_token on immediate confirmation
        if data.get("access_token"):
            return data
        # Email-confirmation flow: Supabase returns 200 but no token yet
        return data

    data = response.json()
    error_msg: str = data.get("msg") or data.get("message") or data.get("error_description", "")

    # Supabase returns 422 when the email already exists
    if response.status_code == 422 or "already registered" in error_msg.lower():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    logger.warning("Supabase signup failed %d: %s", response.status_code, error_msg)
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=error_msg or "Signup failed.",
    )


async def login_with_email(email: str, password: str) -> dict:
    """Authenticate with email and password and return tokens.

    Args:
        email:    User's email address.
        password: User's password.

    Returns:
        Dict containing ``access_token``, ``refresh_token``, ``expires_in``.

    Raises:
        HTTPException 401: Invalid credentials.
        HTTPException 503: Supabase is unreachable.
    """
    url = _supabase_url("/auth/v1/token")
    body = {"email": email, "password": password}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                url,
                params={"grant_type": "password"},
                json=body,
                headers=_anon_headers(),
            )
    except httpx.RequestError as exc:
        logger.error("Supabase login unreachable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable. Please try again.",
        )

    if response.status_code == 200:
        return response.json()

    data = response.json()
    error_msg: str = (
        data.get("error_description")
        or data.get("msg")
        or data.get("message")
        or "Invalid credentials."
    )
    logger.info("Login failed for email hash=%s: %s", hash(email), error_msg)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def refresh_token(refresh_token_value: str) -> dict:
    """Exchange a refresh token for a new access/refresh token pair.

    Args:
        refresh_token_value: The refresh token previously issued at login.

    Returns:
        Dict containing ``access_token``, ``refresh_token``, ``expires_in``.

    Raises:
        HTTPException 401: Refresh token is invalid or expired.
        HTTPException 503: Supabase is unreachable.
    """
    url = _supabase_url("/auth/v1/token")
    body = {"refresh_token": refresh_token_value}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                url,
                params={"grant_type": "refresh_token"},
                json=body,
                headers=_anon_headers(),
            )
    except httpx.RequestError as exc:
        logger.error("Supabase refresh unreachable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable. Please try again.",
        )

    if response.status_code == 200:
        return response.json()

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Refresh token is invalid or has expired. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def logout(access_token: str) -> None:
    """Invalidate the user's current session in Supabase.

    Args:
        access_token: The access token for the session to end.

    Note:
        We suppress errors here intentionally — if Supabase is down or the
        token is already expired, the client should still be directed to clear
        its local token state.
    """
    url = _supabase_url("/auth/v1/logout")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(url, headers=_bearer_headers(access_token), json={})
    except Exception as exc:
        # Non-fatal — client should clear its local state regardless
        logger.warning("Supabase logout call failed (non-fatal): %s", exc)


async def send_password_reset(email: str) -> None:
    """Trigger a password-reset email via Supabase.

    This function intentionally does NOT raise on unknown email addresses to
    prevent user enumeration — the API surface must not reveal whether an email
    is registered.

    Args:
        email: The email address to send the reset link to.
    """
    url = _supabase_url("/auth/v1/recover")
    body = {"email": email}
    try:
        await _post(url, body, _anon_headers())
        # Response is intentionally ignored for security
    except Exception as exc:
        # Also non-fatal — failure is silent to the caller
        logger.warning("Supabase password reset call failed (non-fatal): %s", exc)


async def update_password(access_token: str, new_password: str) -> None:
    """Update the authenticated user's password.

    Args:
        access_token: Valid access token for the user whose password will change.
        new_password: The new plaintext password (Supabase hashes it).

    Raises:
        HTTPException 401: Access token is invalid or expired.
        HTTPException 422: Password does not meet Supabase's complexity requirements.
        HTTPException 503: Supabase is unreachable.
    """
    url = _supabase_url("/auth/v1/user")
    body = {"password": new_password}

    try:
        response = await _put(url, body, _bearer_headers(access_token))
    except httpx.RequestError as exc:
        logger.error("Supabase update password unreachable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable. Please try again.",
        )

    if response.status_code == 200:
        return

    if response.status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    data = response.json()
    error_msg: str = data.get("msg") or data.get("message") or "Password update failed."
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=error_msg,
    )


# ── Admin operations (service role only) ─────────────────────────────────────

async def delete_user(user_id: str) -> None:
    """Permanently delete a Supabase Auth user (admin operation).

    This is called during the account deletion flow *after* the MongoDB
    soft-delete has been applied.  Uses the service role key — this function
    must never be reachable via an unauthenticated code path.

    Args:
        user_id: The Supabase UUID of the user to delete.

    Raises:
        HTTPException 404: User does not exist in Supabase.
        HTTPException 503: Supabase is unreachable.
    """
    url = _supabase_url(f"/auth/v1/admin/users/{user_id}")

    try:
        response = await _delete(url, _service_headers())
    except httpx.RequestError as exc:
        logger.error("Supabase delete user unreachable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable. Please try again.",
        )

    if response.status_code in (200, 204):
        logger.info("Supabase user deleted: user_id=%s", user_id)
        return

    if response.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in auth provider.",
        )

    logger.error(
        "Supabase delete user failed: user_id=%s status=%d",
        user_id,
        response.status_code,
    )
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Failed to delete user from auth provider.",
    )
