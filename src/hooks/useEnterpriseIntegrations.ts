import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface EnterpriseIntegration {
  id: string;
  user_id: string;
  name: string;
  integration_type: string;
  config: Record<string, any> | null;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export function useEnterpriseIntegrations() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading, error } = useQuery({
    queryKey: ['enterprise-integrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('enterprise_integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EnterpriseIntegration[];
    },
    enabled: !!user?.id,
  });

  const createIntegration = useMutation({
    mutationFn: async (integration: {
      name: string;
      integration_type: string;
      config?: Record<string, any>;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('enterprise_integrations')
        .insert({
          user_id: user.id,
          name: integration.name,
          integration_type: integration.integration_type,
          config: integration.config || {},
          is_active: true,
          sync_status: 'idle',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-integrations'] });
      toast.success('Intégration créée avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateIntegration = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EnterpriseIntegration> & { id: string }) => {
      const { data, error } = await supabase
        .from('enterprise_integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-integrations'] });
      toast.success('Intégration mise à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('enterprise_integrations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-integrations'] });
      toast.success('Intégration supprimée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const syncIntegration = useMutation({
    mutationFn: async (id: string) => {
      // Update status to syncing
      await supabase
        .from('enterprise_integrations')
        .update({ sync_status: 'syncing' })
        .eq('id', id);

      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data, error } = await supabase
        .from('enterprise_integrations')
        .update({ 
          sync_status: 'completed',
          last_sync_at: new Date().toISOString(),
          last_error: null
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-integrations'] });
      toast.success('Synchronisation terminée');
    },
    onError: (error) => {
      toast.error(`Erreur de synchronisation: ${error.message}`);
    },
  });

  // Statistics
  const stats = {
    total: integrations.length,
    active: integrations.filter(i => i.is_active).length,
    syncing: integrations.filter(i => i.sync_status === 'syncing').length,
    errors: integrations.filter(i => i.last_error).length,
  };

  return {
    integrations,
    isLoading,
    error,
    stats,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    syncIntegration,
  };
}
