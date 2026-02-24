/**
 * Sprint 7: Onboarding Persistence Hook
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useOnboardingStore } from '@/stores/onboardingStore';

export function useOnboardingPersistence() {
  const { user } = useUnifiedAuth();
  const store = useOnboardingStore();
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Hydrate store from DB on load
  useEffect(() => {
    if (progress) {
      store.setStep(progress.current_step || 1);
      store.setBusinessInfo(progress.business_name || '', progress.business_type || '');
      store.setPlatform(progress.store_platform || '');
      store.setStoreUrl(progress.store_url || '');
      store.setStoreConnected(progress.store_connected || false);
      store.setImportMethod(progress.import_method || '');
      store.setProductsImported(progress.products_imported || 0);
      if (progress.onboarding_completed) store.completeOnboarding();
      const steps = progress.completed_steps as number[] | null;
      if (Array.isArray(steps)) steps.forEach(s => store.completeStep(s));
    }
  }, [progress]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const payload = {
        user_id: user.id,
        current_step: store.currentStep,
        completed_steps: JSON.stringify(store.completedSteps),
        store_platform: store.storePlatform || null,
        store_url: store.storeUrl || null,
        store_connected: store.storeConnected,
        products_imported: store.productsImported,
        import_method: store.importMethod || null,
        business_type: store.businessType || null,
        business_name: store.businessName || null,
        onboarding_completed: store.onboardingCompleted,
        completed_at: store.onboardingCompleted ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('onboarding_progress')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;

      // Also update profiles table so ProtectedRoute redirect works
      if (store.onboardingCompleted) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
    },
  });

  return {
    isLoading,
    hasCompleted: progress?.onboarding_completed ?? false,
    save: save.mutate,
    isSaving: save.isPending,
  };
}
