# 🔄 JOBS_MODEL.md — Unified Job Tracking System

> Last updated: February 2026

## Architecture Decision

**Single system: `jobs` + `job_items`** replaces all previous tracking mechanisms.

`background_jobs` is **DEPRECATED** and will be removed. No new code should reference it.

## Tables

### `jobs` — Job Header

| Field | Type | Description |
|---|---|---|
| `id` | UUID PK | Job identifier |
| `user_id` | UUID NOT NULL | Owner (RLS enforced) |
| `job_type` | TEXT NOT NULL | Category: `import`, `scraping`, `sync`, `seo_audit`, `ai_generation`, `pricing`, `publish`, `fulfillment` |
| `job_subtype` | TEXT | Specific action: `csv`, `xml`, `url`, `store`, `bigbuy`, `aliexpress`, etc. |
| `name` | TEXT | Human-readable label (e.g., "Import products.csv") |
| `status` | TEXT NOT NULL | `pending` → `running` → `completed` / `failed` / `cancelled` |
| `total_items` | INTEGER | Expected item count |
| `processed_items` | INTEGER | Items processed so far |
| `failed_items` | INTEGER | Items that failed |
| `progress_percent` | NUMERIC | 0–100 |
| `progress_message` | TEXT | Current step description |
| `celery_task_id` | TEXT | Celery AsyncResult ID (for FastAPI workers) |
| `priority` | INTEGER | 0 = normal, higher = more urgent |
| `input_data` | JSONB | Job configuration/parameters |
| `output_data` | JSONB | Job results summary |
| `metadata` | JSONB | Extra context |
| `error_message` | TEXT | Error description if failed |
| `max_retries` | INTEGER | Max retry count (default: 3) |
| `retries` | INTEGER | Current retry count |
| `duration_ms` | INTEGER | Execution time |
| `started_at` | TIMESTAMPTZ | When execution began |
| `completed_at` | TIMESTAMPTZ | When execution ended |
| `created_at` | TIMESTAMPTZ | Job creation time |
| `updated_at` | TIMESTAMPTZ | Last update |

### `job_items` — Per-Product Results

| Field | Type | Description |
|---|---|---|
| `id` | UUID PK | Item identifier |
| `job_id` | UUID FK → jobs | Parent job |
| `product_id` | UUID FK → products | Affected product (nullable for creation jobs) |
| `status` | TEXT NOT NULL | `pending`, `success`, `error`, `skipped` |
| `message` | TEXT | Result description |
| `error_code` | TEXT | Error classification |
| `before_state` | JSONB | State before operation |
| `after_state` | JSONB | State after operation |
| `processed_at` | TIMESTAMPTZ | When this item was processed |
| `created_at` | TIMESTAMPTZ | Creation time |

## Status Flow

```
pending → running → completed (all items done)
                  → failed (critical error or all items failed)
                  → cancelled (user cancelled)
```

## Job Types Reference

| `job_type` | `job_subtype` | Description |
|---|---|---|
| `import` | `csv`, `xml`, `url`, `api`, `excel` | Product import |
| `scraping` | `product`, `store`, `competitor` | Web scraping |
| `sync` | `stock`, `price`, `orders`, `full` | Supplier sync |
| `seo_audit` | `full`, `quick`, `page` | SEO analysis |
| `ai_generation` | `title`, `description`, `seo`, `bulk` | AI content generation |
| `pricing` | `update`, `rule_apply`, `competitor_match` | Price adjustments |
| `publish` | `shopify`, `woocommerce`, `bulk` | Store publishing |
| `fulfillment` | `single`, `bulk`, `auto` | Order fulfillment |

## Celery Integration

```python
# In Celery task:
from app.queue.tasks import celery_app

@celery_app.task(bind=True)
def import_csv_products(self, user_id, file_content, **kwargs):
    # 1. Create job in DB
    job = create_job(user_id, "import", "csv", celery_task_id=self.request.id)
    
    # 2. Process items
    for row in parse_csv(file_content):
        try:
            product = create_product(row)
            create_job_item(job.id, product.id, "success")
        except Exception as e:
            create_job_item(job.id, None, "error", str(e))
    
    # 3. Finalize job
    update_job(job.id, status="completed")
```

## Frontend Integration

```typescript
// Subscribe to job progress via Realtime
const channel = supabase
  .channel(`job-${jobId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'jobs',
    filter: `id=eq.${jobId}`
  }, (payload) => {
    updateProgress(payload.new)
  })
  .subscribe()
```

## Migration from background_jobs

| `background_jobs` field | `jobs` equivalent |
|---|---|
| `job_type` | `job_type` |
| `status` | `status` (same values) |
| `items_total` | `total_items` |
| `items_processed` | `processed_items` |
| `items_failed` | `failed_items` |
| `progress_percent` | `progress_percent` |
| `progress_message` | `progress_message` |
| `error_message` | `error_message` |
| `input_data` | `input_data` |
| `output_data` | `output_data` |
| `metadata` | `metadata` |

Frontend hooks should query `jobs` first, with `background_jobs` as read-only fallback during transition.

## RLS

- `jobs`: `auth.uid() = user_id` for SELECT/INSERT/UPDATE
- `job_items`: Access via JOIN on `jobs.user_id = auth.uid()`
- Realtime enabled on both tables
