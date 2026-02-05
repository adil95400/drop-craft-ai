"""
ShopOpti FastAPI - Main Application
Backend métier principal pour l'automatisation e-commerce
Refactored for production-ready architecture
"""

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import logging
import structlog

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.v1.router import api_router

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.dev.ConsoleRenderer()
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    logger.info("🚀 ShopOpti API starting up...")
    await init_db()
    logger.info("✅ Database connection established")
    yield
    await close_db()
    logger.info("👋 ShopOpti API shutting down...")


app = FastAPI(
    title="ShopOpti API",
    description="Backend métier pour l'automatisation e-commerce dropshipping",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration for all environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://shopopti.io",
        "https://www.shopopti.io",
        "https://drop-craft-ai.lovable.app",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


# Health check endpoint (public)
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "service": "shopopti-api",
        "environment": settings.ENVIRONMENT,
        "features": {
            "database": "postgresql",
            "queue": "redis+celery",
            "auth": "supabase",
            "ai": "lovable-gateway"
        }
    }


# Ready check for Kubernetes/orchestration
@app.get("/ready")
async def ready_check():
    """Check if service is ready to accept traffic"""
    # TODO: Add database connectivity check
    return {"ready": True}


# API v1 routes
app.include_router(api_router, prefix="/api/v1")


# Legacy compatibility routes (will be deprecated)
from app.api.legacy import legacy_router
app.include_router(legacy_router, prefix="/api", tags=["Legacy"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=settings.DEBUG,
        log_level="info"
    )
