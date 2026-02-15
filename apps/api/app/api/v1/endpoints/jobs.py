"""
Jobs & Job Items endpoints — unified job tracking system
Every action (sync, import, pricing, AI) creates a job with per-product results
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime
import logging

from app.core.security import get_current_user_id
from app.core.database import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def list_jobs(
    user_id: str = Depends(get_current_user_id),
    status: Optional[str] = None,
    job_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List jobs with filtering and pagination"""
    try:
        supabase = get_supabase()

        query = supabase.table("jobs").select("*", count="exact").eq("user_id", user_id)

        if status:
            query = query.eq("status", status)
        if job_type:
            query = query.eq("job_type", job_type)

        query = query.order("created_at", desc=True)
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)

        result = query.execute()
        total = result.count if result.count is not None else len(result.data)

        return {
            "success": True,
            "jobs": result.data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit
            }
        }

    except Exception as e:
        logger.error(f"Failed to list jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_job_stats(
    user_id: str = Depends(get_current_user_id)
):
    """Job statistics summary"""
    try:
        supabase = get_supabase()

        result = supabase.table("jobs").select("status, job_type").eq("user_id", user_id).execute()
        jobs = result.data or []

        by_status = {}
        by_type = {}
        for j in jobs:
            s = j.get("status", "unknown")
            t = j.get("job_type", "unknown")
            by_status[s] = by_status.get(s, 0) + 1
            by_type[t] = by_type.get(t, 0) + 1

        return {
            "success": True,
            "stats": {
                "total": len(jobs),
                "by_status": by_status,
                "by_type": by_type,
            }
        }

    except Exception as e:
        logger.error(f"Failed to get job stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}")
async def get_job(
    job_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get job details"""
    try:
        supabase = get_supabase()

        result = supabase.table("jobs").select("*").eq("id", job_id).eq("user_id", user_id).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")

        return {"success": True, "job": result.data}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}/items")
async def get_job_items(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    """Get per-product results for a job"""
    try:
        supabase = get_supabase()

        # Verify job ownership
        job = supabase.table("jobs").select("id").eq("id", job_id).eq("user_id", user_id).single().execute()
        if not job.data:
            raise HTTPException(status_code=404, detail="Job not found")

        query = supabase.table("job_items").select("*, products(title, sku, image_url)", count="exact").eq("job_id", job_id)

        if status:
            query = query.eq("status", status)

        query = query.order("created_at", desc=False)
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)

        result = query.execute()
        total = result.count if result.count is not None else len(result.data)

        return {
            "success": True,
            "items": result.data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job items: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Cancel a pending/running job"""
    try:
        supabase = get_supabase()

        result = supabase.table("jobs").select("status").eq("id", job_id).eq("user_id", user_id).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")

        if result.data["status"] not in ["pending", "running"]:
            raise HTTPException(status_code=400, detail="Job cannot be cancelled in current state")

        supabase.table("jobs").update({
            "status": "cancelled",
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job_id).execute()

        return {"success": True, "message": "Job cancelled"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{job_id}/retry")
async def retry_job(
    job_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Retry a failed job — re-enqueues the original Celery task"""
    try:
        supabase = get_supabase()

        result = supabase.table("jobs").select("*").eq("id", job_id).eq("user_id", user_id).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")

        original = result.data
        if original["status"] not in ("failed", "cancelled"):
            raise HTTPException(status_code=400, detail="Only failed/cancelled jobs can be retried")

        # Re-enqueue based on job_type
        new_job_id = _reenqueue_task(original, user_id)

        return {
            "success": True,
            "message": "Job retry enqueued",
            "new_job_id": new_job_id,
            "original_job_id": job_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retry job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{job_id}/resume")
async def resume_job(
    job_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Resume a paused/cancelled job — replays only failed/pending items"""
    try:
        supabase = get_supabase()

        job = supabase.table("jobs").select("*").eq("id", job_id).eq("user_id", user_id).single().execute()
        if not job.data:
            raise HTTPException(status_code=404, detail="Job not found")

        original = job.data
        if original["status"] not in ("cancelled", "paused", "failed"):
            raise HTTPException(status_code=400, detail="Job cannot be resumed in current state")

        # Count failed items
        failed_items = supabase.table("job_items").select("id", count="exact")\
            .eq("job_id", job_id).eq("status", "error").execute()
        failed_count = failed_items.count or 0

        if failed_count == 0:
            return {"success": True, "message": "No failed items to resume", "resumed": 0}

        # Create a new child job referencing the original
        new_job_id = _reenqueue_task(original, user_id, metadata_extra={"resumed_from": job_id, "items_to_retry": failed_count})

        return {
            "success": True,
            "message": f"Resumed {failed_count} failed items",
            "new_job_id": new_job_id,
            "resumed": failed_count
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to resume job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{job_id}/enrich")
async def enrich_job_products(
    job_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Trigger AI enrichment on successfully imported products from a completed job"""
    try:
        supabase = get_supabase()

        job = supabase.table("jobs").select("*").eq("id", job_id).eq("user_id", user_id).single().execute()
        if not job.data:
            raise HTTPException(status_code=404, detail="Job not found")

        if job.data["status"] != "completed":
            raise HTTPException(status_code=400, detail="Only completed jobs can be enriched")

        # Get successful items with product IDs
        items = supabase.table("job_items").select("product_id")\
            .eq("job_id", job_id).eq("status", "success")\
            .not_.is_("product_id", "null")\
            .limit(500).execute()

        product_ids = [i["product_id"] for i in (items.data or []) if i.get("product_id")]

        if not product_ids:
            return {"success": True, "message": "No products to enrich", "count": 0}

        from app.queue.tasks import bulk_ai_enrichment
        result = bulk_ai_enrichment.delay(
            user_id=user_id,
            filter_criteria={"id": product_ids},
            enrichment_types=["description", "seo", "alt_text"],
            limit=len(product_ids)
        )

        return {
            "success": True,
            "message": f"AI enrichment started for {len(product_ids)} products",
            "enrich_job_id": str(result.id),
            "product_count": len(product_ids)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to enrich job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _reenqueue_task(original: dict, user_id: str, metadata_extra: dict = None) -> str:
    """Re-enqueue a Celery task based on the original job's type and input_data."""
    from app.queue.tasks import (
        import_csv_products, import_xml_feed,
        sync_supplier_products, scrape_product_url, scrape_store_catalog,
        bulk_ai_enrichment
    )

    job_type = original.get("job_type", "")
    job_subtype = original.get("job_subtype", "")
    input_data = original.get("input_data") or {}

    task_map = {
        ("import", "csv"): lambda: import_csv_products.delay(
            user_id=user_id,
            feed_url=input_data.get("feed_url"),
            filename=input_data.get("filename"),
        ),
        ("import", "excel"): lambda: import_csv_products.delay(
            user_id=user_id,
            feed_url=input_data.get("feed_url"),
            filename=input_data.get("filename"),
            is_excel=True,
        ),
        ("import", "xml"): lambda: import_xml_feed.delay(
            user_id=user_id,
            feed_url=input_data.get("feed_url"),
            filename=input_data.get("filename"),
        ),
        ("sync", ""): lambda: sync_supplier_products.delay(
            user_id=user_id,
            supplier_id=input_data.get("supplier_id", ""),
            sync_type=input_data.get("sync_type", "products"),
        ),
        ("scraping", "url"): lambda: scrape_product_url.delay(
            user_id=user_id,
            url=input_data.get("url", ""),
        ),
        ("scraping", "store"): lambda: scrape_store_catalog.delay(
            user_id=user_id,
            store_url=input_data.get("store_url", ""),
            max_products=input_data.get("max_products", 100),
        ),
    }

    key = (job_type, job_subtype)
    dispatcher = task_map.get(key) or task_map.get((job_type, ""))

    if not dispatcher:
        raise HTTPException(status_code=400, detail=f"Cannot retry job type: {job_type}/{job_subtype}")

    celery_result = dispatcher()
    return str(celery_result.id)
