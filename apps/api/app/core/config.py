"""
Application configuration using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "ShopOpti API"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # Database (Supabase PostgreSQL)
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    
    # External APIs
    BIGBUY_API_KEY: Optional[str] = None
    ALIEXPRESS_API_KEY: Optional[str] = None
    FIRECRAWL_API_KEY: Optional[str] = None
    
    # AI Services (Lovable AI Gateway)
    LOVABLE_API_KEY: Optional[str] = None
    AI_GATEWAY_URL: str = "https://ai.gateway.lovable.dev/v1/chat/completions"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Workers
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()


settings = get_settings()
