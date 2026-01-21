import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImportProgress {
  status: 'idle' | 'fetching' | 'importing' | 'completed' | 'error';
  imported: number;
  total: number;
  message: string;
}

interface ShopifyIntegration {
  id: string;
  platform_name: string | null;
  store_url: string | null;
  config: {
    credentials?: {
      shop_domain?: string;
      access_token?: string;
    };
  } | null;
}

export function useShopifyOrderImport() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ImportProgress>({
    status: 'idle',
    imported: 0,
    total: 0,
    message: ''
  });

  // Get active Shopify integrations from 'integrations' table
  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
    queryKey: ['shopify-integrations-for-orders'],
    queryFn: async (): Promise<ShopifyIntegration[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('integrations')
        .select('id, platform_name, store_url, config')
        .eq('user_id', user.id)
        .eq('platform', 'shopify')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ShopifyIntegration[];
    }
  });

  // Import orders mutation
  const importOrdersMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      setProgress({
        status: 'fetching',
        imported: 0,
        total: 0,
        message: 'Connexion à Shopify...'
      });

      // Get integration credentials from integrations table
      const { data: integration, error: intError } = await supabase
        .from('integrations')
        .select('id, config')
        .eq('id', integrationId)
        .single();

      if (intError || !integration) {
        throw new Error('Intégration non trouvée');
      }

      const config = integration.config as { credentials?: { shop_domain?: string; access_token?: string } } | null;
      const credentials = config?.credentials;
      
      if (!credentials?.shop_domain || !credentials?.access_token) {
        throw new Error('Credentials Shopify manquants');
      }

      setProgress(prev => ({ ...prev, message: 'Récupération des commandes Shopify...' }));

      // Call edge function to import orders
      const { data, error } = await supabase.functions.invoke('shopify-operations', {
        body: {
          operation: 'import-orders-to-shopopti',
          storeId: integrationId,
          credentials: {
            shop_domain: credentials.shop_domain,
            access_token: credentials.access_token
          }
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erreur inconnue');

      setProgress({
        status: 'completed',
        imported: data.imported_count || 0,
        total: data.total_fetched || data.imported_count || 0,
        message: data.message || `${data.imported_count} commandes importées avec succès`
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unified-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`${data.imported_count} commandes importées depuis Shopify`);
    },
    onError: (error: Error) => {
      setProgress(prev => ({
        ...prev,
        status: 'error',
        message: error.message
      }));
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Wrapper function that accepts options
  const importOrders = (integrationId: string, options?: { onSuccess?: (data: any) => void }) => {
    importOrdersMutation.mutate(integrationId, {
      onSuccess: (data) => {
        options?.onSuccess?.(data);
      }
    });
  };

  const resetProgress = () => {
    setProgress({
      status: 'idle',
      imported: 0,
      total: 0,
      message: ''
    });
  };

  return {
    integrations,
    isLoadingIntegrations,
    importOrders,
    isImporting: importOrdersMutation.isPending,
    progress,
    resetProgress
  };
}
