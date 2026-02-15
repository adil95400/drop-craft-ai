# Audit du Schéma Base de Données — Shopopti

> Généré le 2026-02-15. ~230 tables, ~160 vides (0 lignes).

## Résultat clé

**Aucune table ne peut être supprimée en toute sécurité** : même les tables vides sont référencées dans le code frontend (hooks, services, composants). Un `DROP TABLE` casserait l'application.

---

## Tables avec données (actives)

| Table | Lignes | Rôle |
|---|---|---|
| `activity_logs` | 7 216 | Journal d'activité principal |
| `extension_analytics` | ~450 | Analytiques extension navigateur |
| `extension_data` | ~300 | Données extension |
| `products` | 25 | **Source de vérité catalogue** |
| `product_variants` | 25 | Variantes produits |
| `product_sources` | 25 | Sources des produits |
| `profiles` | ≥1 | Profils utilisateurs |
| `user_roles` | ≥1 | Rôles utilisateurs |

---

## Groupes de doublons identifiés

### 1. Jobs / Tâches asynchrones (6 tables, toutes vides)

| Table | Colonnes | Référencée dans |
|---|---|---|
| `background_jobs` | 26 cols (la + complète) | `MonitoringDashboard.tsx`, services |
| `jobs` | ~12 cols | `useUnifiedImport.ts`, `RealTimeStats.tsx` |
| `import_jobs` | ~15 cols | `supabaseUnlimited.ts` |
| `product_import_jobs` | ~20 cols | `MonitoringDashboard.tsx` |
| `extension_jobs` | ~10 cols | `useExtensions.ts` |
| `job_items` | ~10 cols | Pas de ref directe hors types |

**Recommandation** : Unifier vers `background_jobs` (schéma le plus riche). Créer des vues `jobs`, `import_jobs`, `product_import_jobs` pointant vers `background_jobs`.

### 2. Pricing / Règles de prix (5 tables, toutes vides)

| Table | Référencée dans |
|---|---|
| `pricing_rules` | `usePricingRules.ts`, `PricingRulesEngine.tsx` |
| `price_rules` | `PricingAutomationService.ts` |
| `pricing_rulesets` | Certains services |
| `price_rule_logs` | Services pricing |
| `product_pricing_state` | Hooks pricing |

**Recommandation** : Unifier vers `pricing_rules` + `product_pricing_state`. Supprimer `price_rules` et `pricing_rulesets` après migration du code.

### 3. Automation / Workflows (6 tables, toutes vides)

| Table | Référencée dans |
|---|---|
| `automation_workflows` | Hooks workflow |
| `automation_flows` | `useAutomationFlows.ts` |
| `automation_rules` | `UpsellManager.tsx` |
| `automation_triggers` | Services automation |
| `automation_actions` | Services automation |
| `automation_execution_logs` | Services automation |
| `automated_campaigns` | Marketing hooks |

**Recommandation** : Unifier vers `automation_flows` (+ `automation_executions` qui a le FK). Les autres sont redondants.

### 4. SEO (13 tables, toutes vides)

| Table | Référencée dans |
|---|---|
| `seo_audits` | `useSEOAudits.ts` — **garder** |
| `seo_scores` | `ProductSEO.tsx` — **garder** |
| `seo_keywords` | `useSEOAudits.ts` — **garder** |
| `seo_audit_pages` | `useSEOAudits.ts` — **garder** |
| `seo_issues` | Types seulement |
| `product_seo` | Services SEO |
| `product_seo_versions` | Services SEO |
| `seo_metadata` | Pas de ref directe |
| `seo_page_analysis` | Pas de ref directe |
| `seo_competitor_analysis` | Pas de ref directe |
| `seo_optimization_history` | Pas de ref directe |
| `seo_backlinks` | Pas de ref directe |
| `seo_reports` | Pas de ref directe |

**Recommandation** : Garder `seo_audits`, `seo_scores`, `seo_keywords`, `seo_audit_pages`. Les 9 autres sont candidates à suppression après vérification edge functions.

### 5. Import (5 tables redondantes, toutes vides)

| Table | Référencée dans |
|---|---|
| `imported_products` | `ImportedProductsPage.tsx` — **garder** |
| `catalog_products` | `usePremiumSuppliers.ts` — **garder** |
| `import_history` | Services |
| `import_uploads` | Services |
| `import_pipeline_logs` | Services |

### 6. CRM (6 tables, toutes vides)

Toutes référencées dans des hooks/services CRM. À conserver tant que les pages CRM existent.

### 7. Extensions (10+ tables)

Certaines ont des données (`extension_analytics`, `extension_data`). Le reste est vide mais référencé.

---

## Plan d'action recommandé

### Phase 1 — Vues de compatibilité (sans risque)
Créer des vues SQL pour les tables doublons → le code continue de fonctionner.

```sql
-- Exemple : vue `jobs` pointant vers `background_jobs`
CREATE OR REPLACE VIEW public.jobs AS
SELECT id, user_id AS tenant_id, job_type, status, ...
FROM public.background_jobs;
```

### Phase 2 — Migration du code
Mettre à jour les imports/hooks pour pointer vers la table unifiée.

### Phase 3 — Suppression des tables orphelines
Seulement après que le code ne référence plus les anciennes tables.

---

## Tables sans aucune référence code (hors types.ts)

À vérifier en profondeur, mais candidates probables :
- `seo_metadata`, `seo_page_analysis`, `seo_competitor_analysis`, `seo_optimization_history`, `seo_backlinks`, `seo_reports`
- `request_replay_log`, `gateway_logs`, `idempotency_keys`
- `translation_cache`, `translation_usage`
- `import_job_items` (doublon de `job_items`)

> ⚠️ Ces tables peuvent être référencées dans des edge functions non auditées.
