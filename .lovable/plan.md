
# Plan d'Optimisation et Nettoyage Complet de ShopOpti

## Résumé Exécutif

L'analyse approfondie du projet révèle une application riche mais avec des **duplications significatives** et des **opportunités d'optimisation** majeures. Le projet contient actuellement :
- **~200+ pages** dans `src/pages/`
- **~300+ hooks** dans `src/hooks/`
- **~350+ edge functions** dans `supabase/functions/`
- **~150+ dossiers de composants** dans `src/components/`

---

## Phase 1 : Nettoyage des Hooks Dépréciés (Impact Immédiat)

### Fichiers à Supprimer

Les hooks suivants sont marqués `@deprecated` et redirigent vers les hooks unifiés. Ils peuvent être supprimés après mise à jour des imports :

| Fichier Déprécié | Remplacé Par | Usages Restants |
|------------------|--------------|-----------------|
| `src/hooks/useRealProducts.ts` | `useProductsUnified` | 0 usage direct |
| `src/hooks/useRealCustomers.ts` | `useCustomersUnified` | 0 usage direct |
| `src/hooks/useRealOrders.ts` | `useOrdersUnified` | 0 usage direct |
| `src/hooks/useRealSuppliers.ts` | `useSuppliersUnified` | 0 usage direct |
| `src/hooks/useRealIntegrations.ts` | `useIntegrationsUnified` | 0 usage direct |
| `src/hooks/useOrders.ts` | `useOrdersUnified` | Migration requise |
| `src/hooks/useSuppliers.ts` | `useSuppliersUnified` | 17 composants à migrer |
| `src/hooks/useIntegrations.ts` | `useIntegrationsUnified` | 15 composants à migrer |
| `src/hooks/useCustomers.ts` | `useCustomersUnified` | 4 composants à migrer |

### Fichier Legacy Supplémentaire

| Fichier | Raison | Action |
|---------|--------|--------|
| `src/hooks/useSupabaseData.ts` | Doublon complet avec hooks unifiés | Supprimer (486 lignes) |
| `src/hooks/useIntegrationsData.ts` | Wrapper déprécié | Supprimer |

**Impact estimé** : Suppression de **~1500 lignes de code redondant**

---

## Phase 2 : Consolidation des Pages Dupliquées

### Pages Analytics (5 doublons identifiés)

```text
À CONSERVER (Hub principal)
├── src/pages/AnalyticsDashboard.tsx         ← Hub principal
└── src/pages/analytics/ChannableAnalyticsPage.tsx

À SUPPRIMER/FUSIONNER
├── src/pages/AdvancedAnalytics.tsx          → Rediriger vers /analytics
├── src/pages/AdvancedAnalyticsPage.tsx      → Fusionner dans ChannableAnalyticsPage
├── src/pages/UnifiedAnalyticsDashboard.tsx  → Supprimer (doublon)
├── src/pages/MultiStoreAnalyticsDashboard.tsx → Onglet dans ChannableAnalyticsPage
└── src/pages/ProfitAnalyticsDashboard.tsx   → Onglet dans ChannableAnalyticsPage
```

### Pages CRM (6 fichiers séparés → 1 hub)

```text
À CONSOLIDER dans /marketing/crm (hub avec tabs)
├── src/pages/CRM.tsx           → Base
├── src/pages/CRMLeads.tsx      → Tab "Leads"
├── src/pages/CRMCalls.tsx      → Tab "Appels"
├── src/pages/CRMEmails.tsx     → Tab "Emails"
├── src/pages/CRMCalendar.tsx   → Tab "Calendrier"
└── src/pages/CRMActivity.tsx   → Tab "Activité"
```

### Pages Import (4 pages → 1 hub avec tabs)

```text
À CONSOLIDER dans /import
├── src/pages/import/ImportHubPage.tsx  ← Hub principal (existe déjà)
├── /import/advanced   → Tab "Avancé"
├── /import/simplified → Supprimer (redondant)
└── /import/shopify    → Tab "Shopify"
```

---

## Phase 3 : Nettoyage des Composants Dupliqués

### Composants Analytics

| Doublon | Original | Action |
|---------|----------|--------|
| `src/components/dashboard/AdvancedAnalytics.tsx` | `src/components/analytics/AdvancedAnalyticsDashboard.tsx` | Fusionner |
| `src/components/analytics/AdvancedAnalytics.tsx` | Même composant | Supprimer |

### Navigation Mobile

| Fichier | Statut | Action |
|---------|--------|--------|
| `src/components/layout/MobileNav.tsx` | Doublon | Déjà supprimé ✓ |
| `src/components/mobile/MobileNav.tsx` | Principal | Conserver |

---

## Phase 4 : Optimisation des Edge Functions

### Analyse des Edge Functions

Le projet contient **350+ edge functions**. Beaucoup partagent des fonctionnalités similaires :

```text
Doublons Potentiels Identifiés:
├── ai-content-generator + ai-content-secure + ai-marketing-content
├── ai-optimizer + ai-product-optimizer + ai-price-optimizer
├── supplier-sync + supplier-sync-engine + supplier-unified-sync
├── stock-sync-realtime + stock-sync-cross-marketplace + stock-auto-update
├── tracking-sync + tracking-automation + sync-all-tracking
└── extension-import-product + extension-one-click-import + extension-processor
```

### Recommandations

1. **Consolider** les fonctions AI en 3 catégories : `ai-content`, `ai-pricing`, `ai-automation`
2. **Unifier** les fonctions sync en `unified-sync-*`
3. **Centraliser** les fonctions extension en `extension-hub`

---

## Phase 5 : Optimisation des Performances

### Configuration React Query (déjà en place)

Le fichier `src/config/performanceOptimizations.ts` définit les bonnes stratégies. À appliquer uniformément :

```typescript
// Stratégies de cache par type
CACHE_STRATEGIES = {
  static: { staleTime: 1h, gcTime: 24h },      // Catégories, configs
  user: { staleTime: 5min, gcTime: 30min },    // Profil, préférences
  transactional: { staleTime: 2min, gcTime: 10min }, // Produits, commandes
  realtime: { staleTime: 30s, refetchInterval: 30s } // Stocks, notifications
}
```

### Lazy Loading des Routes

Les routes sont déjà correctement configurées avec `lazy()`. Vérifier que toutes les pages lourdes utilisent ce pattern.

---

## Phase 6 : Nettoyage des Imports et Exports

### Fichiers de Barrel à Nettoyer

| Fichier | Problème | Action |
|---------|----------|--------|
| `src/hooks/index.ts` | Non existant | Créer barrel central |
| `src/components/index.ts` | Non existant | Créer barrel par domaine |
| `src/services/index.ts` | Non existant | Créer barrel services |

---

## Plan d'Implémentation

### Étape 1 : Suppression Sécurisée des Hooks Dépréciés (Estimé: 15 min)

1. Mettre à jour les 17 composants utilisant `useSuppliers` → `useSuppliersUnified`
2. Mettre à jour les 15 composants utilisant `useIntegrations` → `useIntegrationsUnified`
3. Supprimer les 9 fichiers de wrappers dépréciés
4. Supprimer `useSupabaseData.ts`

### Étape 2 : Consolidation Pages Analytics (Estimé: 20 min)

1. Créer `ChannableAnalyticsPage` avec système d'onglets
2. Ajouter redirections depuis anciennes URLs
3. Supprimer les 4 pages dupliquées

### Étape 3 : Hub CRM Unifié (Estimé: 15 min)

1. Créer `CRMHubPage.tsx` avec tabs dynamiques
2. Intégrer les 5 sous-pages comme onglets
3. Mettre à jour les routes

### Étape 4 : Nettoyage Final (Estimé: 10 min)

1. Supprimer composants analytics dupliqués
2. Vérifier les imports cassés
3. Tester les redirections

---

## Résultats Attendus

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Fichiers hooks | 300+ | ~250 | -17% |
| Pages dupliquées | ~15 | 0 | -100% |
| Lignes de code | ~150K | ~140K | -7% |
| Temps de build | - | - | -5-10% estimé |
| Avertissements console | Nombreux | 0 | -100% |

---

## Détails Techniques : Fichiers à Modifier

### Composants à Migrer vers Hooks Unifiés

```
src/components/modals/BigBuyConfigDialog.tsx
src/components/modals/PrestaShopConfigDialog.tsx
src/components/modals/WooCommerceConfigDialog.tsx
src/components/modals/IntegrationSettingsDialog.tsx
src/components/modals/AmazonConfigDialog.tsx
src/components/integrations/EnhancedIntegrationsHub.tsx
src/components/integrations/RealIntegrationsTab.tsx
src/components/price-rules/PriceSyncPanel.tsx
src/components/suppliers/SupplierManagement.tsx
src/pages/stores/StoresPage.tsx
```

### Routes à Ajouter/Modifier

```typescript
// Dans src/routes/AnalyticsRoutes.tsx
<Route path="multi-store" element={<Navigate to="/analytics?tab=multi-store" />} />
<Route path="profit" element={<Navigate to="/analytics?tab=profit" />} />

// Dans src/routes/MarketingRoutes.tsx
<Route path="crm" element={<CRMHubPage />} />
<Route path="crm/leads" element={<Navigate to="/marketing/crm?tab=leads" />} />
<Route path="crm/calls" element={<Navigate to="/marketing/crm?tab=calls" />} />
```

---

## Fichiers à Supprimer (Liste Complète)

```bash
# Hooks dépréciés
rm src/hooks/useRealProducts.ts
rm src/hooks/useRealCustomers.ts
rm src/hooks/useRealOrders.ts
rm src/hooks/useRealSuppliers.ts
rm src/hooks/useRealIntegrations.ts
rm src/hooks/useOrders.ts
rm src/hooks/useSuppliers.ts
rm src/hooks/useIntegrations.ts
rm src/hooks/useCustomers.ts
rm src/hooks/useSupabaseData.ts
rm src/hooks/useIntegrationsData.ts

# Pages dupliquées (après création des hubs)
rm src/pages/AdvancedAnalytics.tsx
rm src/pages/UnifiedAnalyticsDashboard.tsx

# Composants dupliqués
rm src/components/dashboard/AdvancedAnalytics.tsx
rm src/components/analytics/AdvancedAnalytics.tsx
```

Ce plan garantit une **réduction significative de la dette technique** tout en maintenant la **compatibilité descendante** via des redirections appropriées.
