"""Tests for the auth module: JWT verification, dependency guards, and user sync helpers.

Test strategy
-------------
- JWTs are created using ``jose.jwt.encode`` with a known HS256 test secret so
  tests run without any network access.
- The JWKS fetch is mocked where needed via ``unittest.mock.AsyncMock``.
- MongoDB operations use the session-scoped ``test_db`` fixture from conftest.py.
- Raw tokens are used only inside this test file — they are never logged.
"""

import time
from datetime import datetime, timezone
from typing import Optional
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from fastapi import HTTPException
from jose import jwt

from app.auth.jwt import (
    extract_user_from_payload,
    verify_supabase_token,
)
from app.auth.models import UserClaims
from app.auth.user_sync import (
    _REFERRAL_ALPHABET,
    _REFERRAL_CODE_LENGTH,
    generate_referral_code,
    get_mongo_user,
    get_or_create_mongo_user,
    soft_delete_mongo_user,
)

# ── Helpers ───────────────────────────────────────────────────────────────────

_TEST_SECRET = "test-secret-do-not-use-in-production"
_TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
_TEST_EMAIL = "test@championkids.example"
_TEST_ALG = "HS256"


def _make_token(
    user_id: str = _TEST_USER_ID,
    email: str = _TEST_EMAIL,
    role: str = "authenticated",
    app_metadata: Optional[dict] = None,
    user_metadata: Optional[dict] = None,
    exp_offset: int = 3600,          # seconds from now; negative = already expired
    secret: str = _TEST_SECRET,
) -> str:
    """Build a signed HS256 JWT that mimics a Supabase token."""
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "aud": "authenticated",
        "iat": now,
        "exp": now + exp_offset,
        "app_metadata": app_metadata or {"provider": "email"},
        "user_metadata": user_metadata or {"full_name": "Test User"},
    }
    return jwt.encode(payload, secret, algorithm=_TEST_ALG)


# ── JWT verification tests ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_verify_valid_token():
    """A correctly signed, non-expired token returns the decoded payload."""
    token = _make_token()

    # Patch the JWKS fetch to return empty (forces HS256 fallback path)
    with patch("app.auth.jwt.fetch_supabase_jwks", new_callable=AsyncMock, return_value={}):
        # Patch settings.JWT_SECRET so our test secret is used
        with patch("app.auth.jwt.settings") as mock_settings:
            mock_settings.JWT_SECRET = _TEST_SECRET
            mock_settings.JWT_ALGORITHM = "HS256"
            payload = await verify_supabase_token(token)

    assert payload["sub"] == _TEST_USER_ID
    assert payload["email"] == _TEST_EMAIL


@pytest.mark.asyncio
async def test_verify_expired_token():
    """An expired JWT raises HTTP 401."""
    token = _make_token(exp_offset=-1)  # already expired

    with patch("app.auth.jwt.fetch_supabase_jwks", new_callable=AsyncMock, return_value={}):
        with patch("app.auth.jwt.settings") as mock_settings:
            mock_settings.JWT_SECRET = _TEST_SECRET
            mock_settings.JWT_ALGORITHM = "HS256"
            with pytest.raises(HTTPException) as exc_info:
                await verify_supabase_token(token)

    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower() or "invalid" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_verify_invalid_signature():
    """A token signed with the wrong secret raises HTTP 401."""
    token = _make_token(secret="wrong-secret-entirely")

    with patch("app.auth.jwt.fetch_supabase_jwks", new_callable=AsyncMock, return_value={}):
        with patch("app.auth.jwt.settings") as mock_settings:
            mock_settings.JWT_SECRET = _TEST_SECRET   # different from signing secret
            mock_settings.JWT_ALGORITHM = "HS256"
            with pytest.raises(HTTPException) as exc_info:
                await verify_supabase_token(token)

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_verify_malformed_token():
    """A non-JWT string raises HTTP 401."""
    with patch("app.auth.jwt.fetch_supabase_jwks", new_callable=AsyncMock, return_value={}):
        with patch("app.auth.jwt.settings") as mock_settings:
            mock_settings.JWT_SECRET = _TEST_SECRET
            mock_settings.JWT_ALGORITHM = "HS256"
            with pytest.raises(HTTPException) as exc_info:
                await verify_supabase_token("not.a.jwt")

    assert exc_info.value.status_code == 401


# ── Payload extraction tests ──────────────────────────────────────────────────

def test_extract_user_parent_role():
    """Standard authenticated payload maps to role='parent'."""
    payload = {
        "sub": _TEST_USER_ID,
        "email": _TEST_EMAIL,
        "role": "authenticated",
        "app_metadata": {"provider": "email"},
        "user_metadata": {"full_name": "Sarah Jones"},
    }
    claims = extract_user_from_payload(payload)
    assert claims.user_id == _TEST_USER_ID
    assert claims.email == _TEST_EMAIL
    assert claims.role == "parent"
    assert claims.full_name == "Sarah Jones"


def test_extract_user_admin_role():
    """app_metadata.role='admin' maps to role='admin'."""
    payload = {
        "sub": _TEST_USER_ID,
        "email": "admin@championkids.example",
        "role": "authenticated",
        "app_metadata": {"role": "admin", "provider": "email"},
        "user_metadata": {},
    }
    claims = extract_user_from_payload(payload)
    assert claims.role == "admin"


def test_extract_user_missing_sub_raises_401():
    """Payload without 'sub' raises HTTP 401."""
    payload = {"email": _TEST_EMAIL, "role": "authenticated"}
    with pytest.raises(HTTPException) as exc_info:
        extract_user_from_payload(payload)
    assert exc_info.value.status_code == 401


def test_extract_user_missing_full_name():
    """Missing full_name in user_metadata results in full_name=None."""
    payload = {
        "sub": _TEST_USER_ID,
        "email": _TEST_EMAIL,
        "role": "authenticated",
        "app_metadata": {},
        "user_metadata": {},
    }
    claims = extract_user_from_payload(payload)
    assert claims.full_name is None


# ── FastAPI dependency guard tests ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_current_user_no_token():
    """Missing token raises HTTP 401."""
    from app.auth.dependencies import get_current_user

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(token=None)

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_get_current_admin_wrong_role():
    """A parent UserClaims raises HTTP 403 on the admin dependency."""
    from app.auth.dependencies import get_current_admin

    parent_claims = UserClaims(
        user_id=_TEST_USER_ID,
        email=_TEST_EMAIL,
        role="parent",
    )
    with pytest.raises(HTTPException) as exc_info:
        await get_current_admin(current_user=parent_claims)

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_get_current_parent_wrong_role():
    """An admin UserClaims raises HTTP 403 on the parent dependency."""
    from app.auth.dependencies import get_current_parent

    admin_claims = UserClaims(
        user_id=_TEST_USER_ID,
        email="admin@example.com",
        role="admin",
    )
    with pytest.raises(HTTPException) as exc_info:
        await get_current_parent(current_user=admin_claims)

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_get_optional_user_no_token_returns_none():
    """Missing token returns None without raising."""
    from app.auth.dependencies import get_optional_user

    result = await get_optional_user(token=None)
    assert result is None


@pytest.mark.asyncio
async def test_get_optional_user_invalid_token_returns_none():
    """Invalid token returns None without raising."""
    from app.auth.dependencies import get_optional_user

    result = await get_optional_user(token="garbage.token.here")
    assert result is None


# ── Referral code tests ───────────────────────────────────────────────────────

def test_generate_referral_code_length():
    """Referral code is exactly 8 characters."""
    code = generate_referral_code()
    assert len(code) == _REFERRAL_CODE_LENGTH


def test_generate_referral_code_no_ambiguous_chars():
    """Referral code never contains 0, O, I, or 1."""
    ambiguous = set("0OI1")
    for _ in range(500):
        code = generate_referral_code()
        assert not ambiguous.intersection(set(code)), (
            f"Referral code '{code}' contains an ambiguous character."
        )


def test_generate_referral_code_uppercase():
    """Referral code is all uppercase alphanumeric."""
    for _ in range(100):
        code = generate_referral_code()
        assert code.isupper() or code.isdigit() or all(
            c in _REFERRAL_ALPHABET for c in code
        )


def test_generate_referral_code_only_valid_chars():
    """Every character in the code is in the declared alphabet."""
    for _ in range(200):
        code = generate_referral_code()
        for char in code:
            assert char in _REFERRAL_ALPHABET, (
                f"Character '{char}' in code '{code}' is not in the referral alphabet."
            )


def test_generate_referral_codes_are_random():
    """Two independently generated codes should almost certainly differ."""
    codes = {generate_referral_code() for _ in range(20)}
    # With 32^8 combinations and only 20 samples this should always pass
    assert len(codes) > 1


# ── User sync tests (require test_db fixture) ─────────────────────────────────

@pytest.mark.asyncio
async def test_get_or_create_mongo_user_creates_document(test_db):
    """First call creates a user document with the expected fields."""
    uid = "test-sync-create-001"
    doc = await get_or_create_mongo_user(uid, "create@test.com", "Create Test", test_db)

    assert doc["_id"] == uid
    assert doc["email"] == "create@test.com"
    assert doc["full_name"] == "Create Test"
    assert len(doc["referral_code"]) == _REFERRAL_CODE_LENGTH
    assert doc["deleted_at"] is None
    assert isinstance(doc["created_at"], datetime)

    # Cleanup
    await test_db["users"].delete_one({"_id": uid})


@pytest.mark.asyncio
async def test_get_or_create_mongo_user_idempotent(test_db):
    """Second call updates updated_at but preserves referral_code and created_at."""
    uid = "test-sync-idempotent-001"
    first = await get_or_create_mongo_user(uid, "idem@test.com", "Idem User", test_db)
    second = await get_or_create_mongo_user(uid, "idem@test.com", "Idem User Updated", test_db)

    assert second["referral_code"] == first["referral_code"]
    # MongoDB stores datetimes at millisecond precision; normalise before comparing
    def _sec(dt):
        return dt.replace(tzinfo=None, microsecond=0) if dt else None
    assert _sec(second["created_at"]) == _sec(first["created_at"])
    assert second["full_name"] == "Idem User Updated"

    # Cleanup
    await test_db["users"].delete_one({"_id": uid})


@pytest.mark.asyncio
async def test_get_mongo_user_returns_none_when_deleted(test_db):
    """soft_delete_mongo_user makes the user invisible to get_mongo_user."""
    uid = "test-soft-delete-001"
    await get_or_create_mongo_user(uid, "del@test.com", "Del User", test_db)

    await soft_delete_mongo_user(uid, test_db)
    result = await get_mongo_user(uid, test_db)

    assert result is None

    # Cleanup
    await test_db["users"].delete_one({"_id": uid})


@pytest.mark.asyncio
async def test_soft_delete_cascades_to_children(test_db):
    """soft_delete_mongo_user also sets deleted_at on all child documents."""
    from bson import ObjectId

    uid = "test-cascade-delete-001"
    await get_or_create_mongo_user(uid, "cascade@test.com", "Cascade", test_db)

    child_id = ObjectId()
    await test_db["children"].insert_one({
        "_id": child_id,
        "parent_id": uid,
        "name": "Child A",
        "deleted_at": None,
    })

    await soft_delete_mongo_user(uid, test_db)

    child_after = await test_db["children"].find_one({"_id": child_id})
    assert child_after is not None
    assert child_after["deleted_at"] is not None

    # Cleanup
    await test_db["users"].delete_one({"_id": uid})
    await test_db["children"].delete_one({"_id": child_id})
