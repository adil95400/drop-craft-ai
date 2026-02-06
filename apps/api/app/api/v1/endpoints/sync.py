"""
Sync endpoints — multi-store synchronization via jobs/job_items
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


class BulkSyncRequest(BaseModel):
    product_ids: List[str] = []  # empty = all products with store links
    store_ids: List[str] = []  # empty = all stores


class BulkPublishRequest(BaseModel):
    product_ids: List[str]
    store_ids: List[str] = []  # empty = all linked stores


class BulkUnpublishRequest(BaseModel):
    product_ids: List[str]
    store_ids: List[str] = []


# === SYNC ===

@router.post("/bulk/sync")
async def bulk_sync(
    request: BulkSyncRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Sync products with external stores — creates job with per-product tracking"""
    try:
        supabase = get_supabase()

        # Get store links to sync
        query = supabase.table("product_store_links").select(
            "*, products!inner(id, title, user_id), stores!inner(id, name, platform)"
        )
        
        if request.product_ids:
            query = query.in_("product_id", request.product_ids)
        if request.store_ids:
            query = query.in_("store_id", request.store_ids)
        
        # Filter by user via products
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
            },
            "started_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute().data[0]

        success = 0
        failed = 0

        for link in links:
            try:
                # TODO: Actual sync via platform API (Shopify, WooCommerce, etc.)
                # For now, update sync status
                supabase.table("product_store_links").update({
                    "sync_status": "synced",
                    "last_sync_at": datetime.utcnow().isoformat(),
                    "last_error": None,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("id", link["id"]).execute()

                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": link["product_id"],
                    "status": "success",
                    "message": f"Synced with {link.get('stores', {}).get('name', 'store')}",
                    "processed_at": datetime.utcnow().isoformat(),
                }).execute()
                success += 1

            except Exception as e:
                supabase.table("product_store_links").update({
                    "sync_status": "error",
                    "last_error": str(e),
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("id", link["id"]).execute()

                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": link["product_id"],
                    "status": "failed",
                    "message": str(e),
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
        }).eq("id", job["id"]).execute()

        return {
            "success": True,
            "job_id": job["id"],
            "results": {"synced": success, "failed": failed}
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk sync failed: {e}")
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
