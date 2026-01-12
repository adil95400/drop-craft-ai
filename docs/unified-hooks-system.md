# Système de Hooks Unifiés

## Vue d'ensemble

Le système de hooks unifiés centralise toute la logique d'accès aux données dans un ensemble cohérent de hooks réutilisables. Cette architecture remplace les multiples hooks dispersés qui existaient auparavant.

## Architecture

```
src/hooks/unified/
├── index.ts                    # Point d'entrée central
├── useProductsUnified.ts       # Gestion des produits
├── useCustomersUnified.ts      # Gestion des clients
├── useIntegrationsUnified.ts   # Gestion des intégrations
├── useOrdersUnified.ts         # Gestion des commandes
└── useSuppliersUnified.ts      # Gestion des fournisseurs
```

## Import

```typescript
// ✅ Recommandé - Import depuis le point d'entrée central
import { 
  useProductsUnified, 
  useCustomersUnified,
  useIntegrationsUnified,
  useOrdersUnified,
  useSuppliersUnified
} from '@/hooks/unified'

// Types disponibles
import type {
  UnifiedProduct,
  UnifiedCustomer,
  UnifiedIntegration,
  UnifiedOrder,
  UnifiedSupplier
} from '@/hooks/unified'
```

## Hooks Disponibles

### 1. useProductsUnified

Gestion complète des produits avec filtrage, pagination et mutations.

```typescript
const {
  products,           // UnifiedProduct[]
  isLoading,          // boolean
  error,              // Error | null
  stats,              // ProductStats
  refetch,            // () => void
  updateProduct,      // UseMutationResult
  deleteProduct,      // UseMutationResult
  bulkUpdateProducts  // UseMutationResult
} = useProductsUnified({
  filters: {
    search: 'terme',
    status: 'active',
    category: 'electronics',
    priceRange: { min: 10, max: 100 }
  },
  pagination: {
    page: 1,
    pageSize: 20
  },
  enabled: true
})
```

**Types:**
```typescript
interface UnifiedProduct {
  id: string
  title: string
  description: string | null
  price: number
  compare_at_price: number | null
  cost_price: number | null
  sku: string | null
  barcode: string | null
  status: 'active' | 'draft' | 'archived'
  category: string | null
  tags: string[]
  images: string[]
  stock_quantity: number
  weight: number | null
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

interface ProductStats {
  total: number
  active: number
  draft: number
  archived: number
  lowStock: number
  outOfStock: number
  avgPrice: number
}
```

### 2. useCustomersUnified

Gestion des clients avec segmentation et statistiques.

```typescript
const {
  customers,          // UnifiedCustomer[]
  isLoading,          // boolean
  error,              // Error | null
  stats,              // CustomerStats
  segments,           // CustomerSegments
  refetch,            // () => void
  updateCustomer,     // UseMutationResult
  deleteCustomer      // UseMutationResult
} = useCustomersUnified({
  filters: {
    search: 'email@example.com',
    segment: 'vip',
    tags: ['loyal']
  },
  enabled: true
})
```

**Types:**
```typescript
interface UnifiedCustomer {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  company: string | null
  tags: string[]
  total_orders: number
  total_spent: number
  last_order_date: string | null
  address: {
    line1: string | null
    line2: string | null
    city: string | null
    state: string | null
    postal_code: string | null
    country: string | null
  } | null
  created_at: string
  updated_at: string
}

interface CustomerStats {
  total: number
  active: number
  new: number
  returning: number
  averageOrderValue: number
  totalRevenue: number
}

interface CustomerSegments {
  vip: number
  regular: number
  atRisk: number
  churned: number
}
```

### 3. useIntegrationsUnified

Gestion des intégrations et synchronisations.

```typescript
const {
  integrations,       // UnifiedIntegration[]
  templates,          // IntegrationTemplate[]
  syncLogs,           // SyncLog[]
  stats,              // IntegrationStats
  isLoading,          // boolean
  error,              // Error | null
  refetch,            // () => void
  createIntegration,  // UseMutationResult
  updateIntegration,  // UseMutationResult
  deleteIntegration,  // UseMutationResult
  syncIntegration     // UseMutationResult
} = useIntegrationsUnified({
  filters: {
    status: 'active',
    platform: 'shopify'
  },
  enabled: true
})
```

**Types:**
```typescript
interface UnifiedIntegration {
  id: string
  name: string
  platform: string
  status: 'active' | 'inactive' | 'error' | 'pending'
  config: Record<string, unknown>
  last_sync_at: string | null
  sync_status: 'idle' | 'syncing' | 'success' | 'error'
  error_message: string | null
  created_at: string
  updated_at: string
}

interface IntegrationTemplate {
  id: string
  name: string
  platform: string
  description: string
  icon: string
  category: string
  requiredFields: string[]
}

interface SyncLog {
  id: string
  integration_id: string
  status: 'success' | 'error' | 'partial'
  items_synced: number
  errors: string[]
  started_at: string
  completed_at: string | null
}
```

### 4. useOrdersUnified

Gestion des commandes avec filtrage par statut et date.

```typescript
const {
  orders,             // UnifiedOrder[]
  isLoading,          // boolean
  error,              // Error | null
  stats,              // OrderStats
  pagination,         // PaginationInfo
  refetch,            // () => void
  updateOrder         // UseMutationResult
} = useOrdersUnified({
  filters: {
    status: 'pending',
    dateRange: { start: '2024-01-01', end: '2024-12-31' },
    customerId: 'uuid'
  },
  pagination: {
    page: 1,
    pageSize: 50
  },
  enabled: true
})
```

### 5. useSuppliersUnified

Gestion des fournisseurs avec statistiques.

```typescript
const {
  suppliers,          // UnifiedSupplier[]
  isLoading,          // boolean
  error,              // Error | null
  stats,              // SupplierStats
  refetch             // () => void
} = useSuppliersUnified({
  filters: {
    search: 'nom',
    status: 'active'
  },
  enabled: true
})
```

## Wrappers de Compatibilité (Déprécié)

Les anciens hooks sont maintenus comme wrappers pour la rétrocompatibilité mais émettent des avertissements de dépréciation :

| Ancien Hook | Nouveau Hook |
|-------------|--------------|
| `useProducts` | `useProductsUnified` |
| `useRealProducts` | `useProductsUnified` |
| `useCustomers` | `useCustomersUnified` |
| `useRealCustomers` | `useCustomersUnified` |
| `useIntegrations` | `useIntegrationsUnified` |
| `useRealIntegrations` | `useIntegrationsUnified` |
| `useOrders` | `useOrdersUnified` |
| `useSuppliers` | `useSuppliersUnified` |

⚠️ **Ces wrappers seront supprimés dans une version future. Migrez vers les hooks unifiés.**

## Migration

### Avant (ancien code)
```typescript
import { useProducts } from '@/hooks/useProducts'

function MyComponent() {
  const { products, loading } = useProducts()
  // ...
}
```

### Après (nouveau code)
```typescript
import { useProductsUnified } from '@/hooks/unified'

function MyComponent() {
  const { products, isLoading } = useProductsUnified()
  // ...
}
```

### Changements de nommage courants

| Ancien | Nouveau |
|--------|---------|
| `loading` | `isLoading` |
| `data` | Nom spécifique (`products`, `customers`, etc.) |
| `avgOrderValue` | `averageOrderValue` |
| `street` | `address.line1` |
| `postalCode` | `address.postal_code` |

## Bonnes Pratiques

### 1. Toujours utiliser les filtres
```typescript
// ✅ Bon - Filtrage explicite
const { products } = useProductsUnified({
  filters: { status: 'active' }
})

// ❌ Éviter - Pas de filtrage
const { products } = useProductsUnified()
```

### 2. Utiliser la pagination pour les grandes listes
```typescript
const { products, pagination } = useProductsUnified({
  pagination: { page: currentPage, pageSize: 20 }
})
```

### 3. Désactiver les requêtes conditionnellement
```typescript
const { products } = useProductsUnified({
  filters: { category: selectedCategory },
  enabled: !!selectedCategory // Ne charge que si une catégorie est sélectionnée
})
```

### 4. Typer les données correctement
```typescript
import type { UnifiedProduct } from '@/hooks/unified'

function ProductCard({ product }: { product: UnifiedProduct }) {
  // TypeScript connaît la structure de product
}
```

## Fichiers Supprimés

Les fichiers suivants ont été supprimés lors de la consolidation :
- `src/hooks/useProductsOptimized.ts`
- `src/hooks/useCustomersOptimized.ts`
- `src/hooks/useUnifiedData.ts`
- `src/hooks/useUnifiedOrders.ts`

## Roadmap

1. ✅ Phase 1 : Analyse et planification
2. ✅ Phase 2 : Création des hooks unifiés
3. ✅ Phase 3 : Migration des composants
4. ✅ Phase 4 : Nettoyage des anciens fichiers
5. ✅ Phase 5 : Documentation

### Prochaines étapes recommandées
- Supprimer les wrappers de compatibilité après migration complète
- Ajouter des tests unitaires pour les hooks unifiés
- Implémenter le caching optimisé avec React Query
