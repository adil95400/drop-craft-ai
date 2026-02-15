# Audit du Schéma Base de Données — Shopopti

> Généré le 2026-02-15. Mis à jour après Phases 1 & 2.

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
| `pricing_rulesets` | Supprimée (aucune donnée, peu de refs) | — |
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

**Table canonique** : `automation_workflows` (colonnes ajoutées pour trigger/action configs)

Tables conservées : `automation_triggers`, `automation_actions`, `automated_campaigns` (référencées activement)

---

## Tables canoniques (Source de Vérité)

| Table | Lignes | Rôle |
|---|---|---|
| `jobs` | 0+ | **Job tracking unifié** (remplace background_jobs, import_jobs, etc.) |
| `job_items` | 0+ | Résultats par item de job |
| `products` | 25 | Source de vérité catalogue |
| `product_variants` | 25 | Variantes produits |
| `product_sources` | 25 | Sources des produits |
| `pricing_rules` | 0+ | Règles de prix unifiées |
| `automation_workflows` | 0+ | Workflows d'automatisation unifiés |
| `activity_logs` | 7 216 | Journal d'activité principal |
| `profiles` | ≥1 | Profils utilisateurs |
| `user_roles` | ≥1 | Rôles utilisateurs |
| `extension_analytics` | ~450 | Analytiques extension |
| `extension_data` | ~300 | Données extension |

---

## Phases restantes

### Phase 3 — SEO (13 tables, toutes vides)

| Table | Action recommandée |
|---|---|
| `seo_audits` | **Garder** — utilisée par `useSEOAudits.ts` |
| `seo_scores` | **Garder** — utilisée par `ProductSEO.tsx` |
| `seo_keywords` | **Garder** — utilisée par `useSEOAudits.ts` |
| `seo_audit_pages` | **Garder** — utilisée par `useSEOAudits.ts` |
| `seo_issues` | À évaluer (types seulement) |
| `product_seo` | Candidat suppression |
| `product_seo_versions` | Candidat suppression |
| `seo_metadata` | Candidat suppression |
| `seo_page_analysis` | Candidat suppression |
| `seo_competitor_analysis` | Candidat suppression |
| `seo_optimization_history` | Candidat suppression |
| `seo_backlinks` | Candidat suppression |
| `seo_reports` | Candidat suppression |

### Phase 4 — Import (tables redondantes)

| Table | Action recommandée |
|---|---|
| `imported_products` | **Garder** — utilisée par `ImportedProductsPage.tsx` |
| `catalog_products` | **DEPRECATED** — redirigé vers `products` avec champ `supplier` |
| `import_history` | Candidat suppression |
| `import_uploads` | Candidat suppression |
| `import_pipeline_logs` | Candidat suppression |

### Phase 5 — Autres candidats à nettoyage

| Table | Raison |
|---|---|
| `request_replay_log` | Aucune ref code |
| `gateway_logs` | Aucune ref code |
| `idempotency_keys` | Aucune ref code |
| `translation_cache` | Aucune ref code |
| `translation_usage` | Aucune ref code |
| `import_job_items` | Doublon de `job_items` |

> ⚠️ Vérifier les edge functions avant suppression de ces tables.

---

## Vues de compatibilité actives

| Vue | Table source | Triggers |
|---|---|---|
| `background_jobs` | `jobs` | INSERT, UPDATE, DELETE |
| `import_jobs` | `jobs` | INSERT, UPDATE, DELETE |
| `product_import_jobs` | `jobs` | INSERT, UPDATE, DELETE |
| `extension_jobs` | `jobs` | INSERT, UPDATE, DELETE |
| `price_rules` | `pricing_rules` | INSERT, UPDATE, DELETE |
| `automation_rules` | `automation_workflows` | INSERT, UPDATE, DELETE |
