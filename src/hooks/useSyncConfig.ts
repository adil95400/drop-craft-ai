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

  // Récupérer toutes les configurations
  const { data: configs, isLoading } = useQuery({
    queryKey: ['sync-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SyncConfiguration[];
    },
  });

  // Récupérer une configuration spécifique
  const getConfig = (connectorId: string) => {
    return configs?.find(c => c.connector_id === connectorId);
  };

  // Créer ou mettre à jour une configuration
  const saveMutation = useMutation({
    mutationFn: async (config: Partial<SyncConfiguration>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const configData = {
        connector_id: config.connector_id,
        sync_direction: config.sync_direction,
        sync_frequency: config.sync_frequency,
        sync_entities: config.sync_entities,
        is_active: config.is_active,
        auto_resolve_conflicts: config.auto_resolve_conflicts,
        conflict_resolution_rules: config.conflict_resolution_rules as any,
        field_mappings: config.field_mappings as any,
        filters: config.filters as any,
        user_id: user.user.id,
        updated_at: new Date().toISOString(),
      };

      if (config.id) {
        const { data, error } = await supabase
          .from('sync_configurations')
          .update(configData)
          .eq('id', config.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('sync_configurations')
          .insert(configData)
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

  // Supprimer une configuration
  const deleteMutation = useMutation({
    mutationFn: async (configId: string) => {
      const { error } = await supabase
        .from('sync_configurations')
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
