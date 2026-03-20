# Edge Functions Consolidation Map
# Target: ~387 functions → ~80 hubs

## ✅ Already Consolidated
| Hub | Replaces | Status |
|-----|----------|--------|
| `unified-ai` | ai-optimizer, ai-product-description, ai-product-descriptions, ai-seo-optimizer, ai-content-generator, ai-marketing-content, ai-price-optimizer, ai-recommendations-engine | ✅ Active |
| `api-v1` | Multiple CRUD endpoints | ✅ Active |
| `robust-import-pipeline` | csv-import, url-import, process-import, bulk-import-products | ✅ Active |

## 🔄 Phase 1 — AI Hub (Priority)
**Target hub: `unified-ai`** (already exists)

Functions to deprecate (redirect to unified-ai):
- `ai-auto-actions` → unified-ai?action=auto-actions
- `ai-catalog-analysis` → unified-ai?action=catalog-analysis
- `ai-copywriter` → unified-ai?action=generate-description
- `ai-demand-predictor` → unified-ai?action=predictive-analytics
- `ai-dynamic-pricing` → unified-ai?action=price-optimization
- `ai-enrich-import` → unified-ai?action=enrich-import
- `ai-image-enhancer` → unified-ai?action=image-enhance
- `ai-insights` → unified-ai?action=insights
- `ai-intelligence` → unified-ai?action=intelligence
- `ai-optimize-product` → unified-ai?action=optimize-product
- `ai-performance-advisor` → unified-ai?action=performance
- `ai-predictive-ml` → unified-ai?action=predictive-analytics
- `ai-product-optimizer` → unified-ai?action=optimize-product
- `ai-product-research` → unified-ai?action=product-research
- `ai-revenue-forecaster` → unified-ai?action=revenue-forecast
- `ai-review-analysis` → unified-ai?action=review-analysis
- `ai-sentiment-analysis` → unified-ai?action=sentiment
- `ai-social-posts` → unified-ai?action=generate-marketing
- `ai-trend-predictor` → unified-ai?action=trends
- `ai-winning-product-scanner` → unified-ai?action=winning-scanner
- `bulk-ai-optimizer` → unified-ai?action=bulk-optimize

**Savings: ~21 functions removed**

## 🔄 Phase 2 — Sync Hub
**Target hub: `unified-sync-orchestrator`** (exists)

Functions to deprecate:
- `sync-connected-stores`, `sync-customers-to-channels`, `sync-orders-to-channels`
- `sync-prices-to-channels`, `sync-stock-to-channels`, `sync-tracking-to-channels`
- `sync-integration`, `sync-marketplace`, `cron-sync`, `track-sync`
- `advanced-sync`, `bidirectional-sync`, `channel-sync-bidirectional`
- `cross-marketplace-sync`, `auto-sync-channels`
- `shopify-sync`, `shopify-sync-stock`, `shopify-auto-sync`, `shopify-complete-sync`
- `woocommerce-sync`, `prestashop-sync`
- `stock-sync-realtime`, `stock-price-sync`, `price-sync-auto`

**Savings: ~23 functions removed**

## 🔄 Phase 3 — Supplier Hub
**Target hub: `supplier-hub`** (to create)

Functions to consolidate:
- `supplier-connect`, `supplier-connect-advanced`, `supplier-connectors`
- `supplier-api-connector`, `supplier-catalog-sync`, `supplier-compare`
- `supplier-fallback-check`, `supplier-health-check`, `supplier-ingestion`
- `supplier-marketplace-sync`, `supplier-order-place`, `supplier-price-update`
- `supplier-scorer`, `supplier-stock-monitor`, `supplier-sync-cron`
- `supplier-sync-products`, `supplier-sync`, `supplier-test-connection`
- `supplier-ai-recommendations`, `premium-supplier-connect`, `premium-suppliers`
- `find-supplier`, `backup-supplier-finder`, `analyze-supplier`
- `compare-supplier-prices`, `import-suppliers`

**Savings: ~25 functions removed**

## 🔄 Phase 4 — Orders & Fulfillment Hub
**Target hub: `order-hub`** (to create)

Functions to consolidate:
- `auto-order-complete`, `auto-order-queue`, `order-automation-processor`
- `order-fulfillment-auto`, `order-management`, `order-tracking`
- `pending-orders`, `retry-failed-orders`, `auto-fulfillment-engine`
- `shipment-create`, `carrier-connect`, `carrier-select-auto`
- `carrier-tracking-fetch`, `carrier-tracking-realtime`, `carrier-tracking-webhook`
- `returns-automation`, `returns-disputes-manager`, `returns-processor`
- `returns-workflow-automation`, `refund-automation-processor`
- `auto-refund-engine`, `disputes-manager`

**Savings: ~22 functions removed**

## 🔄 Phase 5 — SEO Hub
**Target hub: `seo-hub`** (to create)

Functions to consolidate:
- `seo-ai-engine`, `seo-ai-generate`, `seo-audit`
- `seo-content-ai`, `seo-fix-apply`, `seo-issues`
- `seo-multilingual-translate`, `seo-optimizer`
- `audit-product`, `batch-audit-catalog`

**Savings: ~10 functions removed**

## Summary
| Phase | Functions Removed | Running Total |
|-------|-------------------|---------------|
| Phase 1 (AI) | 21 | 366 |
| Phase 2 (Sync) | 23 | 343 |
| Phase 3 (Suppliers) | 25 | 318 |
| Phase 4 (Orders) | 22 | 296 |
| Phase 5 (SEO) | 10 | 286 |
| **Future phases** | ~200 | **~80** |
