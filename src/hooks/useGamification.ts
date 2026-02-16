/**
 * Sprint 16: Gamification & XP System Hook
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useCallback } from 'react';

// Achievement definitions
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  category: 'onboarding' | 'products' | 'sales' | 'engagement' | 'mastery';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Onboarding
  { id: 'first_login', name: 'Premier Pas', description: 'Connectez-vous pour la première fois', icon: '🚀', xpReward: 50, category: 'onboarding' },
  { id: 'profile_complete', name: 'Profil Complet', description: 'Remplissez votre profil', icon: '👤', xpReward: 100, category: 'onboarding' },
  { id: 'store_connected', name: 'Boutique Connectée', description: 'Connectez votre première boutique', icon: '🏪', xpReward: 200, category: 'onboarding' },
  // Products
  { id: 'first_import', name: 'Premier Import', description: 'Importez votre premier produit', icon: '📦', xpReward: 150, category: 'products' },
  { id: 'ten_products', name: 'Catalogue Starter', description: 'Atteignez 10 produits', icon: '📋', xpReward: 300, category: 'products' },
  { id: 'fifty_products', name: 'Catalogue Pro', description: 'Atteignez 50 produits', icon: '🗂️', xpReward: 500, category: 'products' },
  { id: 'ai_optimize', name: 'IA Activée', description: 'Utilisez l\'optimisation IA', icon: '🤖', xpReward: 200, category: 'products' },
  // Sales
  { id: 'first_order', name: 'Première Vente', description: 'Recevez votre première commande', icon: '💰', xpReward: 300, category: 'sales' },
  { id: 'ten_orders', name: 'Vendeur Actif', description: 'Atteignez 10 commandes', icon: '📈', xpReward: 500, category: 'sales' },
  // Engagement
  { id: 'streak_3', name: 'Régularité', description: '3 jours consécutifs d\'activité', icon: '🔥', xpReward: 150, category: 'engagement' },
  { id: 'streak_7', name: 'Dévoué', description: '7 jours consécutifs d\'activité', icon: '⚡', xpReward: 400, category: 'engagement' },
  { id: 'streak_30', name: 'Inarrêtable', description: '30 jours consécutifs d\'activité', icon: '🏆', xpReward: 1000, category: 'engagement' },
  // Mastery
  { id: 'seo_audit', name: 'SEO Expert', description: 'Lancez un audit SEO', icon: '🔍', xpReward: 200, category: 'mastery' },
  { id: 'automation_created', name: 'Automatiseur', description: 'Créez une automatisation', icon: '⚙️', xpReward: 300, category: 'mastery' },
  { id: 'report_generated', name: 'Analyste', description: 'Générez un rapport avancé', icon: '📊', xpReward: 250, category: 'mastery' },
];

// XP thresholds per level
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

export function getLevelFromXP(xp: number) {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 2000;
  const progressInLevel = xp - currentThreshold;
  const levelRange = nextThreshold - currentThreshold;
  return { level, xp, xpInLevel: progressInLevel, xpForNext: levelRange, percent: Math.min((progressInLevel / levelRange) * 100, 100), nextThreshold };
}

export function useGamification() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const { data: gamification } = useQuery({
    queryKey: ['user-gamification', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: unlockedAchievements } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const awardXP = useMutation({
    mutationFn: async (amount: number) => {
      if (!user?.id) throw new Error('Not authenticated');
      const currentXP = gamification?.xp || 0;
      const newXP = currentXP + amount;
      const newLevel = getLevelFromXP(newXP).level;
      const today = new Date().toISOString().split('T')[0];
      const lastActive = gamification?.last_active_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak = gamification?.streak_days || 0;
      if (lastActive === yesterday) newStreak += 1;
      else if (lastActive !== today) newStreak = 1;

      const { error } = await supabase
        .from('user_gamification')
        .upsert({
          user_id: user.id,
          xp: newXP,
          level: newLevel,
          streak_days: newStreak,
          last_active_date: today,
          total_actions: (gamification?.total_actions || 0) + 1,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (error) throw error;
      return { newXP, newLevel, newStreak };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-gamification'] });
    },
  });

  const unlockAchievement = useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const already = unlockedAchievements?.find(a => a.achievement_id === achievementId);
      if (already) return null;

      const def = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (!def) throw new Error('Unknown achievement');

      const { error } = await supabase
        .from('user_achievements')
        .insert({ user_id: user.id, achievement_id: achievementId });
      if (error && !error.message.includes('duplicate')) throw error;

      // Award XP
      if (def.xpReward) await awardXP.mutateAsync(def.xpReward);
      return def;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });

  const isUnlocked = useCallback((achievementId: string) => {
    return unlockedAchievements?.some(a => a.achievement_id === achievementId) ?? false;
  }, [unlockedAchievements]);

  const levelInfo = getLevelFromXP(gamification?.xp || 0);

  return {
    gamification,
    unlockedAchievements: unlockedAchievements || [],
    achievements: ACHIEVEMENTS,
    levelInfo,
    awardXP,
    unlockAchievement,
    isUnlocked,
    streak: gamification?.streak_days || 0,
  };
}
