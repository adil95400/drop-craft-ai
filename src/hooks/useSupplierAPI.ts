import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface SupplierCredentials {
  api_key?: string;
  api_secret?: string;
  store_url?: string;
  username?: string;
  password?: string;
  [key: string]: string | undefined;
}

export interface SyncJob {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  total_items?: number;
  processed_items?: number;
  products_processed?: number;
  products_created?: number;
  products_failed?: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface SupplierAnalyticsData {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  analytics_date: string;
  period_start?: string;
  period_end?: string;
  total_syncs?: number;
  successful_syncs?: number;
  failed_syncs?: number;
  products_synced?: number;
  products_active?: number;
  avg_sync_time_ms?: number;
  avg_response_time_ms?: number;
  total_api_calls?: number;
  api_calls?: number;
  api_errors?: number;
  total_revenue?: number;
  revenue?: number;
  total_orders?: number;
  orders_count?: number;
  error_count?: number;
  avg_margin?: number;
}

export function useSupplierAPI() {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Valider et sauvegarder les credentials
  const saveCredentialsMutation = useMutation({
    mutationFn: async ({ 
      supplierId, 
      supplierName, 
      credentials 
    }: { 
      supplierId: string; 
      supplierName: string; 
      credentials: SupplierCredentials 
    }) => {
      const { data, error } = await supabase.functions.invoke('supplier-api-connector', {
        body: { 
          action: 'save_credentials', 
          supplierId, 
          supplierName,
          credentials 
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erreur lors de la sauvegarde');
      
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Credentials ${variables.supplierName} sauvegardés avec succès`);
      queryClient.invalidateQueries({ queryKey: ['supplier-credentials'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-connections'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Tester la connexion
  const testConnectionMutation = useMutation({
    mutationFn: async ({ 
      supplierId, 
      supplierName 
    }: { 
      supplierId: string; 
      supplierName: string 
    }) => {
      setIsConnecting(true);
      const { data, error } = await supabase.functions.invoke('supplier-api-connector', {
        body: { 
          action: 'test_connection', 
          supplierId, 
          supplierName 
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (data?.success) {
        toast.success(`Connexion ${variables.supplierName} réussie!`);
      } else {
        toast.error(`Échec connexion: ${data?.error || 'Erreur inconnue'}`);
      }
      queryClient.invalidateQueries({ queryKey: ['supplier-credentials'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur de connexion: ${error.message}`);
    },
    onSettled: () => {
      setIsConnecting(false);
    }
  });

  // Récupérer les produits d'un fournisseur
  const fetchProductsMutation = useMutation({
    mutationFn: async ({ 
      supplierId, 
      supplierName,
      limit = 100,
      offset = 0
    }: { 
      supplierId: string; 
      supplierName: string;
      limit?: number;
      offset?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('supplier-api-connector', {
        body: { 
          action: 'fetch_products', 
          supplierId, 
          supplierName,
          limit,
          offset
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(`${data.products?.length || 0} produits récupérés`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Démarrer une synchronisation
  const startSyncMutation = useMutation({
    mutationFn: async ({ 
      supplierId, 
      supplierName,
      syncType = 'full'
    }: { 
      supplierId: string; 
      supplierName: string;
      syncType?: 'full' | 'incremental' | 'stock_only' | 'price_only';
    }) => {
      const { data, error } = await supabase.functions.invoke('supplier-sync', {
        body: { 
          action: 'start', 
          supplierId, 
          supplierName,
          syncType
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (data?.success) {
        toast.success(`Synchronisation ${variables.supplierName} démarrée`);
        queryClient.invalidateQueries({ queryKey: ['sync-jobs'] });
      } else {
        toast.error(`Échec: ${data?.error || 'Erreur inconnue'}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur de synchronisation: ${error.message}`);
    }
  });

  // Annuler une synchronisation
  const cancelSyncMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('supplier-sync', {
        body: { action: 'cancel', jobId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Synchronisation annulée');
      queryClient.invalidateQueries({ queryKey: ['sync-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Récupérer les jobs de synchronisation actifs
  const useSyncJobs = (supplierId?: string) => useQuery({
    queryKey: ['sync-jobs', supplierId],
    queryFn: async () => {
      let query = supabase
        .from('supplier_sync_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SyncJob[];
    },
    refetchInterval: 5000, // Rafraîchir toutes les 5 secondes pour les jobs actifs
  });

  // Récupérer les analytics
  const useSupplierAnalytics = (timeRange: '7d' | '30d' | '90d' = '30d') => useQuery({
    queryKey: ['supplier-analytics', timeRange],
    queryFn: async () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('supplier_analytics')
        .select('*')
        .gte('period_start', startDate)
        .order('total_revenue', { ascending: false });

      if (error) throw error;
      return (data || []) as SupplierAnalyticsData[];
    },
    staleTime: 60000, // 1 minute
  });

  // Récupérer les credentials existants
  const useSupplierCredentials = () => useQuery({
    queryKey: ['supplier-credentials'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('supplier_credentials')
        .select('supplier_id, supplier_name, is_valid, last_validated_at, created_at')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
  });

  // Récupérer les schedules de sync
  const useSyncSchedules = () => useQuery({
    queryKey: ['sync-schedules'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('supplier_sync_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Créer ou mettre à jour un schedule
  const upsertScheduleMutation = useMutation({
    mutationFn: async ({
      supplierId,
      supplierName,
      schedule,
      syncType,
      isActive
    }: {
      supplierId: string;
      supplierName: string;
      schedule: string;
      syncType: string;
      isActive: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('supplier_sync_schedules')
        .upsert({
          user_id: user.id,
          supplier_id: supplierId,
          supplier_name: supplierName,
          schedule_cron: schedule,
          sync_type: syncType,
          is_active: isActive,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,supplier_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Planning de synchronisation mis à jour');
      queryClient.invalidateQueries({ queryKey: ['sync-schedules'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  return {
    // Mutations
    saveCredentials: saveCredentialsMutation.mutate,
    testConnection: testConnectionMutation.mutate,
    fetchProducts: fetchProductsMutation.mutate,
    startSync: startSyncMutation.mutate,
    cancelSync: cancelSyncMutation.mutate,
    upsertSchedule: upsertScheduleMutation.mutate,
    
    // États
    isConnecting,
    isSavingCredentials: saveCredentialsMutation.isPending,
    isTestingConnection: testConnectionMutation.isPending,
    isFetchingProducts: fetchProductsMutation.isPending,
    isStartingSync: startSyncMutation.isPending,
    
    // Hooks de requête
    useSyncJobs,
    useSupplierAnalytics,
    useSupplierCredentials,
    useSyncSchedules,
  };
}
