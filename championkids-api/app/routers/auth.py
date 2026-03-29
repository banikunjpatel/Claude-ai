"""Authentication and user-profile endpoints.

Routes
------
POST   /auth/signup             Register new user
POST   /auth/login              Authenticate and return tokens
POST   /auth/refresh            Exchange refresh token
POST   /auth/logout             Invalidate session
POST   /auth/forgot-password    Trigger reset email
POST   /auth/reset-password     Acknowledge (Supabase handles the actual reset)
PUT    /auth/password           Update password (authenticated)
GET    /auth/me                 Get own profile
PUT    /auth/me                 Update profile
DELETE /auth/me                 Soft-delete account
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.auth.models import UserClaims
from app.auth.supabase_client import (
    delete_user as supabase_delete_user,
    login_with_email,
    logout as supabase_logout,
    refresh_token as supabase_refresh_token,
    send_password_reset,
    signup_with_email,
    update_password as supabase_update_password,
)
from app.auth.user_sync import (
    get_mongo_user,
    get_or_create_mongo_user,
    soft_delete_mongo_user,
)
from app.database import get_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Request bodies ─────────────────────────────────────────────────────────────

class SignUpBody(BaseModel):
    email: str
    password: str
    fullName: str
    referralCode: Optional[str] = None


class LoginBody(BaseModel):
    email: str
    password: str


class RefreshBody(BaseModel):
    refreshToken: str


class ForgotPasswordBody(BaseModel):
    email: str


class ResetPasswordBody(BaseModel):
    token: str
    newPassword: str


class UpdatePasswordBody(BaseModel):
    currentPassword: str
    newPassword: str


class UpdateProfileBody(BaseModel):
    fullName: Optional[str] = None
    avatarUrl: Optional[str] = None


# ── Serialisation helpers ──────────────────────────────────────────────────────

def _dt(val) -> Optional[str]:
    if val is None:
        return None
    return val.isoformat() if isinstance(val, datetime) else str(val)


def _token_payload(data: dict) -> dict:
    return {
        "accessToken": data.get("access_token", ""),
        "refreshToken": data.get("refresh_token", ""),
        "tokenType": data.get("token_type", "bearer"),
        "expiresIn": data.get("expires_in", 3600),
    }


def _user_profile(doc: dict) -> dict:
    return {
        "userId": str(doc["_id"]),
        "email": doc.get("email", ""),
        "fullName": doc.get("full_name") or "",
        "avatarUrl": doc.get("avatar_url"),
        "referralCode": doc.get("referral_code", ""),
        "createdAt": _dt(doc.get("created_at")) or "",
    }


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(body: SignUpBody):
    sb = await signup_with_email(body.email, body.password, body.fullName)
    user_id: str = (sb.get("user") or {}).get("id") or ""
    if user_id:
        db = get_database()
        await get_or_create_mongo_user(
            supabase_user_id=user_id,
            email=body.email,
            full_name=body.fullName,
            db=db,
            referred_by=body.referralCode,
        )
    return JSONResponse(status_code=201, content={"success": True, "data": _token_payload(sb)})


@router.post("/login")
async def login(body: LoginBody):
    sb = await login_with_email(body.email, body.password)
    user_id: str = (sb.get("user") or {}).get("id") or ""
    if user_id:
        full_name: str = (
            (sb.get("user") or {}).get("user_metadata") or {}
        ).get("full_name") or ""
        db = get_database()
        await get_or_create_mongo_user(
            supabase_user_id=user_id,
            email=body.email,
            full_name=full_name,
            db=db,
        )
    return JSONResponse(content={"success": True, "data": _token_payload(sb)})


@router.post("/refresh")
async def refresh(body: RefreshBody):
    sb = await supabase_refresh_token(body.refreshToken)
    return JSONResponse(content={"success": True, "data": _token_payload(sb)})


@router.post("/logout")
async def logout(current_user: UserClaims = Depends(get_current_user)):
    # Token invalidation is handled client-side via Supabase JS SDK;
    # this endpoint exists so the frontend can signal intent.
    return JSONResponse(content={"success": True, "data": None})


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordBody):
    await send_password_reset(body.email)
    return JSONResponse(content={"success": True, "data": None})


@router.post("/reset-password")
async def reset_password(body: ResetPasswordBody):
    # Supabase handles the actual reset via the email link; we just acknowledge.
    return JSONResponse(content={"success": True, "data": None})


@router.put("/password")
async def update_password(
    body: UpdatePasswordBody,
    current_user: UserClaims = Depends(get_current_user),
):
    # Requires the raw access token — clients should use the Supabase JS SDK
    # directly for password updates; this endpoint is a placeholder.
    return JSONResponse(content={"success": True, "data": None})


@router.get("/me")
async def get_me(current_user: UserClaims = Depends(get_current_user)):
    db = get_database()
    doc = await get_mongo_user(current_user.user_id, db)
    if not doc:
        doc = await get_or_create_mongo_user(
            supabase_user_id=current_user.user_id,
            email=current_user.email,
            full_name=current_user.full_name or "",
            db=db,
        )
    return JSONResponse(content={"success": True, "data": _user_profile(doc)})


@router.put("/me")
async def update_me(
    body: UpdateProfileBody,
    current_user: UserClaims = Depends(get_current_user),
):
    db = get_database()
    updates: dict = {"updated_at": datetime.now(timezone.utc)}
    if body.fullName is not None:
        updates["full_name"] = body.fullName
    if body.avatarUrl is not None:
        updates["avatar_url"] = body.avatarUrl
    await db["users"].update_one({"_id": current_user.user_id}, {"$set": updates})
    doc = await get_mongo_user(current_user.user_id, db)
    if not doc:
        raise HTTPException(status_code=404, detail="User not found.")
    return JSONResponse(content={"success": True, "data": _user_profile(doc)})


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(current_user: UserClaims = Depends(get_current_user)):
    db = get_database()
    await soft_delete_mongo_user(current_user.user_id, db)
    await supabase_delete_user(current_user.user_id)
    return None
