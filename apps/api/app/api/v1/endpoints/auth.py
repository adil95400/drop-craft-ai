"""
Auth & Profiles endpoints
- GET  /auth/me          → current user claims from JWT
- GET  /auth/profile     → full profile from DB
- PATCH /auth/profile    → update profile
- GET  /auth/subscription → subscription status + plan limits
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app.core.security import verify_supabase_jwt, get_current_user_id
from app.core.database import get_supabase

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    website: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    marketing_notifications: Optional[bool] = None


class ProfileResponse(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    language: str = "fr"
    timezone: str = "Europe/Paris"
    plan: str = "free"
    subscription_status: Optional[str] = None
    subscription_expires_at: Optional[str] = None
    onboarding_completed: bool = False
    created_at: Optional[str] = None


class SubscriptionInfo(BaseModel):
    plan: str = "free"
    status: Optional[str] = None
    expires_at: Optional[str] = None
    quotas: Dict[str, Any] = {}
    limits: Dict[str, Any] = {}


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_current_user_info(
    claims: Dict[str, Any] = Depends(verify_supabase_jwt)
):
    """Return JWT claims (no DB call)"""
    return {
        "user_id": claims["user_id"],
        "email": claims.get("email"),
        "role": claims.get("role", "authenticated"),
    }


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user_id: str = Depends(get_current_user_id)):
    """Fetch full profile from DB"""
    supabase = get_supabase()
    result = supabase.table("profiles").select("*").eq("id", user_id).maybeSingle().execute()

    if not result.data:
        # Auto-create profile if missing (first login scenario)
        new_profile = {"id": user_id, "plan": "free", "subscription_status": "active"}
        supabase.table("profiles").insert(new_profile).execute()
        return ProfileResponse(id=user_id)

    return ProfileResponse(**result.data)


@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    updates: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """Update user profile (only non-null fields)"""
    supabase = get_supabase()

    # Filter out None values
    data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("profiles").update(data).eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    return ProfileResponse(**result.data[0])


@router.get("/subscription", response_model=SubscriptionInfo)
async def get_subscription_info(user_id: str = Depends(get_current_user_id)):
    """Get subscription status + plan limits + current quota usage"""
    supabase = get_supabase()

    # 1. Get profile (plan info)
    profile = supabase.table("profiles").select(
        "plan, subscription_status, subscription_expires_at"
    ).eq("id", user_id).maybeSingle().execute()

    plan = (profile.data or {}).get("plan", "free")
    status = (profile.data or {}).get("subscription_status")
    expires = (profile.data or {}).get("subscription_expires_at")

    # 2. Get plan limits
    limits_result = supabase.table("plan_limits").select(
        "limit_key, limit_value"
    ).eq("plan_name", plan).execute()

    limits = {row["limit_key"]: row["limit_value"] for row in (limits_result.data or [])}

    # 3. Get current quota usage
    quotas_result = supabase.table("quota_usage").select(
        "quota_key, current_usage, period_start, period_end"
    ).eq("user_id", user_id).execute()

    quotas = {
        row["quota_key"]: {
            "used": row["current_usage"],
            "limit": limits.get(row["quota_key"], -1),
            "period_end": row["period_end"],
        }
        for row in (quotas_result.data or [])
    }

    return SubscriptionInfo(
        plan=plan,
        status=status,
        expires_at=expires,
        quotas=quotas,
        limits=limits,
    )
