import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Integration {
  id: string;
  user_id: string;
  platform_name: string;
  platform_type: string;
  platform_url?: string;
  shop_domain?: string;
  seller_id?: string;
  store_config?: any;
  sync_settings?: any;
  connection_status: 'connected' | 'disconnected' | 'error';
  is_active: boolean;
  sync_frequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ecommerce' | 'marketplace' | 'payment' | 'marketing' | 'analytics' | 'ai' | 'security';
  logo?: string;
  color?: string;
  features?: any[];
  setupSteps?: any[];
  status: 'available';
  icon?: any;
  premium?: boolean;
  rating?: number;
  installs?: number;
  isPopular?: boolean;
  isPremium?: boolean;
}

export interface SyncLog {
  id: string;
  integration_id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  records_succeeded: number;
  records_failed: number;
  error_message?: string;
}

export function useIntegrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch integrations
  const { data: integrations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['integrations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Integration[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Fetch sync logs
  const { data: syncLogs = [] } = useQuery({
    queryKey: ['sync-logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SyncLog[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('integrations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integrations',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['integrations', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Create integration mutation
  const createMutation = useMutation({
    mutationFn: async ({ template, config }: { template: IntegrationTemplate; config: Partial<Integration> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('integrations')
        .insert([{
          user_id: user.id,
          platform_name: template.id,
          platform_type: template.category,
          connection_status: 'disconnected',
          is_active: false,
          sync_frequency: 'daily',
          ...config
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Intégration créée",
        description: "L'intégration a été créée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer l'intégration",
        variant: "destructive"
      });
    }
  });

  // Update integration mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Integration> }) => {
      const { data, error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Intégration mise à jour",
        description: "Les modifications ont été sauvegardées",
      });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de mise à jour",
        description: error.message || "Impossible de mettre à jour l'intégration",
        variant: "destructive"
      });
    }
  });

  // Add integration mutation (alias for create)
  const addMutation = useMutation({
    mutationFn: async ({ template, config }: { template: any; config: any }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('integrations')
        .insert([{
          user_id: user.id,
          platform_name: template.id || template.name,
          platform_type: template.category || template.platform_type || 'ecommerce',
          connection_status: 'disconnected',
          is_active: false,
          sync_frequency: 'daily',
          ...config
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Intégration ajoutée",
        description: "L'intégration a été ajoutée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter l'intégration",
        variant: "destructive"
      });
    }
  });

  // Sync integration mutation
  const syncMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase.functions.invoke('sync-integration', {
        body: { integration_id: integrationId, sync_type: 'full' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Synchronisation lancée",
        description: "La synchronisation des données est en cours...",
      });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Impossible de lancer la synchronisation",
        variant: "destructive"
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase.functions.invoke('test-integration', {
        body: { integration_id: integrationId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Connexion réussie" : "Connexion échouée",
        description: data.message || "Test de connexion effectué",
        variant: data.success ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de test",
        description: error.message || "Impossible de tester la connexion",
        variant: "destructive"
      });
    }
  });

  // Delete integration mutation
  const deleteMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Intégration supprimée",
        description: "L'intégration a été supprimée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'intégration",
        variant: "destructive"
      });
    }
  });

  // Computed values
  const connectedIntegrations = integrations.filter(i => i.connection_status === 'connected');
  const loading = isLoading;
  const templates: IntegrationTemplate[] = [];

  return {
    integrations,
    connectedIntegrations,
    syncLogs,
    templates,
    isLoading,
    loading,
    error,
    refetch,
    fetchIntegrations: refetch,
    // Mutations
    createIntegration: (template: IntegrationTemplate, config: any) => 
      createMutation.mutateAsync({ template, config }),
    updateIntegration: (id: string, updates: Partial<Integration>) => 
      updateMutation.mutate({ id, updates }),
    addIntegration: (template: any, config: any) => 
      addMutation.mutateAsync({ template, config }),
    connectIntegration: async (template: any, credentials?: any) => {
      try {
        await addMutation.mutateAsync({ 
          template, 
          config: { 
            connection_status: 'connected', 
            is_active: true,
            credentials 
          } 
        });
        return true;
      } catch {
        return false;
      }
    },
    disconnectIntegration: (id: string) => 
      updateMutation.mutate({ id, updates: { connection_status: 'disconnected', is_active: false } }),
    syncIntegration: syncMutation.mutate,
    syncData: syncMutation.mutate,
    testConnection: testConnectionMutation.mutate,
    deleteIntegration: deleteMutation.mutate,
    // Loading states
    isSyncing: syncMutation.isPending,
    isTesting: testConnectionMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAdding: addMutation.isPending || createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
