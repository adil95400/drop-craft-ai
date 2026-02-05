
# Plan de Nettoyage des Anciens Fichiers

## Résumé de l'Audit

L'application contient plusieurs catégories de fichiers obsolètes à traiter :

| Catégorie | Fichiers | Utilisations | Action |
|-----------|----------|--------------|--------|
| Non utilisés | 2 fichiers | 0 | **Supprimer** |
| Déprécié logging | 1 fichier | 65 composants | **Migrer** |
| Déprécié hooks | 2 fichiers | 12 composants | **Migrer** |
| Scripts docs obsolètes | 2 fichiers | 0 | **Supprimer** |

---

## Phase 1 : Suppression Immédiate (0 utilisation)

### Fichiers à supprimer
```text
src/services/performance/BundleOptimizer.ts   → Non importé
src/lib/migration-helper.ts                    → Non importé
scripts/cleanup-duplicates.md                  → Documentation obsolète
scripts/remaining-migration.md                 → Documentation obsolète
src/utils/migrate-auth-imports.sh              → Script migration terminée
```

---

## Phase 2 : Migration consoleCleanup → productionLogger

**65 fichiers** utilisent encore `@/utils/consoleCleanup`

### Mapping des fonctions
| Ancien | Nouveau |
|--------|---------|
| `logAction(msg, data)` | `productionLogger.info(msg, data)` |
| `logError(msg, ctx)` | `productionLogger.error(msg, undefined, ctx)` |
| `logWarning(msg, ctx)` | `productionLogger.warn(msg, undefined, ctx)` |

### Fichiers principaux à migrer (top 10)
1. `src/components/integrations/IntegrationHealthMonitor.tsx`
2. `src/components/import/SmartImportInterface.tsx`
3. `src/components/notifications/RealTimeNotifications.tsx`
4. `src/components/analytics/AdvancedReportsCenter.tsx`
5. `src/components/ai/AIAssistantChat.tsx`
6. `src/components/admin/FinalHealthCheck.tsx`
7. `src/components/import/BrowserExtensionImportInterface.tsx`
8. `src/components/import/ImportURLInterface.tsx`
9. `src/components/browser-extension/ExtensionBridge.tsx`
10. `src/components/auth/DisconnectNotification.tsx`

Après migration complète → Supprimer `src/utils/consoleCleanup.ts`

---

## Phase 3 : Migration Hooks Produits

**4 fichiers** utilisent `@/hooks/useRealProducts`

| Fichier | Action |
|---------|--------|
| `ProductsTable.tsx` | Changer import vers `useProductsUnified` |
| `ProductsListSimple.tsx` | Changer import + adapter API |
| `CatalogIntelligencePage.tsx` | Changer import + adapter API |
| `ProductViewModal.tsx` | Changer import type `UnifiedProduct` |

Après migration → Supprimer `src/hooks/useRealProducts.ts`

---

## Phase 4 : Migration Hooks Fournisseurs

**8 fichiers** utilisent `@/hooks/useRealSuppliers`

| Fichier | Action |
|---------|--------|
| `CreateSupplier.tsx` | Migrer vers `useSuppliersUnified` |
| `ChannableStyleSuppliersPage.tsx` | Migrer vers `useSuppliersUnified` |
| `ConnectedSupplierCard.tsx` | Migrer type `UnifiedSupplier` |
| `AdvancedSupplierManager.tsx` | Migrer vers `useSuppliersUnified` |
| `MySuppliersPage.tsx` | Migrer vers `useSuppliersUnified` |
| `SupplierDetails.tsx` | Migrer vers `useSuppliersUnified` |
| `SupplierConfigModal.tsx` | Migrer type `UnifiedSupplier` |
| `SupplierImportPage.tsx` | Migrer vers `useSuppliersUnified` |

Après migration → Supprimer `src/hooks/useRealSuppliers.ts`

---

## Ordre d'Exécution

```text
┌─────────────────────────────────────────────────────────┐
│ Étape 1: Supprimer fichiers non utilisés (5 fichiers)   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ Étape 2: Migrer consoleCleanup (65 fichiers)            │
│          Puis supprimer consoleCleanup.ts               │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ Étape 3: Migrer useRealProducts (4 fichiers)            │
│          Puis supprimer useRealProducts.ts              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ Étape 4: Migrer useRealSuppliers (8 fichiers)           │
│          Puis supprimer useRealSuppliers.ts             │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ Étape 5: Valider build & tests                          │
└─────────────────────────────────────────────────────────┘
```

---

## Résultat Attendu

| Métrique | Avant | Après |
|----------|-------|-------|
| Fichiers obsolètes | 10 | 0 |
| Imports déprécié | 77 | 0 |
| Warnings console | ~20 | 0 |
| Lignes de code | ~800 | -800 |

---

## Section Technique

### Pattern de Migration consoleCleanup

**Avant:**
```typescript
import { logError, logAction } from '@/utils/consoleCleanup';
logAction('User action', { data });
logError('Error message', 'Context');
```

**Après:**
```typescript
import { productionLogger } from '@/utils/productionLogger';
productionLogger.info('User action', { data });
productionLogger.error('Error message', undefined, 'Context');
```

### Pattern de Migration Hooks

**Avant:**
```typescript
import { useRealProducts, Product } from '@/hooks/useRealProducts';
const { products, isLoading, updateProduct } = useRealProducts();
```

**Après:**
```typescript
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified';
const { products, isLoading, update } = useProductsUnified();
```

