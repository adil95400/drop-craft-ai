"""
API v1 Router - Aggregates all endpoint routers
Aligned with unified DB schema (jobs, job_items, product_store_links, pricing_rules)
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    suppliers,
    products,
    orders,
    sync,
    scraping,
    ai,
    jobs,
    imports,
    pricing,
    seo,
)

api_router = APIRouter()

# Auth & Profiles
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Auth & Profiles"]
)

# Product management (CRUD, bulk, export, stats)
api_router.include_router(
    products.router,
    prefix="/products",
    tags=["Products"]
)

# Import (CSV, URL, feeds)
api_router.include_router(
    imports.router,
    prefix="/import",
    tags=["Import"]
)

# Pricing rules & application
api_router.include_router(
    pricing.router,
    prefix="/pricing-rules",
    tags=["Pricing"]
)

# Synchronization (multi-store sync, publish, unpublish)
api_router.include_router(
    sync.router,
    prefix="/products",
    tags=["Synchronization"]
)

# AI services (enrich, content generation)
api_router.include_router(
    ai.router,
    prefix="/ai",
    tags=["AI"]
)

# Background jobs (tracking, cancel, retry)
api_router.include_router(
    jobs.router,
    prefix="/jobs",
    tags=["Jobs"]
)

# Supplier integrations
api_router.include_router(
    suppliers.router,
    prefix="/suppliers",
    tags=["Suppliers"]
)

# Order management
api_router.include_router(
    orders.router,
    prefix="/orders",
    tags=["Orders"]
)

# SEO audits, analysis, AI generation, fixes
api_router.include_router(
    seo.router,
    prefix="/seo",
    tags=["SEO"]
)

# Scraping & import (legacy — redirects to /import)
api_router.include_router(
    scraping.router,
    prefix="/scraping",
    tags=["Scraping (Legacy)"]
)
