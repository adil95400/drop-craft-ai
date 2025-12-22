import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIRecommendation {
  id: string;
  recommendation_type: string;
  target_entity_type: string;
  target_entity_id: string;
  title: string;
  description: string;
  confidence_score: number;
  suggested_actions: any[];
  estimated_impact: any;
  reasoning: any;
  status: string;
  is_active: boolean;
  created_at: string;
  expires_at: string;
}

export function useSupplierRecommendations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use business_intelligence_insights table as a proxy for AI recommendations
  const { data: recommendations = [], isLoading, refetch } = useQuery({
    queryKey: ['supplier-recommendations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('business_intelligence_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('insight_type', 'supplier_recommendation')
        .eq('status', 'new')
        .order('confidence_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recommendations:', error);
        return [];
      }

      // Transform to AIRecommendation interface
      return (data || []).map((item: any): AIRecommendation => ({
        id: item.id,
        recommendation_type: item.insight_type,
        target_entity_type: 'supplier',
        target_entity_id: '',
        title: item.title,
        description: item.description || '',
        confidence_score: item.confidence_score || 0.8,
        suggested_actions: (item.actionable_recommendations as any[]) || [],
        estimated_impact: { score: item.impact_score || 0.5 },
        reasoning: item.supporting_data || {},
        status: item.status || 'new',
        is_active: !item.is_read,
        created_at: item.created_at,
        expires_at: item.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }));
    },
    refetchInterval: 60000,
  });

  // Generate new recommendations
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-ai-recommendations');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-recommendations'] });
      
      toast({
        title: 'Recommandations générées',
        description: `${data?.count || 0} nouvelles recommandations disponibles`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Accept a recommendation
  const acceptMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const { error } = await supabase
        .from('business_intelligence_insights')
        .update({
          status: 'accepted',
          is_read: true,
        })
        .eq('id', recommendationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-recommendations'] });
      toast({
        title: 'Recommandation acceptée',
      });
    },
  });

  // Reject a recommendation
  const rejectMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const { error } = await supabase
        .from('business_intelligence_insights')
        .update({
          status: 'dismissed',
          is_read: true,
        })
        .eq('id', recommendationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-recommendations'] });
    },
  });

  // Statistics
  const stats = {
    total: recommendations.length,
    highConfidence: recommendations.filter(r => r.confidence_score >= 0.8).length,
    mediumConfidence: recommendations.filter(r => r.confidence_score >= 0.5 && r.confidence_score < 0.8).length,
    byType: recommendations.reduce((acc, r) => {
      acc[r.recommendation_type] = (acc[r.recommendation_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    recommendations,
    isLoading,
    refetch,
    generateRecommendations: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    acceptRecommendation: acceptMutation.mutate,
    isAccepting: acceptMutation.isPending,
    rejectRecommendation: rejectMutation.mutate,
    isRejecting: rejectMutation.isPending,
    stats,
  };
}
