/**
 * Sprint 16: Feature Discovery & Guided Tours Hook
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export interface FeatureTip {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  category: 'import' | 'catalog' | 'analytics' | 'marketing' | 'settings';
}

export const FEATURE_TIPS: FeatureTip[] = [
  { id: 'tip_bulk_import', title: 'Import en masse', description: 'Importez des centaines de produits via CSV en un clic.', route: '/import', icon: '📤', category: 'import' },
  { id: 'tip_ai_optimize', title: 'Optimisation IA', description: 'L\'IA peut réécrire vos fiches produits pour améliorer le SEO.', route: '/products', icon: '🤖', category: 'catalog' },
  { id: 'tip_seo_audit', title: 'Audit SEO', description: 'Analysez vos produits et obtenez un score de santé SEO.', route: '/seo', icon: '🔍', category: 'catalog' },
  { id: 'tip_analytics', title: 'Tableau de bord', description: 'Suivez vos ventes, marges et tendances en temps réel.', route: '/dashboard', icon: '📊', category: 'analytics' },
  { id: 'tip_automations', title: 'Automatisations', description: 'Créez des règles pour automatiser vos tâches récurrentes.', route: '/automations', icon: '⚙️', category: 'marketing' },
  { id: 'tip_team', title: 'Collaboration', description: 'Invitez votre équipe et gérez les rôles d\'accès.', route: '/settings/team', icon: '👥', category: 'settings' },
];

export function useFeatureDiscovery() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const { data: seenFeatures } = useQuery({
    queryKey: ['feature-discovery', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_feature_discovery')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const markSeen = useMutation({
    mutationFn: async (featureId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_feature_discovery')
        .upsert({ user_id: user.id, feature_id: featureId, seen_at: new Date().toISOString() }, { onConflict: 'user_id,feature_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-discovery'] });
    },
  });

  const dismiss = useMutation({
    mutationFn: async (featureId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_feature_discovery')
        .upsert({ user_id: user.id, feature_id: featureId, dismissed: true }, { onConflict: 'user_id,feature_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-discovery'] });
    },
  });

  const isFeatureSeen = (featureId: string) => seenFeatures?.some(f => f.feature_id === featureId) ?? false;
  const isFeatureDismissed = (featureId: string) => seenFeatures?.some(f => f.feature_id === featureId && f.dismissed) ?? false;

  const unseenTips = FEATURE_TIPS.filter(t => !isFeatureSeen(t.id));

  return {
    tips: FEATURE_TIPS,
    unseenTips,
    seenFeatures: seenFeatures || [],
    markSeen,
    dismiss,
    isFeatureSeen,
    isFeatureDismissed,
  };
}
