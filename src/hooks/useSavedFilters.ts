/**
 * Hook pour gérer les filtres sauvegardés
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useSavedFilters() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch saved filters
  const { data: savedFilters = [], isLoading } = useQuery({
    queryKey: ['saved-catalog-filters'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('saved_catalog_filters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as SavedFilter[];
    },
    staleTime: 60 * 1000,
  });

  // Save filter
  const saveFilter = useMutation({
    mutationFn: async ({ name, filters }: { name: string; filters: Record<string, unknown> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('saved_catalog_filters')
        .insert([{
          user_id: user.id,
          name,
          filters: filters as any,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-catalog-filters'] });
      toast({
        title: "Filtres sauvegardés",
        description: "Vos filtres ont été enregistrés",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete filter
  const deleteFilter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_catalog_filters')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-catalog-filters'] });
      toast({
        title: "Filtre supprimé",
        description: "Le filtre a été supprimé",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set default filter
  const setDefaultFilter = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Reset all defaults
      await supabase
        .from('saved_catalog_filters')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('saved_catalog_filters')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-catalog-filters'] });
      toast({
        title: "Filtre par défaut",
        description: "Ce filtre sera appliqué par défaut",
      });
    },
  });

  const defaultFilter = savedFilters.find(f => f.is_default);

  return {
    savedFilters,
    defaultFilter,
    isLoading,
    saveFilter: saveFilter.mutate,
    deleteFilter: deleteFilter.mutate,
    setDefaultFilter: setDefaultFilter.mutate,
    isSaving: saveFilter.isPending,
  };
}
