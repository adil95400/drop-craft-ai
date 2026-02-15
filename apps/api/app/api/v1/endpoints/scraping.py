"""
Web scraping and product import endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
import logging

from app.core.security import get_current_user_id
from app.queue.tasks import (
    scrape_product_url,
    scrape_store_catalog,
    import_csv_products,
    import_xml_feed
)

logger = logging.getLogger(__name__)
router = APIRouter()


class UrlScrapeRequest(BaseModel):
    url: HttpUrl
    extract_variants: bool = True
    extract_reviews: bool = False
    enrich_with_ai: bool = True


class StoreScrapeRequest(BaseModel):
    store_url: HttpUrl
    max_products: int = 100
    category_filter: Optional[str] = None


class FeedImportRequest(BaseModel):
    feed_url: HttpUrl
    feed_type: str = "xml"  # xml, csv, json
    mapping_config: Dict[str, str] = {}
    update_existing: bool = True


@router.post("/url")
async def scrape_url(
    request: UrlScrapeRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Scrape a single product URL"""
    try:
        result = scrape_product_url.delay(
            user_id=user_id,
            url=str(request.url),
            extract_variants=request.extract_variants,
            extract_reviews=request.extract_reviews,
            enrich_with_ai=request.enrich_with_ai
        )
        
        return {
            "success": True,
            "message": "Scraping job queued",
            "job_id": str(result.id)
        }
        
    except Exception as e:
        logger.error(f"URL scrape failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/store")
async def scrape_store(
    request: StoreScrapeRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Scrape an entire store catalog"""
    try:
        result = scrape_store_catalog.delay(
            user_id=user_id,
            store_url=str(request.store_url),
            max_products=request.max_products,
            category_filter=request.category_filter
        )
        
        return {
            "success": True,
            "message": "Store scraping job queued",
            "job_id": str(result.id)
        }
        
    except Exception as e:
        logger.error(f"Store scrape failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feed")
async def import_feed(
    request: FeedImportRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Import products from XML/CSV feed"""
    try:
        if request.feed_type == "xml":
            result = import_xml_feed.delay(
                user_id=user_id,
                feed_url=str(request.feed_url),
                mapping_config=request.mapping_config,
                update_existing=request.update_existing
            )
        elif request.feed_type == "csv":
            result = import_csv_products.delay(
                user_id=user_id,
                feed_url=str(request.feed_url),
                mapping_config=request.mapping_config,
                update_existing=request.update_existing
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported feed type: {request.feed_type}"
            )
        
        return {
            "success": True,
            "message": f"{request.feed_type.upper()} feed import job queued",
            "job_id": str(result.id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Feed import failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_file_import(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """Upload and import a file (CSV/XML/Excel)"""
    try:
        # Validate file type
        allowed_types = ["text/csv", "application/xml", "text/xml", 
                         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}"
            )
        
        # Read file content
        content = await file.read()
        
        # Determine file type and queue appropriate job
        if "csv" in file.content_type:
            result = import_csv_products.delay(
                user_id=user_id,
                file_content=content.decode("utf-8"),
                filename=file.filename
            )
        elif "xml" in file.content_type:
            result = import_xml_feed.delay(
                user_id=user_id,
                file_content=content.decode("utf-8"),
                filename=file.filename
            )
        else:
            # Excel handling
            result = import_csv_products.delay(
                user_id=user_id,
                file_content=content,
                filename=file.filename,
                is_excel=True
            )
        
        return {
            "success": True,
            "message": f"File {file.filename} queued for import",
            "job_id": str(result.id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
