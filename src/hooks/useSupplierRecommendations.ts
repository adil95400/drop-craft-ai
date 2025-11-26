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

  // Charger les recommandations
  const { data: recommendations = [], isLoading, refetch } = useQuery({
    queryKey: ['supplier-recommendations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_ai_recommendations')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AIRecommendation[];
    },
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  });

  // Générer de nouvelles recommandations
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-ai-recommendations');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-notifications'] });
      
      toast({
        title: 'Recommandations générées',
        description: `${data.count} nouvelles recommandations disponibles`,
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

  // Accepter une recommandation
  const acceptMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const { error } = await supabase
        .from('supplier_ai_recommendations')
        .update({
          status: 'accepted',
          acted_at: new Date().toISOString(),
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

  // Rejeter une recommandation
  const rejectMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const { error } = await supabase
        .from('supplier_ai_recommendations')
        .update({
          status: 'rejected',
          is_active: false,
          acted_at: new Date().toISOString(),
        })
        .eq('id', recommendationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-recommendations'] });
    },
  });

  // Statistiques
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