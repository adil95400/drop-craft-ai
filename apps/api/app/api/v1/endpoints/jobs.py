"""
Background jobs management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
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
    limit: int = Query(50, ge=1, le=100)
):
    """List background jobs"""
    try:
        supabase = get_supabase()
        
        query = supabase.table("background_jobs")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(limit)
        
        if status:
            query = query.eq("status", status)
        if job_type:
            query = query.eq("job_type", job_type)
        
        result = query.execute()
        
        return {
            "success": True,
            "jobs": result.data
        }
        
    except Exception as e:
        logger.error(f"Failed to list jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}")
async def get_job(
    job_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get job details"""
    try:
        supabase = get_supabase()
        
        result = supabase.table("background_jobs")\
            .select("*")\
            .eq("id", job_id)\
            .eq("user_id", user_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "success": True,
            "job": result.data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Cancel a running job"""
    try:
        supabase = get_supabase()
        
        # Check job exists and belongs to user
        result = supabase.table("background_jobs")\
            .select("status")\
            .eq("id", job_id)\
            .eq("user_id", user_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if result.data["status"] not in ["pending", "running"]:
            raise HTTPException(
                status_code=400,
                detail="Job cannot be cancelled in current state"
            )
        
        # Update status to cancelled
        supabase.table("background_jobs")\
            .update({"status": "cancelled"})\
            .eq("id", job_id)\
            .execute()
        
        # TODO: Also revoke Celery task
        
        return {
            "success": True,
            "message": "Job cancelled"
        }
        
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
    """Retry a failed job"""
    try:
        supabase = get_supabase()
        
        # Fetch original job
        result = supabase.table("background_jobs")\
            .select("*")\
            .eq("id", job_id)\
            .eq("user_id", user_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = result.data
        
        if job["status"] != "failed":
            raise HTTPException(
                status_code=400,
                detail="Only failed jobs can be retried"
            )
        
        # TODO: Re-queue the task based on job_type
        
        return {
            "success": True,
            "message": "Job retry queued",
            "new_job_id": "placeholder"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retry job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary")
async def get_job_stats(
    user_id: str = Depends(get_current_user_id)
):
    """Get job statistics summary"""
    try:
        supabase = get_supabase()
        
        # Fetch job counts by status
        result = supabase.table("background_jobs")\
            .select("status")\
            .eq("user_id", user_id)\
            .execute()
        
        stats = {
            "total": len(result.data),
            "pending": 0,
            "running": 0,
            "completed": 0,
            "failed": 0,
            "cancelled": 0
        }
        
        for job in result.data:
            status = job.get("status", "unknown")
            if status in stats:
                stats[status] += 1
        
        return {
            "success": True,
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Failed to get job stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
