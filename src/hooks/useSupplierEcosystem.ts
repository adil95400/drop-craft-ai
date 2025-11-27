// ============================================
// SHOPOPTI SUPPLIER ECOSYSTEM HOOK
// React hook for supplier management
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierEcosystemService } from '@/services/SupplierEcosystemService';
import { useToast } from '@/hooks/use-toast';
import type {
  ConnectSupplierRequest,
  PlaceOrderRequest,
  SyncProductsRequest,
  SupplierPricingRule,
  SupplierWebhook,
} from '@/types/supplier-ecosystem';

export function useSupplierEcosystem(supplierId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============================================
  // CONNECTION
  // ============================================
  const { data: connection, isLoading: connectionLoading } = useQuery({
    queryKey: ['supplier-connection', supplierId],
    queryFn: () => supplierEcosystemService.getConnectionStatus(supplierId!),
    enabled: !!supplierId,
    refetchInterval: 30000, // Refresh every 30s
  });

  const connectMutation = useMutation({
    mutationFn: (request: ConnectSupplierRequest) =>
      supplierEcosystemService.connectSupplier(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-connection'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      
      // Show sync info if available
      const syncInfo = data?.syncResult?.success 
        ? ` ${data.syncResult.syncStats?.imported || 0} produits synchronisés.`
        : '';
      
      toast({
        title: 'Fournisseur connecté',
        description: `La connexion a été établie avec succès.${syncInfo}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (supplierId: string) => supplierEcosystemService.disconnectSupplier(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-connection'] });
      toast({
        title: 'Fournisseur déconnecté',
        description: 'La connexion a été révoquée',
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: ({ supplierId, credentials }: { supplierId: string; credentials?: any }) => 
      supplierEcosystemService.testConnection(supplierId, credentials),
    onSuccess: (success) => {
      toast({
        title: success ? 'Connexion OK' : 'Échec du test',
        description: success
          ? 'La connexion fonctionne correctement'
          : 'Impossible de se connecter au fournisseur',
        variant: success ? 'default' : 'destructive',
      });
    },
  });

  // ============================================
  // PRICING
  // ============================================
  const { data: pricingRules, isLoading: pricingLoading } = useQuery({
    queryKey: ['pricing-rules', supplierId],
    queryFn: () => supplierEcosystemService.getPricingRules(supplierId!),
    enabled: !!supplierId,
  });

  const createPricingMutation = useMutation({
    mutationFn: (rule: Partial<SupplierPricingRule>) =>
      supplierEcosystemService.createPricingRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast({
        title: 'Règle créée',
        description: 'La règle de pricing a été configurée',
      });
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SupplierPricingRule> }) =>
      supplierEcosystemService.updatePricingRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast({
        title: 'Règle mise à jour',
        description: 'La règle de pricing a été modifiée',
      });
    },
  });

  // ============================================
  // ORDERS
  // ============================================
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['supplier-orders', supplierId],
    queryFn: () => supplierEcosystemService.getSupplierOrders(supplierId!),
    enabled: !!supplierId,
    refetchInterval: 60000, // Refresh every minute
  });

  const placeOrderMutation = useMutation({
    mutationFn: (request: PlaceOrderRequest) => supplierEcosystemService.placeOrder(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-analytics'] });
      toast({
        title: 'Commande passée',
        description: `Commande ${data.supplier_order_id || 'créée'} chez le fournisseur`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Échec de la commande',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      supplierEcosystemService.cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      toast({
        title: 'Commande annulée',
        description: 'La commande a été annulée chez le fournisseur',
      });
    },
  });

  // ============================================
  // ANALYTICS
  // ============================================
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['supplier-analytics', supplierId],
    queryFn: () =>
      supplierEcosystemService.getAnalytics({
        supplier_id: supplierId!,
      }),
    enabled: !!supplierId,
  });

  const { data: healthScore, isLoading: healthLoading } = useQuery({
    queryKey: ['supplier-health', supplierId],
    queryFn: () => supplierEcosystemService.getHealthScore(supplierId!),
    enabled: !!supplierId,
    refetchInterval: 60000,
  });

  // ============================================
  // PRODUCT SYNC
  // ============================================
  const syncProductsMutation = useMutation({
    mutationFn: (request: SyncProductsRequest) => supplierEcosystemService.syncProducts(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['imported-products'] });
      toast({
        title: 'Synchronisation terminée',
        description: `${data.products_synced} produits synchronisés en ${Math.round(data.duration_ms / 1000)}s`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Échec de la synchronisation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ============================================
  // WEBHOOKS
  // ============================================
  const { data: webhooks, isLoading: webhooksLoading } = useQuery({
    queryKey: ['supplier-webhooks', supplierId],
    queryFn: () => supplierEcosystemService.getWebhooks(supplierId!),
    enabled: !!supplierId,
  });

  const createWebhookMutation = useMutation({
    mutationFn: (webhook: Partial<SupplierWebhook>) =>
      supplierEcosystemService.createWebhook(webhook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-webhooks'] });
      toast({
        title: 'Webhook créé',
        description: 'Le webhook a été configuré',
      });
    },
  });

  // ============================================
  // EXTENDED DATA
  // ============================================
  const { data: supplierExtended, isLoading: extendedLoading } = useQuery({
    queryKey: ['supplier-extended', supplierId],
    queryFn: () => supplierEcosystemService.getSupplierExtended(supplierId!),
    enabled: !!supplierId,
    staleTime: 30000,
  });

  return {
    // Connection
    connection,
    connectionLoading,
    connectSupplier: connectMutation.mutate,
    disconnectSupplier: disconnectMutation.mutate,
    testConnection: testConnectionMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isTesting: testConnectionMutation.isPending,

    // Pricing
    pricingRules,
    pricingLoading,
    createPricingRule: createPricingMutation.mutate,
    updatePricingRule: updatePricingMutation.mutate,
    isCreatingPricing: createPricingMutation.isPending,
    isUpdatingPricing: updatePricingMutation.isPending,

    // Orders
    orders,
    ordersLoading,
    placeOrder: placeOrderMutation.mutate,
    cancelOrder: cancelOrderMutation.mutate,
    isPlacingOrder: placeOrderMutation.isPending,
    isCancellingOrder: cancelOrderMutation.isPending,

    // Analytics
    analytics,
    analyticsLoading,
    healthScore,
    healthLoading,

    // Product sync
    syncProducts: syncProductsMutation.mutate,
    isSyncing: syncProductsMutation.isPending,

    // Webhooks
    webhooks,
    webhooksLoading,
    createWebhook: createWebhookMutation.mutate,
    isCreatingWebhook: createWebhookMutation.isPending,

    // Extended
    supplierExtended,
    extendedLoading,
  };
}
