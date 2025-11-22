# Guide de Migration vers le Système Unifié de Hooks

## Vue d'ensemble

Le système unifié de hooks centralise la gestion des données pour garantir la cohérence, réduire la duplication de code et améliorer la maintenabilité.

## Hooks Unifiés Disponibles

### 1. useUnifiedProducts
**Fichier**: `src/hooks/useUnifiedProducts.ts`  
**Remplace**: `useProducts`, `useProductsDemo`, `useProductsOptimized`

```typescript
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts'

const { 
  products,           // Tous les produits
  stats,             // Statistiques (total, active, inactive, lowStock, totalValue, bySource)
  isLoading,
  updateProduct,     // Fonction de mise à jour
  deleteProduct,     // Fonction de suppression
  consolidateProducts // Fonction de consolidation
} = useUnifiedProducts({
  search: 'terme',
  category: 'electronics',
  status: 'active',
  minPrice: 10,
  maxPrice: 100,
  lowStock: true
})
```

### 2. useUnifiedData
**Fichier**: `src/hooks/useUnifiedData.ts`  
**Contient**: `useUnifiedProducts`, `useUnifiedSuppliers`, `useUnifiedCustomers`

#### useUnifiedProducts (version data)
```typescript
const { 
  data,              // Produits
  stats,
  add,               // Ajouter un produit
  update,            // Mettre à jour
  delete,            // Supprimer
  refetch 
} = useUnifiedProducts(filters)
```

#### useUnifiedSuppliers
```typescript
const { 
  data,              // Fournisseurs
  stats,             // total, connected, totalProducts
  refetch 
} = useUnifiedSuppliers(filters)
```

#### useUnifiedCustomers
```typescript
const { 
  data,              // Clients
  stats,             // total, active, totalRevenue, avgOrderValue
  refetch 
} = useUnifiedCustomers(filters)
```

### 3. useUnifiedOrders
**Fichier**: `src/hooks/useUnifiedOrders.ts`  
**Remplace**: `useOrders`, `useOrdersDemo`, `useOrdersOptimized`

```typescript
import { useUnifiedOrders } from '@/hooks/useUnifiedOrders'

const { 
  data,              // Commandes
  stats,             // total, pending, processing, shipped, delivered, cancelled, revenue, avgOrderValue
  update,            // Mettre à jour une commande
  refetch 
} = useUnifiedOrders({
  status: 'pending',
  search: 'CMD-123'
})
```

### 4. useUnifiedMarketing
**Fichier**: `src/hooks/useUnifiedMarketing.ts`  
**Remplace**: `useMarketing`, `useMarketingCampaigns`, `useCRMLeads`

```typescript
import { useUnifiedMarketing } from '@/hooks/useUnifiedMarketing'

const {
  campaigns,
  segments,
  contacts,
  createCampaign,
  deleteCampaign,
  createSegment,
  addContact
} = useUnifiedMarketing()
```

### 5. useUnifiedImport
**Fichier**: `src/hooks/useUnifiedImport.ts`  
**Remplace**: `useImport`, `useImportJobs`, `useImportMethods`

```typescript
import { useUnifiedImport } from '@/hooks/useUnifiedImport'

const {
  importCSV,
  importURL,
  importBulkProducts,
  importStatus
} = useUnifiedImport()
```

### 6. useUnifiedStores
**Fichier**: `src/hooks/useUnifiedStores.ts`  
**Pour**: Gestion des boutiques connectées

```typescript
import { useUnifiedStores } from '@/hooks/useUnifiedStores'

const {
  stores,
  connectStore,
  disconnectStore,
  syncStore
} = useUnifiedStores()
```

### 7. useUnifiedPerformance
**Fichier**: `src/hooks/useUnifiedPerformance.ts`  
**Pour**: Métriques de performance et monitoring

```typescript
import { useUnifiedPerformance } from '@/hooks/useUnifiedPerformance'

const {
  metrics,
  trackEvent,
  getPerformanceReport
} = useUnifiedPerformance()
```

### 8. useUnifiedModules
**Fichier**: `src/hooks/useUnifiedModules.ts`  
**Pour**: Gestion des modules et fonctionnalités

```typescript
import { useUnifiedModules } from '@/hooks/useUnifiedModules'

const {
  availableModules,
  enabledModules,
  hasAccess,
  enableModule
} = useUnifiedModules()
```

## Hooks d'Authentification

### useUnifiedAuth
**Via**: `@/contexts/UnifiedAuthContext`

```typescript
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'

const {
  user,
  profile,
  isLoading,
  signIn,
  signOut,
  refetchProfile
} = useUnifiedAuth()
```

### useUnifiedPlan
**Via**: `@/lib/unified-plan-system`

```typescript
import { useUnifiedPlan } from '@/lib/unified-plan-system'

const {
  currentPlan,
  isPro,
  isUltraPro,
  hasFeature,
  loadUserPlan
} = useUnifiedPlan()
```

## Plan de Migration

### Phase 1: Hooks Dépréciés (Compatibilité Maintenue)
Ces hooks redirigent vers les versions unifiées mais sont conservés pour compatibilité:

- ✅ `useProducts` → `useUnifiedProducts`
- ✅ `useCustomers` → `useUnifiedCustomers`
- ✅ `useSuppliers` → `useUnifiedSuppliers`
- ✅ `useOrders` → `useUnifiedOrders`

### Phase 2: À Migrer Prochainement
- `useProductsDemo` → `useUnifiedProducts`
- `useProductsOptimized` → `useUnifiedProducts`
- `useOrdersDemo` → `useUnifiedOrders`
- `useOrdersOptimized` → `useUnifiedOrders`
- `useCustomersOptimized` → `useUnifiedCustomers`
- `useMarketingCampaigns` → `useUnifiedMarketing`
- `useImportJobs` → `useUnifiedImport`

### Phase 3: Hooks Spécialisés (Garder Séparés)
Ces hooks restent séparés car ils ont des responsabilités spécifiques:

- `useAI` - Fonctionnalités IA
- `useAnalytics` - Analytics avancés
- `useAutomation` - Automatisations
- `useSEO` - Optimisation SEO
- `useShopifySync` - Synchronisation Shopify
- `useStripePayments` - Paiements Stripe

## Exemple de Migration

### Avant
```typescript
import { useProducts } from '@/hooks/useProducts'

function ProductList() {
  const { products, isLoading, updateProduct } = useProducts({ 
    status: 'active' 
  })
  
  return <div>{/* ... */}</div>
}
```

### Après
```typescript
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts'

function ProductList() {
  const { products, isLoading, updateProduct } = useUnifiedProducts({ 
    status: 'active' 
  })
  
  return <div>{/* ... */}</div>
}
```

## Avantages du Système Unifié

1. **Cache Centralisé**: Une seule source de vérité pour chaque entité
2. **Performance**: Moins de requêtes grâce au cache partagé
3. **Cohérence**: Types et interfaces standardisés
4. **Maintenabilité**: Un seul endroit pour les corrections et améliorations
5. **DRY**: Élimination de la duplication de code

## Notes Importantes

- Les hooks dépréciés affichent des warnings en console
- Les anciens hooks restent fonctionnels pour la compatibilité
- Privilégiez toujours les hooks unifiés pour les nouveaux développements
- Les services sous-jacents (ProductsUnifiedService, etc.) gèrent la logique métier
