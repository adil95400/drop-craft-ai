"""
Sync endpoints — multi-store synchronization via jobs/job_items
Uses platform adapters (Shopify, WooCommerce) for real API calls.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from app.core.security import get_current_user_id
from app.core.database import get_supabase
from app.services.platform_sync import get_adapter
from app.services.platform_sync.base import PlatformProduct
from app.services.platform_sync.conflict_resolution import (
    detect_conflicts, resolve_conflicts, apply_sync_actions, ConflictStrategy
)

logger = logging.getLogger(__name__)
router = APIRouter()


class BulkSyncRequest(BaseModel):
    product_ids: List[str] = []
    store_ids: List[str] = []
    conflict_strategy: str = "local_wins"  # local_wins | remote_wins | newest_wins | manual


class BulkPublishRequest(BaseModel):
    product_ids: List[str]
    store_ids: List[str] = []


class BulkUnpublishRequest(BaseModel):
    product_ids: List[str]
    store_ids: List[str] = []


class ConflictResolveRequest(BaseModel):
    product_id: str
    store_id: str
    resolution: str  # "local" or "remote"
    fields: List[str] = []  # empty = all conflicting fields


# === SYNC ===

@router.post("/bulk/sync")
async def bulk_sync(
    request: BulkSyncRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Sync products with external stores using platform adapters"""
    try:
        supabase = get_supabase()

        # Get store links to sync
        query = supabase.table("product_store_links").select(
            "*, products!inner(id, title, description, sale_price, stock, status, user_id, updated_at), shops!inner(id, name, platform, credentials_encrypted)"
        )
        if request.product_ids:
            query = query.in_("product_id", request.product_ids)
        if request.store_ids:
            query = query.in_("store_id", request.store_ids)

        links_result = query.execute()
        links = [l for l in (links_result.data or []) if l.get("products", {}).get("user_id") == user_id]

        if not links:
            raise HTTPException(status_code=400, detail="No product-store links found to sync")

        # Create job
        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "sync",
            "status": "running",
            "total_items": len(links),
            "metadata": {
                "product_count": len(set(l["product_id"] for l in links)),
                "store_count": len(set(l["store_id"] for l in links)),
                "conflict_strategy": request.conflict_strategy,
            },
            "started_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute().data[0]

        success = 0
        failed = 0
        conflicts_found = 0

        # Group links by store for adapter reuse
        store_adapters: Dict[str, Any] = {}

        for link in links:
            store = link.get("shops", {})
            product = link.get("products", {})
            store_id = store.get("id", "")

            try:
                # Get or create adapter for this store
                if store_id not in store_adapters:
                    platform = store.get("platform", "").lower()
                    creds = store.get("credentials_encrypted", {})
                    if isinstance(creds, str):
                        import json
                        creds = json.loads(creds)
                    store_adapters[store_id] = get_adapter(platform, creds or {})

                adapter = store_adapters[store_id]
                external_id = link.get("external_product_id")

                if external_id:
                    # Pull remote state and check for conflicts
                    try:
                        remote = await adapter.pull_product(external_id)
                        remote_dict = {
                            "title": remote.title, "description": remote.description,
                            "price": remote.price, "stock": remote.stock,
                            "status": remote.status, "updated_at": link.get("last_remote_update"),
                        }
                        local_dict = {
                            "title": product.get("title"), "description": product.get("description"),
                            "sale_price": product.get("sale_price"), "stock": product.get("stock"),
                            "status": product.get("status"), "updated_at": product.get("updated_at"),
                        }

                        conflicts = detect_conflicts(local_dict, remote_dict, link["product_id"], store_id)

                        if conflicts:
                            conflicts_found += len(conflicts)
                            strategy = ConflictStrategy(request.conflict_strategy)
                            resolution = resolve_conflicts(conflicts, strategy)

                            if resolution["manual_review"]:
                                # Flag for manual review
                                supabase.table("product_store_links").update({
                                    "sync_status": "conflict",
                                    "metadata": {"conflicts": resolution["manual_review"]},
                                    "updated_at": datetime.utcnow().isoformat(),
                                }).eq("id", link["id"]).execute()

                                supabase.table("job_items").insert({
                                    "job_id": job["id"],
                                    "product_id": link["product_id"],
                                    "status": "warning",
                                    "message": f"{len(resolution['manual_review'])} conflicts need review",
                                    "processed_at": datetime.utcnow().isoformat(),
                                }).execute()
                                success += 1
                                continue

                            # Apply resolved actions
                            if resolution["actions"]:
                                await apply_sync_actions(supabase, resolution["actions"], user_id)
                    except Exception as pull_err:
                        logger.warning(f"Could not pull remote product {external_id}: {pull_err}")

                # Push local → remote
                pp = PlatformProduct(
                    external_id=external_id,
                    title=product.get("title", ""),
                    description=product.get("description", ""),
                    price=float(product.get("sale_price", 0)),
                    stock=product.get("stock", 0),
                    status=product.get("status", "draft"),
                )
                push_result = await adapter.push_product(pp)

                # Update link
                supabase.table("product_store_links").update({
                    "external_product_id": push_result.get("external_id", external_id),
                    "sync_status": "synced",
                    "last_sync_at": datetime.utcnow().isoformat(),
                    "last_error": None,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("id", link["id"]).execute()

                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": link["product_id"],
                    "status": "success",
                    "message": f"Synced with {store.get('name', 'store')}",
                    "processed_at": datetime.utcnow().isoformat(),
                }).execute()
                success += 1

            except Exception as e:
                supabase.table("product_store_links").update({
                    "sync_status": "error",
                    "last_error": str(e)[:500],
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("id", link["id"]).execute()

                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": link.get("product_id"),
                    "status": "failed",
                    "message": str(e)[:500],
                    "error_code": "SYNC_FAILED",
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
            "metadata": {
                "conflicts_found": conflicts_found,
                "conflict_strategy": request.conflict_strategy,
            },
        }).eq("id", job["id"]).execute()

        return {
            "success": True,
            "job_id": job["id"],
            "results": {"synced": success, "failed": failed, "conflicts": conflicts_found}
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conflicts/resolve")
async def resolve_conflict(
    request: ConflictResolveRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Manually resolve a sync conflict for a product-store link"""
    try:
        supabase = get_supabase()

        link_result = supabase.table("product_store_links").select(
            "*, products!inner(user_id)"
        ).eq("product_id", request.product_id).eq("store_id", request.store_id).single().execute()

        link = link_result.data
        if not link or link.get("products", {}).get("user_id") != user_id:
            raise HTTPException(status_code=404, detail="Link not found")

        # Mark as resolved
        supabase.table("product_store_links").update({
            "sync_status": "outdated" if request.resolution == "local" else "synced",
            "metadata": {"conflict_resolved": request.resolution, "resolved_at": datetime.utcnow().isoformat()},
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("product_id", request.product_id).eq("store_id", request.store_id).execute()

        return {"success": True, "resolution": request.resolution}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk/publish")
async def bulk_publish(
    request: BulkPublishRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Publish products to stores — creates job"""
    try:
        supabase = get_supabase()

        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "publish",
            "status": "running",
            "total_items": len(request.product_ids),
            "started_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute().data[0]

        success = 0
        for pid in request.product_ids:
            try:
                # Update product status
                supabase.table("products").update({
                    "status": "active",
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("id", pid).eq("user_id", user_id).execute()

                # Update store links
                link_query = supabase.table("product_store_links").select("id").eq("product_id", pid)
                if request.store_ids:
                    link_query = link_query.in_("store_id", request.store_ids)
                links = link_query.execute().data or []

                for link in links:
                    supabase.table("product_store_links").update({
                        "published": True,
                        "sync_status": "outdated",
                        "updated_at": datetime.utcnow().isoformat(),
                    }).eq("id", link["id"]).execute()

                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": pid,
                    "status": "success",
                    "message": "Published",
                    "processed_at": datetime.utcnow().isoformat(),
                }).execute()
                success += 1
            except Exception as e:
                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": pid,
                    "status": "failed",
                    "message": str(e),
                    "processed_at": datetime.utcnow().isoformat(),
                }).execute()

        supabase.table("jobs").update({
            "status": "completed",
            "processed_items": success,
            "progress_percent": 100,
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job["id"]).execute()

        return {
            "success": True,
            "job_id": job["id"],
            "published": success
        }

    except Exception as e:
        logger.error(f"Bulk publish failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk/unpublish")
async def bulk_unpublish(
    request: BulkUnpublishRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Unpublish products from stores — creates job"""
    try:
        supabase = get_supabase()

        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "unpublish",
            "status": "running",
            "total_items": len(request.product_ids),
            "started_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute().data[0]

        success = 0
        for pid in request.product_ids:
            try:
                supabase.table("products").update({
                    "status": "paused",
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("id", pid).eq("user_id", user_id).execute()

                link_query = supabase.table("product_store_links").select("id").eq("product_id", pid)
                if request.store_ids:
                    link_query = link_query.in_("store_id", request.store_ids)
                links = link_query.execute().data or []

                for link in links:
                    supabase.table("product_store_links").update({
                        "published": False,
                        "sync_status": "outdated",
                        "updated_at": datetime.utcnow().isoformat(),
                    }).eq("id", link["id"]).execute()

                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": pid,
                    "status": "success",
                    "message": "Unpublished",
                    "processed_at": datetime.utcnow().isoformat(),
                }).execute()
                success += 1
            except Exception as e:
                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": pid,
                    "status": "failed",
                    "message": str(e),
                    "processed_at": datetime.utcnow().isoformat(),
                }).execute()

        supabase.table("jobs").update({
            "status": "completed",
            "processed_items": success,
            "progress_percent": 100,
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job["id"]).execute()

        return {
            "success": True,
            "job_id": job["id"],
            "unpublished": success
        }

    except Exception as e:
        logger.error(f"Bulk unpublish failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
