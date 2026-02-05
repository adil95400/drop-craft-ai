"""
Database connection and session management
Uses Supabase PostgreSQL via asyncpg
"""

from supabase import create_client, Client
from typing import Optional
import asyncpg
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Supabase client (for auth and storage)
supabase: Optional[Client] = None

# PostgreSQL connection pool (for direct queries)
db_pool: Optional[asyncpg.Pool] = None


async def init_db():
    """Initialize database connections"""
    global supabase, db_pool
    
    # Initialize Supabase client
    supabase = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    logger.info("Supabase client initialized")
    
    # Initialize PostgreSQL connection pool
    try:
        db_pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=5,
            max_size=20,
            command_timeout=60
        )
        logger.info("PostgreSQL pool initialized")
    except Exception as e:
        logger.error(f"Failed to initialize PostgreSQL pool: {e}")
        raise


async def close_db():
    """Close database connections"""
    global db_pool
    if db_pool:
        await db_pool.close()
        logger.info("PostgreSQL pool closed")


def get_supabase() -> Client:
    """Get Supabase client instance"""
    if not supabase:
        raise RuntimeError("Supabase client not initialized")
    return supabase


async def get_db_connection():
    """Get a database connection from the pool"""
    if not db_pool:
        raise RuntimeError("Database pool not initialized")
    return await db_pool.acquire()


async def release_db_connection(conn):
    """Release a database connection back to the pool"""
    if db_pool and conn:
        await db_pool.release(conn)
