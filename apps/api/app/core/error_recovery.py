"""
Error recovery middleware for Celery tasks.
Sprint 2: Enhanced with structured logging, DLQ metrics, and
configurable retry policies per error category.
"""

from celery import Task
from datetime import datetime
import structlog
import random

logger = structlog.get_logger(__name__)

# ── Error classification ─────────────────────────────────────────────────────

TRANSIENT_ERRORS = frozenset({
    "ConnectionError", "TimeoutError", "HTTPError",
    "OperationalError", "InterfaceError", "ConnectionRefusedError",
    "BrokenPipeError", "ConnectionResetError", "OSError",
})

PERMANENT_ERRORS = frozenset({
    "ValidationError", "ValueError", "KeyError",
    "PermissionError", "AuthenticationError", "TypeError",
    "AttributeError",
})

# Rate-limit errors: retry with longer backoff
RATE_LIMIT_ERRORS = frozenset({
    "RateLimitError", "TooManyRequestsError",
})


def classify_error(exc: Exception) -> str:
    """Classify an exception as transient, permanent, or rate_limited."""
    exc_type = type(exc).__name__
    if exc_type in PERMANENT_ERRORS:
        return "permanent"
    if exc_type in RATE_LIMIT_ERRORS:
        return "rate_limited"
    if exc_type in TRANSIENT_ERRORS:
        return "transient"
    # Check by message patterns
    msg = str(exc).lower()
    if any(kw in msg for kw in ("rate limit", "429", "too many requests")):
        return "rate_limited"
    if any(kw in msg for kw in ("timeout", "connection refused", "connection reset")):
        return "transient"
    # Default: treat unknown errors as transient (allow retry)
    return "transient"


def exponential_backoff(retry_count: int, base_delay: int = 30, max_delay: int = 600) -> int:
    """Calculate exponential backoff with jitter (decorrelated)."""
    delay = min(base_delay * (2 ** retry_count), max_delay)
    jitter = random.uniform(0, delay * 0.3)
    return int(delay + jitter)


def rate_limit_backoff(retry_count: int) -> int:
    """Longer backoff for rate-limited requests."""
    return exponential_backoff(retry_count, base_delay=60, max_delay=1800)


# ── Resilient Task base class ─────────────────────────────────────────────────

class ResilientTask(Task):
    """
    Base Celery task with built-in error recovery, structured logging,
    and dead-letter queue tracking.

    Usage:
        @shared_task(bind=True, base=ResilientTask, max_retries=3)
        def my_task(self, ...):
            ...
    """

    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Called when task permanently fails (max retries exhausted)."""
        error_class = classify_error(exc)
        logger.error(
            "celery.task.dead_letter",
            task_id=task_id,
            task_name=self.name,
            error_type=type(exc).__name__,
            error_class=error_class,
            error_message=str(exc)[:500],
            retries_exhausted=True,
        )
        self._record_dead_letter(task_id, exc, args, kwargs)

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Called when task is retried."""
        retry_count = self.request.retries or 0
        error_class = classify_error(exc)
        countdown = (
            rate_limit_backoff(retry_count)
            if error_class == "rate_limited"
            else exponential_backoff(retry_count)
        )
        logger.warning(
            "celery.task.retry",
            task_id=task_id,
            task_name=self.name,
            error_type=type(exc).__name__,
            error_class=error_class,
            retry_count=retry_count,
            max_retries=self.max_retries,
            backoff_seconds=countdown,
        )

    def retry_with_backoff(self, exc: Exception, **kwargs):
        """Retry with appropriate backoff, or fail immediately for permanent errors."""
        error_class = classify_error(exc)

        if error_class == "permanent":
            logger.error(
                "celery.task.permanent_failure",
                task_name=self.name,
                error=str(exc)[:500],
            )
            raise exc

        retry_count = self.request.retries or 0

        if error_class == "rate_limited":
            countdown = rate_limit_backoff(retry_count)
        else:
            countdown = exponential_backoff(retry_count)

        logger.info(
            "celery.task.scheduling_retry",
            task_name=self.name,
            countdown=countdown,
            attempt=retry_count + 1,
            error_class=error_class,
        )
        raise self.retry(exc=exc, countdown=countdown, **kwargs)

    def _record_dead_letter(self, task_id: str, exc: Exception, args, kwargs):
        """Record permanently failed task in the `jobs` table for manual review."""
        try:
            from app.core.database import get_supabase
            supabase = get_supabase()

            supabase.table("jobs").update({
                "status": "failed",
                "error_message": f"[DEAD LETTER] {type(exc).__name__}: {str(exc)[:500]}",
                "metadata": {
                    "dead_letter": True,
                    "error_class": classify_error(exc),
                    "error_type": type(exc).__name__,
                    "final_failure_at": datetime.utcnow().isoformat(),
                    "retries_exhausted": True,
                    "task_args_summary": str(args)[:200] if args else None,
                },
                "completed_at": datetime.utcnow().isoformat(),
            }).eq("id", task_id).execute()

        except Exception as db_err:
            logger.error("celery.dead_letter.db_failed", task_id=task_id, error=str(db_err))
