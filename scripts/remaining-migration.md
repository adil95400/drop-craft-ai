# Migration Restante - Hooks Unifiés

## Fichiers Déjà Supprimés ✅
- `src/hooks/useProducts.ts`
- `src/hooks/useRealOrders.ts`
- `src/hooks/useIntegrations.ts`
- `src/hooks/useRealIntegrations.ts`
- `src/hooks/useSuppliers.ts`
- `src/hooks/useOrders.ts`
- `src/hooks/useIntegrationsData.ts`
- `src/hooks/useRealCustomers.ts`

## Fichiers Migrés ✅
- `src/components/suppliers/SupplierManagement.tsx`
- `src/components/suppliers/SupplierForm.tsx`
- `src/components/suppliers/SupplierCard.tsx`
- `src/components/price-rules/PriceSyncPanel.tsx`
- `src/components/modals/WooCommerceConfigDialog.tsx`
- `src/components/modals/ShopifyConfigDialog.tsx`
- `src/components/modals/PrestaShopConfigDialog.tsx`
- `src/components/modals/BigBuyConfigDialog.tsx`
- `src/components/crm/AddCustomerModal.tsx`
- `src/components/crm/CustomerDetailsModal.tsx`
- `src/components/customers/SecureCustomersList.tsx`
- `src/pages/CommercePage.tsx`
- `src/pages/EmailMarketingPage.tsx`
- `src/pages/stores/StoresPage.tsx`

## Fichiers à Migrer (imports + usages)

### Intégrations
```bash
# Remplacer useIntegrations/useRealIntegrations par useIntegrationsUnified
src/components/integrations/AddIntegrationDialog.tsx        # ligne 127
src/components/integrations/ConnectionManager.tsx           # ligne 79
src/components/integrations/EnhancedIntegrationsHub.tsx     # ligne 145
src/components/integrations/RealIntegrationsTab.tsx         # ligne 16
src/components/integrations/CreateIntegrationForm.tsx       # import + usage
src/components/integrations/EditIntegrationModal.tsx        # import + usage
src/components/integrations/IntegrationAnalytics.tsx        # import + usage
src/components/integrations/IntegrationHealthMonitor.tsx    # import + usage
src/components/integrations/IntegrationsManager.tsx         # import + usage
src/components/integrations/IntegrationsTable.tsx           # import + usage
src/components/integrations/RealIntegrationsManager.tsx     # import + usage
src/components/modals/AmazonConfigDialog.tsx                # ligne 22
src/components/modals/IntegrationSettingsDialog.tsx         # ligne 37
src/components/sync/AdvancedSyncInterface.tsx               # import + usage
src/pages/ShopifyManagementPage.tsx                         # import + usage
src/pages/stores/ChannableStoresPage.tsx                    # ligne 57
src/pages/stores/IntegrationsPage.tsx                       # import + usage
src/pages/stores/StoreSettings.tsx                          # import + usage
```

### Orders
```bash
# Remplacer updateOrderStatus(id) par update({ id, updates: { status } })
src/components/orders/OrdersUltraProInterface.tsx           # ligne 74
src/components/stores/orders/OrdersTable.tsx                # ligne 98
```

## Commandes de Remplacement Rapide

```bash
# Pattern de remplacement pour imports
# FROM: import { useIntegrations } from '@/hooks/useIntegrations'
# TO:   import { useIntegrationsUnified } from '@/hooks/unified'

# FROM: import { useRealIntegrations } from '@/hooks/useRealIntegrations'
# TO:   import { useIntegrationsUnified } from '@/hooks/unified'

# FROM: const { ... } = useIntegrations()
# TO:   const { ... } = useIntegrationsUnified()

# FROM: const { ... } = useRealIntegrations()
# TO:   const { ... } = useIntegrationsUnified()
```

## Impact Réalisé
- **8 fichiers hooks supprimés** (~1500 lignes)
- **14 composants migrés** vers hooks unifiés
- **~15 composants restants** à migrer

## Prochaine Étape
Continuer la migration des fichiers restants avec le même pattern de remplacement.
