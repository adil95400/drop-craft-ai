"""
Import endpoints — CSV/URL/feed import with async job tracking
Every import creates a job then enqueues Celery for async processing.
Endpoints return HTTP 202 with job_id immediately.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict
from datetime import datetime
import logging

from app.core.security import get_current_user_id
from app.core.database import get_supabase
from app.queue.tasks import import_csv_products, import_xml_feed

logger = logging.getLogger(__name__)
router = APIRouter()


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


@router.post("/csv", status_code=202)
async def import_csv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """Import products from CSV file — enqueues Celery task, returns job_id"""
    try:
        if file.content_type not in ["text/csv", "application/vnd.ms-excel",
                                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]:
            raise HTTPException(status_code=400, detail="File must be CSV or Excel")

        content = await file.read()
        is_excel = "spreadsheet" in (file.content_type or "")

        # Enqueue Celery task — it creates/updates the job record itself
        result = import_csv_products.delay(
            user_id=user_id,
            file_content=content if is_excel else content.decode("utf-8"),
            filename=file.filename,
            is_excel=is_excel,
        )

        return {
            "success": True,
            "job_id": str(result.id),
            "message": f"File {file.filename} queued for import",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV import failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/url", status_code=202)
async def import_from_url(
    request: UrlImportRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Import products from URL (CSV/XML/JSON feed) — enqueues Celery task"""
    try:
        if request.format in ("xml",):
            result = import_xml_feed.delay(
                user_id=user_id,
                feed_url=str(request.url),
                mapping_config=request.mapping_config,
                update_existing=request.update_existing,
            )
        else:
            result = import_csv_products.delay(
                user_id=user_id,
                feed_url=str(request.url),
                mapping_config=request.mapping_config,
                update_existing=request.update_existing,
            )

        return {
            "success": True,
            "job_id": str(result.id),
            "message": f"{request.format.upper()} import queued from URL",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL import failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
