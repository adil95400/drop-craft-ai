# 📊 DATA_MODEL.md — Source of Truth

> Last updated: February 2026

## Tables — Source of Truth (SoT)

| Table | Role | Owner | Notes |
|---|---|---|---|
| `products` | User product catalog | FastAPI / Edge Functions | `title` is SoT (NOT `name`). `name` is legacy nullable, ignored. |
| `product_variants` | Product variants | FastAPI / Edge Functions | `stock_quantity` is SoT for inventory at variant level. |
| `product_images` | Product images | FastAPI / Edge Functions | `url` + `alt_text` are SoT fields. |
| `product_store_links` | Product ↔ Store mapping | FastAPI / Edge Functions | Links products to Shopify/WooCommerce stores. |
| `orders` | Customer orders | FastAPI / Edge Functions | |
| `order_items` | Order line items | FastAPI / Edge Functions | |
| `shops` | Connected stores | Edge Functions | Shopify, WooCommerce, etc. |
| `suppliers` | Supplier integrations | FastAPI | BigBuy, AliExpress, etc. |
| `jobs` | **Unified job tracking** | FastAPI (Celery) / Edge Functions | Replaces `background_jobs`. |
| `job_items` | Per-product job results | FastAPI (Celery) / Edge Functions | Linked to `jobs.id`. |
| `profiles` | User profiles | Supabase Auth trigger | Extended user info. |
| `ai_generations` | AI generation logs | Edge Functions | Tracks cost, tokens, model. |
| `seo_audits` | SEO audit results | Edge Functions | |
| `seo_pages` / `seo_issues` | SEO page-level data | Edge Functions | |
| `audit_logs` | Security audit trail | All backends | Immutable. |

## Deprecated Tables

| Table | Status | Migration Path |
|---|---|---|
| `background_jobs` | **DEPRECATED** | Use `jobs` + `job_items` instead. Will be removed in v2. Frontend fallback still reads it. |
| `catalog_products` | **DEPRECATED** | Was used for supplier catalogs. Use `products` with `supplier` field instead. |

## Field Standardization

### products
| Field | Type | SoT | Notes |
|---|---|---|---|
| `title` | TEXT NOT NULL | ✅ | Product title — primary field |
| `name` | TEXT NULL | ❌ LEGACY | Do NOT use in new code |
| `status` | TEXT | ✅ | Enum: `draft`, `active`, `paused`, `archived`, `error` |
| `stock_quantity` | INTEGER | ✅ | Aggregate stock at product level |
| `price` | NUMERIC | ✅ | Selling price |
| `cost_price` | NUMERIC | ✅ | Cost/purchase price |
| `primary_image_url` | TEXT | ✅ | Denormalized primary image |

### product_variants
| Field | Type | SoT | Notes |
|---|---|---|---|
| `stock_quantity` | INTEGER | ✅ | Per-variant inventory |
| `price` | NUMERIC | ✅ | Variant-specific price |
| `sku` | TEXT | ✅ | Variant SKU |

### product_images
| Field | Type | SoT | Notes |
|---|---|---|---|
| `url` | TEXT NOT NULL | ✅ | Image URL |
| `alt_text` | TEXT | ✅ | Alt text for SEO |
| `position` | INTEGER | ✅ | Display order |
| `is_primary` | BOOLEAN | ✅ | Primary image flag |

## Product Status Enum

```
draft → active → paused → archived
                ↘ error
```

- `draft`: Not yet published
- `active`: Live and selling
- `paused`: Temporarily disabled
- `archived`: Soft deleted
- `error`: Import/sync error

## RLS Strategy

All user-scoped tables enforce `auth.uid() = user_id` via RLS policies.
FastAPI uses `service_role` key but **MUST** always filter by `user_id` from JWT.

## Multi-Tenant Guard

- Frontend: JWT extracted by Supabase client
- Edge Functions: `auth.getUser(token)` — user_id from JWT only
- FastAPI: `get_current_user_id()` dependency — never from request body
