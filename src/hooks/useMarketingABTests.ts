import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type MarketingABTest = {
  id: string; name: string; description?: string; status?: string; variants?: any; metrics?: any;
  start_date?: string; end_date?: string; winner_variant_id?: string; user_id: string;
  created_at: string; updated_at: string;
};

export const useMarketingABTests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: abTests = [], isLoading, error } = useQuery({
    queryKey: ['marketing-ab-tests', user?.id],
    queryFn: async (): Promise<MarketingABTest[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('ab_test_experiments')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MarketingABTest[];
    },
    enabled: !!user?.id,
  });

  const createABTest = useMutation({
    mutationFn: async (testData: any) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('ab_test_experiments')
        .insert({ ...testData, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-ab-tests'] });
      toast({ title: "Test A/B créé" });
    },
  });

  const updateABTest = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('ab_test_experiments')
        .update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-ab-tests'] });
      toast({ title: "Test A/B mis à jour" });
    },
  });

  return {
    abTests, isLoading, error,
    createABTest: createABTest.mutate, updateABTest: updateABTest.mutate,
    isCreating: createABTest.isPending, isUpdating: updateABTest.isPending,
  };
};
