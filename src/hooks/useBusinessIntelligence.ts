import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePriorityInsights() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['business-insights', 'priority', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('analytics_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useInsightMetrics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['insight-metrics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('analytics_insights')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return {
        total: data?.length || 0,
        critical: data?.filter(d => d.trend === 'critical').length || 0,
        acknowledged: data?.filter(d => d.metadata && typeof d.metadata === 'object' && (d.metadata as any).acknowledged).length || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAcknowledgeInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('analytics_insights')
        .update({ metadata: { acknowledged: true, acknowledged_at: new Date().toISOString() } })
        .eq('id', insightId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-insights'] });
    },
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('analytics_insights')
        .delete()
        .eq('id', insightId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-insights'] });
    },
  });
}

export function useGenerateInsights() {
  return useMutation({
    mutationFn: async ({ analysisType, timeRange }: { analysisType?: string; timeRange?: string }) => {
      // Placeholder: insights generation would require AI backend
      return { message: 'Génération d\'insights disponible prochainement' };
    },
  });
}
