"""
API v1 Router - Aggregates all endpoint routers
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    suppliers,
    products,
    orders,
    sync,
    scraping,
    ai,
    jobs
)

api_router = APIRouter()

# Supplier integrations
api_router.include_router(
    suppliers.router,
    prefix="/suppliers",
    tags=["Suppliers"]
)

# Product management
api_router.include_router(
    products.router,
    prefix="/products",
    tags=["Products"]
)

# Order management
api_router.include_router(
    orders.router,
    prefix="/orders",
    tags=["Orders"]
)

# Synchronization
api_router.include_router(
    sync.router,
    prefix="/sync",
    tags=["Synchronization"]
)

# Scraping & import
api_router.include_router(
    scraping.router,
    prefix="/scraping",
    tags=["Scraping"]
)

# AI services
api_router.include_router(
    ai.router,
    prefix="/ai",
    tags=["AI"]
)

# Background jobs
api_router.include_router(
    jobs.router,
    prefix="/jobs",
    tags=["Jobs"]
)
