

# Audit d'Organisation, Synchronisation et Cohérence Inter-Pages

## Constat Global

L'application est **bien structurée architecturalement** (routing modulaire, stores Zustand, contextes React, services découplés). Cependant, plusieurs problèmes de cohérence et de synchronisation subsistent.

---

## Problèmes Identifiés

### 1. Données mock résiduelles (2 pages)
- **`TriggersManagerPage.tsx`** : utilise `MOCK_TRIGGERS` — données statiques non connectées à la DB
- **`SEOContentHubPage.tsx`** : 6 tableaux `MOCK_*` (keywords, SERP, competitors, calendar, technical issues, ranking/traffic)

### 2. `Math.random()` dans le code de production (67 fichiers)
Encore **565 occurrences** de `Math.random()` dans le code. Beaucoup sont légitimes (génération d'ID), mais certaines produisent des données aléatoires affichées à l'utilisateur :
- **`TopWinnersSection.tsx`** : engagement_score et running_days aléatoires
- **`XMLConfigDialog.tsx`** : productCount aléatoire
- **`MobileOptimizer.tsx`** : métriques device simulées
- **`useCatalogHealth.ts`** : score de santé avec variation random
- **`useSmartDecisionEngine.ts`** : `avg_latency_ms` aléatoire
- **`SEOAnalyticsService.ts`** : CPC aléatoire

### 3. Contextes Auth dupliqués
5 fichiers de contexte auth coexistent :
- `AuthContext.tsx`, `LightAuthContext.tsx`, `UnifiedAuthContext.tsx`, `PlanContext.tsx` + `NavigationContext.tsx`
- Risque de désynchronisation de l'état utilisateur entre pages

### 4. Hooks massifs non consolidés
**508 hooks** dans `src/hooks/` — beaucoup de doublons fonctionnels :
- `useReviews` + `useRealReviews` + `useReviewManagement` + `useProductReviews`
- `useAnalytics` + `useRealAnalytics` + `useAdvancedAnalytics` + `useAdvancedAnalyticsDashboard`
- `useImport` + `useRealImportMethods` + `useOptimizedImport` + `useRobustImport` + `useBulkImport`
- `usePriceRules` + `usePricingRules` + `useRepricingRules` + `useDynamicPricingRules`

### 5. Synchronisation inter-pages
Le **CrossModuleEventBus** est en place et fonctionnel (import → pricing → stock → marketing). Cependant :
- Seulement **13 fichiers** l'utilisent sur 150+ pages
- La plupart des pages fonctionnent en isolation (pas de réactivité croisée)
- Le `useSyncStore` n'est utilisé que dans `useAutoSync` — pas propagé aux autres modules

---

## Plan de Correction

### Étape 1 — Supprimer les mocks résiduels (2 fichiers)
- **`TriggersManagerPage.tsx`** : connecter à la table `automation_workflows` (type = trigger)
- **`SEOContentHubPage.tsx`** : remplacer les 6 `MOCK_*` par des données déterministes ou des requêtes DB (`seo_scores`, `products`)

### Étape 2 — Corriger les `Math.random()` affichés à l'utilisateur (6 fichiers)
Remplacer par des valeurs déterministes (hash-based) ou des requêtes DB :
- `TopWinnersSection.tsx` → hash du titre
- `XMLConfigDialog.tsx` → compter les produits réels
- `MobileOptimizer.tsx` → API navigator réelle
- `useCatalogHealth.ts` → supprime la variation random
- `useSmartDecisionEngine.ts` → latence depuis `api_analytics`
- `SEOAnalyticsService.ts` → CPC déterministe

### Étape 3 — Étendre le CrossModuleEventBus aux pages clés
Connecter les modules isolés au bus d'événements pour une synchronisation réactive :
- **Orders** → émettre `orders.created` quand une commande est passée
- **Stock** → écouter `orders.created` pour décrémenter
- **Pricing** → écouter `products.imported` pour appliquer les règles auto
- **Marketing** → écouter `products.updated` pour mettre à jour les campagnes

### Étape 4 — Consolider les hooks dupliqués (optionnel, refactor lourd)
Créer des hooks unifiés qui délèguent aux services existants, puis déprécier les anciens.

---

## Résumé d'Impact

| Axe | Fichiers | Priorité |
|-----|----------|----------|
| Mocks résiduels | 2 | Haute |
| Math.random() visible | 6 | Haute |
| Bus événements étendu | ~8 | Moyenne |
| Consolidation hooks | ~20 | Basse (refactor) |

**Estimation** : Étapes 1-3 faisables maintenant. Étape 4 est un refactoring progressif.

Souhaitez-vous que j'implémente les étapes 1 à 3 ?

