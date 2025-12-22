import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeneratedStore {
  id: string;
  user_id: string;
  name: string;
  theme: string;
  config: any;
  status: string;
  created_at: string;
}

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

  // Use integrations table as a proxy for generated stores
  const getGeneratedStores = useQuery({
    queryKey: ['generated-stores'],
    queryFn: async (): Promise<GeneratedStore[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      // Use integrations table with platform = 'generated_store'
      const { data, error } = await (supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'generated_store')
        .order('created_at', { ascending: false }) as any);
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.platform_name || 'Ma Boutique',
        theme: (item.config as any)?.theme || 'default',
        config: item.config,
        status: item.connection_status || 'draft',
        created_at: item.created_at
      }));
    }
  });

  return {
    generateStore,
    getThemes,
    optimizeSEO,
    getGeneratedStores
  };
};