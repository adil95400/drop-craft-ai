"""
Legacy API router for backward compatibility
Maps old endpoints to new v1 API structure
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from typing import Optional, Dict, Any
import logging

from app.core.security import get_current_user_id, verify_supabase_jwt
from app.core.database import get_supabase
from app.queue.tasks import (
    scrape_product_url,
    import_csv_products,
    import_xml_feed,
    sync_supplier_products
)

logger = logging.getLogger(__name__)
router = APIRouter()


# Legacy import endpoints
@router.post("/import/url")
async def legacy_import_url(
    url: str,
    mapping_config: Optional[Dict[str, Any]] = None,
    user_id: str = Depends(get_current_user_id)
):
    """Legacy URL import - redirects to v1 scraping"""
    result = scrape_product_url.delay(
        user_id=user_id,
        url=url,
        extract_variants=True,
        enrich_with_ai=True
    )
    
    return {
        "success": True,
        "message": f"Import from {url} started",
        "job_id": str(result.id)
    }


@router.post("/import/csv")
async def legacy_import_csv(
    file: UploadFile = File(...),
    mapping_config: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """Legacy CSV import"""
    import json
    
    content = await file.read()
    mapping = json.loads(mapping_config) if mapping_config else {}
    
    result = import_csv_products.delay(
        user_id=user_id,
        file_content=content.decode("utf-8"),
        filename=file.filename,
        mapping_config=mapping
    )
    
    return {
        "success": True,
        "message": "CSV import started",
        "job_id": str(result.id)
    }


@router.post("/import/xml")
async def legacy_import_xml(
    url: str,
    mapping_config: Optional[Dict[str, Any]] = None,
    user_id: str = Depends(get_current_user_id)
):
    """Legacy XML import"""
    result = import_xml_feed.delay(
        user_id=user_id,
        feed_url=url,
        mapping_config=mapping_config or {}
    )
    
    return {
        "success": True,
        "message": f"XML import from {url} started",
        "job_id": str(result.id)
    }


# Legacy supplier endpoints
@router.post("/suppliers/bigbuy/sync")
async def legacy_bigbuy_sync(
    api_key: str,
    category_filter: Optional[str] = None,
    limit: int = 100,
    user_id: str = Depends(get_current_user_id)
):
    """Legacy BigBuy sync"""
    result = sync_supplier_products.delay(
        user_id=user_id,
        supplier_id="bigbuy",
        limit=limit,
        category_filter=category_filter
    )
    
    return {
        "success": True,
        "message": "BigBuy catalog sync started",
        "job_id": str(result.id)
    }


# ... keep existing code (legacy data endpoints: products, orders, integrations)
# Legacy data endpoints
@router.get("/products")
async def legacy_get_products(
    category: Optional[str] = None,
    supplier: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id)
):
    """Legacy products endpoint"""
    supabase = get_supabase()
    query = supabase.table('products').select("*").eq('user_id', user_id)
    
    if category:
        query = query.eq('category_id', category)
    if supplier:
        query = query.eq('supplier_id', supplier)
    if status:
        query = query.eq('status', status)
        
    result = query.limit(limit).execute()
    
    return {
        "success": True,
        "products": result.data,
        "count": len(result.data)
    }


@router.get("/orders")
async def legacy_get_orders(
    shop_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id)
):
    """Legacy orders endpoint"""
    supabase = get_supabase()
    query = supabase.table('orders').select("*").eq('user_id', user_id)
    
    if shop_id:
        query = query.eq('shop_id', shop_id)
    if status:
        query = query.eq('status', status)
        
    result = query.limit(limit).execute()
    
    return {
        "success": True,
        "orders": result.data,
        "count": len(result.data)
    }


@router.get("/integrations")
async def legacy_get_integrations(
    user_id: str = Depends(get_current_user_id)
):
    """Legacy integrations endpoint"""
    supabase = get_supabase()
    result = supabase.table('shops').select("*").eq('user_id', user_id).execute()
    
    return {
        "success": True,
        "integrations": result.data,
        "count": len(result.data)
    }
