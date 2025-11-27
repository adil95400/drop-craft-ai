import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useStoreBuilder = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateStore = useMutation({
    mutationFn: async (storeData: any) => {
      const { data, error } = await supabase.functions.invoke('ai-store-builder', {
        body: { action: 'generate_store', store_data: storeData }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-stores'] });
      toast({ title: '✨ Boutique générée avec succès' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  const getThemes = useQuery({
    queryKey: ['store-themes'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-store-builder', {
        body: { action: 'get_themes' }
      });
      if (error) throw error;
      return data.themes;
    }
  });

  const optimizeSEO = useMutation({
    mutationFn: async (storeId: string) => {
      const { data, error } = await supabase.functions.invoke('ai-store-builder', {
        body: { action: 'optimize_seo', store_id: storeId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: '🚀 SEO optimisé' });
    }
  });

  const getGeneratedStores = useQuery({
    queryKey: ['generated-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_stores')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  return {
    generateStore,
    getThemes,
    optimizeSEO,
    getGeneratedStores
  };
};