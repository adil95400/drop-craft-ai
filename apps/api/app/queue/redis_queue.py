"""
Redis Queue service for job management and caching
Complements Celery for job tracking and pub/sub
"""

import json
import redis
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from enum import Enum
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


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
        self._client = None
    
    @property
    def client(self):
        """Lazy initialization of Redis client"""
        if self._client is None:
            self._client = redis.from_url(
                self.redis_url, 
                decode_responses=True
            )
        return self._client
    
    def publish_job_update(self, job_id: str, status: str, data: Dict[str, Any] = None):
        """Publish job status update for realtime notifications"""
        message = {
            "job_id": job_id,
            "status": status,
            "data": data or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        self.client.publish(f"job_updates:{job_id}", json.dumps(message))
        logger.debug(f"Published job update: {job_id} -> {status}")
    
    def get_job_progress(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get current job progress from cache"""
        data = self.client.get(f"job_progress:{job_id}")
        if data:
            return json.loads(data)
        return None
    
    def set_job_progress(self, job_id: str, progress: int, message: str = None, total: int = None):
        """Update job progress in cache"""
        data = {
            "progress": progress,
            "message": message,
            "total": total,
            "updated_at": datetime.utcnow().isoformat()
        }
        self.client.setex(
            f"job_progress:{job_id}",
            3600,  # 1 hour TTL
            json.dumps(data)
        )
        
        # Also publish update for realtime
        self.publish_job_update(job_id, "progress", data)
    
    def add_to_rate_limit(self, key: str, window_seconds: int = 60) -> int:
        """Increment rate limit counter and return current count"""
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
    
    def cache_set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Set a cached value"""
        self.client.setex(key, ttl_seconds, json.dumps(value))
    
    def cache_get(self, key: str) -> Optional[Any]:
        """Get a cached value"""
        data = self.client.get(key)
        if data:
            return json.loads(data)
        return None
    
    def cache_delete(self, key: str):
        """Delete a cached value"""
        self.client.delete(key)
    
    def cache_get_or_set(self, key: str, factory, ttl_seconds: int = 300):
        """Get cached value or compute and cache it"""
        cached = self.cache_get(key)
        if cached is not None:
            return cached
        
        value = factory()
        self.cache_set(key, value, ttl_seconds)
        return value
    
    # Queue statistics
    def get_queue_stats(self) -> Dict[str, int]:
        """Get queue statistics from Celery"""
        # Note: This queries Celery's Redis backend
        stats = {}
        
        for priority in TaskPriority:
            queue_name = f"celery:{priority.name.lower()}"
            count = self.client.llen(queue_name)
            stats[f"{priority.name.lower()}_queue"] = count
        
        # Default celery queue
        stats["default_queue"] = self.client.llen("celery")
        
        return stats
    
    def get_active_jobs_count(self) -> int:
        """Get count of currently active jobs"""
        # This would need coordination with Celery
        return self.client.scard("active_jobs") or 0
    
    # User job tracking
    def track_user_job(self, user_id: str, job_id: str, job_type: str):
        """Track a job for a specific user"""
        self.client.sadd(f"user_jobs:{user_id}", job_id)
        self.client.hset(f"job_meta:{job_id}", mapping={
            "user_id": user_id,
            "job_type": job_type,
            "created_at": datetime.utcnow().isoformat()
        })
        # Expire after 24 hours
        self.client.expire(f"user_jobs:{user_id}", 86400)
        self.client.expire(f"job_meta:{job_id}", 86400)
    
    def get_user_jobs(self, user_id: str) -> List[str]:
        """Get all job IDs for a user"""
        return list(self.client.smembers(f"user_jobs:{user_id}"))
    
    def get_job_meta(self, job_id: str) -> Optional[Dict[str, str]]:
        """Get job metadata"""
        return self.client.hgetall(f"job_meta:{job_id}")
    
    # Supplier sync tracking
    def set_supplier_sync_status(self, supplier_id: str, status: str, progress: int = 0):
        """Track supplier sync status"""
        self.client.hset(f"supplier_sync:{supplier_id}", mapping={
            "status": status,
            "progress": progress,
            "updated_at": datetime.utcnow().isoformat()
        })
        self.client.expire(f"supplier_sync:{supplier_id}", 3600)
    
    def get_supplier_sync_status(self, supplier_id: str) -> Optional[Dict[str, str]]:
        """Get supplier sync status"""
        return self.client.hgetall(f"supplier_sync:{supplier_id}")
    
    # Lock management for preventing duplicate jobs
    def acquire_lock(self, lock_name: str, ttl_seconds: int = 300) -> bool:
        """Acquire a distributed lock"""
        return bool(self.client.set(
            f"lock:{lock_name}",
            datetime.utcnow().isoformat(),
            nx=True,
            ex=ttl_seconds
        ))
    
    def release_lock(self, lock_name: str):
        """Release a distributed lock"""
        self.client.delete(f"lock:{lock_name}")
    
    def is_locked(self, lock_name: str) -> bool:
        """Check if a lock exists"""
        return self.client.exists(f"lock:{lock_name}") > 0


# Global instance
redis_queue = RedisQueue()
