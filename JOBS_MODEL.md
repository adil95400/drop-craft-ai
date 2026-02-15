# 🔄 JOBS_MODEL.md — Unified Job Tracking System

> Last updated: February 2026

## Architecture Decision

**Single system: `jobs` + `job_items`** replaces all previous tracking mechanisms.

`background_jobs` is **DEPRECATED** and will be removed. No new code should reference it.
A compatibility view `background_jobs_compat` exists for read-only fallback during transition.

## Migration Status (P0.2 — COMPLETED)

| Component | Status | Notes |
|---|---|---|
| Celery tasks (`tasks.py`) | ✅ Migrated | All 6 task types write to `jobs` via helpers |
| SEO endpoints (`seo.py`) | ✅ Migrated | audit, ai_generate, fix → `jobs` |
| Import endpoints (`imports.py`) | ✅ Migrated | Async via Celery `.delay()`, HTTP 202 |
| Scraping endpoints (`scraping.py`) | ✅ Already async | Uses `.delay()`, returns `job_id` |
| Frontend hooks | ✅ Migrated | `useBackgroundJobs` reads `jobs` table |
| Frontend realtime | ✅ Migrated | `useAIEnrichment` listens to `jobs` table |
| Supplier services | ✅ Migrated | BigBuy/AliExpress write to `products` (not `catalog_products`) |

## Tables

### `jobs` — Job Header

| Field | Type | Description |
|---|---|---|
| `id` | UUID PK | Job identifier |
| `user_id` | UUID NOT NULL | Owner (RLS enforced) |
| `job_type` | TEXT NOT NULL | Category: `import`, `scraping`, `sync`, `seo_audit`, `ai_generation`, `pricing`, `publish`, `fulfillment` |
| `job_subtype` | TEXT | Specific action: `csv`, `xml`, `url`, `store`, `bigbuy`, `aliexpress`, `fix`, `seo`, etc. |
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
| `scraping` | `url`, `store`, `competitor` | Web scraping |
| `sync` | `stock`, `price`, `orders`, `full` | Supplier sync |
| `seo_audit` | `full`, `quick`, `page`, `fix` | SEO analysis + fixes |
| `ai_generation` | `title`, `description`, `seo`, `bulk` | AI content generation |
| `ai_enrich` | `bulk` | AI product enrichment |
| `pricing` | `update`, `rule_apply`, `competitor_match` | Price adjustments |
| `publish` | `shopify`, `woocommerce`, `bulk` | Store publishing |
| `fulfillment` | `single`, `bulk`, `auto` | Order fulfillment |

## Celery Integration

```python
# In Celery task — use helper functions:
from app.queue.tasks import _upsert_job, _complete_job, _fail_job

@shared_task(bind=True)
def my_task(self, user_id, **kwargs):
    job_id = self.request.id
    supabase = get_supabase()
    
    _upsert_job(supabase, job_id, user_id, "import", job_subtype="csv",
                name="Import products.csv")
    
    try:
        # Process items...
        _complete_job(supabase, job_id, output_data=result,
                      processed=10, failed=0, total=10)
    except Exception as exc:
        _fail_job(supabase, job_id, str(exc))
        raise self.retry(exc=exc)
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

## RLS

- `jobs`: `auth.uid() = user_id` for SELECT/INSERT/UPDATE
- `job_items`: Access via JOIN on `jobs.user_id = auth.uid()`
- Realtime enabled on both tables
