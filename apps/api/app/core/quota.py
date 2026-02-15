"""
Quota enforcement dependency for FastAPI endpoints.
P2.1: Reusable dependency that checks plan limits and increments usage atomically.

Usage:
    @router.post("/csv")
    async def import_csv(
        user_id: str = Depends(get_current_user_id),
        quota: QuotaGuard = Depends(require_quota("products:import")),
    ):
        ...
        # After success, call quota.consume(quantity)
"""

from fastapi import HTTPException, Request, Depends
from typing import Optional
from datetime import datetime
import logging

from app.core.database import db_pool
from app.core.security import get_current_user_id

logger = logging.getLogger(__name__)

# ── Action → quota mapping ───────────────────────────────────────────────────
ACTION_MAP = {
    "products:import":  {"quota_key": "products_imported", "limit_key": "max_products"},
    "products:create":  {"quota_key": "products_imported", "limit_key": "max_products"},
    "ai:generate":      {"quota_key": "ai_generations",    "limit_key": "ai_generations"},
    "ai:enrich":        {"quota_key": "ai_generations",    "limit_key": "ai_generations"},
    "seo:audit":        {"quota_key": "seo_audits",        "limit_key": "seo_audits"},
    "seo:generate":     {"quota_key": "seo_generations",   "limit_key": "seo_generations"},
    "seo:apply":        {"quota_key": "seo_applies",       "limit_key": "seo_applies"},
    "orders:create":    {"quota_key": "orders_created",    "limit_key": "max_orders_per_month"},
    "imports:csv":      {"quota_key": "imports_monthly",   "limit_key": "imports_monthly"},
    "imports:url":      {"quota_key": "imports_monthly",   "limit_key": "imports_monthly"},
}

PLAN_ORDER = ["free", "starter", "standard", "pro", "ultra_pro", "enterprise"]


class QuotaGuard:
    """
    Holds quota state for a request. Call .consume(n) after successful action.
    """

    def __init__(self, user_id: str, action: str, plan: str, limit: int, current_usage: int, usage_row_id: Optional[str]):
        self.user_id = user_id
        self.action = action
        self.plan = plan
        self.limit = limit
        self.current_usage = current_usage
        self._usage_row_id = usage_row_id
        self._mapping = ACTION_MAP[action]

    @property
    def remaining(self) -> int:
        if self.limit == -1:
            return -1  # unlimited
        return max(0, self.limit - self.current_usage)

    async def consume(self, quantity: int = 1):
        """Increment usage after a successful action."""
        if self.limit == -1:
            return  # unlimited, no tracking needed
        if not db_pool:
            logger.warning("DB pool not available for quota consume")
            return

        now = datetime.utcnow()
        period_start = datetime(now.year, now.month, 1).isoformat()
        period_end_month = now.month + 1 if now.month < 12 else 1
        period_end_year = now.year if now.month < 12 else now.year + 1
        period_end = datetime(period_end_year, period_end_month, 1).isoformat()

        async with db_pool.acquire() as conn:
            if self._usage_row_id:
                await conn.execute(
                    "UPDATE quota_usage SET current_usage = current_usage + $1, updated_at = now() WHERE id = $2",
                    quantity, self._usage_row_id,
                )
            else:
                await conn.execute(
                    """INSERT INTO quota_usage (user_id, quota_key, current_usage, period_start, period_end)
                       VALUES ($1, $2, $3, $4::timestamptz, $5::timestamptz)""",
                    self.user_id, self._mapping["quota_key"], quantity, period_start, period_end,
                )
            logger.info(f"Quota consumed: {self._mapping['quota_key']} +{quantity} for user {self.user_id}")

        # Log consumption
        try:
            async with db_pool.acquire() as conn:
                await conn.execute(
                    """INSERT INTO consumption_logs (user_id, quota_key, action_type, tokens_used, source)
                       VALUES ($1, $2, $3, $4, $5)""",
                    self.user_id, self._mapping["quota_key"], self.action, quantity, "fastapi",
                )
        except Exception as e:
            logger.warning(f"Failed to log consumption: {e}")


def require_quota(action: str, quantity: int = 1):
    """
    FastAPI dependency factory.
    Returns a QuotaGuard if the user is within limits, raises 402/403 otherwise.
    """

    async def _check(user_id: str = Depends(get_current_user_id)) -> QuotaGuard:
        mapping = ACTION_MAP.get(action)
        if not mapping:
            logger.warning(f"Unknown quota action '{action}', allowing by default")
            return QuotaGuard(user_id, action, "unknown", -1, 0, None)

        if not db_pool:
            raise HTTPException(status_code=503, detail="Database not available")

        async with db_pool.acquire() as conn:
            # 1. Get user plan
            row = await conn.fetchrow(
                "SELECT subscription_plan, plan, subscription_status FROM profiles WHERE id = $1",
                user_id,
            )
            plan = (row["subscription_plan"] if row and row["subscription_plan"] else
                    row["plan"] if row and row["plan"] else "free")
            sub_status = row["subscription_status"] if row else None

            # Downgrade if subscription expired
            if sub_status in ("past_due", "canceled"):
                plan = "free"

            # 2. Get limit
            limit_row = await conn.fetchrow(
                "SELECT limit_value FROM plan_limits WHERE plan_name = $1 AND limit_key = $2",
                plan, mapping["limit_key"],
            )
            limit = limit_row["limit_value"] if limit_row else 0

            # Unlimited
            if limit == -1:
                return QuotaGuard(user_id, action, plan, -1, 0, None)

            # 3. Get current usage for this period
            now = datetime.utcnow()
            period_start = datetime(now.year, now.month, 1).isoformat()

            usage_row = await conn.fetchrow(
                """SELECT id, current_usage FROM quota_usage
                   WHERE user_id = $1 AND quota_key = $2 AND period_start >= $3::timestamptz""",
                user_id, mapping["quota_key"], period_start,
            )

            current_usage = usage_row["current_usage"] if usage_row else 0
            usage_row_id = str(usage_row["id"]) if usage_row else None

            # 4. Check
            if current_usage + quantity > limit:
                current_idx = PLAN_ORDER.index(plan) if plan in PLAN_ORDER else 0
                upgrade = PLAN_ORDER[current_idx + 1] if current_idx < len(PLAN_ORDER) - 1 else None
                raise HTTPException(
                    status_code=402,
                    detail={
                        "code": "QUOTA_EXCEEDED",
                        "action": action,
                        "plan": plan,
                        "current_usage": current_usage,
                        "limit": limit,
                        "upgrade_required": upgrade,
                        "message": f"Quota exceeded for '{action}'. Current: {current_usage}/{limit}. Upgrade to {upgrade or 'contact sales'}.",
                    },
                )

            return QuotaGuard(user_id, action, plan, limit, current_usage, usage_row_id)

    return _check
