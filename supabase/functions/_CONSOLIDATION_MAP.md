# Edge Functions Consolidation Map
# Target: ~387 functions → ~80 hubs

## ✅ Already Consolidated (Phase 1 — AI)
| Hub | Replaces | Status |
|-----|----------|--------|
| `unified-ai` | 21 AI functions (ai-optimizer, ai-product-descriptions, ai-seo-optimizer, ai-content-generator, ai-marketing-content, ai-price-optimizer, ai-recommendations-engine, ai-demand-predictor, ai-dynamic-pricing, ai-optimize-product, ai-pricing-optimizer, ai-social-posts + 9 more) | ✅ Active + proxys |
| `api-v1` | Multiple CRUD endpoints | ✅ Active |
| `robust-import-pipeline` | csv-import, url-import, process-import, bulk-import-products | ✅ Active |

## ✅ Phase 2 — Sync Hub (Completed)
**Hub: `unified-sync-orchestrator`** — orchestrates all sync operations
- Existing sync functions kept running (substantial implementations)
- New code should invoke `unified-sync-orchestrator` with `sync_types` param

## ✅ Phase 3 — Supplier Hub (Completed)
**Hub: `supplier-hub`** — 9 actions: connect, test, health-check, compare, score, catalog-sync, stock-monitor, price-update, find
- Created as new consolidated hub
- Existing supplier functions (25) remain active for backward compat

## ✅ Phase 4 — Orders & Fulfillment Hub (Completed)
**Hub: `order-hub`** — 10 actions: list, track, fulfill, cancel, return, refund, retry-failed, auto-queue, shipping-rate, disputes
- Created as new consolidated hub
- Existing order functions (22) remain active for backward compat

## ✅ Phase 5 — SEO Hub (Completed)
**Hub: `seo-hub`** — 5 actions: audit, generate, fix, issues, score (with AI via Lovable Gateway)
- Created as new consolidated hub
- Existing SEO functions (10) remain active for backward compat

## Migration Strategy
New frontend code should use hub functions exclusively. Legacy functions will continue working but are not receiving updates.

### Hub Function Invocation Pattern
```typescript
// Instead of: supabase.functions.invoke('supplier-health-check', ...)
// Use:
supabase.functions.invoke('supplier-hub', {
  body: { action: 'health-check', ...params }
})
```

## Summary
| Phase | Hub | Actions | Status |
|-------|-----|---------|--------|
| 1 | `unified-ai` | 21 AI tasks | ✅ Active |
| 2 | `unified-sync-orchestrator` | 6 sync types | ✅ Active |
| 3 | `supplier-hub` | 9 supplier ops | ✅ Created |
| 4 | `order-hub` | 10 order ops | ✅ Created |
| 5 | `seo-hub` | 5 SEO tasks | ✅ Created |
| - | `api-v1` | CRUD | ✅ Active |
| - | `robust-import-pipeline` | 4 import types | ✅ Active |
| **Total** | **7 hubs** | **~66 actions** | **Active** |

Remaining ~380 functions: kept for backward compatibility, no updates.
New development uses hub pattern exclusively.
