/**
 * Hook pour rafraîchir automatiquement le profil et les plans
 */
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedPlan } from '@/lib/unified-plan-system';

export const useProfileRefresh = () => {
  const { user, refetchProfile } = useAuth();
  const loadUserPlan = useUnifiedPlan(s => s.loadUserPlan);

  const refreshProfile = async () => {
    if (!user?.id) return;
    
    try {
      await refetchProfile();
      await loadUserPlan(user.id);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du profil:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('profile_changes')
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        async () => {
          await refreshProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { refreshProfile };
};
