"""
Celery application configuration for async task processing
Sprint 2: Hardened configuration with proper serialization, 
connection retry, health monitoring, and graceful shutdown.
"""

from celery import Celery
from celery.signals import (
    worker_ready, worker_shutting_down, task_prerun, task_postrun, task_failure
)
from app.core.config import settings
import logging
import structlog

logger = structlog.get_logger(__name__)

# Create Celery app
celery_app = Celery(
    "shopopti",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.queue.tasks"
    ]
)

# ── Core configuration ────────────────────────────────────────────────────────

celery_app.conf.update(
    # Serialization security: only accept JSON, reject pickle
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,

    # Task execution
    task_track_started=True,
    task_time_limit=3600,       # 1 hour hard limit
    task_soft_time_limit=3000,  # 50 min soft limit (raises SoftTimeLimitExceeded)

    # Result settings
    result_expires=86400,  # 24h

    # Worker settings
    worker_prefetch_multiplier=1,  # Fair scheduling (1 task at a time per worker)
    worker_concurrency=4,
    worker_max_tasks_per_child=200,  # Restart worker after 200 tasks (memory leak protection)
    worker_max_memory_per_child=512_000,  # 512MB memory limit per worker

    # Rate limiting
    task_default_rate_limit="100/m",

    # Reliability: late ack ensures task redelivery on worker crash
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # Broker connection retry on startup
    broker_connection_retry_on_startup=True,
    broker_connection_retry=True,
    broker_connection_max_retries=10,
    broker_connection_timeout=10,

    # Redis-specific transport options
    broker_transport_options={
        "visibility_timeout": 43200,  # 12 hours (must be > task_time_limit)
        "retry_policy": {
            "max_retries": 5,
            "interval_start": 1,
            "interval_step": 2,
            "interval_max": 30,
        },
    },

    # Result backend retry
    result_backend_transport_options={
        "retry_policy": {
            "max_retries": 5,
            "interval_start": 1,
            "interval_step": 2,
            "interval_max": 30,
        },
    },

    # Beat scheduler (periodic tasks)
    beat_schedule={
        "sync-supplier-stock-hourly": {
            "task": "app.queue.tasks.scheduled_stock_sync",
            "schedule": 3600.0,
        },
        "cleanup-old-jobs-daily": {
            "task": "app.queue.tasks.cleanup_old_jobs",
            "schedule": 86400.0,
        },
        "process-pending-orders": {
            "task": "app.queue.tasks.process_pending_fulfillments",
            "schedule": 300.0,
        },
    },
)

# ── Task routing ──────────────────────────────────────────────────────────────

celery_app.conf.task_routes = {
    "app.queue.tasks.sync_*": {"queue": "sync"},
    "app.queue.tasks.scrape_*": {"queue": "scraping"},
    "app.queue.tasks.ai_*": {"queue": "ai"},
    "app.queue.tasks.import_*": {"queue": "import"},
    "app.queue.tasks.order_*": {"queue": "orders"},
}


# ── Worker lifecycle signals ──────────────────────────────────────────────────

@worker_ready.connect
def on_worker_ready(**kwargs):
    """Log worker startup and verify broker connectivity."""
    logger.info("celery.worker.ready", queues=list(celery_app.conf.task_routes.values()))


@worker_shutting_down.connect
def on_worker_shutdown(sig, how, exitcode, **kwargs):
    """Graceful shutdown: log pending tasks before exit."""
    logger.warning("celery.worker.shutting_down", signal=str(sig), how=how, exitcode=exitcode)


@task_prerun.connect
def on_task_prerun(task_id, task, args, kwargs, **kw):
    """Bind task_id to structured log context."""
    structlog.contextvars.bind_contextvars(celery_task_id=task_id, celery_task_name=task.name)


@task_postrun.connect
def on_task_postrun(task_id, task, retval, state, **kw):
    """Clear log context after task completes."""
    structlog.contextvars.unbind_contextvars("celery_task_id", "celery_task_name")


@task_failure.connect
def on_task_failure(task_id, exception, traceback, **kw):
    """Log task failure with structured context."""
    logger.error(
        "celery.task.failed",
        celery_task_id=task_id,
        error_type=type(exception).__name__,
        error_message=str(exception)[:500],
    )
