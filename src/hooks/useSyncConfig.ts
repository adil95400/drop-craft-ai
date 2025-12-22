import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SyncConfigFilters {
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  brands?: string[];
  tags?: string[];
  status?: string[];
}

export interface SyncConfiguration {
  id: string;
  user_id: string;
  connector_id: string;
  sync_direction: string;
  sync_frequency: 'hourly' | 'daily' | 'weekly' | 'manual';
  sync_entities: string[];
  auto_resolve_conflicts: boolean;
  conflict_resolution_rules: any;
  field_mappings: any;
  filters: SyncConfigFilters;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export function useSyncConfig() {
  const queryClient = useQueryClient();

  // Use integrations table as a proxy for sync configurations
  const { data: configs, isLoading } = useQuery({
    queryKey: ['sync-configurations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sync configs:', error);
        return [];
      }

      // Transform to SyncConfiguration interface
      return (data || []).map((item: any): SyncConfiguration => ({
        id: item.id,
        user_id: item.user_id,
        connector_id: item.platform,
        sync_direction: (item.config as any)?.sync_direction || 'import',
        sync_frequency: (item.sync_frequency as any) || 'manual',
        sync_entities: (item.config as any)?.sync_entities || ['products'],
        auto_resolve_conflicts: (item.config as any)?.auto_resolve_conflicts || false,
        conflict_resolution_rules: (item.config as any)?.conflict_resolution_rules || {},
        field_mappings: (item.config as any)?.field_mappings || {},
        filters: (item.config as any)?.filters || {},
        is_active: item.is_active || false,
        last_sync_at: item.last_sync_at || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    },
  });

  // Get a specific configuration
  const getConfig = (connectorId: string) => {
    return configs?.find(c => c.connector_id === connectorId);
  };

  // Create or update a configuration
  const saveMutation = useMutation({
    mutationFn: async (config: Partial<SyncConfiguration>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const integrationData = {
        platform: config.connector_id || 'generic',
        sync_frequency: config.sync_frequency || 'manual',
        is_active: config.is_active,
        config: {
          sync_direction: config.sync_direction,
          sync_entities: config.sync_entities,
          auto_resolve_conflicts: config.auto_resolve_conflicts,
          conflict_resolution_rules: config.conflict_resolution_rules,
          field_mappings: config.field_mappings,
          filters: config.filters,
        },
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (config.id) {
        const { data, error } = await supabase
          .from('integrations')
          .update(integrationData as any)
          .eq('id', config.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('integrations')
          .insert(integrationData as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-configurations'] });
      toast.success('Configuration sauvegardée avec succès');
    },
    onError: (error) => {
      console.error('Error saving sync config:', error);
      toast.error('Erreur lors de la sauvegarde de la configuration');
    },
  });

  // Delete a configuration
  const deleteMutation = useMutation({
    mutationFn: async (configId: string) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', configId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-configurations'] });
      toast.success('Configuration supprimée avec succès');
    },
    onError: (error) => {
      console.error('Error deleting sync config:', error);
      toast.error('Erreur lors de la suppression de la configuration');
    },
  });

  return {
    configs,
    isLoading,
    getConfig,
    saveConfig: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    deleteConfig: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
