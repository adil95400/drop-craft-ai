# Guide de Migration des Hooks Deprecated

## État Actuel (v5.7.0)

Les hooks deprecated suivants sont des **wrappers de compatibilité** qui redirigent vers les hooks unifiés. Ils sont encore utilisés dans le codebase mais peuvent être migrés progressivement.

## Hooks Deprecated → Hooks Unifiés

| Hook Deprecated | Hook Unifié | Fichiers Utilisant |
|-----------------|-------------|-------------------|
| `useRealProducts` | `useProductsUnified` | ~12 fichiers |
| `useRealCustomers` | `useCustomersUnified` | ~8 fichiers |
| `useRealOrders` | `useOrdersUnified` | ~10 fichiers |
| `useRealSuppliers` | `useSuppliersUnified` | ~15 fichiers |
| `useRealIntegrations` | `useIntegrationsUnified` | ~8 fichiers |
| `useIntegrations` | `useIntegrationsUnified` | ~5 fichiers |
| `useIntegrationsData` | `useIntegrationsUnified` | ~3 fichiers |
| `useSuppliers` | `useSuppliersUnified` | ~7 fichiers |

## Comment Migrer

### Exemple de Migration

**Avant:**
```typescript
import { useRealProducts } from '@/hooks/useRealProducts'

export function MyComponent() {
  const { products, isLoading } = useRealProducts({ status: 'active' })
  // ...
}
```

**Après:**
```typescript
import { useProductsUnified } from '@/hooks/unified'

export function MyComponent() {
  const { products, isLoading } = useProductsUnified({ status: 'active' })
  // ...
}
```

## Import Centralisé

Tous les hooks unifiés sont exportés depuis `@/hooks/unified`:

```typescript
import { 
  useProductsUnified,
  useCustomersUnified,
  useOrdersUnified,
  useSuppliersUnified,
  useIntegrationsUnified
} from '@/hooks/unified'
```

## Autres Fichiers Deprecated (Non-Hooks)

| Fichier | Remplacement |
|---------|-------------|
| `lazyWithRetry.ts` | `performanceService.createLazyComponent()` |
| `consoleCleanup.ts` | `productionLogger` |
| `BundleOptimizer.ts` | `PerformanceService` |

## Notes

- Les wrappers deprecated affichent un warning console en dev
- La migration peut être faite progressivement sans urgence
- Les hooks unifiés offrent une API plus cohérente et typée
- Aucune perte de fonctionnalité lors de la migration

## Priorité de Migration

1. **Haute** : Composants critiques (Dashboard, Products, Orders)
2. **Moyenne** : Pages secondaires (Settings, Reports)
3. **Basse** : Composants rarement utilisés

---

*Dernière mise à jour: Janvier 2026*
