/**
 * Hook pour rafraîchir automatiquement le profil et les plans
 */
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedPlan } from '@/lib/unified-plan-system';

export const useProfileRefresh = () => {
  const { user, refetchProfile } = useAuth();
  const { loadUserPlan } = useUnifiedPlan();

  const refreshProfile = async () => {
    if (!user?.id) return;
    
    try {
      // Rafraîchir le profil dans AuthContext
      await refetchProfile();
      
      // Rafraîchir le plan dans UnifiedPlan
      await loadUserPlan(user.id);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du profil:', error);
    }
  };

  // Écouter les changements dans la base de données
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
        async (payload) => {
          console.log('Profil modifié:', payload);
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

// Import Supabase pour les changements en temps réel
import { supabase } from '@/integrations/supabase/client';