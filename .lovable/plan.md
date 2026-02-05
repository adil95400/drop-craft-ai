# Plan de Nettoyage - EN COURS

## Résumé

La migration a été **partiellement complétée**. Les fichiers obsolètes ont été supprimés et les fichiers de compatibilité redirigent vers les nouvelles APIs unifiées.

## État actuel

### Phase 1 ✅ Complète - Fichiers supprimés
- `src/services/performance/BundleOptimizer.ts` - Supprimé
- `src/lib/migration-helper.ts` - Supprimé
- `scripts/cleanup-duplicates.md` - Supprimé
- `scripts/remaining-migration.md` - Supprimé

### Phase 2 🔄 En cours - Migration consoleCleanup

| Statut | Fichiers |
|--------|----------|
| ✅ Migrés | 18 fichiers (IntegrationHealthMonitor, SmartImportInterface, RealTimeNotifications, etc.) |
| 🔄 Via wrapper | ~50 fichiers utilisent le wrapper de compatibilité |

**Wrapper actif:** `src/utils/consoleCleanup.ts` redirige vers `productionLogger`

### Phase 3 ✅ Complète - Hooks Produits
- `src/hooks/useRealProducts.ts` → Wrapper vers `useProductsUnified`

### Phase 4 ✅ Complète - Hooks Fournisseurs
- `src/hooks/useRealSuppliers.ts` → Wrapper vers `useSuppliersUnified`

## Prochaines étapes

Pour terminer la migration complète, migrer progressivement les ~50 fichiers restants utilisant consoleCleanup, puis supprimer le wrapper.

### Fichiers restants à migrer (top priorité)
1. `src/components/jobs/JobQueueDashboard.tsx`
2. `src/components/integrations/CanvaIntegrationCard.tsx`
3. `src/components/import/FTPImporter.tsx`
4. `src/components/import/AdvancedImportInterface.tsx`
5. `src/components/analytics/AdvancedAnalytics.tsx`
6. `src/components/onboarding/OnboardingWizard.tsx`
7. `src/components/billing/SubscriptionManager.tsx`
8. `src/components/automation/SmartDataProcessor.tsx`
... et ~42 autres fichiers

## Architecture finale visée

```
productionLogger (source de vérité)
├── logDebug() / productionLogger.debug()
├── logInfo() / productionLogger.info()
├── logWarn() / productionLogger.warn()
├── logError() / productionLogger.error()
└── logCritical() / productionLogger.critical()
```
