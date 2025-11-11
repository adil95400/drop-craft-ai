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
  store_config?: any;
  connection_status: 'connected' | 'disconnected' | 'error';
  is_active: boolean;
  sync_frequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
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

  return {
    integrations,
    isLoading,
    error,
    refetch,
    syncIntegration: syncMutation.mutate,
    testConnection: testConnectionMutation.mutate,
    deleteIntegration: deleteMutation.mutate,
    isSyncing: syncMutation.isPending,
    isTesting: testConnectionMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
