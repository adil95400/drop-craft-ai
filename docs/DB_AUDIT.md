# Audit du Schéma Base de Données — Shopopti

> Généré le 2026-02-15. Toutes les phases terminées.

## Résumé des actions réalisées

### ✅ Phase 1 — Unification Jobs (terminée)

Tables supprimées et remplacées par des **vues de compatibilité** pointant vers `jobs` :

| Table supprimée | Remplacée par | Mécanisme |
|---|---|---|
| `background_jobs` | Vue `background_jobs` → `jobs` | INSTEAD OF triggers |
| `import_jobs` | Vue `import_jobs` → `jobs` | INSTEAD OF triggers (metadata JSONB) |
| `product_import_jobs` | Vue `product_import_jobs` → `jobs` | INSTEAD OF triggers |
| `extension_jobs` | Vue `extension_jobs` → `jobs` | INSTEAD OF triggers (metadata JSONB) |

**Table canonique** : `jobs` + `job_items`

### ✅ Phase 2a — Unification Pricing (terminée)

| Table supprimée | Remplacée par | Mécanisme |
|---|---|---|
| `price_rules` | Vue `price_rules` → `pricing_rules` | INSTEAD OF triggers |
| `pricing_rulesets` | Supprimée | — |
| `price_simulations` | Supprimée | — |
| `price_stock_monitoring` | Supprimée (remplacée par query `products`) | — |
| `price_rule_logs` | Supprimée | — |
| `product_pricing_state` | Supprimée | — |
| `price_optimization_results` | Supprimée | — |

**Table canonique** : `pricing_rules` (colonnes ajoutées : `calculation`, `apply_to`, `apply_filter`)

### ✅ Phase 2b — Unification Automation (terminée)

| Table supprimée | Remplacée par | Mécanisme |
|---|---|---|
| `automation_rules` | Vue `automation_rules` → `automation_workflows` | INSTEAD OF triggers |
| `automation_flows` | Supprimée | — |
| `automation_executions` | Supprimée | — |
| `automation_execution_logs` | Supprimée (redirigé vers `activity_logs`) | — |

**Table canonique** : `automation_workflows`

Tables conservées : `automation_triggers`, `automation_actions`, `automated_campaigns`

### ✅ Phase 3 — Nettoyage SEO (terminée)

| Table supprimée | Raison |
|---|---|
| `seo_metadata` | Aucune ref code |
| `seo_page_analysis` | Aucune ref code |
| `seo_competitor_analysis` | Aucune ref code |
| `seo_optimization_history` | Aucune ref code |
| `seo_backlinks` | Aucune ref code |
| `seo_reports` | Aucune ref code |
| `seo_scores` | Aucune ref code (hors types.ts) |

Tables SEO conservées : `seo_audits`, `seo_audit_pages`, `seo_issues`, `seo_keywords`, `product_seo`, `product_seo_versions`

### ✅ Phase 4 — Nettoyage Import (terminée)

| Table supprimée | Raison |
|---|---|
| `import_history` | Aucune ref code (code migré vers `activity_logs`) |
| `import_uploads` | Aucune ref code |
| `import_pipeline_logs` | Aucune ref code |

Tables Import conservées : `imported_products` (160+ refs), `catalog_products` (hooks + edge functions), `import_job_items` (api-v1 edge fn)

### ✅ Phase 5 — Nettoyage Divers (terminée)

| Table supprimée | Raison |
|---|---|
| `request_replay_log` | Aucune ref code |
| `gateway_logs` | Aucune ref code |
| `idempotency_keys` | Aucune ref code |

Tables conservées : `translation_cache`, `translation_usage` (edge functions translate/libretranslate-proxy)

---

## Tables canoniques (Source de Vérité — état final)

| Table | Lignes | Rôle |
|---|---|---|
| `jobs` | 0+ | **Job tracking unifié** |
| `job_items` | 0+ | Résultats par item de job |
| `import_job_items` | 0+ | Items d'import (api-v1) |
| `products` | 25 | Source de vérité catalogue |
| `product_variants` | 25 | Variantes produits |
| `product_sources` | 25 | Sources des produits |
| `imported_products` | 0+ | Produits importés (pré-catalogue) |
| `catalog_products` | 0+ | Catalogue fournisseurs |
| `pricing_rules` | 0+ | Règles de prix unifiées |
| `automation_workflows` | 0+ | Workflows d'automatisation unifiés |
| `activity_logs` | 7 216 | Journal d'activité principal |
| `profiles` | ≥1 | Profils utilisateurs |
| `user_roles` | ≥1 | Rôles utilisateurs |
| `extension_analytics` | ~450 | Analytiques extension |
| `extension_data` | ~300 | Données extension |
| `seo_audits` | 0+ | Audits SEO |
| `seo_audit_pages` | 0+ | Pages d'audit SEO |
| `seo_issues` | 0+ | Problèmes SEO |
| `seo_keywords` | 0+ | Mots-clés SEO |
| `product_seo` | 0+ | SEO produit |
| `product_seo_versions` | 0+ | Historique SEO produit |
| `translation_cache` | 0+ | Cache traductions |
| `translation_usage` | 0+ | Usage traductions |

## Vues de compatibilité actives

| Vue | Table source | Triggers |
|---|---|---|
| `background_jobs` | `jobs` | INSERT, UPDATE, DELETE |
| `import_jobs` | `jobs` | INSERT, UPDATE, DELETE |
| `product_import_jobs` | `jobs` | INSERT, UPDATE, DELETE |
| `extension_jobs` | `jobs` | INSERT, UPDATE, DELETE |
| `price_rules` | `pricing_rules` | INSERT, UPDATE, DELETE |
| `automation_rules` | `automation_workflows` | INSERT, UPDATE, DELETE |

## Tables supprimées au total : ~28

Répartition :
- Jobs : 4 (remplacées par vues)
- Pricing : 7
- Automation : 4 (dont 1 vue)
- SEO : 7
- Import : 3
- Divers : 3
