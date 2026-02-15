"""
Error recovery middleware for Celery tasks.
Implements:
- Exponential backoff with jitter
- Dead-letter tracking for permanently failed tasks
- Structured error categorization
"""

from celery import Task
from typing import Optional
from datetime import datetime
import logging
import random

logger = logging.getLogger(__name__)

# Error categories for structured tracking
TRANSIENT_ERRORS = (
    "ConnectionError", "TimeoutError", "HTTPError",
    "OperationalError", "InterfaceError",
)

PERMANENT_ERRORS = (
    "ValidationError", "ValueError", "KeyError",
    "PermissionError", "AuthenticationError",
)


def classify_error(exc: Exception) -> str:
    """Classify an exception as transient or permanent."""
    exc_type = type(exc).__name__
    if exc_type in PERMANENT_ERRORS:
        return "permanent"
    if exc_type in TRANSIENT_ERRORS:
        return "transient"
    # Default: treat unknown errors as transient (allow retry)
    return "transient"


def exponential_backoff(retry_count: int, base_delay: int = 30, max_delay: int = 600) -> int:
    """Calculate exponential backoff with jitter."""
    delay = min(base_delay * (2 ** retry_count), max_delay)
    jitter = random.uniform(0, delay * 0.3)
    return int(delay + jitter)


class ResilientTask(Task):
    """
    Base Celery task with built-in error recovery.
    
    Usage:
        @shared_task(bind=True, base=ResilientTask, max_retries=3)
        def my_task(self, ...):
            ...
    """
    
    abstract = True
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Called when task permanently fails (max retries exhausted)."""
        logger.error(
            f"Task {self.name} permanently failed",
            extra={
                "task_id": task_id,
                "error_type": type(exc).__name__,
                "error_class": classify_error(exc),
                "error_message": str(exc),
                "retries_exhausted": True,
            }
        )
        # Record to dead-letter in DB
        self._record_dead_letter(task_id, exc, args, kwargs)
    
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Called when task is retried."""
        retry_count = self.request.retries or 0
        logger.warning(
            f"Task {self.name} retrying ({retry_count}/{self.max_retries})",
            extra={
                "task_id": task_id,
                "error_type": type(exc).__name__,
                "retry_count": retry_count,
                "backoff_seconds": exponential_backoff(retry_count),
            }
        )
    
    def retry_with_backoff(self, exc: Exception, **kwargs):
        """Retry with exponential backoff, or fail immediately for permanent errors."""
        error_class = classify_error(exc)
        
        if error_class == "permanent":
            logger.error(f"Permanent error in {self.name}, not retrying: {exc}")
            raise exc
        
        retry_count = self.request.retries or 0
        countdown = exponential_backoff(retry_count)
        
        logger.info(f"Retrying {self.name} in {countdown}s (attempt {retry_count + 1})")
        raise self.retry(exc=exc, countdown=countdown, **kwargs)
    
    def _record_dead_letter(self, task_id: str, exc: Exception, args, kwargs):
        """Record permanently failed task for manual review."""
        try:
            from app.core.database import get_supabase
            supabase = get_supabase()
            
            # Update job status to 'dead_letter' for visibility
            supabase.table("jobs").update({
                "status": "failed",
                "error_message": f"[DEAD LETTER] {type(exc).__name__}: {str(exc)[:500]}",
                "metadata": {
                    "dead_letter": True,
                    "error_class": classify_error(exc),
                    "error_type": type(exc).__name__,
                    "final_failure_at": datetime.utcnow().isoformat(),
                    "retries_exhausted": True,
                },
                "completed_at": datetime.utcnow().isoformat(),
            }).eq("id", task_id).execute()
            
        except Exception as db_err:
            logger.error(f"Failed to record dead letter for {task_id}: {db_err}")
