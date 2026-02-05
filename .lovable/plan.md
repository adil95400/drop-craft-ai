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
| ✅ Migrés | 26 fichiers nativement vers productionLogger |
| 🔄 Via wrapper | ~34 fichiers utilisent le wrapper de compatibilité |

**Fichiers migrés nativement:**
1. IntegrationHealthMonitor.tsx
2. SmartImportInterface.tsx
3. RealTimeNotifications.tsx
4. AdvancedReportsCenter.tsx
5. AIAssistantChat.tsx
6. FinalHealthCheck.tsx
7. BrowserExtensionImportInterface.tsx
8. ImportURLInterface.tsx
9. ExtensionBridge.tsx
10. DisconnectNotification.tsx
11. BusinessIntelligenceDashboard.tsx
12. OrderAutomationPanel.tsx
13. NotificationService.tsx
14. RealTimeMonitoring.tsx
15. RoleManager.tsx
16. SecurityMonitor.tsx
17. AIRecommendations.tsx
18. ContentGenerator.tsx
19. JobQueueDashboard.tsx
20. FTPImporter.tsx
21. AdvancedImportInterface.tsx
22. AdvancedAnalytics.tsx
23. OnboardingWizard.tsx
24. SubscriptionManager.tsx
25. SmartDataProcessor.tsx
26. CanvaIntegrationCard.tsx

**Wrapper actif:** `src/utils/consoleCleanup.ts` redirige vers `productionLogger`

### Phase 3 ✅ Complète - Hooks Produits
- `src/hooks/useRealProducts.ts` → Wrapper vers `useProductsUnified`

### Phase 4 ✅ Complète - Hooks Fournisseurs
- `src/hooks/useRealSuppliers.ts` → Wrapper vers `useSuppliersUnified`

## Prochaines étapes

Pour terminer la migration complète, migrer progressivement les ~34 fichiers restants utilisant consoleCleanup, puis supprimer le wrapper.

### Fichiers restants à migrer (par priorité)
1. `src/components/integrations/SecurityAudit.tsx`
2. `src/components/integrations/IntegrationCard.tsx`
3. `src/components/mobile/MobileOptimizer.tsx`
4. `src/components/import/ImportMethodsGrid.tsx`
5. `src/components/common/ActionModal.tsx`
6. `src/components/common/PerformanceMonitor.tsx`
7. `src/components/integrations/AdvancedMonitoring.tsx`
8. `src/components/automation/WorkflowManager.tsx`
9. `src/components/admin/UserForceDisconnect.tsx`
10. `src/components/auth/SessionManager.tsx`
... et ~24 autres fichiers

## Architecture finale visée

```
productionLogger (source de vérité)
├── logDebug() / productionLogger.debug()
├── logInfo() / productionLogger.info()
├── logWarn() / productionLogger.warn()
├── logError() / productionLogger.error()
└── logCritical() / productionLogger.critical()
```
