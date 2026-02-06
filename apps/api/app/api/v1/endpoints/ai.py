"""
AI services endpoints — content generation, SEO, enrichment
All actions create jobs with job_items for per-product tracking
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from app.core.security import get_current_user_id
from app.core.database import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()


class EnrichRequest(BaseModel):
    product_ids: List[str]
    enrichment_types: List[str] = ["title", "description"]  # title, description, seo, tags
    language: str = "fr"
    tone: str = "professional"


class ContentGenerationRequest(BaseModel):
    product_id: str
    content_types: List[str] = ["title", "description"]
    language: str = "fr"
    tone: str = "professional"


@router.post("/enrich")
async def enrich_products(
    request: EnrichRequest,
    user_id: str = Depends(get_current_user_id)
):
    """AI enrichment for products — creates a job with per-product results"""
    try:
        supabase = get_supabase()

        # Create job
        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "ai_enrich",
            "status": "running",
            "total_items": len(request.product_ids),
            "metadata": {
                "enrichment_types": request.enrichment_types,
                "language": request.language,
                "tone": request.tone,
            },
            "started_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute().data[0]

        success = 0
        failed = 0

        for pid in request.product_ids:
            try:
                # Fetch product
                product = supabase.table("products").select("*").eq("id", pid).eq("user_id", user_id).single().execute()
                if not product.data:
                    raise ValueError("Product not found")

                p = product.data
                before_state = {
                    "title": p.get("title"),
                    "description": p.get("description"),
                }

                # TODO: Call AI service (Lovable AI Gateway) for real enrichment
                # For now, create job_items tracking the intent
                after_state = {**before_state}  # Placeholder — AI worker will fill this

                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": pid,
                    "status": "pending",  # Will be processed by Celery worker
                    "message": f"Queued for AI enrichment: {', '.join(request.enrichment_types)}",
                    "before_state": before_state,
                    "created_at": datetime.utcnow().isoformat(),
                }).execute()
                success += 1

            except Exception as e:
                supabase.table("job_items").insert({
                    "job_id": job["id"],
                    "product_id": pid,
                    "status": "failed",
                    "message": str(e),
                    "error_code": "ENRICH_FAILED",
                    "processed_at": datetime.utcnow().isoformat(),
                }).execute()
                failed += 1

        # Update job — if using Celery, status stays "running" until worker completes
        final_status = "pending" if success > 0 else "failed"
        supabase.table("jobs").update({
            "status": final_status,
            "processed_items": failed,  # Only failures processed synchronously
            "failed_items": failed,
            "progress_percent": round((failed / len(request.product_ids)) * 100, 2) if failed else 0,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job["id"]).execute()

        return {
            "success": True,
            "job_id": job["id"],
            "message": f"{success} products queued for AI enrichment, {failed} failed",
            "results": {"queued": success, "failed": failed}
        }

    except Exception as e:
        logger.error(f"AI enrichment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-content")
async def generate_content(
    request: ContentGenerationRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Generate AI content for a single product — creates a job"""
    try:
        supabase = get_supabase()

        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "ai_enrich",
            "status": "pending",
            "total_items": 1,
            "metadata": {
                "product_id": request.product_id,
                "content_types": request.content_types,
                "language": request.language,
                "tone": request.tone,
            },
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute().data[0]

        supabase.table("job_items").insert({
            "job_id": job["id"],
            "product_id": request.product_id,
            "status": "pending",
            "message": f"Content generation queued: {', '.join(request.content_types)}",
            "created_at": datetime.utcnow().isoformat(),
        }).execute()

        # TODO: Queue Celery task

        return {
            "success": True,
            "job_id": job["id"],
            "message": "Content generation job created"
        }

    except Exception as e:
        logger.error(f"Content generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usage")
async def get_ai_usage(
    user_id: str = Depends(get_current_user_id)
):
    """Get AI usage statistics from jobs"""
    try:
        supabase = get_supabase()

        result = supabase.table("jobs").select("status, total_items, processed_items").eq("user_id", user_id).eq("job_type", "ai_enrich").execute()

        jobs = result.data or []
        total_jobs = len(jobs)
        total_products = sum(j.get("total_items") or 0 for j in jobs)
        completed = sum(1 for j in jobs if j.get("status") == "completed")

        return {
            "success": True,
            "usage": {
                "total_jobs": total_jobs,
                "completed_jobs": completed,
                "total_products_enriched": total_products,
                "quota_remaining": max(0, 1000 - total_products),
            }
        }

    except Exception as e:
        logger.error(f"Failed to get AI usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))
