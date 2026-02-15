"""
Sync conflict resolution — detects and resolves bidirectional sync conflicts.
Strategies: local_wins, remote_wins, newest_wins, manual
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class ConflictStrategy(str, Enum):
    LOCAL_WINS = "local_wins"       # Our DB is source of truth
    REMOTE_WINS = "remote_wins"     # Store platform is source of truth
    NEWEST_WINS = "newest_wins"     # Most recent update wins
    MANUAL = "manual"               # Flag for user review


class SyncConflict:
    def __init__(
        self,
        product_id: str,
        store_id: str,
        field: str,
        local_value: Any,
        remote_value: Any,
        local_updated_at: Optional[str] = None,
        remote_updated_at: Optional[str] = None,
    ):
        self.product_id = product_id
        self.store_id = store_id
        self.field = field
        self.local_value = local_value
        self.remote_value = remote_value
        self.local_updated_at = local_updated_at
        self.remote_updated_at = remote_updated_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "product_id": self.product_id,
            "store_id": self.store_id,
            "field": self.field,
            "local_value": self.local_value,
            "remote_value": self.remote_value,
            "local_updated_at": self.local_updated_at,
            "remote_updated_at": self.remote_updated_at,
        }


# Fields that are critical — always flag for review if different
CRITICAL_FIELDS = {"price", "stock", "compare_at_price"}
# Fields that can auto-resolve with strategy
SAFE_FIELDS = {"title", "description", "tags", "status", "images", "weight"}


def detect_conflicts(
    local_product: Dict[str, Any],
    remote_product: Dict[str, Any],
    product_id: str,
    store_id: str,
) -> List[SyncConflict]:
    """Compare local and remote product data, return list of conflicts."""
    conflicts: List[SyncConflict] = []
    compare_fields = {
        "title": ("title", "title"),
        "description": ("description", "description"),
        "price": ("sale_price", "price"),
        "stock": ("stock", "stock"),
        "status": ("status", "status"),
    }

    for field_name, (local_key, remote_key) in compare_fields.items():
        local_val = local_product.get(local_key)
        remote_val = remote_product.get(remote_key)

        if local_val is None or remote_val is None:
            continue

        # Normalize for comparison
        if isinstance(local_val, (int, float)) and isinstance(remote_val, (int, float)):
            if abs(float(local_val) - float(remote_val)) < 0.01:
                continue
        elif str(local_val).strip() == str(remote_val).strip():
            continue

        conflicts.append(SyncConflict(
            product_id=product_id,
            store_id=store_id,
            field=field_name,
            local_value=local_val,
            remote_value=remote_val,
            local_updated_at=local_product.get("updated_at"),
            remote_updated_at=remote_product.get("updated_at"),
        ))

    return conflicts


def resolve_conflicts(
    conflicts: List[SyncConflict],
    strategy: ConflictStrategy = ConflictStrategy.LOCAL_WINS,
) -> Dict[str, Any]:
    """
    Resolve conflicts using the given strategy.
    Returns {"resolved": [...], "manual_review": [...], "actions": [...]}
    """
    resolved = []
    manual_review = []
    actions = []  # {"direction": "push"|"pull", "field": ..., "value": ...}

    for conflict in conflicts:
        if strategy == ConflictStrategy.MANUAL or conflict.field in CRITICAL_FIELDS:
            if strategy == ConflictStrategy.MANUAL:
                manual_review.append(conflict.to_dict())
                continue

        if strategy == ConflictStrategy.LOCAL_WINS:
            actions.append({
                "direction": "push",
                "field": conflict.field,
                "value": conflict.local_value,
                "product_id": conflict.product_id,
                "store_id": conflict.store_id,
            })
            resolved.append({**conflict.to_dict(), "resolution": "local_wins"})

        elif strategy == ConflictStrategy.REMOTE_WINS:
            actions.append({
                "direction": "pull",
                "field": conflict.field,
                "value": conflict.remote_value,
                "product_id": conflict.product_id,
                "store_id": conflict.store_id,
            })
            resolved.append({**conflict.to_dict(), "resolution": "remote_wins"})

        elif strategy == ConflictStrategy.NEWEST_WINS:
            local_ts = conflict.local_updated_at or "1970-01-01"
            remote_ts = conflict.remote_updated_at or "1970-01-01"

            if local_ts >= remote_ts:
                actions.append({
                    "direction": "push",
                    "field": conflict.field,
                    "value": conflict.local_value,
                    "product_id": conflict.product_id,
                    "store_id": conflict.store_id,
                })
                resolved.append({**conflict.to_dict(), "resolution": "local_newer"})
            else:
                actions.append({
                    "direction": "pull",
                    "field": conflict.field,
                    "value": conflict.remote_value,
                    "product_id": conflict.product_id,
                    "store_id": conflict.store_id,
                })
                resolved.append({**conflict.to_dict(), "resolution": "remote_newer"})

    # Critical fields always go to manual review regardless of strategy
    for conflict in conflicts:
        if conflict.field in CRITICAL_FIELDS and strategy != ConflictStrategy.LOCAL_WINS:
            manual_review.append({
                **conflict.to_dict(),
                "reason": f"Critical field '{conflict.field}' requires review",
            })

    return {
        "resolved": resolved,
        "manual_review": manual_review,
        "actions": actions,
        "total_conflicts": len(conflicts),
    }


async def apply_sync_actions(supabase, actions: List[Dict], user_id: str) -> Dict[str, int]:
    """Apply resolved sync actions to local DB or queue push to remote."""
    pushed = 0
    pulled = 0

    for action in actions:
        try:
            if action["direction"] == "pull":
                # Update local product with remote value
                field_map = {
                    "title": "title",
                    "description": "description",
                    "price": "sale_price",
                    "stock": "stock",
                    "status": "status",
                }
                db_field = field_map.get(action["field"], action["field"])
                supabase.table("products").update({
                    db_field: action["value"],
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("id", action["product_id"]).eq("user_id", user_id).execute()
                pulled += 1

            elif action["direction"] == "push":
                # Mark store link as outdated so next sync pushes the value
                supabase.table("product_store_links").update({
                    "sync_status": "outdated",
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("product_id", action["product_id"]).eq("store_id", action["store_id"]).execute()
                pushed += 1

        except Exception as e:
            logger.error(f"Failed to apply sync action: {e}")

    return {"pushed": pushed, "pulled": pulled}
