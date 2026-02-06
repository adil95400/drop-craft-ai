"""
Pricing rules endpoints — apply rules, track via jobs/job_items
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from app.core.security import get_current_user_id
from app.core.database import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()


class PricingRuleCreate(BaseModel):
    name: str
    rule_type: str  # margin_percent, margin_fixed, markup, round, competitor, custom
    config: Dict[str, Any] = {}
    priority: int = 0
    applies_to: Dict[str, Any] = {}  # category, vendor, tags filters


class PricingRuleUpdate(BaseModel):
    name: Optional[str] = None
    rule_type: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    applies_to: Optional[Dict[str, Any]] = None


class ApplyRulesRequest(BaseModel):
    rule_ids: List[str] = []  # empty = apply all active rules
    product_ids: List[str] = []  # empty = apply to all matching products
    dry_run: bool = False


# === RULES CRUD ===

@router.get("/rules")
async def list_rules(
    user_id: str = Depends(get_current_user_id)
):
    """List all pricing rules"""
    try:
        supabase = get_supabase()
        result = supabase.table("pricing_rules").select("*").eq("user_id", user_id).order("priority", desc=True).execute()
        return {"success": True, "rules": result.data or []}
    except Exception as e:
        logger.error(f"Failed to list rules: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rules")
async def create_rule(
    rule: PricingRuleCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a pricing rule"""
    try:
        supabase = get_supabase()
        data = rule.model_dump()
        data["user_id"] = user_id
        data["created_at"] = datetime.utcnow().isoformat()
        data["updated_at"] = datetime.utcnow().isoformat()
        result = supabase.table("pricing_rules").insert(data).execute()
        return {"success": True, "rule": result.data[0] if result.data else None}
    except Exception as e:
        logger.error(f"Failed to create rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/rules/{rule_id}")
async def update_rule(
    rule_id: str,
    updates: PricingRuleUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update a pricing rule"""
    try:
        supabase = get_supabase()
        update_data = updates.model_dump(exclude_none=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        result = supabase.table("pricing_rules").update(update_data).eq("id", rule_id).eq("user_id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Rule not found")
        return {"success": True, "rule": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a pricing rule"""
    try:
        supabase = get_supabase()
        supabase.table("pricing_rules").delete().eq("id", rule_id).eq("user_id", user_id).execute()
        return {"success": True, "message": "Rule deleted"}
    except Exception as e:
        logger.error(f"Failed to delete rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# === APPLY RULES ===

@router.post("/apply")
async def apply_pricing_rules(
    request: ApplyRulesRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Apply pricing rules to products — creates a job with job_items per product"""
    try:
        supabase = get_supabase()

        # Fetch rules
        if request.rule_ids:
            rules_result = supabase.table("pricing_rules").select("*").in_("id", request.rule_ids).eq("user_id", user_id).eq("is_active", True).order("priority", desc=True).execute()
        else:
            rules_result = supabase.table("pricing_rules").select("*").eq("user_id", user_id).eq("is_active", True).order("priority", desc=True).execute()

        rules = rules_result.data or []
        if not rules:
            raise HTTPException(status_code=400, detail="No active pricing rules found")

        # Fetch products
        if request.product_ids:
            products_result = supabase.table("products").select("id, title, price, cost_price, category, vendor, tags").in_("id", request.product_ids).eq("user_id", user_id).execute()
        else:
            products_result = supabase.table("products").select("id, title, price, cost_price, category, vendor, tags").eq("user_id", user_id).execute()

        products = products_result.data or []

        # Create job
        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "pricing",
            "status": "running",
            "total_items": len(products),
            "metadata": {
                "rule_count": len(rules),
                "dry_run": request.dry_run,
                "rule_ids": [r["id"] for r in rules],
            },
            "started_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute().data[0]

        success = 0
        failed = 0

        for product in products:
            try:
                cost = float(product.get("cost_price") or 0)
                current_price = float(product.get("price") or 0)
                new_price = current_price

                applied_rule = None
                for rule in rules:
                    if _rule_matches(rule, product):
                        new_price = _compute_price(rule, cost, current_price)
                        applied_rule = rule
                        break

                before = {"price": current_price}
                after = {"price": round(new_price, 2)}

                if not request.dry_run and new_price != current_price and applied_rule:
                    supabase.table("products").update({
                        "price": round(new_price, 2),
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", product["id"]).eq("user_id", user_id).execute()

                    # Update pricing state
                    margin_pct = ((new_price - cost) / new_price * 100) if new_price > 0 else 0
                    supabase.table("product_pricing_state").upsert({
                        "product_id": product["id"],
                        "rule_id": applied_rule["id"],
                        "computed_price": round(new_price, 2),
                        "base_cost": cost,
                        "margin_percent": round(margin_pct, 2),
                        "margin_amount": round(new_price - cost, 2),
                        "last_applied_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat(),
                    }, on_conflict="product_id,variant_id").execute()

                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": product["id"],
                    "status": "success",
                    "message": f"Rule '{applied_rule['name']}' applied" if applied_rule else "No matching rule",
                    "before_state": before,
                    "after_state": after,
                    "processed_at": datetime.utcnow().isoformat(),
                }).execute()
                success += 1

            except Exception as e:
                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": product["id"],
                    "status": "failed",
                    "message": str(e),
                    "error_code": "PRICING_FAILED",
                    "processed_at": datetime.utcnow().isoformat(),
                }).execute()
                failed += 1

        supabase.table("jobs").update({
            "status": "completed",
            "processed_items": success + failed,
            "failed_items": failed,
            "progress_percent": 100,
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job["id"]).execute()

        return {
            "success": True,
            "job_id": job["id"],
            "results": {"success": success, "failed": failed, "dry_run": request.dry_run}
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Apply pricing rules failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _rule_matches(rule: dict, product: dict) -> bool:
    """Check if a pricing rule applies to a product"""
    applies = rule.get("applies_to") or {}
    if not applies:
        return True  # Applies to all

    if "category" in applies and applies["category"]:
        if product.get("category") != applies["category"]:
            return False
    if "vendor" in applies and applies["vendor"]:
        if product.get("vendor") != applies["vendor"]:
            return False
    if "tags" in applies and applies["tags"]:
        product_tags = product.get("tags") or []
        if not any(t in product_tags for t in applies["tags"]):
            return False
    return True


def _compute_price(rule: dict, cost: float, current_price: float) -> float:
    """Compute new price based on rule type and config"""
    config = rule.get("config") or {}
    rule_type = rule.get("rule_type", "")

    if rule_type == "margin_percent":
        target_margin = config.get("margin", 30)
        if cost > 0:
            return cost / (1 - target_margin / 100)
        return current_price

    elif rule_type == "margin_fixed":
        fixed_margin = config.get("margin", 10)
        return cost + fixed_margin

    elif rule_type == "markup":
        multiplier = config.get("multiplier", 2.0)
        return cost * multiplier

    elif rule_type == "round":
        # Round to .99
        base = round(current_price)
        return base - 0.01 if base > 0 else current_price

    return current_price
