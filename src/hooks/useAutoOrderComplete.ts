import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface OrderItem {
  product_id: string;
  variant_id?: string;
  sku: string;
  quantity: number;
  price: number;
  supplier_sku?: string;
  supplier_type: 'cj' | 'aliexpress' | 'bigbuy' | 'generic';
}

interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postal_code: string;
  country_code: string;
  phone: string;
  email?: string;
}

interface PlaceOrderParams {
  order_id: string;
  items: OrderItem[];
  shipping: ShippingAddress;
  store_order_id?: string;
  priority?: 'normal' | 'express';
}

interface OrderResult {
  success: boolean;
  partial_success?: boolean;
  results: Array<{
    supplier: string;
    success: boolean;
    supplier_order_id?: string;
    error?: string;
  }>;
  tracking_numbers: string[];
}

export function useAutoOrderComplete() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Place auto-order
  const placeOrder = useMutation({
    mutationFn: async (params: PlaceOrderParams): Promise<OrderResult> => {
      const { data, error } = await supabase.functions.invoke('auto-order-complete', {
        body: { action: 'place_order', ...params }
      });

      if (error) throw error;
      if (!data.success && !data.partial_success) {
        throw new Error(data.error || 'Order placement failed');
      }
      return data;
    },
    onSuccess: (data, variables) => {
      const successCount = data.results.filter(r => r.success).length;
      const totalCount = data.results.length;
      
      if (data.success) {
        toast.success(`Commande automatique réussie`, {
          description: `${successCount}/${totalCount} fournisseurs traités`
        });
      } else if (data.partial_success) {
        toast.warning(`Commande partiellement réussie`, {
          description: `${successCount}/${totalCount} fournisseurs traités`
        });
      }

      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['auto-order-queue'] });
    },
    onError: (error: Error) => {
      toast.error('Erreur de commande automatique', {
        description: error.message
      });
    }
  });

  // Sync tracking
  const syncTracking = useMutation({
    mutationFn: async (params: { 
      order_id: string; 
      supplier_order_id: string; 
      supplier_type: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('auto-order-complete', {
        body: { action: 'sync_tracking', ...params }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.tracking?.trackingNumber) {
        toast.success('Tracking synchronisé', {
          description: `N° ${data.tracking.trackingNumber}`
        });
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast.error('Erreur de synchronisation tracking', {
        description: error.message
      });
    }
  });

  // Batch sync all pending tracking
  const batchSyncTracking = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('auto-order-complete', {
        body: { action: 'batch_sync_tracking' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const synced = data.results?.filter((r: any) => r.tracking).length || 0;
      toast.success(`${synced} trackings synchronisés`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast.error('Erreur de synchronisation batch', {
        description: error.message
      });
    }
  });

  // Get order status from supplier
  const getOrderStatus = useMutation({
    mutationFn: async (params: {
      order_id: string;
      supplier_order_id: string;
      supplier_type: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('auto-order-complete', {
        body: { action: 'get_status', ...params }
      });

      if (error) throw error;
      return data;
    }
  });

  return {
    placeOrder: placeOrder.mutate,
    placeOrderAsync: placeOrder.mutateAsync,
    isPlacingOrder: placeOrder.isPending,
    
    syncTracking: syncTracking.mutate,
    isSyncingTracking: syncTracking.isPending,
    
    batchSyncTracking: batchSyncTracking.mutate,
    isBatchSyncing: batchSyncTracking.isPending,
    
    getOrderStatus: getOrderStatus.mutateAsync,
    isGettingStatus: getOrderStatus.isPending,
  };
}

// Hook for auto-order automation settings
export function useAutoOrderSettings() {
  const { user } = useAuth();

  const defaultSettings = {
    enabled: false,
    auto_confirm: true,
    default_shipping: 'standard',
    notify_on_order: true,
    notify_on_tracking: true,
    retry_failed: true,
    max_retries: 3,
  };

  const { data: settings, isLoading } = useQuery({
    queryKey: ['auto-order-settings', user?.id],
    queryFn: async () => {
      if (!user) return defaultSettings;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      // Use type assertion since column may not exist in generated types
      const settings = data as Record<string, any> | null;
      return settings?.auto_order_settings || defaultSettings;
    },
    enabled: !!user
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Record<string, unknown>) => {
      if (!user) throw new Error('Not authenticated');

      // Direct insert/update
      const { error } = await (supabase
        .from('user_settings') as unknown as ReturnType<typeof supabase.from>)
        .upsert({
          user_id: user.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Paramètres auto-order mis à jour');
    }
  });

  return {
    settings: settings || defaultSettings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}
