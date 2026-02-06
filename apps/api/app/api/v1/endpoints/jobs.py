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
    """Retry a failed job — creates a new job copying original parameters"""
    try:
        supabase = get_supabase()

        result = supabase.table("jobs").select("*").eq("id", job_id).eq("user_id", user_id).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")

        original = result.data
        if original["status"] != "failed":
            raise HTTPException(status_code=400, detail="Only failed jobs can be retried")

        # Create new job
        new_job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": original["job_type"],
            "status": "pending",
            "total_items": original.get("total_items", 0),
            "metadata": {**(original.get("metadata") or {}), "retry_of": job_id},
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute().data[0]

        # TODO: Re-queue the Celery task based on job_type + metadata

        return {
            "success": True,
            "message": "Job retry created",
            "new_job_id": new_job["id"],
            "original_job_id": job_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retry job: {e}")
        raise HTTPException(status_code=500, detail=str(e))
