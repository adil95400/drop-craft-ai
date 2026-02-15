"""
Import endpoints — CSV/URL/feed import with async job tracking
Every import creates a job then enqueues Celery for async processing.
Endpoints return HTTP 202 with job_id immediately.
Pre-flight validation ensures fail-fast before enqueue.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict
from datetime import datetime
import logging

from app.core.security import get_current_user_id
from app.core.database import get_supabase
from app.core.quota import require_quota, QuotaGuard
from app.core.validators import validate_import_file, validate_import_url
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
    user_id: str = Depends(get_current_user_id),
    quota: QuotaGuard = Depends(require_quota("imports:csv")),
):
    """Import products from CSV file — validates then enqueues Celery task"""
    try:
        # Pre-flight validation (fail-fast)
        file_meta = await validate_import_file(file)

        content = await file.read()
        is_excel = file_meta.get("is_excel", False)

        # Enqueue Celery task
        result = import_csv_products.delay(
            user_id=user_id,
            file_content=content if is_excel else content.decode("utf-8"),
            filename=file.filename,
            is_excel=is_excel,
        )

        await quota.consume(1)

        return {
            "success": True,
            "job_id": str(result.id),
            "message": f"File {file.filename} queued for import",
            "validation": file_meta,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV import failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/url", status_code=202)
async def import_from_url(
    request: UrlImportRequest,
    user_id: str = Depends(get_current_user_id),
    quota: QuotaGuard = Depends(require_quota("imports:url")),
):
    """Import products from URL (CSV/XML/JSON feed) — validates URL then enqueues"""
    try:
        # Pre-flight: check URL reachability
        url_meta = await validate_import_url(str(request.url), request.format)

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

        await quota.consume(1)

        return {
            "success": True,
            "job_id": str(result.id),
            "message": f"{request.format.upper()} import queued from URL",
            "validation": url_meta,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"URL import failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
