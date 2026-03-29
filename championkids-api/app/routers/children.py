"""Children CRUD endpoints.

Routes
------
GET    /children                 List all children for the current user
GET    /children/{child_id}      Get a single child
POST   /children                 Create a child profile
PUT    /children/{child_id}      Update a child profile
DELETE /children/{child_id}      Soft-delete a child profile
"""

import logging
from datetime import date, datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.auth.models import UserClaims
from app.database import get_database

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Children"])


# ── Request bodies ─────────────────────────────────────────────────────────────

class CreateChildBody(BaseModel):
    display_name: str
    date_of_birth: str        # ISO "YYYY-MM-DD"
    avatar_id: int = 0
    skill_focuses: list[str] = []


class UpdateChildBody(BaseModel):
    display_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    avatar_id: Optional[int] = None
    skill_focuses: Optional[list[str]] = None


# ── Helpers ────────────────────────────────────────────────────────────────────

def _dt(val) -> Optional[str]:
    if val is None:
        return None
    return val.isoformat() if isinstance(val, datetime) else str(val)


def _age_years(dob_str: str) -> float:
    try:
        dob = date.fromisoformat(dob_str)
    except ValueError:
        return 0.0
    return (date.today() - dob).days / 365.25


async def _resolve_age_band(db, dob_str: str) -> Optional[dict]:
    age = _age_years(dob_str)
    return await db["age_bands"].find_one(
        {"min_age_years": {"$lte": age}, "max_age_years": {"$gte": age}}
    )


def _age_band_shape(band: Optional[dict]) -> Optional[dict]:
    if not band:
        return None
    return {
        "id": str(band["_id"]),
        "label": band.get("label", ""),
        "minAgeYears": band.get("min_age_years", 0),
        "maxAgeYears": band.get("max_age_years", 0),
        "sortOrder": band.get("sort_order", 0),
    }


async def _child_shape(doc: dict, db) -> dict:
    band = await _resolve_age_band(db, doc.get("date_of_birth", ""))
    display = doc.get("display_name") or doc.get("name", "")
    return {
        "id": str(doc["_id"]),
        "parentId": doc.get("parent_id", ""),
        "name": display,
        "display_name": display,
        "dateOfBirth": doc.get("date_of_birth", ""),
        "date_of_birth": doc.get("date_of_birth", ""),
        "avatarUrl": doc.get("avatar_url"),
        "avatar_id": doc.get("avatar_id", 0),
        "ageBand": _age_band_shape(band),
        "skill_focuses": doc.get("skill_focuses", []),
        "streak": doc.get("streak", 0),
        "total_completions": doc.get("total_completions", 0),
        "createdAt": _dt(doc.get("created_at")) or "",
        "updatedAt": _dt(doc.get("updated_at")) or "",
        "deletedAt": _dt(doc.get("deleted_at")),
    }


async def _get_child_or_404(child_id: str, parent_id: str, db) -> dict:
    try:
        oid = ObjectId(child_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found.")
    doc = await db["children"].find_one(
        {"_id": oid, "parent_id": parent_id, "deleted_at": None}
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found.")
    return doc


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/children")
async def list_children(current_user: UserClaims = Depends(get_current_user)):
    db = get_database()
    docs = await db["children"].find(
        {"parent_id": current_user.user_id, "deleted_at": None}
    ).to_list(100)
    return JSONResponse(content={
        "success": True,
        "data": [await _child_shape(d, db) for d in docs],
    })


@router.get("/children/{child_id}")
async def get_child(
    child_id: str,
    current_user: UserClaims = Depends(get_current_user),
):
    db = get_database()
    doc = await _get_child_or_404(child_id, current_user.user_id, db)
    return JSONResponse(content={"success": True, "data": await _child_shape(doc, db)})


@router.post("/children", status_code=status.HTTP_201_CREATED)
async def create_child(
    body: CreateChildBody,
    current_user: UserClaims = Depends(get_current_user),
):
    db = get_database()
    now = datetime.now(timezone.utc)
    doc: dict = {
        "parent_id": current_user.user_id,
        "display_name": body.display_name,
        "name": body.display_name,           # kept for backwards compat
        "date_of_birth": body.date_of_birth,
        "avatar_id": body.avatar_id,
        "avatar_url": None,
        "skill_focuses": body.skill_focuses,
        "streak": 0,
        "total_completions": 0,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
    }
    result = await db["children"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return JSONResponse(
        status_code=201,
        content={"success": True, "data": await _child_shape(doc, db)},
    )


@router.put("/children/{child_id}")
async def update_child(
    child_id: str,
    body: UpdateChildBody,
    current_user: UserClaims = Depends(get_current_user),
):
    db = get_database()
    doc = await _get_child_or_404(child_id, current_user.user_id, db)
    updates: dict = {"updated_at": datetime.now(timezone.utc)}
    if body.display_name is not None:
        updates["display_name"] = body.display_name
        updates["name"] = body.display_name   # keep in sync
    if body.date_of_birth is not None:
        updates["date_of_birth"] = body.date_of_birth
    if body.avatar_id is not None:
        updates["avatar_id"] = body.avatar_id
    if body.skill_focuses is not None:
        updates["skill_focuses"] = body.skill_focuses
    await db["children"].update_one({"_id": doc["_id"]}, {"$set": updates})
    updated = await db["children"].find_one({"_id": doc["_id"]})
    return JSONResponse(content={"success": True, "data": await _child_shape(updated, db)})


@router.delete("/children/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_child(
    child_id: str,
    current_user: UserClaims = Depends(get_current_user),
):
    db = get_database()
    doc = await _get_child_or_404(child_id, current_user.user_id, db)
    now = datetime.now(timezone.utc)
    await db["children"].update_one(
        {"_id": doc["_id"]},
        {"$set": {"deleted_at": now, "updated_at": now}},
    )
    return None
