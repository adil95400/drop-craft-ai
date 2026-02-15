# 📊 DATA_MODEL.md — Source of Truth

> Last updated: February 2026 (post-unification Phases 1–5)

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
| `jobs` | **Unified job tracking** | FastAPI (Celery) / Edge Functions | Canonical table. All async tasks write here. |
| `job_items` | Per-product job results | FastAPI (Celery) / Edge Functions | Linked to `jobs.id`. |
| `import_job_items` | Per-item import results | Edge Functions (api-v1) | Used by api-v1 for granular import tracking. |
| `imported_products` | Pre-catalog imported products | Edge Functions | Products before promotion to `products`. |
| `profiles` | User profiles | Supabase Auth trigger | Extended user info. |
| `ai_generations` | AI generation logs | Edge Functions | Tracks cost, tokens, model. |
| `seo_audits` | SEO audit results | Edge Functions | |
| `seo_audit_pages` | SEO page-level data | Edge Functions | |
| `seo_issues` | SEO issues per page | Edge Functions | |
| `seo_keywords` | Tracked keywords | Hooks | |
| `product_seo` | Product SEO metadata | Edge Functions (api-v1) | |
| `product_seo_versions` | Product SEO history | Edge Functions (api-v1) | |
| `pricing_rules` | **Unified pricing rules** | FastAPI / Edge Functions | Canonical table. Absorbed `price_rules`, `pricing_rulesets`. |
| `automation_workflows` | **Unified automation workflows** | FastAPI / Edge Functions | Canonical table. Absorbed `automation_rules`, `automation_flows`. |
| `activity_logs` | Activity journal | All backends | Also serves as execution log for automations. |
| `audit_logs` | Security audit trail | All backends | Immutable. |
| `translation_cache` | Translation cache | Edge Functions | Used by translate/libretranslate-proxy. |
| `translation_usage` | Translation billing | Edge Functions | Tracks usage per user. |

## Compatibility Views (Phase 1–2)

| View | Source Table | Purpose |
|---|---|---|
| `background_jobs` | `jobs` | Legacy compat — INSTEAD OF triggers |
| `import_jobs` | `jobs` | Legacy compat — INSTEAD OF triggers |
| `product_import_jobs` | `jobs` | Legacy compat — INSTEAD OF triggers |
| `extension_jobs` | `jobs` | Legacy compat — INSTEAD OF triggers |
| `price_rules` | `pricing_rules` | Legacy compat — INSTEAD OF triggers |
| `automation_rules` | `automation_workflows` | Legacy compat — INSTEAD OF triggers |
| `background_jobs_compat` | `jobs` | Read-only compat view |

## Deprecated / Removed Tables (Phases 1–5)

| Table | Phase | Migration Path |
|---|---|---|
| `background_jobs` | 1 | → View on `jobs` |
| `import_jobs` | 1 | → View on `jobs` |
| `product_import_jobs` | 1 | → View on `jobs` |
| `extension_jobs` | 1 | → View on `jobs` |
| `price_rules` (table) | 2a | → View on `pricing_rules` |
| `pricing_rulesets` | 2a | Dropped |
| `price_simulations` | 2a | Dropped |
| `price_stock_monitoring` | 2a | Dropped (use `products` query) |
| `price_rule_logs` | 2a | Dropped |
| `product_pricing_state` | 2a | Dropped |
| `price_optimization_results` | 2a | Dropped |
| `automation_rules` (table) | 2b | → View on `automation_workflows` |
| `automation_flows` | 2b | Dropped |
| `automation_executions` | 2b | Dropped |
| `automation_execution_logs` | 2b | Dropped (use `activity_logs`) |
| `seo_metadata` | 3 | Dropped |
| `seo_page_analysis` | 3 | Dropped |
| `seo_competitor_analysis` | 3 | Dropped |
| `seo_optimization_history` | 3 | Dropped |
| `seo_backlinks` | 3 | Dropped |
| `seo_reports` | 3 | Dropped |
| `seo_scores` | 3 | Dropped |
| `import_history` | 4 | Dropped (use `activity_logs`) |
| `import_uploads` | 4 | Dropped |
| `import_pipeline_logs` | 4 | Dropped |
| `request_replay_log` | 5 | Dropped |
| `gateway_logs` | 5 | Dropped |
| `idempotency_keys` | 5 | Dropped |

## Field Standardization

### products
| Field | Type | SoT | Notes |
|---|---|---|---|
| `title` | TEXT NOT NULL | ✅ | Product title — primary field |
| `name` | TEXT NULL | ❌ LEGACY | Do NOT use in new code |
| `status` | TEXT | ✅ | CHECK: `draft`, `active`, `paused`, `archived`, `error` |
| `stock_quantity` | INTEGER | ✅ | Aggregate stock at product level |
| `price` | NUMERIC | ✅ | Selling price |
| `cost_price` | NUMERIC | ✅ | Cost/purchase price |
| `primary_image_url` | TEXT | ✅ | Denormalized primary image |
| `supplier` | TEXT | ✅ | Supplier name (bigbuy, aliexpress, etc.) |
| `supplier_product_id` | TEXT | ✅ | External product ID from supplier |

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

## Backend Write Targets (Post-Unification)

| Operation | Target Table | Writer |
|---|---|---|
| Celery supplier sync | `products` | FastAPI worker |
| Celery import (CSV/XML) | `products` | FastAPI worker |
| Celery scraping | `products` + `job_items` | FastAPI worker |
| SEO audit | `seo_audits` + `jobs` | FastAPI endpoint |
| SEO AI generate | `ai_generations` + `jobs` | FastAPI endpoint |
| SEO fix apply | `products` + `jobs` | FastAPI endpoint |
| All job tracking | `jobs` + `job_items` | All backends |
| Pricing rules | `pricing_rules` | All backends |
| Automation workflows | `automation_workflows` | All backends |

## RLS Strategy

All user-scoped tables enforce `auth.uid() = user_id` via RLS policies.
FastAPI uses `service_role` key but **MUST** always filter by `user_id` from JWT.

## Multi-Tenant Guard

- Frontend: JWT extracted by Supabase client
- Edge Functions: `auth.getUser(token)` — user_id from JWT only
- FastAPI: `get_current_user_id()` dependency — never from request body
