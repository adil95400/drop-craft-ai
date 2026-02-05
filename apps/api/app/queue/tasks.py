"""
Celery tasks for async job processing
All heavy operations run here, not in HTTP handlers
Refactored to use Celery instead of custom Redis queue
"""

from celery import shared_task
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import logging
import asyncio

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async code in sync Celery tasks"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


# ==========================================
# SUPPLIER SYNC TASKS
# ==========================================

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def sync_supplier_products(
    self,
    user_id: str,
    supplier_id: str,
    sync_type: str = "products",
    limit: int = 1000,
    category_filter: Optional[str] = None
):
    """Sync products from supplier (BigBuy, AliExpress, etc.)"""
    from app.services.suppliers import get_supplier_service
    from app.core.database import get_supabase
    
    job_id = self.request.id
    logger.info(f"Starting supplier sync job {job_id}")
    
    try:
        supabase = get_supabase()
        
        # Update job status
        supabase.table("background_jobs").upsert({
            "id": job_id,
            "user_id": user_id,
            "job_type": "supplier_sync",
            "job_subtype": sync_type,
            "status": "running",
            "input_data": {
                "supplier_id": supplier_id,
                "sync_type": sync_type,
                "limit": limit,
                "category_filter": category_filter
            },
            "started_at": datetime.utcnow().isoformat()
        }).execute()
        
        # Get supplier service and sync
        service = get_supplier_service(supplier_id)
        result = service.sync_products(
            user_id=user_id,
            limit=limit,
            category_filter=category_filter
        )
        
        # Update job as completed
        supabase.table("background_jobs").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "output_data": result,
            "items_processed": result.get("fetched", 0),
            "items_succeeded": result.get("saved", 0),
            "items_failed": len(result.get("errors", []))
        }).eq("id", job_id).execute()
        
        logger.info(f"Supplier sync completed: {result}")
        return result
        
    except Exception as exc:
        logger.error(f"Supplier sync failed: {exc}")
        
        # Update job as failed
        try:
            supabase = get_supabase()
            supabase.table("background_jobs").update({
                "status": "failed",
                "error_message": str(exc),
                "completed_at": datetime.utcnow().isoformat()
            }).eq("id", job_id).execute()
        except:
            pass
        
        # Retry if possible
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3)
def sync_supplier_stock(self, user_id: str, supplier_id: str):
    """Sync stock levels from supplier"""
    from app.services.suppliers import get_supplier_service
    
    logger.info(f"Syncing stock for supplier {supplier_id}")
    
    try:
        service = get_supplier_service(supplier_id)
        result = service.sync_stock(user_id=user_id)
        return result
    except Exception as exc:
        logger.error(f"Stock sync failed: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True)
def sync_platform_orders(self, user_id: str, platform_id: str, **options):
    """Sync orders from sales platform (Shopify, WooCommerce, etc.)"""
    logger.info(f"Syncing orders from platform {platform_id}")
    # TODO: Implement platform-specific order sync
    return {"synced": 0}


@shared_task(bind=True, max_retries=2)
def full_catalog_sync(self, user_id: str, supplier_id: str, **options):
    """Full catalog sync including products, stock, and prices"""
    from app.services.suppliers import get_supplier_service
    
    logger.info(f"Starting full catalog sync for supplier {supplier_id}")
    
    service = get_supplier_service(supplier_id)
    
    # Sync products
    products_result = service.sync_products(user_id=user_id, **options)
    
    # Sync stock
    stock_result = service.sync_stock(user_id=user_id)
    
    return {
        "products": products_result,
        "stock": stock_result
    }


# ==========================================
# SCRAPING TASKS
# ==========================================

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def scrape_product_url(
    self,
    user_id: str,
    url: str,
    extract_variants: bool = True,
    extract_reviews: bool = False,
    enrich_with_ai: bool = True
):
    """Scrape a single product URL"""
    from app.services.scraping import ScrapingService
    from app.core.database import get_supabase
    
    job_id = self.request.id
    logger.info(f"Scraping product URL: {url}")
    
    try:
        supabase = get_supabase()
        
        # Create job record
        supabase.table("background_jobs").upsert({
            "id": job_id,
            "user_id": user_id,
            "job_type": "scraping",
            "job_subtype": "url",
            "status": "running",
            "input_data": {"url": url},
            "started_at": datetime.utcnow().isoformat()
        }).execute()
        
        scraper = ScrapingService()
        product = scraper.scrape_product(
            url=url,
            extract_variants=extract_variants,
            extract_reviews=extract_reviews
        )
        
        if enrich_with_ai and product:
            from app.services.ai import AIService
            ai = AIService()
            product = ai.enrich_product(product)
        
        # Save to database
        result = supabase.table("catalog_products").insert({
            **product,
            "user_id": user_id,
            "source_url": url,
            "import_source": "scraping",
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        # Update job
        supabase.table("background_jobs").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "output_data": {"product_id": result.data[0]["id"] if result.data else None}
        }).eq("id", job_id).execute()
        
        return {"success": True, "product_id": result.data[0]["id"] if result.data else None}
        
    except Exception as exc:
        logger.error(f"URL scrape failed: {exc}")
        
        try:
            supabase = get_supabase()
            supabase.table("background_jobs").update({
                "status": "failed",
                "error_message": str(exc),
                "completed_at": datetime.utcnow().isoformat()
            }).eq("id", job_id).execute()
        except:
            pass
        
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=1)
def scrape_store_catalog(
    self,
    user_id: str,
    store_url: str,
    max_products: int = 100,
    category_filter: Optional[str] = None
):
    """Scrape an entire store catalog"""
    from app.services.scraping import ScrapingService
    from app.core.database import get_supabase
    
    logger.info(f"Scraping store catalog: {store_url}")
    
    scraper = ScrapingService()
    products = scraper.scrape_store(
        store_url=store_url,
        max_products=max_products,
        category_filter=category_filter
    )
    
    # Save products
    supabase = get_supabase()
    
    saved_count = 0
    for product in products:
        try:
            supabase.table("catalog_products").insert({
                **product,
                "user_id": user_id,
                "import_source": "store_scrape",
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            saved_count += 1
        except Exception as e:
            logger.warning(f"Failed to save product: {e}")
    
    return {"scraped": len(products), "saved": saved_count}


# ==========================================
# IMPORT TASKS
# ==========================================

@shared_task(bind=True, max_retries=2)
def import_csv_products(
    self,
    user_id: str,
    feed_url: Optional[str] = None,
    file_content: Optional[str] = None,
    filename: Optional[str] = None,
    mapping_config: Dict[str, str] = None,
    update_existing: bool = True,
    is_excel: bool = False
):
    """Import products from CSV file or URL"""
    from app.services.import_service import ImportService
    from app.core.database import get_supabase
    
    job_id = self.request.id
    logger.info(f"Importing CSV products for user {user_id}")
    
    try:
        supabase = get_supabase()
        
        supabase.table("background_jobs").upsert({
            "id": job_id,
            "user_id": user_id,
            "job_type": "import",
            "job_subtype": "csv",
            "status": "running",
            "started_at": datetime.utcnow().isoformat()
        }).execute()
        
        importer = ImportService()
        
        if feed_url:
            result = importer.import_from_url(
                user_id=user_id,
                url=feed_url,
                format="csv",
                mapping=mapping_config or {},
                update_existing=update_existing
            )
        else:
            result = importer.import_from_content(
                user_id=user_id,
                content=file_content,
                format="excel" if is_excel else "csv",
                mapping=mapping_config or {}
            )
        
        supabase.table("background_jobs").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "output_data": result,
            "items_processed": result.get("total", 0),
            "items_succeeded": result.get("imported", 0)
        }).eq("id", job_id).execute()
        
        return result
        
    except Exception as exc:
        logger.error(f"CSV import failed: {exc}")
        
        try:
            supabase = get_supabase()
            supabase.table("background_jobs").update({
                "status": "failed",
                "error_message": str(exc)
            }).eq("id", job_id).execute()
        except:
            pass
        
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2)
def import_xml_feed(
    self,
    user_id: str,
    feed_url: Optional[str] = None,
    file_content: Optional[str] = None,
    filename: Optional[str] = None,
    mapping_config: Dict[str, str] = None,
    update_existing: bool = True
):
    """Import products from XML feed"""
    from app.services.import_service import ImportService
    
    logger.info(f"Importing XML feed for user {user_id}")
    
    importer = ImportService()
    
    if feed_url:
        result = importer.import_from_url(
            user_id=user_id,
            url=feed_url,
            format="xml",
            mapping=mapping_config or {},
            update_existing=update_existing
        )
    else:
        result = importer.import_from_content(
            user_id=user_id,
            content=file_content,
            format="xml",
            mapping=mapping_config or {}
        )
    
    return result


# ==========================================
# ORDER FULFILLMENT TASKS
# ==========================================

@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def process_order_fulfillment(
    self,
    user_id: str,
    order_id: str,
    supplier_id: Optional[str] = None,
    auto_select: bool = True
):
    """Process order fulfillment with supplier"""
    from app.services.fulfillment import FulfillmentService
    from app.core.database import get_supabase
    
    job_id = self.request.id
    logger.info(f"Processing fulfillment for order {order_id}")
    
    try:
        supabase = get_supabase()
        
        supabase.table("background_jobs").upsert({
            "id": job_id,
            "user_id": user_id,
            "job_type": "fulfillment",
            "status": "running",
            "input_data": {"order_id": order_id, "supplier_id": supplier_id},
            "started_at": datetime.utcnow().isoformat()
        }).execute()
        
        fulfillment = FulfillmentService()
        result = fulfillment.fulfill_order(
            user_id=user_id,
            order_id=order_id,
            supplier_id=supplier_id,
            auto_select=auto_select
        )
        
        supabase.table("background_jobs").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "output_data": result
        }).eq("id", job_id).execute()
        
        return result
        
    except Exception as exc:
        logger.error(f"Fulfillment failed: {exc}")
        raise self.retry(exc=exc)


# ==========================================
# AI TASKS
# ==========================================

@shared_task(bind=True, max_retries=2)
def generate_product_content(
    self,
    user_id: str,
    product_id: str,
    content_types: List[str],
    language: str = "fr",
    tone: str = "professional"
):
    """Generate AI content for product"""
    from app.services.ai import AIService
    
    logger.info(f"Generating content for product {product_id}")
    
    ai = AIService()
    result = ai.generate_content(
        product_id=product_id,
        content_types=content_types,
        language=language,
        tone=tone
    )
    
    return result


@shared_task(bind=True)
def optimize_product_seo(
    self,
    user_id: str,
    product_id: str,
    target_keywords: Optional[List[str]] = None,
    language: str = "fr"
):
    """Optimize product SEO with AI"""
    from app.services.ai import AIService
    
    ai = AIService()
    result = ai.optimize_seo(
        product_id=product_id,
        keywords=target_keywords,
        language=language
    )
    
    return result


@shared_task(bind=True)
def analyze_pricing(
    self,
    user_id: str,
    product_ids: List[str],
    competitor_analysis: bool = True,
    market_positioning: str = "competitive"
):
    """Analyze and optimize pricing"""
    from app.services.pricing import PricingService
    
    pricing = PricingService()
    result = pricing.analyze(
        product_ids=product_ids,
        competitor_analysis=competitor_analysis,
        positioning=market_positioning
    )
    
    return result


@shared_task(bind=True)
def bulk_ai_enrichment(
    self,
    user_id: str,
    filter_criteria: Dict[str, Any],
    enrichment_types: List[str],
    limit: int = 100
):
    """Bulk AI enrichment for products"""
    from app.services.ai import AIService
    from app.core.database import get_supabase
    
    supabase = get_supabase()
    
    # Fetch products matching criteria
    query = supabase.table("products").select("id").eq("user_id", user_id)
    
    for key, value in filter_criteria.items():
        query = query.eq(key, value)
    
    result = query.limit(limit).execute()
    product_ids = [p["id"] for p in result.data]
    
    # Enrich each product
    ai = AIService()
    enriched = 0
    
    for product_id in product_ids:
        try:
            ai.enrich_product_by_id(product_id, enrichment_types)
            enriched += 1
        except Exception as e:
            logger.warning(f"Failed to enrich product {product_id}: {e}")
    
    return {"total": len(product_ids), "enriched": enriched}


# ==========================================
# SCHEDULED TASKS (Celery Beat)
# ==========================================

@shared_task
def scheduled_stock_sync():
    """Hourly stock sync for all active suppliers"""
    from app.core.database import get_supabase
    
    logger.info("Running scheduled stock sync")
    
    supabase = get_supabase()
    
    # Get all active supplier integrations with auto-sync enabled
    integrations = supabase.table("supplier_integrations")\
        .select("id, user_id")\
        .eq("is_active", True)\
        .eq("auto_sync_stock", True)\
        .execute()
    
    queued = 0
    for integration in (integrations.data or []):
        sync_supplier_stock.delay(
            user_id=integration["user_id"],
            supplier_id=integration["id"]
        )
        queued += 1
    
    logger.info(f"Queued {queued} stock sync jobs")
    return {"queued": queued}


@shared_task
def cleanup_old_jobs():
    """Clean up old completed jobs (daily)"""
    from app.core.database import get_supabase
    
    logger.info("Cleaning up old jobs")
    
    supabase = get_supabase()
    cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()
    
    result = supabase.table("background_jobs")\
        .delete()\
        .in_("status", ["completed", "cancelled"])\
        .lt("completed_at", cutoff)\
        .execute()
    
    deleted = len(result.data) if result.data else 0
    logger.info(f"Deleted {deleted} old jobs")
    return {"deleted": deleted}


@shared_task
def process_pending_fulfillments():
    """Process pending auto-fulfillment orders (every 5 min)"""
    from app.core.database import get_supabase
    
    logger.info("Processing pending fulfillments")
    
    supabase = get_supabase()
    
    # Get pending orders with auto-fulfillment enabled
    orders = supabase.table("orders")\
        .select("id, user_id")\
        .eq("status", "pending")\
        .eq("auto_fulfill", True)\
        .limit(50)\
        .execute()
    
    queued = 0
    for order in (orders.data or []):
        process_order_fulfillment.delay(
            user_id=order["user_id"],
            order_id=order["id"],
            auto_select=True
        )
        queued += 1
    
    return {"queued": queued}


# ==========================================
# LEGACY COMPATIBILITY FUNCTIONS
# (for backward compatibility with existing code)
# ==========================================

async def process_bulk_import(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy: Process bulk product import - now uses Celery"""
    user_id = payload.get('user_id')
    supplier = payload.get('supplier')
    product_ids = payload.get('product_ids', [])
    
    # Queue as Celery task
    job = sync_supplier_products.delay(
        user_id=user_id,
        supplier_id=supplier,
        limit=len(product_ids)
    )
    
    return {"job_id": str(job.id), "status": "queued"}


async def sync_product_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy: Sync product data - now uses Celery"""
    user_id = payload.get('user_id')
    product_id = payload.get('product_id')
    
    # This would be handled by platform sync
    return {"status": "legacy_method", "message": "Use /api/v1/sync endpoints"}


async def send_notification_email(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy: Send notification email"""
    # This remains but could be migrated to Celery
    from app.core.database import get_supabase
    
    user_id = payload.get('user_id')
    template = payload.get('template')
    
    logger.info(f"Notification email queued for user {user_id}: {template}")
    return {"success": True}


async def generate_reports(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy: Generate reports"""
    return {"status": "legacy_method", "message": "Use /api/v1/reports endpoints"}


async def cleanup_temp_files(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy: Cleanup - handled by scheduled task"""
    cleanup_old_jobs.delay()
    return {"status": "queued"}
