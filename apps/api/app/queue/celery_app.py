"""
Celery application configuration for async task processing
"""

from celery import Celery
from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "shopopti",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.queue.tasks"
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task execution
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3000,  # 50 min soft limit
    
    # Result settings
    result_expires=86400,  # Results expire after 24h
    
    # Worker settings
    worker_prefetch_multiplier=1,  # Fair scheduling
    worker_concurrency=4,  # 4 concurrent tasks per worker
    
    # Rate limiting
    task_default_rate_limit="100/m",  # 100 tasks per minute default
    
    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Beat scheduler (periodic tasks)
    beat_schedule={
        "sync-supplier-stock-hourly": {
            "task": "app.queue.tasks.scheduled_stock_sync",
            "schedule": 3600.0,  # Every hour
        },
        "cleanup-old-jobs-daily": {
            "task": "app.queue.tasks.cleanup_old_jobs",
            "schedule": 86400.0,  # Every 24 hours
        },
        "process-pending-orders": {
            "task": "app.queue.tasks.process_pending_fulfillments",
            "schedule": 300.0,  # Every 5 minutes
        }
    }
)


# Task routing
celery_app.conf.task_routes = {
    "app.queue.tasks.sync_*": {"queue": "sync"},
    "app.queue.tasks.scrape_*": {"queue": "scraping"},
    "app.queue.tasks.ai_*": {"queue": "ai"},
    "app.queue.tasks.import_*": {"queue": "import"},
    "app.queue.tasks.order_*": {"queue": "orders"},
}
