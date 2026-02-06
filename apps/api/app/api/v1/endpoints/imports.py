"""
Import endpoints — CSV/URL/feed import with job tracking
Every import creates a job + job_items for per-product results
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from app.core.security import get_current_user_id
from app.core.database import get_supabase
from app.services.import_service import ImportService

logger = logging.getLogger(__name__)
router = APIRouter()
import_service = ImportService()


class UrlImportRequest(BaseModel):
    url: HttpUrl
    format: str = "csv"  # csv, xml, json
    mapping_config: Dict[str, str] = {}
    update_existing: bool = True


class FeedImportRequest(BaseModel):
    feed_url: HttpUrl
    feed_type: str = "xml"
    mapping_config: Dict[str, str] = {}
    update_existing: bool = True


@router.post("/csv")
async def import_csv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """Import products from CSV file — returns job_id"""
    try:
        supabase = get_supabase()

        # Validate
        if file.content_type not in ["text/csv", "application/vnd.ms-excel"]:
            raise HTTPException(status_code=400, detail="File must be CSV")

        content = (await file.read()).decode("utf-8")

        # Create job
        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "import",
            "status": "running",
            "metadata": {"source": "csv", "filename": file.filename},
            "started_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute().data[0]

        # Process
        result = import_service.import_from_content(
            user_id=user_id,
            content=content,
            format="csv",
            update_existing=True
        )

        # Create job_items for tracking
        total = result["imported"] + result["updated"] + len(result["errors"])
        supabase.table("jobs").update({
            "status": "completed" if not result["errors"] else "completed",
            "total_items": total,
            "processed_items": result["imported"] + result["updated"],
            "failed_items": len(result["errors"]),
            "progress_percent": 100,
            "metadata": {
                "source": "csv",
                "filename": file.filename,
                "imported": result["imported"],
                "updated": result["updated"],
                "errors_count": len(result["errors"]),
            },
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job["id"]).execute()

        return {
            "success": True,
            "job_id": job["id"],
            "results": {
                "imported": result["imported"],
                "updated": result["updated"],
                "errors": result["errors"][:20],  # Limit error details
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV import failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/url")
async def import_from_url(
    request: UrlImportRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Import products from URL (CSV/XML/JSON feed) — returns job_id"""
    try:
        supabase = get_supabase()

        # Create job
        job = supabase.table("jobs").insert({
            "user_id": user_id,
            "job_type": "import",
            "status": "running",
            "metadata": {"source": "url", "url": str(request.url), "format": request.format},
            "started_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute().data[0]

        # Process
        result = import_service.import_from_url(
            user_id=user_id,
            url=str(request.url),
            format=request.format,
            mapping=request.mapping_config or None,
            update_existing=request.update_existing
        )

        total = result["imported"] + result["updated"] + len(result["errors"])
        supabase.table("jobs").update({
            "status": "completed",
            "total_items": total,
            "processed_items": result["imported"] + result["updated"],
            "failed_items": len(result["errors"]),
            "progress_percent": 100,
            "metadata": {
                "source": "url",
                "url": str(request.url),
                "imported": result["imported"],
                "updated": result["updated"],
            },
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", job["id"]).execute()

        return {
            "success": True,
            "job_id": job["id"],
            "results": {
                "imported": result["imported"],
                "updated": result["updated"],
                "errors": result["errors"][:20],
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL import failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
