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
import time
import uuid
import logging
import structlog

from app.core.config import settings
from app.core.database import init_db, close_db, db_pool

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

# ── Startup timestamp ────────────────────────────────────────────────────────
_startup_time: float = 0.0


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    global _startup_time
    _startup_time = time.time()
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


# ── Request ID Correlation Middleware ─────────────────────────────────────────

@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """
    P2.2: Attach a unique request_id to every request for correlated logging.
    The request_id is returned in response headers for client-side tracing.
    """
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()

    # Bind request_id to structlog context for this request
    log = logger.bind(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
    )

    # Store on request state for downstream access
    request.state.request_id = request_id
    request.state.log = log

    log.info("request.start")

    try:
        response = await call_next(request)
    except Exception as exc:
        duration_ms = round((time.time() - start_time) * 1000, 1)
        log.error("request.error", duration_ms=duration_ms, error=str(exc))
        raise

    duration_ms = round((time.time() - start_time) * 1000, 1)
    log.info("request.end", status=response.status_code, duration_ms=duration_ms)

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time"] = f"{duration_ms}ms"
    return response


# ── Global exception handler ─────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error("Unhandled exception", error=str(exc), path=request.url.path, request_id=request_id)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred",
            "request_id": request_id,
        }
    )


# ── Health check (public) ────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """
    P2.2: Real health check — pings DB and Redis, reports component status.
    Returns 200 if all components are healthy, 503 if any are degraded.
    """
    checks = {}

    # Database check
    try:
        if db_pool:
            async with db_pool.acquire() as conn:
                start = time.time()
                await conn.fetchval("SELECT 1")
                checks["database"] = {
                    "status": "healthy",
                    "response_ms": round((time.time() - start) * 1000, 1),
                }
        else:
            checks["database"] = {"status": "unhealthy", "message": "Pool not initialized"}
    except Exception as e:
        checks["database"] = {"status": "unhealthy", "message": str(e)}

    # Redis check
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        start = time.time()
        await r.ping()
        checks["redis"] = {
            "status": "healthy",
            "response_ms": round((time.time() - start) * 1000, 1),
        }
        await r.aclose()
    except Exception as e:
        checks["redis"] = {"status": "degraded", "message": str(e)}

    overall = "healthy" if all(c["status"] == "healthy" for c in checks.values()) else "degraded"
    uptime_s = round(time.time() - _startup_time) if _startup_time else 0

    return JSONResponse(
        status_code=200 if overall == "healthy" else 503,
        content={
            "status": overall,
            "version": "2.0.0",
            "service": "shopopti-api",
            "environment": settings.ENVIRONMENT,
            "uptime_seconds": uptime_s,
            "checks": checks,
        }
    )


# ── Ready check for orchestration ────────────────────────────────────────────

@app.get("/ready")
async def ready_check():
    """
    P2.2: Real readiness probe — service is ready only if DB pool is alive.
    Used by Kubernetes/Railway/Render to gate traffic.
    """
    try:
        if not db_pool:
            return JSONResponse(status_code=503, content={"ready": False, "reason": "DB pool not initialized"})
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"ready": True}
    except Exception as e:
        return JSONResponse(status_code=503, content={"ready": False, "reason": str(e)})


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
