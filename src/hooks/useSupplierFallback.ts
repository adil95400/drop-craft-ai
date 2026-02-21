/**
 * useSupplierFallback — Hook pour la gestion du fallback fournisseur (P1-2)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierFallbackService, FallbackRule } from '@/services/SupplierFallbackService';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export function useSupplierFallback() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['fallback-rules', user?.id],
    queryFn: () => supplierFallbackService.getRules(user!.id),
    enabled: !!user?.id,
  });

  const createRule = useMutation({
    mutationFn: (rule: Partial<FallbackRule>) =>
      supplierFallbackService.createRule(user!.id, rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fallback-rules'] });
      toast.success('Règle de fallback créée');
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  const updateRule = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FallbackRule> }) =>
      supplierFallbackService.updateRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fallback-rules'] });
      toast.success('Règle mise à jour');
    },
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => supplierFallbackService.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fallback-rules'] });
      toast.success('Règle supprimée');
    },
  });

  const runFallbackCheck = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-fallback-check');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fallback-rules'] });
      queryClient.invalidateQueries({ queryKey: ['price-change-history'] });
      const switches = data?.switches?.length ?? 0;
      if (switches > 0) {
        toast.warning(`${switches} basculement(s) de fournisseur effectué(s)`);
      } else {
        toast.success(`${data?.evaluated ?? 0} règles évaluées, aucun basculement nécessaire`);
      }
    },
    onError: (e: Error) => toast.error(`Erreur fallback: ${e.message}`),
  });

  return {
    rules,
    isLoading,
    createRule: createRule.mutate,
    updateRule: updateRule.mutate,
    deleteRule: deleteRule.mutate,
    runFallbackCheck: runFallbackCheck.mutate,
    isChecking: runFallbackCheck.isPending,
    isCreating: createRule.isPending,
  };
}
