"""Supabase JWT verification with JWKS support and HS256 fallback.

Verification strategy
---------------------
1. Fetch the Supabase JWKS endpoint and cache it for 1 hour (asyncio-safe).
2. Read the ``kid`` (key ID) from the unverified JWT header.
3. Find the matching JWK and construct a public key.
4. Verify the token using RS256 (or ES256 if that is the key type).
5. If JWKS fetch fails *or* the kid is not found in the JWKS, fall back to
   HS256 with ``settings.JWT_SECRET`` (this covers local dev and projects that
   have not enabled asymmetric signing).

The JWKS cache uses ``asyncio.Lock`` — safe for concurrent async access.
Raw tokens are never logged.
"""

import asyncio
import logging
import time
from typing import Optional

import httpx
from fastapi import HTTPException, status
from jose import ExpiredSignatureError, JWTError, jwk, jwt
from jose.backends.base import Key

from app.auth.models import UserClaims
from app.config import settings

logger = logging.getLogger(__name__)

# ── JWKS cache (module-level, asyncio-safe) ───────────────────────────────────

_jwks_cache: dict[str, Key] = {}          # kid → constructed public key
_jwks_fetched_at: float = 0.0             # epoch seconds of last successful fetch
_jwks_ttl: float = 3600.0                 # 1 hour
_jwks_lock: asyncio.Lock = asyncio.Lock() # one fetch at a time


# ── JWKS helpers ──────────────────────────────────────────────────────────────

def _jwks_is_stale() -> bool:
    return (time.monotonic() - _jwks_fetched_at) > _jwks_ttl


async def _fetch_and_cache_jwks() -> None:
    """Fetch the Supabase JWKS endpoint and populate the in-memory key cache.

    Must be called while holding ``_jwks_lock``.  On failure the cache is left
    unchanged so an existing (possibly stale) cache remains usable.
    """
    global _jwks_fetched_at

    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        logger.warning("JWKS fetch failed (%s) — will use HS256 fallback.", exc)
        return

    new_cache: dict[str, Key] = {}
    for key_data in data.get("keys", []):
        kid = key_data.get("kid")
        if not kid:
            continue
        try:
            constructed = jwk.construct(key_data)
            new_cache[kid] = constructed
        except Exception as exc:
            logger.warning("Failed to construct JWK for kid=%s: %s", kid, exc)

    _jwks_cache.clear()
    _jwks_cache.update(new_cache)
    _jwks_fetched_at = time.monotonic()
    logger.debug("JWKS cache refreshed — %d key(s) loaded.", len(_jwks_cache))


async def fetch_supabase_jwks() -> dict[str, Key]:
    """Return the current kid → public key mapping, refreshing if stale.

    Returns:
        Dict mapping key IDs to constructed public key objects.  May be empty
        if the Supabase URL is not configured or the fetch has always failed.
    """
    async with _jwks_lock:
        if _jwks_is_stale():
            await _fetch_and_cache_jwks()
    return _jwks_cache


# ── Token verification ────────────────────────────────────────────────────────

def _decode_hs256(token: str) -> dict:
    """Verify a token using the HS256 JWT_SECRET (local dev / Supabase default)."""
    return jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=["HS256"],
        options={"verify_aud": False},
    )


def _decode_asymmetric(token: str, key: Key, algorithm: str) -> dict:
    """Verify a token using an asymmetric public key from JWKS."""
    return jwt.decode(
        token,
        key,
        algorithms=[algorithm],
        audience="authenticated",
    )


def _get_token_header(token: str) -> dict:
    """Return the decoded (unverified) header of a JWT.

    Raises HTTPException 401 if the token is not a valid JWT structure.
    """
    try:
        return jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def verify_supabase_token(token: str) -> dict:
    """Verify a Supabase-issued JWT and return the decoded payload.

    Verification steps:
      1. Decode the header to extract ``kid`` and ``alg``.
      2. If ``kid`` is present, attempt JWKS-based asymmetric verification.
      3. If JWKS lookup misses or kid is absent, fall back to HS256.

    Args:
        token: Raw Bearer token string.  Never logged.

    Returns:
        Decoded JWT payload dict.

    Raises:
        HTTPException 401: on any verification or expiry failure.
    """
    _401 = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    header = _get_token_header(token)
    kid: Optional[str] = header.get("kid")
    alg: str = header.get("alg", "HS256")

    # ── Attempt asymmetric verification if kid is present ──────────────────
    if kid and alg in ("RS256", "RS384", "RS512", "ES256", "ES384", "ES512"):
        keys = await fetch_supabase_jwks()
        key = keys.get(kid)
        if key is not None:
            try:
                return _decode_asymmetric(token, key, alg)
            except ExpiredSignatureError:
                raise _401
            except JWTError:
                # Signature invalid even with the correct key — do not fall through
                raise _401
        else:
            logger.debug(
                "JWKS kid=%s not found in cache (%d keys) — falling back to HS256.",
                kid,
                len(keys),
            )

    # ── HS256 fallback (project JWT_SECRET or dev environment) ────────────
    try:
        return _decode_hs256(token)
    except ExpiredSignatureError:
        raise _401
    except JWTError:
        raise _401


# ── Payload extraction ────────────────────────────────────────────────────────

def extract_user_from_payload(payload: dict) -> UserClaims:
    """Map a decoded JWT payload to a ``UserClaims`` model.

    Role resolution order:
      1. ``app_metadata.role`` — set by Supabase Admin API for admin users.
      2. ``role`` top-level claim — Supabase sets this to ``"authenticated"``.
      3. Default: ``"parent"``.

    Args:
        payload: Decoded JWT payload dict from ``verify_supabase_token``.

    Returns:
        Populated ``UserClaims`` instance.

    Raises:
        HTTPException 401: if ``sub`` is missing from the payload.
    """
    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email: str = payload.get("email", "")
    user_metadata: dict = payload.get("user_metadata", {}) or {}
    app_metadata: dict = payload.get("app_metadata", {}) or {}

    # Resolve role: admin flag in app_metadata takes precedence
    if app_metadata.get("role") == "admin":
        role = "admin"
    else:
        role = "parent"

    full_name: Optional[str] = user_metadata.get("full_name") or None

    return UserClaims(
        user_id=user_id,
        email=email,
        role=role,
        full_name=full_name,
    )
