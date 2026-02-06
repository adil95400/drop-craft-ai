# ✅ Fonctions Nettoyées

Ce document documente les fonctions obsolètes qui ont été supprimées.

## Nettoyage Batch 2 — 45 fonctions non-référencées supprimées

Fonctions supprimées car jamais invoquées dans le frontend (src/) :
- ai-ad-creator, ai-ad-creator-complete, ai-content-secure
- enrich-product, enrich-product-ai, conversion-analytics, seed-dev
- aliexpress-integration, aliexpress-api, amazon-pa-api, amazon-seller-api
- ebay-browse-api, ebay-trading-api, global-seo-scanner
- shopify-webhook-handler, shopify-webhook, shopify-auth, shopify-product-create, sync-shopify
- supplier-import-csv, supplier-order-automation, supplier-place-order
- supplier-webhook-bigbuy, supplier-webhook-cj, supplier-webhook-handler, supplier-webhooks
- stock-auto-update, stock-sync-cross-marketplace, prestashop-sync-products
- sync-all-tracking, sync-orders-to-channels, sync-stock-to-channels, sync-tracking-to-channels
- tracking-sync, unified-channel-webhooks, webhook-delivery, creative-generation
- winners-amazon, winners-ebay, maintenance, api
- bts-csv-import, import-bts-csv, secure-integration-credentials, secure-supplier-credentials

## Nettoyage du 2026-02-06 — 54 fonctions supprimées

### Dev/Test (6)
- `example-secure-function` — exemple de code
- `generate-test-data` — générateur de données test
- `generate-realistic-data` — générateur de données test
- `simulate-optimization` — simulation mock
- `sso-manager` — devrait être config auth, pas edge function
- `cli-manager` — pas pertinent en web API

### Sync doublons (9)
- `automated-sync` → supersédé par fonctions sync spécifiques
- `cron-stock-sync` → `stock-price-sync` utilisé à la place
- `auto-sync-scheduler` → `auto-sync-channels` utilisé
- `supplier-sync-engine` → `supplier-sync-products` utilisé
- `supplier-unified-sync` → `supplier-catalog-sync` utilisé
- `sync-suppliers` → `supplier-sync-products` utilisé
- `shopify-sync-export` → `shopify-operations` utilisé
- `shopify-sync-import` → `shopify-store-import` utilisé
- `shopify-integration` → `shopify-sync` utilisé

### Intégrations non invoquées (9)
- `channel-sync-bidirectional` → `advanced-sync` utilisé
- `integration-oauth` → `oauth-supplier` utilisé
- `integration-webhook` → webhooks spécifiques utilisés
- `integration-health-monitor` → `system-health-check` utilisé
- `image-optimization` → `global-image-optimizer` utilisé
- `instagram-shopping` — jamais implémenté
- `process-price-sync-queue` — orchestrateur interne non utilisé
- `customer-behavior-analysis` — jamais invoqué
- `enterprise-scalability` — jamais invoqué

### Extensions doublons (14)
- `extension-import-collection` → `extension-realtime-import` utilisé
- `extension-import-product` → `extension-product-importer` utilisé
- `extension-ai-optimize` → `ai-optimizer` utilisé
- `extension-gateway` — jamais invoqué
- `extension-notifications` → `send-notification` utilisé
- `extension-scraper` → `extension-realtime-import` utilisé
- `extension-selectors` — jamais invoqué
- `extension-stock-alert` → `extension-price-monitor` utilisé
- `extension-supplier-search` — jamais invoqué
- `extension-sync-stock` → `extension-sync-realtime` utilisé
- `extension-sync` → `extension-sync-realtime` utilisé
- `extension-import-reviews` → `extension-review-importer` utilisé
- `extension-import-videos` — jamais invoqué
- `extension-job-status` — jamais invoqué

### Marketing/Marketplace doublons (6)
- `marketing-integration` — jamais invoqué
- `marketing-store-sync` — jamais invoqué
- `marketing-intelligence` — jamais invoqué
- `marketing-optimization` — jamais invoqué
- `marketplace-webhook` — jamais invoqué depuis frontend
- `oauth-setup` → `oauth-supplier` utilisé

### Autres doublons (10)
- `store-webhooks` → `shopify-webhook` utilisé
- `webhook-handler` → `webhook-delivery` utilisé
- `import-to-store` → `import-to-shopify` utilisé
- `import-reviews` → `extension-review-importer` utilisé
- `order-automation` → `order-automation-processor` utilisé
- `label-generate` → `label-generate-real` utilisé
- `bigbuy-sync` → `bigbuy-integration` utilisé
- `btswholesaler-sync` → `bts-feed-sync` utilisé
- `supplier-scheduler` — jamais invoqué
- `process-unified-sync-queue` — orchestrateur interne

## Nettoyages précédents

| Date | Fonction | Raison |
|------|----------|--------|
| 2025-01-21 | unified-payments | Mock complet |
| 2025-01-21 | unified-management | Mock complet |
| 2025-01-21 | unified-integrations | Duplications + mocks |
| 2025-12-06 | canva-design-optimizer | Mock sans API Canva |

## Nettoyage du 2026-02-06 (batch 3) — 5 fonctions non référencées supprimées

- `facebook-shops` — jamais invoqué depuis src/
- `analyze-channel-readiness` — jamais invoqué depuis src/
- `list-user-stores` — jamais invoqué depuis src/
- `metrics-collector` — jamais invoqué depuis src/
- `price-stock-cron` — jamais invoqué depuis src/

## Résumé

| Métrique | Avant | Après |
|----------|-------|-------|
| Edge Functions totales | ~400+ | ~285 |
| Fonctions supprimées (total) | 4 | 63 |
| Doublons éliminés | 0 | 40+ |
