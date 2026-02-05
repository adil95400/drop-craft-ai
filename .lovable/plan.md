# Plan de Nettoyage - EN COURS

## Résumé

La migration a été **partiellement complétée**. Les fichiers obsolètes ont été convertis en wrappers de compatibilité qui redirigent vers les nouvelles APIs unifiées.

## État actuel

| Fichier | Statut | Notes |
|---------|--------|-------|
| `src/utils/consoleCleanup.ts` | ✅ Wrapper | Redirige vers productionLogger |
| `src/hooks/useRealProducts.ts` | ✅ Wrapper | Redirige vers useProductsUnified |
| `src/hooks/useRealSuppliers.ts` | ❌ Supprimé | Migré vers useSuppliersUnified |

## Fichiers supprimés

- `src/services/performance/BundleOptimizer.ts`
- `src/lib/migration-helper.ts`
- `scripts/cleanup-duplicates.md`
- `scripts/remaining-migration.md`

## Prochaines étapes

Pour terminer la migration, migrer progressivement les ~55 fichiers restants utilisant consoleCleanup, puis supprimer le wrapper.
