"""
Production configuration for deployment on Railway/Render/Fly.io
Sprint 5: Centralized settings with validation
"""
import os
from typing import Optional


class ProductionConfig:
    """
    Reads config from environment variables with sensible defaults.
    All secrets come from env — never committed.
    """

    # ── App ──────────────────────────────────────────────────────────────
    APP_NAME: str = "ShopOpti API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # ── Server ───────────────────────────────────────────────────────────
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    WORKERS: int = int(os.getenv("WEB_CONCURRENCY", "2"))

    # ── Database ─────────────────────────────────────────────────────────
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    DB_POOL_MIN: int = int(os.getenv("DB_POOL_MIN", "2"))
    DB_POOL_MAX: int = int(os.getenv("DB_POOL_MAX", "10"))
    DB_COMMAND_TIMEOUT: int = int(os.getenv("DB_COMMAND_TIMEOUT", "30"))

    # ── Redis ────────────────────────────────────────────────────────────
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_MAX_CONNECTIONS: int = int(os.getenv("REDIS_MAX_CONNECTIONS", "20"))

    # ── Celery ───────────────────────────────────────────────────────────
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://localhost:6379/1"))

    # ── Security ─────────────────────────────────────────────────────────
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    JWT_CACHE_TTL: int = int(os.getenv("JWT_CACHE_TTL", "300"))

    # ── Rate Limiting ────────────────────────────────────────────────────
    RATE_LIMIT_DEFAULT: int = int(os.getenv("RATE_LIMIT_DEFAULT", "60"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
    RATE_LIMIT_AUTH: int = int(os.getenv("RATE_LIMIT_AUTH", "10"))

    # ── CORS ─────────────────────────────────────────────────────────────
    CORS_ORIGINS: list = [
        "https://shopopti.io",
        "https://www.shopopti.io",
        "https://drop-craft-ai.lovable.app",
    ]

    @classmethod
    def validate(cls) -> list[str]:
        """Validate critical config, return list of missing vars."""
        missing = []
        if not cls.DATABASE_URL:
            missing.append("DATABASE_URL")
        if not cls.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not cls.SUPABASE_SERVICE_ROLE_KEY:
            missing.append("SUPABASE_SERVICE_ROLE_KEY")
        return missing

    @classmethod
    def summary(cls) -> dict:
        """Non-sensitive config summary for health endpoints."""
        return {
            "app": cls.APP_NAME,
            "version": cls.APP_VERSION,
            "environment": cls.ENVIRONMENT,
            "debug": cls.DEBUG,
            "db_pool": f"{cls.DB_POOL_MIN}-{cls.DB_POOL_MAX}",
            "redis_pool": cls.REDIS_MAX_CONNECTIONS,
            "workers": cls.WORKERS,
            "rate_limit": f"{cls.RATE_LIMIT_DEFAULT}/min",
        }


production_config = ProductionConfig()
