"""
Celery tasks for async job processing
All heavy operations run here, not in HTTP handlers

Sprint 2: Fixed async patterns — replaced broken `run_async` with
proper `asgiref.sync_to_async` / `asyncio.Runner` (Python 3.11+),
added structured logging, idempotent job upserts, and progress callbacks.

IMPORTANT: All tasks write to the `jobs` table (unified system).
"""

from celery import shared_task
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import logging
import asyncio
import sys
import structlog

from app.core.error_recovery import ResilientTask, classify_error

logger = structlog.get_logger(__name__)


# ── Async helper (Sprint 2 fix) ──────────────────────────────────────────────

def run_async(coro):
    """
    Safely run an async coroutine from synchronous Celery tasks.
    Uses asyncio.Runner on Python 3.11+ (proper cleanup),
    falls back to new_event_loop on older versions.
    """
    if sys.version_info >= (3, 11):
        with asyncio.Runner() as runner:
            return runner.run(coro)
    else:
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()


# ── Job tracking helpers (unified `jobs` table) ──────────────────────────────

def _upsert_job(supabase, job_id: str, user_id: str, job_type: str, job_subtype: str = None, **extra):
    """Create or update a job record in the unified `jobs` table."""
    record = {
        "id": job_id,
        "user_id": user_id,
        "job_type": job_type,
        "status": "running",
        "started_at": datetime.utcnow().isoformat(),
    }
    if job_subtype:
        record["job_subtype"] = job_subtype
    record.update(extra)
    supabase.table("jobs").upsert(record, on_conflict="id").execute()


def _update_progress(supabase, job_id: str, processed: int, total: int, message: str = None):
    """Update job progress for realtime tracking."""
    update = {
        "processed_items": processed,
        "total_items": total,
    }
    if message:
        update["metadata"] = {"progress_message": message}
    try:
        supabase.table("jobs").update(update).eq("id", job_id).execute()
    except Exception:
        pass  # Non-critical: progress update failure should not break the task


def _complete_job(supabase, job_id: str, output_data=None, processed=0, failed=0, total=0):
    """Mark a job as completed in the unified `jobs` table."""
    supabase.table("jobs").update({
        "status": "completed",
        "completed_at": datetime.utcnow().isoformat(),
        "output_data": output_data,
        "processed_items": processed,
        "failed_items": failed,
        "total_items": total or processed,
    }).eq("id", job_id).execute()


def _fail_job(supabase, job_id: str, error_message: str):
    """Mark a job as failed in the unified `jobs` table."""
    try:
        supabase.table("jobs").update({
            "status": "failed",
            "error_message": str(error_message)[:2000],
            "completed_at": datetime.utcnow().isoformat(),
        }).eq("id", job_id).execute()
    except Exception:
        logger.warning("job.update_failed", job_id=job_id)


def _get_supabase_safe():
    """Import and return Supabase client, with error handling."""
    from app.core.database import get_supabase
    return get_supabase()


# ==========================================
# SUPPLIER SYNC TASKS
# ==========================================

@shared_task(bind=True, base=ResilientTask, max_retries=3, default_retry_delay=60)
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

    job_id = self.request.id
    log = logger.bind(job_id=job_id, task="sync_supplier_products")
    log.info("task.start", supplier_id=supplier_id, sync_type=sync_type)

    try:
        supabase = _get_supabase_safe()

        _upsert_job(supabase, job_id, user_id, "sync", job_subtype=sync_type,
                     name=f"Supplier sync: {sync_type}",
                     input_data={
                         "supplier_id": supplier_id,
                         "sync_type": sync_type,
                         "limit": limit,
                         "category_filter": category_filter
                     })

        service = get_supplier_service(supplier_id)
        result = service.sync_products(
            user_id=user_id,
            limit=limit,
            category_filter=category_filter
        )

        _complete_job(supabase, job_id,
                      output_data=result,
                      processed=result.get("fetched", 0),
                      failed=len(result.get("errors", [])),
                      total=result.get("fetched", 0))

        log.info("task.completed", fetched=result.get("fetched", 0))
        return result

    except Exception as exc:
        log.error("task.failed", error=str(exc))
        try:
            supabase = _get_supabase_safe()
            _fail_job(supabase, job_id, str(exc))
        except Exception:
            pass
        self.retry_with_backoff(exc)


@shared_task(bind=True, base=ResilientTask, max_retries=3)
def sync_supplier_stock(self, user_id: str, supplier_id: str):
    """Sync stock levels from supplier"""
    from app.services.suppliers import get_supplier_service

    log = logger.bind(job_id=self.request.id, task="sync_supplier_stock")
    log.info("task.start", supplier_id=supplier_id)

    try:
        service = get_supplier_service(supplier_id)
        result = service.sync_stock(user_id=user_id)
        log.info("task.completed")
        return result
    except Exception as exc:
        log.error("task.failed", error=str(exc))
        self.retry_with_backoff(exc)


@shared_task(bind=True)
def sync_platform_orders(self, user_id: str, platform_id: str, **options):
    """Sync orders from sales platform (Shopify, WooCommerce, etc.)"""
    logger.info("task.stub", task="sync_platform_orders", platform_id=platform_id)
    return {"synced": 0}


@shared_task(bind=True, base=ResilientTask, max_retries=2)
def full_catalog_sync(self, user_id: str, supplier_id: str, **options):
    """Full catalog sync including products, stock, and prices"""
    from app.services.suppliers import get_supplier_service

    log = logger.bind(job_id=self.request.id, task="full_catalog_sync")
    log.info("task.start", supplier_id=supplier_id)

    try:
        service = get_supplier_service(supplier_id)
        products_result = service.sync_products(user_id=user_id, **options)
        stock_result = service.sync_stock(user_id=user_id)

        result = {"products": products_result, "stock": stock_result}
        log.info("task.completed")
        return result
    except Exception as exc:
        log.error("task.failed", error=str(exc))
        self.retry_with_backoff(exc)


# ==========================================
# SCRAPING TASKS
# ==========================================

@shared_task(bind=True, base=ResilientTask, max_retries=2, default_retry_delay=30)
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

    job_id = self.request.id
    log = logger.bind(job_id=job_id, task="scrape_product_url")
    log.info("task.start", url=url[:80])

    try:
        supabase = _get_supabase_safe()

        _upsert_job(supabase, job_id, user_id, "scraping", job_subtype="url",
                     name=f"Scrape: {url[:60]}",
                     input_data={"url": url})

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

        result = supabase.table("products").insert({
            **product,
            "user_id": user_id,
            "source_url": url,
            "import_source": "scraping",
            "status": "draft",
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        product_id = result.data[0]["id"] if result.data else None

        _complete_job(supabase, job_id,
                      output_data={"product_id": product_id},
                      processed=1, total=1)

        log.info("task.completed", product_id=product_id)
        return {"success": True, "product_id": product_id}

    except Exception as exc:
        log.error("task.failed", error=str(exc))
        try:
            supabase = _get_supabase_safe()
            _fail_job(supabase, job_id, str(exc))
        except Exception:
            pass
        self.retry_with_backoff(exc)


@shared_task(bind=True, base=ResilientTask, max_retries=1)
def scrape_store_catalog(
    self,
    user_id: str,
    store_url: str,
    max_products: int = 100,
    category_filter: Optional[str] = None
):
    """Scrape an entire store catalog with per-item progress tracking"""
    from app.services.scraping import ScrapingService

    job_id = self.request.id
    log = logger.bind(job_id=job_id, task="scrape_store_catalog")
    log.info("task.start", store_url=store_url[:80])

    supabase = _get_supabase_safe()

    _upsert_job(supabase, job_id, user_id, "scraping", job_subtype="store",
                name=f"Store scrape: {store_url[:60]}",
                input_data={"store_url": store_url, "max_products": max_products},
                total_items=max_products)

    scraper = ScrapingService()
    products = scraper.scrape_store(
        store_url=store_url,
        max_products=max_products,
        category_filter=category_filter
    )

    saved_count = 0
    failed_count = 0
    for i, product in enumerate(products):
        try:
            prod_result = supabase.table("products").insert({
                **product,
                "user_id": user_id,
                "import_source": "store_scrape",
                "status": "draft",
                "created_at": datetime.utcnow().isoformat()
            }).execute()

            supabase.table("job_items").insert({
                "job_id": job_id,
                "product_id": prod_result.data[0]["id"] if prod_result.data else None,
                "status": "success",
                "message": f"Scraped from {store_url}",
                "processed_at": datetime.utcnow().isoformat(),
            }).execute()
            saved_count += 1
        except Exception as e:
            log.warning("item.failed", index=i, error=str(e))
            supabase.table("job_items").insert({
                "job_id": job_id,
                "status": "error",
                "message": str(e)[:500],
                "processed_at": datetime.utcnow().isoformat(),
            }).execute()
            failed_count += 1

        # Update progress every 10 items
        if (i + 1) % 10 == 0:
            _update_progress(supabase, job_id, saved_count + failed_count, len(products))

    _complete_job(supabase, job_id,
                  output_data={"scraped": len(products), "saved": saved_count},
                  processed=saved_count, failed=failed_count, total=len(products))

    log.info("task.completed", scraped=len(products), saved=saved_count, failed=failed_count)
    return {"scraped": len(products), "saved": saved_count}


# ==========================================
# IMPORT TASKS
# ==========================================

@shared_task(bind=True, base=ResilientTask, max_retries=2)
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

    job_id = self.request.id
    log = logger.bind(job_id=job_id, task="import_csv_products")
    log.info("task.start", filename=filename or feed_url)

    try:
        supabase = _get_supabase_safe()

        _upsert_job(supabase, job_id, user_id, "import",
                     job_subtype="excel" if is_excel else "csv",
                     name=f"Import {filename or feed_url or 'CSV'}",
                     input_data={"feed_url": feed_url, "filename": filename})

        importer = ImportService()

        if feed_url:
            result = importer.import_from_url(
                user_id=user_id, url=feed_url, format="csv",
                mapping=mapping_config or {}, update_existing=update_existing
            )
        else:
            result = importer.import_from_content(
                user_id=user_id, content=file_content,
                format="excel" if is_excel else "csv",
                mapping=mapping_config or {}
            )

        _complete_job(supabase, job_id,
                      output_data=result,
                      processed=result.get("imported", 0),
                      failed=result.get("failed", 0),
                      total=result.get("total", 0))

        log.info("task.completed", imported=result.get("imported", 0))
        return result

    except Exception as exc:
        log.error("task.failed", error=str(exc))
        try:
            supabase = _get_supabase_safe()
            _fail_job(supabase, job_id, str(exc))
        except Exception:
            pass
        self.retry_with_backoff(exc)


@shared_task(bind=True, base=ResilientTask, max_retries=2)
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

    job_id = self.request.id
    log = logger.bind(job_id=job_id, task="import_xml_feed")
    log.info("task.start", filename=filename or feed_url)

    try:
        supabase = _get_supabase_safe()

        _upsert_job(supabase, job_id, user_id, "import", job_subtype="xml",
                     name=f"Import {filename or feed_url or 'XML'}",
                     input_data={"feed_url": feed_url, "filename": filename})

        importer = ImportService()

        if feed_url:
            result = importer.import_from_url(
                user_id=user_id, url=feed_url, format="xml",
                mapping=mapping_config or {}, update_existing=update_existing
            )
        else:
            result = importer.import_from_content(
                user_id=user_id, content=file_content, format="xml",
                mapping=mapping_config or {}
            )

        _complete_job(supabase, job_id,
                      output_data=result,
                      processed=result.get("imported", 0),
                      failed=result.get("failed", 0),
                      total=result.get("total", 0))

        log.info("task.completed", imported=result.get("imported", 0))
        return result

    except Exception as exc:
        log.error("task.failed", error=str(exc))
        try:
            supabase = _get_supabase_safe()
            _fail_job(supabase, job_id, str(exc))
        except Exception:
            pass
        self.retry_with_backoff(exc)


# ==========================================
# ORDER FULFILLMENT TASKS
# ==========================================

@shared_task(bind=True, base=ResilientTask, max_retries=3, default_retry_delay=120)
def process_order_fulfillment(
    self,
    user_id: str,
    order_id: str,
    supplier_id: Optional[str] = None,
    auto_select: bool = True
):
    """Process order fulfillment with supplier"""
    from app.services.fulfillment import FulfillmentService

    job_id = self.request.id
    log = logger.bind(job_id=job_id, task="process_order_fulfillment")
    log.info("task.start", order_id=order_id)

    try:
        supabase = _get_supabase_safe()

        _upsert_job(supabase, job_id, user_id, "fulfillment",
                     name=f"Fulfill order {order_id[:8]}",
                     input_data={"order_id": order_id, "supplier_id": supplier_id})

        fulfillment = FulfillmentService()
        result = fulfillment.fulfill_order(
            user_id=user_id, order_id=order_id,
            supplier_id=supplier_id, auto_select=auto_select
        )

        _complete_job(supabase, job_id, output_data=result, processed=1, total=1)
        log.info("task.completed")
        return result

    except Exception as exc:
        log.error("task.failed", error=str(exc))
        try:
            supabase = _get_supabase_safe()
            _fail_job(supabase, job_id, str(exc))
        except Exception:
            pass
        self.retry_with_backoff(exc)


# ==========================================
# AI TASKS
# ==========================================

@shared_task(bind=True, base=ResilientTask, max_retries=2)
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

    log = logger.bind(job_id=self.request.id, task="generate_product_content")
    log.info("task.start", product_id=product_id)

    try:
        ai = AIService()
        result = ai.generate_content(
            product_id=product_id, content_types=content_types,
            language=language, tone=tone
        )
        log.info("task.completed")
        return result
    except Exception as exc:
        log.error("task.failed", error=str(exc))
        self.retry_with_backoff(exc)


@shared_task(bind=True, base=ResilientTask, max_retries=2)
def optimize_product_seo(
    self,
    user_id: str,
    product_id: str,
    target_keywords: Optional[List[str]] = None,
    language: str = "fr"
):
    """Optimize product SEO with AI"""
    from app.services.ai import AIService

    log = logger.bind(job_id=self.request.id, task="optimize_product_seo")
    log.info("task.start", product_id=product_id)

    try:
        ai = AIService()
        result = ai.optimize_seo(
            product_id=product_id, keywords=target_keywords, language=language
        )
        log.info("task.completed")
        return result
    except Exception as exc:
        log.error("task.failed", error=str(exc))
        self.retry_with_backoff(exc)


@shared_task(bind=True, base=ResilientTask, max_retries=2)
def analyze_pricing(
    self,
    user_id: str,
    product_ids: List[str],
    competitor_analysis: bool = True,
    market_positioning: str = "competitive"
):
    """Analyze and optimize pricing"""
    from app.services.pricing import PricingService

    log = logger.bind(job_id=self.request.id, task="analyze_pricing")
    log.info("task.start", product_count=len(product_ids))

    try:
        pricing = PricingService()
        result = pricing.analyze(
            product_ids=product_ids,
            competitor_analysis=competitor_analysis,
            positioning=market_positioning
        )
        log.info("task.completed")
        return result
    except Exception as exc:
        log.error("task.failed", error=str(exc))
        self.retry_with_backoff(exc)


@shared_task(bind=True, base=ResilientTask, max_retries=2)
def bulk_ai_enrichment(
    self,
    user_id: str,
    filter_criteria: Dict[str, Any],
    enrichment_types: List[str],
    limit: int = 100
):
    """Bulk AI enrichment for products with progress tracking"""
    from app.services.ai import AIService

    job_id = self.request.id
    log = logger.bind(job_id=job_id, task="bulk_ai_enrichment")
    log.info("task.start", limit=limit)

    try:
        supabase = _get_supabase_safe()

        _upsert_job(supabase, job_id, user_id, "ai", job_subtype="bulk_enrichment",
                     name="Bulk AI enrichment",
                     input_data={"filter": filter_criteria, "types": enrichment_types})

        query = supabase.table("products").select("id").eq("user_id", user_id)
        for key, value in filter_criteria.items():
            query = query.eq(key, value)
        result = query.limit(limit).execute()
        product_ids = [p["id"] for p in result.data]

        ai = AIService()
        enriched = 0
        failed = 0

        for i, product_id in enumerate(product_ids):
            try:
                ai.enrich_product_by_id(product_id, enrichment_types)
                enriched += 1
            except Exception as e:
                log.warning("item.failed", product_id=product_id, error=str(e))
                failed += 1

            if (i + 1) % 10 == 0:
                _update_progress(supabase, job_id, enriched + failed, len(product_ids))

        _complete_job(supabase, job_id,
                      output_data={"enriched": enriched, "failed": failed},
                      processed=enriched, failed=failed, total=len(product_ids))

        log.info("task.completed", enriched=enriched, failed=failed)
        return {"total": len(product_ids), "enriched": enriched, "failed": failed}

    except Exception as exc:
        log.error("task.failed", error=str(exc))
        try:
            supabase = _get_supabase_safe()
            _fail_job(supabase, job_id, str(exc))
        except Exception:
            pass
        self.retry_with_backoff(exc)


# ==========================================
# SCHEDULED TASKS (Celery Beat)
# ==========================================

@shared_task
def scheduled_stock_sync():
    """Hourly stock sync for all active suppliers"""
    log = logger.bind(task="scheduled_stock_sync")
    log.info("task.start")

    supabase = _get_supabase_safe()

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

    log.info("task.completed", queued=queued)
    return {"queued": queued}


@shared_task
def cleanup_old_jobs():
    """Clean up old completed jobs (daily) — uses unified `jobs` table"""
    log = logger.bind(task="cleanup_old_jobs")
    log.info("task.start")

    supabase = _get_supabase_safe()
    cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()

    result = supabase.table("jobs")\
        .delete()\
        .in_("status", ["completed", "cancelled"])\
        .lt("completed_at", cutoff)\
        .execute()

    deleted = len(result.data) if result.data else 0
    log.info("task.completed", deleted=deleted)
    return {"deleted": deleted}


@shared_task
def process_pending_fulfillments():
    """Process pending auto-fulfillment orders (every 5 min)"""
    log = logger.bind(task="process_pending_fulfillments")
    log.info("task.start")

    supabase = _get_supabase_safe()

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

    log.info("task.completed", queued=queued)
    return {"queued": queued}


# ==========================================
# LEGACY COMPATIBILITY FUNCTIONS
# ==========================================

async def process_bulk_import(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy: Process bulk product import - now uses Celery"""
    user_id = payload.get('user_id')
    supplier = payload.get('supplier')
    product_ids = payload.get('product_ids', [])

    job = sync_supplier_products.delay(
        user_id=user_id, supplier_id=supplier, limit=len(product_ids)
    )
    return {"job_id": str(job.id), "status": "queued"}


async def sync_product_data(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy: Sync product data - now uses Celery"""
    return {"status": "legacy_method", "message": "Use /api/v1/sync endpoints"}


async def send_notification_email(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy: Send notification email"""
    user_id = payload.get('user_id')
    template = payload.get('template')
    logger.info("notification.queued", user_id=user_id, template=template)
    return {"success": True}


async def generate_reports(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy: Generate reports"""
    return {"status": "legacy_method", "message": "Use /api/v1/reports endpoints"}


async def cleanup_temp_files(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy: Cleanup - handled by scheduled task"""
    cleanup_old_jobs.delay()
    return {"status": "queued"}
