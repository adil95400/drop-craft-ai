import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MarketplaceType = 'amazon' | 'ebay' | 'aliexpress' | 'cdiscount';

export interface MarketplaceCredentials {
  // Amazon
  accessKey?: string;
  secretKey?: string;
  refreshToken?: string;
  marketplaceId?: string;
  region?: string;
  // eBay
  clientId?: string;
  clientSecret?: string;
  userToken?: string;
  sandbox?: boolean;
  // AliExpress
  appKey?: string;
  appSecret?: string;
  accessToken?: string;
  // Cdiscount
  apiKey?: string;
  sellerId?: string;
}

export interface MarketplaceConnection {
  id: string;
  platform: MarketplaceType;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: string;
  productCount?: number;
  orderCount?: number;
  errorMessage?: string;
  config?: Record<string, any>;
}

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

export function useMarketplaceConnectors() {
  const queryClient = useQueryClient();

  // Fetch all marketplace connections
  const { data: connections, isLoading: isLoadingConnections, refetch: refetchConnections } = useQuery({
    queryKey: ['marketplace-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .in('platform', ['amazon', 'ebay', 'aliexpress', 'cdiscount'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(integration => ({
        id: integration.id,
        platform: integration.platform as MarketplaceType,
        status: integration.is_active ? 'connected' : 'disconnected',
        lastSync: integration.last_sync_at,
        config: integration.config as Record<string, any> | undefined,
        errorMessage: (integration.config as any)?.error_message
      })) as MarketplaceConnection[];
    }
  });

  // Connect to a marketplace
  const connectMarketplace = useMutation({
    mutationFn: async ({ 
      platform, 
      credentials, 
      config 
    }: { 
      platform: MarketplaceType;
      credentials: MarketplaceCredentials;
      config?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.functions.invoke('marketplace-connector', {
        body: { 
          action: 'connect', 
          platform, 
          credentials,
          config 
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-connections'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success(`${variables.platform} connecté avec succès`);
    },
    onError: (error: Error, variables) => {
      toast.error(`Erreur de connexion ${variables.platform}: ${error.message}`);
    }
  });

  // Disconnect from a marketplace
  const disconnectMarketplace = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('integrations')
        .update({ is_active: false, connection_status: 'disconnected' })
        .eq('id', connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-connections'] });
      toast.success('Marketplace déconnectée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Sync products from a marketplace
  const syncProducts = useMutation({
    mutationFn: async ({ 
      platform, 
      options 
    }: { 
      platform: MarketplaceType;
      options?: { limit?: number; category?: string };
    }) => {
      const { data, error } = await supabase.functions.invoke('marketplace-connector', {
        body: { 
          action: 'sync_products', 
          platform,
          options 
        }
      });
      if (error) throw error;
      return data as SyncResult;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-connections'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (data.failed > 0) {
        toast.warning(`${data.synced} produits synchronisés, ${data.failed} échecs`);
      } else {
        toast.success(`${data.synced} produits synchronisés depuis ${variables.platform}`);
      }
    },
    onError: (error: Error, variables) => {
      toast.error(`Erreur sync ${variables.platform}: ${error.message}`);
    }
  });

  // Sync orders from a marketplace
  const syncOrders = useMutation({
    mutationFn: async ({ 
      platform, 
      options 
    }: { 
      platform: MarketplaceType;
      options?: { limit?: number; since?: string };
    }) => {
      const { data, error } = await supabase.functions.invoke('marketplace-connector', {
        body: { 
          action: 'sync_orders', 
          platform,
          options 
        }
      });
      if (error) throw error;
      return data as SyncResult;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`${data.synced} commandes synchronisées depuis ${variables.platform}`);
    },
    onError: (error: Error, variables) => {
      toast.error(`Erreur sync commandes ${variables.platform}: ${error.message}`);
    }
  });

  // Update inventory on marketplace
  const updateInventory = useMutation({
    mutationFn: async ({ 
      platform, 
      products 
    }: { 
      platform: MarketplaceType;
      products: { sku: string; stock: number }[];
    }) => {
      const { data, error } = await supabase.functions.invoke('marketplace-connector', {
        body: { 
          action: 'update_inventory', 
          platform,
          products 
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Stock mis à jour sur ${variables.platform}`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur mise à jour stock: ${error.message}`);
    }
  });

  // Update prices on marketplace
  const updatePrices = useMutation({
    mutationFn: async ({ 
      platform, 
      products 
    }: { 
      platform: MarketplaceType;
      products: { sku: string; price: number }[];
    }) => {
      const { data, error } = await supabase.functions.invoke('marketplace-connector', {
        body: { 
          action: 'update_prices', 
          platform,
          products 
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Prix mis à jour sur ${variables.platform}`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur mise à jour prix: ${error.message}`);
    }
  });

  // Validate credentials
  const validateCredentials = useMutation({
    mutationFn: async ({ 
      platform, 
      credentials 
    }: { 
      platform: MarketplaceType;
      credentials: MarketplaceCredentials;
    }) => {
      const { data, error } = await supabase.functions.invoke('marketplace-connector', {
        body: { 
          action: 'validate', 
          platform,
          credentials 
        }
      });
      if (error) throw error;
      return data as { valid: boolean; message?: string };
    }
  });

  const getConnectionByPlatform = (platform: MarketplaceType) => {
    return connections?.find(c => c.platform === platform);
  };

  const isConnected = (platform: MarketplaceType) => {
    const connection = getConnectionByPlatform(platform);
    return connection?.status === 'connected';
  };

  return {
    // Data
    connections,
    isLoadingConnections,
    
    // Actions
    connectMarketplace: connectMarketplace.mutate,
    disconnectMarketplace: disconnectMarketplace.mutate,
    syncProducts: syncProducts.mutate,
    syncOrders: syncOrders.mutate,
    updateInventory: updateInventory.mutate,
    updatePrices: updatePrices.mutate,
    validateCredentials: validateCredentials.mutateAsync,
    refetchConnections,
    
    // State
    isConnecting: connectMarketplace.isPending,
    isSyncingProducts: syncProducts.isPending,
    isSyncingOrders: syncOrders.isPending,
    isUpdatingInventory: updateInventory.isPending,
    isUpdatingPrices: updatePrices.isPending,
    
    // Helpers
    getConnectionByPlatform,
    isConnected
  };
}
