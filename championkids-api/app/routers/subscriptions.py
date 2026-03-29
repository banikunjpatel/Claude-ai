"""Subscription and entitlement endpoints.

Routes
------
GET    /subscription/entitlement              Compute access rights from current subscription
GET    /subscription                          Get raw subscription document
GET    /subscription/me                       Subscription with computed fields
POST   /subscription/trial                    Start a 7-day free trial
POST   /subscription/checkout                 Create Stripe Checkout session
POST   /subscription/portal                   Get Stripe Customer Portal URL
POST   /subscription/cancel                   Schedule cancellation at period end
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.auth.models import UserClaims
from app.config import settings
from app.database import get_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subscription", tags=["Subscriptions"])


# ── Request bodies ──────────────────────────────────────────────────────────────

class TrialBody(BaseModel):
    planType: str                  # "individual" | "family"
    referralCode: Optional[str] = None


class CheckoutBody(BaseModel):
    planType: str                  # "individual" | "family" | "pro_monthly" | "pro_annual"
    successUrl: str
    cancelUrl: str


class PortalBody(BaseModel):
    returnUrl: str


# ── Helpers ─────────────────────────────────────────────────────────────────────

def _dt(val) -> Optional[str]:
    if val is None:
        return None
    return val.isoformat() if isinstance(val, datetime) else str(val)


def _sub_shape(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "userId": doc.get("user_id", ""),
        "platform": doc.get("platform", "stripe"),
        "planType": doc.get("plan_type", "individual"),
        "status": doc.get("status", "trial"),
        "currentPeriodStart": _dt(doc.get("current_period_start")) or "",
        "currentPeriodEnd": _dt(doc.get("current_period_end")) or "",
        "trialEnd": _dt(doc.get("trial_end")),
        "cancelAtPeriodEnd": doc.get("cancel_at_period_end", False),
        "externalSubscriptionId": doc.get("external_subscription_id"),
        "createdAt": _dt(doc.get("created_at")) or "",
        "updatedAt": _dt(doc.get("updated_at")) or "",
    }


def _entitlement_shape(doc: Optional[dict], user_id: str) -> dict:
    if not doc:
        return {
            "userId": user_id,
            "planType": "free",
            "status": "expired",
            "maxChildren": 1,
            "hasFullAccess": False,
            "isInTrial": False,
            "trialDaysRemaining": None,
            "currentPeriodEnd": None,
        }

    plan_type = doc.get("plan_type", "individual")
    sub_status = doc.get("status", "trial")
    is_in_trial = sub_status == "trial"

    trial_days: Optional[int] = None
    trial_end = doc.get("trial_end")
    if is_in_trial and trial_end:
        # trial_end is timezone-aware (tz_aware=True on Motor client)
        diff = trial_end - datetime.now(timezone.utc)
        trial_days = max(0, diff.days)

    return {
        "userId": user_id,
        "planType": plan_type,
        "status": sub_status,
        "maxChildren": 4 if plan_type == "family" else 1,
        "hasFullAccess": sub_status in ("trial", "active", "grace"),
        "isInTrial": is_in_trial,
        "trialDaysRemaining": trial_days,
        "currentPeriodEnd": _dt(doc.get("current_period_end")),
    }


def _me_shape(doc: dict, user_id: str) -> dict:
    """Extended subscription shape with computed entitlement fields."""
    plan_type = doc.get("plan_type", "individual")
    sub_status = doc.get("status", "trial")
    is_in_trial = sub_status == "trial"
    is_entitled = sub_status in ("trial", "active", "grace")

    trial_days: Optional[int] = None
    trial_end = doc.get("trial_end")
    if is_in_trial and trial_end:
        diff = trial_end - datetime.now(timezone.utc)
        trial_days = max(0, diff.days)

    return {
        **_sub_shape(doc),
        # Computed fields
        "trialDaysRemaining": trial_days if is_in_trial else 0,
        "isEntitled": is_entitled,
        "canAccessFullLibrary": is_entitled,
        "maxChildren": 4 if plan_type == "family" else 1,
    }


def _stripe_price_id(plan_type: str) -> Optional[str]:
    """Map a plan_type string to a Stripe price ID from config."""
    mapping = {
        "individual": settings.STRIPE_PRICE_PRO_MONTHLY,
        "pro_monthly": settings.STRIPE_PRICE_PRO_MONTHLY,
        "pro_annual": settings.STRIPE_PRICE_PRO_ANNUAL,
        "family": settings.STRIPE_PRICE_FAMILY,
    }
    price_id = mapping.get(plan_type, "")
    return price_id if price_id else None


# ── Routes ──────────────────────────────────────────────────────────────────────

@router.get("/entitlement")
async def get_entitlement(current_user: UserClaims = Depends(get_current_user)):
    db = get_database()
    now = datetime.now(timezone.utc)
    doc = await db["subscriptions"].find_one({
        "user_id": current_user.user_id,
        "status": {"$in": ["trial", "active", "grace"]},
        "current_period_end": {"$gt": now},
    })
    return JSONResponse(content={
        "success": True,
        "data": _entitlement_shape(doc, current_user.user_id),
    })


@router.get("/me")
async def get_subscription_me(current_user: UserClaims = Depends(get_current_user)):
    """Return the current subscription with computed entitlement fields.

    Returns a 404 SUBSCRIPTION_NOT_FOUND if no subscription record exists —
    the frontend can use this to show the "Start free trial" flow.
    """
    db = get_database()
    doc = await db["subscriptions"].find_one({"user_id": current_user.user_id})
    if not doc:
        raise HTTPException(
            status_code=404,
            detail={"code": "SUBSCRIPTION_NOT_FOUND", "message": "No subscription found."},
        )
    return JSONResponse(content={"success": True, "data": _me_shape(doc, current_user.user_id)})


@router.get("")
async def get_subscription(current_user: UserClaims = Depends(get_current_user)):
    db = get_database()
    doc = await db["subscriptions"].find_one({"user_id": current_user.user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="No subscription found.")
    return JSONResponse(content={"success": True, "data": _sub_shape(doc)})


@router.post("/trial", status_code=status.HTTP_201_CREATED)
async def start_trial(
    body: TrialBody,
    current_user: UserClaims = Depends(get_current_user),
):
    """Start a 7-day free trial.

    If a subscription already exists:
      - status in [trial, active, grace]: return 200 with the current subscription
        (frontend treats this as success and refreshes entitlement).
      - Otherwise (expired / cancelled): still return 200 with the current subscription
        since we cannot create a second row (unique constraint on user_id).
    """
    db = get_database()
    existing = await db["subscriptions"].find_one({"user_id": current_user.user_id})
    if existing:
        logger.info(
            "start_trial called but subscription already exists for user=%s (status=%s)",
            current_user.user_id, existing.get("status"),
        )
        # Return the existing subscription as a successful response so the frontend
        # can refetch and display the correct state without showing an error.
        return JSONResponse(
            status_code=200,
            content={"success": True, "data": _sub_shape(existing)},
        )

    now = datetime.now(timezone.utc)
    trial_end = now + timedelta(days=7)
    doc: dict = {
        "user_id": current_user.user_id,
        "platform": "web",
        "plan_type": body.planType,
        "status": "trial",
        "current_period_start": now,
        "current_period_end": trial_end,
        "trial_end": trial_end,
        "cancel_at_period_end": False,
        "external_subscription_id": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["subscriptions"].insert_one(doc)
    doc["_id"] = result.inserted_id

    logger.info("Trial started: user=%s plan=%s", current_user.user_id, body.planType)
    return JSONResponse(
        status_code=201,
        content={"success": True, "data": _sub_shape(doc)},
    )


@router.post("/checkout")
async def create_checkout(
    body: CheckoutBody,
    current_user: UserClaims = Depends(get_current_user),
):
    """Create a Stripe Checkout session.

    Returns 501 if STRIPE_SECRET_KEY is not configured.
    """
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Stripe is not configured. Add STRIPE_SECRET_KEY to .env",
        )

    price_id = _stripe_price_id(body.planType)
    if not price_id:
        raise HTTPException(
            status_code=400,
            detail=f"No Stripe price configured for plan '{body.planType}'. "
                   "Set STRIPE_PRICE_* in .env",
        )

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=body.successUrl,
            cancel_url=body.cancelUrl,
            metadata={
                "user_id": current_user.user_id,
                "plan_type": body.planType,
            },
            customer_email=current_user.email or None,
        )
    except stripe.StripeError as exc:
        logger.error("Stripe checkout error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Stripe error: {exc.user_message}")

    logger.info("Checkout session created: user=%s plan=%s", current_user.user_id, body.planType)
    return JSONResponse(content={
        "success": True,
        "data": {
            "checkoutUrl": session.url,
            "sessionId": session.id,
        },
    })


@router.post("/portal")
async def customer_portal(
    body: PortalBody,
    current_user: UserClaims = Depends(get_current_user),
):
    """Create a Stripe Customer Portal session.

    Requires an external_subscription_id stored on the subscription document
    (set by the Stripe webhook handler when a subscription is created).
    """
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Stripe is not configured. Add STRIPE_SECRET_KEY to .env",
        )

    db = get_database()
    sub_doc = await db["subscriptions"].find_one({"user_id": current_user.user_id})
    if not sub_doc or not sub_doc.get("external_subscription_id"):
        raise HTTPException(
            status_code=400,
            detail="No active Stripe subscription found.",
        )

    stripe.api_key = settings.STRIPE_SECRET_KEY

    # Derive the Stripe customer ID from the subscription object
    try:
        stripe_sub = stripe.Subscription.retrieve(sub_doc["external_subscription_id"])
        customer_id = stripe_sub["customer"]

        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=body.returnUrl,
        )
    except stripe.StripeError as exc:
        logger.error("Stripe portal error: %s", exc)
        raise HTTPException(status_code=502, detail=f"Stripe error: {exc.user_message}")

    return JSONResponse(content={
        "success": True,
        "data": {"portalUrl": session.url},
    })


@router.post("/cancel")
async def cancel_subscription(current_user: UserClaims = Depends(get_current_user)):
    db = get_database()
    result = await db["subscriptions"].update_one(
        {
            "user_id": current_user.user_id,
            "status": {"$in": ["trial", "active", "grace"]},
        },
        {"$set": {"cancel_at_period_end": True, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="No active subscription to cancel.")
    return JSONResponse(content={"success": True, "data": None})
