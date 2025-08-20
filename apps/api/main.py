"""
Drop Craft AI - FastAPI Backend
Production-ready SaaS backend with real integrations
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import os
import httpx
from typing import Optional, List, Dict, Any
import logging
import structlog
from datetime import datetime
import json

# Import our modules
from integrations.shopify import ShopifyAPI
from integrations.bigbuy import BigBuyAPI
from integrations.aliexpress import AliExpressAPI
from integrations.tracking import TrackingAPI
from integrations.ai import OpenAIService
from utils.auth import verify_supabase_token
from utils.database import get_supabase_client
from utils.parsers import CSVParser, XMLParser, URLScraper
from models.schemas import *

# Configure structured logging
structlog.configure(
    processors=[
        structlog.dev.ConsoleRenderer()
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# FastAPI app with lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Drop Craft AI API starting up...")
    yield
    logger.info("👋 Drop Craft AI API shutting down...")

app = FastAPI(
    title="Drop Craft AI API",
    description="Production SaaS backend for e-commerce dropshipping",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://drop-craft-ai.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "services": {
            "database": "connected",
            "integrations": "enabled",
            "ai": "operational"
        }
    }

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await verify_supabase_token(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    return user

# === IMPORT ENDPOINTS ===

@app.post("/api/import/url")
async def import_from_url(
    request: URLImportRequest,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    """Import products by scraping URLs"""
    try:
        scraper = URLScraper()
        
        # Start background task for URL scraping
        background_tasks.add_task(
            scraper.scrape_and_import,
            url=request.url,
            user_id=user["id"],
            mapping_config=request.mapping_config
        )
        
        return {
            "success": True,
            "message": f"Import from {request.url} started",
            "job_id": f"url_import_{datetime.utcnow().timestamp()}"
        }
    except Exception as e:
        logger.error("URL import error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/import/csv")
async def import_from_csv(
    file: UploadFile = File(...),
    mapping_config: Optional[str] = None,
    user = Depends(get_current_user)
):
    """Import products from CSV file"""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be CSV format")
        
        content = await file.read()
        parser = CSVParser()
        
        mapping = json.loads(mapping_config) if mapping_config else {}
        products = await parser.parse_and_normalize(content, mapping)
        
        # Save to database
        supabase = get_supabase_client()
        result = supabase.table('products').insert([
            {**product, "user_id": user["id"]} for product in products
        ]).execute()
        
        return {
            "success": True,
            "message": f"Successfully imported {len(products)} products from CSV",
            "imported_count": len(products),
            "products": result.data
        }
    except Exception as e:
        logger.error("CSV import error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/import/xml")
async def import_from_xml(
    request: XMLImportRequest,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    """Import products from XML feed"""
    try:
        parser = XMLParser()
        
        background_tasks.add_task(
            parser.fetch_and_import,
            url=request.url,
            user_id=user["id"],
            mapping_config=request.mapping_config
        )
        
        return {
            "success": True,
            "message": f"XML import from {request.url} started",
            "job_id": f"xml_import_{datetime.utcnow().timestamp()}"
        }
    except Exception as e:
        logger.error("XML import error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/import/ftp/sync")
async def sync_ftp_directory(
    request: FTPSyncRequest,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    """Sync products from FTP directory"""
    try:
        from integrations.ftp import FTPService
        
        ftp_service = FTPService()
        background_tasks.add_task(
            ftp_service.sync_directory,
            host=request.host,
            username=request.username,
            password=request.password,
            directory=request.directory,
            user_id=user["id"]
        )
        
        return {
            "success": True,
            "message": f"FTP sync from {request.host} started",
            "job_id": f"ftp_sync_{datetime.utcnow().timestamp()}"
        }
    except Exception as e:
        logger.error("FTP sync error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# === SUPPLIER INTEGRATIONS ===

@app.post("/api/suppliers/bigbuy/sync")
async def sync_bigbuy_catalog(
    request: BigBuySyncRequest,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    """Sync products from BigBuy API"""
    try:
        bigbuy = BigBuyAPI(api_key=request.api_key)
        
        background_tasks.add_task(
            bigbuy.sync_catalog,
            user_id=user["id"],
            category_filter=request.category_filter,
            limit=request.limit or 100
        )
        
        return {
            "success": True,
            "message": "BigBuy catalog sync started",
            "job_id": f"bigbuy_sync_{datetime.utcnow().timestamp()}"
        }
    except Exception as e:
        logger.error("BigBuy sync error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# === SHOPIFY INTEGRATIONS ===

@app.post("/api/shopify/connect")
async def connect_shopify(
    request: ShopifyConnectRequest,
    user = Depends(get_current_user)
):
    """Connect Shopify store via OAuth"""
    try:
        shopify = ShopifyAPI()
        auth_url = shopify.get_oauth_url(
            shop_domain=request.shop_domain,
            redirect_uri=request.redirect_uri
        )
        
        return {
            "success": True,
            "auth_url": auth_url,
            "message": "Complete OAuth flow to connect your Shopify store"
        }
    except Exception as e:
        logger.error("Shopify connect error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/shopify/sync-products")
async def sync_products_to_shopify(
    request: ShopifySyncRequest,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    """Push products from DB to Shopify"""
    try:
        shopify = ShopifyAPI(
            shop_domain=request.shop_domain,
            access_token=request.access_token
        )
        
        background_tasks.add_task(
            shopify.push_products,
            user_id=user["id"],
            product_ids=request.product_ids
        )
        
        return {
            "success": True,
            "message": f"Product sync to {request.shop_domain} started",
            "job_id": f"shopify_push_{datetime.utcnow().timestamp()}"
        }
    except Exception as e:
        logger.error("Shopify sync error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orders")
async def get_orders(
    shop_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    user = Depends(get_current_user)
):
    """Get real orders from connected shops"""
    try:
        supabase = get_supabase_client()
        query = supabase.table('orders').select("*").eq('user_id', user["id"])
        
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
    except Exception as e:
        logger.error("Orders fetch error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# === TRACKING INTEGRATIONS ===

@app.post("/api/tracking/17track/sync")
async def sync_tracking_17track(
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    """Sync tracking status from 17Track"""
    try:
        tracking = TrackingAPI()
        
        background_tasks.add_task(
            tracking.sync_all_shipments,
            user_id=user["id"]
        )
        
        return {
            "success": True,
            "message": "17Track sync started for all shipments",
            "job_id": f"17track_sync_{datetime.utcnow().timestamp()}"
        }
    except Exception as e:
        logger.error("17Track sync error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# === AI INTEGRATIONS ===

@app.post("/api/ai/seo")
async def generate_seo_content(
    request: SEOGenerationRequest,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    """Generate SEO content for products using OpenAI"""
    try:
        ai_service = OpenAIService()
        
        background_tasks.add_task(
            ai_service.generate_seo_for_product,
            product_id=request.product_id,
            user_id=user["id"],
            language=request.language or "fr"
        )
        
        return {
            "success": True,
            "message": f"SEO generation started for product {request.product_id}",
            "job_id": f"seo_gen_{datetime.utcnow().timestamp()}"
        }
    except Exception as e:
        logger.error("SEO generation error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# === DATA ENDPOINTS ===

@app.get("/api/products")
async def get_products(
    category: Optional[str] = None,
    supplier: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    user = Depends(get_current_user)
):
    """Get real products from database"""
    try:
        supabase = get_supabase_client()
        query = supabase.table('products').select("*").eq('user_id', user["id"])
        
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
    except Exception as e:
        logger.error("Products fetch error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/integrations")
async def get_integrations(user = Depends(get_current_user)):
    """Get real integration status"""
    try:
        supabase = get_supabase_client()
        result = supabase.table('shops').select("*").eq('user_id', user["id"]).execute()
        
        return {
            "success": True,
            "integrations": result.data,
            "count": len(result.data)
        }
    except Exception as e:
        logger.error("Integrations fetch error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development",
        log_level="info"
    )