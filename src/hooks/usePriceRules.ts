/**
 * Price Rules Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PriceRulesService, CreatePriceRuleInput, PriceRule } from '@/services/PriceRulesService';

export function usePriceRules() {
  return useQuery({
    queryKey: ['price-rules'],
    queryFn: () => PriceRulesService.getRules(),
    staleTime: 30 * 1000,
  });
}

export function usePriceRule(ruleId: string) {
  return useQuery({
    queryKey: ['price-rule', ruleId],
    queryFn: () => PriceRulesService.getRule(ruleId),
    enabled: !!ruleId,
  });
}

export function useCreatePriceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePriceRuleInput) => PriceRulesService.createRule(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-rules'] });
      toast.success('Règle créée');
    },
    onError: (error: Error) => toast.error(`Erreur: ${error.message}`),
  });
}

export function useUpdatePriceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, updates }: { ruleId: string; updates: Partial<PriceRule> }) => 
      PriceRulesService.updateRule(ruleId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-rules'] });
      queryClient.invalidateQueries({ queryKey: ['price-rule', data.id] });
      toast.success('Règle mise à jour');
    },
    onError: (error: Error) => toast.error(`Erreur: ${error.message}`),
  });
}

export function useDeletePriceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => PriceRulesService.deleteRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-rules'] });
      toast.success('Règle supprimée');
    },
    onError: (error: Error) => toast.error(`Erreur: ${error.message}`),
  });
}

export function useApplyPriceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => PriceRulesService.applyRule(ruleId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-rules'] });
      queryClient.invalidateQueries({ queryKey: ['price-rule-logs'] });
      toast.success(`Règle appliquée: ${data.products_count} produits modifiés`);
    },
    onError: (error: Error) => toast.error(`Erreur: ${error.message}`),
  });
}

export function useSimulatePriceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => PriceRulesService.simulateRule(ruleId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-rule-logs'] });
      toast.success(`Simulation: ${data.products_count} produits affectés`);
    },
    onError: (error: Error) => toast.error(`Erreur: ${error.message}`),
  });
}

export function usePriceRuleLogs(ruleId?: string, limit?: number) {
  return useQuery({
    queryKey: ['price-rule-logs', ruleId, limit],
    queryFn: () => PriceRulesService.getLogs(ruleId, limit),
    staleTime: 30 * 1000,
  });
}

export function usePriceRulesStats() {
  return useQuery({
    queryKey: ['price-rules-stats'],
    queryFn: () => PriceRulesService.getStats(),
    staleTime: 60 * 1000,
  });
}

export function useRuleTypeOptions() {
  return PriceRulesService.getRuleTypeOptions();
}

export function useApplyToOptions() {
  return PriceRulesService.getApplyToOptions();
}
