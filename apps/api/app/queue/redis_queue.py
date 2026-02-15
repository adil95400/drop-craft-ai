"""
Redis Queue service for job management and caching
Sprint 2: Added connection health check, retry logic, and connection pooling.
"""

import json
import redis
from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)


class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"


class TaskPriority(int, Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4


class RedisQueue:
    """Redis-based utilities for job tracking and caching"""

    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or settings.REDIS_URL
        self._pool: Optional[redis.ConnectionPool] = None
        self._client: Optional[redis.Redis] = None

    @property
    def client(self) -> redis.Redis:
        """Lazy initialization with connection pooling."""
        if self._client is None:
            self._pool = redis.ConnectionPool.from_url(
                self.redis_url,
                decode_responses=True,
                max_connections=20,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30,
            )
            self._client = redis.Redis(connection_pool=self._pool)
        return self._client

    def health_check(self) -> Dict[str, Any]:
        """Check Redis connectivity and return status."""
        try:
            start = __import__("time").time()
            self.client.ping()
            latency_ms = round((__import__("time").time() - start) * 1000, 1)
            info = self.client.info("memory")
            return {
                "status": "healthy",
                "latency_ms": latency_ms,
                "used_memory_mb": round(info.get("used_memory", 0) / 1_048_576, 1),
                "connected_clients": self.client.info("clients").get("connected_clients", 0),
            }
        except Exception as e:
            logger.error("redis.health_check.failed", error=str(e))
            return {"status": "unhealthy", "error": str(e)}

    def close(self):
        """Cleanly close the connection pool."""
        if self._pool:
            self._pool.disconnect()
            self._pool = None
            self._client = None

    # ── Job progress ──────────────────────────────────────────────────────────

    def publish_job_update(self, job_id: str, status: str, data: Dict[str, Any] = None):
        """Publish job status update for realtime notifications"""
        message = {
            "job_id": job_id,
            "status": status,
            "data": data or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        try:
            self.client.publish(f"job_updates:{job_id}", json.dumps(message))
        except redis.ConnectionError:
            logger.warning("redis.publish.failed", job_id=job_id)

    def get_job_progress(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get current job progress from cache"""
        data = self.client.get(f"job_progress:{job_id}")
        return json.loads(data) if data else None

    def set_job_progress(self, job_id: str, progress: int, message: str = None, total: int = None):
        """Update job progress in cache"""
        data = {
            "progress": progress,
            "message": message,
            "total": total,
            "updated_at": datetime.utcnow().isoformat()
        }
        self.client.setex(f"job_progress:{job_id}", 3600, json.dumps(data))
        self.publish_job_update(job_id, "progress", data)

    # ── Rate limiting ─────────────────────────────────────────────────────────

    def add_to_rate_limit(self, key: str, window_seconds: int = 60) -> int:
        """Atomic increment with expiry using pipeline."""
        pipe = self.client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window_seconds)
        results = pipe.execute()
        return results[0]

    def check_rate_limit(self, key: str, max_requests: int) -> bool:
        """Check if under rate limit"""
        current = self.client.get(key)
        if current is None:
            return True
        return int(current) < max_requests

    def get_user_rate_limit_status(self, user_id: str) -> Dict[str, Any]:
        """Get user's current rate limit status"""
        key = f"rate_limit:user:{user_id}"
        current = self.client.get(key)
        ttl = self.client.ttl(key)
        return {
            "current": int(current) if current else 0,
            "limit": settings.RATE_LIMIT_PER_MINUTE,
            "remaining": max(0, settings.RATE_LIMIT_PER_MINUTE - (int(current) if current else 0)),
            "reset_in": max(0, ttl)
        }

    # ── Caching ───────────────────────────────────────────────────────────────

    def cache_set(self, key: str, value: Any, ttl_seconds: int = 300):
        self.client.setex(key, ttl_seconds, json.dumps(value))

    def cache_get(self, key: str) -> Optional[Any]:
        data = self.client.get(key)
        return json.loads(data) if data else None

    def cache_delete(self, key: str):
        self.client.delete(key)

    def cache_get_or_set(self, key: str, factory, ttl_seconds: int = 300):
        cached = self.cache_get(key)
        if cached is not None:
            return cached
        value = factory()
        self.cache_set(key, value, ttl_seconds)
        return value

    # ── Queue stats ───────────────────────────────────────────────────────────

    def get_queue_stats(self) -> Dict[str, int]:
        stats = {}
        for priority in TaskPriority:
            queue_name = f"celery:{priority.name.lower()}"
            stats[f"{priority.name.lower()}_queue"] = self.client.llen(queue_name)
        stats["default_queue"] = self.client.llen("celery")
        return stats

    def get_active_jobs_count(self) -> int:
        return self.client.scard("active_jobs") or 0

    # ── User job tracking ─────────────────────────────────────────────────────

    def track_user_job(self, user_id: str, job_id: str, job_type: str):
        self.client.sadd(f"user_jobs:{user_id}", job_id)
        self.client.hset(f"job_meta:{job_id}", mapping={
            "user_id": user_id,
            "job_type": job_type,
            "created_at": datetime.utcnow().isoformat()
        })
        self.client.expire(f"user_jobs:{user_id}", 86400)
        self.client.expire(f"job_meta:{job_id}", 86400)

    def get_user_jobs(self, user_id: str) -> List[str]:
        return list(self.client.smembers(f"user_jobs:{user_id}"))

    def get_job_meta(self, job_id: str) -> Optional[Dict[str, str]]:
        return self.client.hgetall(f"job_meta:{job_id}")

    # ── Supplier sync tracking ────────────────────────────────────────────────

    def set_supplier_sync_status(self, supplier_id: str, status: str, progress: int = 0):
        self.client.hset(f"supplier_sync:{supplier_id}", mapping={
            "status": status,
            "progress": progress,
            "updated_at": datetime.utcnow().isoformat()
        })
        self.client.expire(f"supplier_sync:{supplier_id}", 3600)

    def get_supplier_sync_status(self, supplier_id: str) -> Optional[Dict[str, str]]:
        return self.client.hgetall(f"supplier_sync:{supplier_id}")

    # ── Distributed locking ───────────────────────────────────────────────────

    def acquire_lock(self, lock_name: str, ttl_seconds: int = 300) -> bool:
        return bool(self.client.set(
            f"lock:{lock_name}",
            datetime.utcnow().isoformat(),
            nx=True, ex=ttl_seconds
        ))

    def release_lock(self, lock_name: str):
        self.client.delete(f"lock:{lock_name}")

    def is_locked(self, lock_name: str) -> bool:
        return self.client.exists(f"lock:{lock_name}") > 0


# Global instance
redis_queue = RedisQueue()
