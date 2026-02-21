/**
 * Feed Rules Hooks
 * React Query hooks pour les règles de feed
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  FeedRulesService, 
  CreateRuleInput,
  FeedRule,
} from '@/services/FeedRulesService';

// ========== RULES ==========

export function useFeedRules(feedId?: string) {
  return useQuery({
    queryKey: ['feed-rules', feedId],
    queryFn: () => FeedRulesService.getRules(feedId),
    staleTime: 30 * 1000,
  });
}

export function useFeedRule(ruleId: string) {
  return useQuery({
    queryKey: ['feed-rule', ruleId],
    queryFn: () => FeedRulesService.getRule(ruleId),
    enabled: !!ruleId,
    staleTime: 10 * 1000,
  });
}

export function useCreateFeedRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRuleInput) => FeedRulesService.createRule(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-rules'] });
      queryClient.invalidateQueries({ queryKey: ['feed-rules-stats'] });
      toast.success('Règle créée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateFeedRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, updates }: { ruleId: string; updates: Partial<FeedRule> }) => 
      FeedRulesService.updateRule(ruleId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feed-rules'] });
      queryClient.invalidateQueries({ queryKey: ['feed-rule', data.id] });
      toast.success('Règle mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteFeedRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => FeedRulesService.deleteRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-rules'] });
      queryClient.invalidateQueries({ queryKey: ['feed-rules-stats'] });
      toast.success('Règle supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useToggleFeedRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => 
      FeedRulesService.toggleRule(ruleId, isActive),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feed-rules'] });
      queryClient.invalidateQueries({ queryKey: ['feed-rule', data.id] });
      toast.success(data.is_active ? 'Règle activée' : 'Règle désactivée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDuplicateFeedRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => FeedRulesService.duplicateRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-rules'] });
      toast.success('Règle dupliquée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== TEMPLATES ==========

export function useFeedRuleTemplates(category?: string) {
  return useQuery({
    queryKey: ['feed-rule-templates', category],
    queryFn: () => FeedRulesService.getTemplates(category),
    staleTime: 60 * 1000,
  });
}

export function useCreateRuleFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, feedId }: { templateId: string; feedId?: string }) => 
      FeedRulesService.createFromTemplate(templateId, feedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-rules'] });
      queryClient.invalidateQueries({ queryKey: ['feed-rule-templates'] });
      toast.success('Règle créée depuis le template');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useSaveRuleAsTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, category }: { ruleId: string; category?: string }) => 
      FeedRulesService.saveAsTemplate(ruleId, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-rule-templates'] });
      toast.success('Template créé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== EXECUTIONS ==========

export function useFeedRuleExecutions(ruleId?: string, limit?: number) {
  return useQuery({
    queryKey: ['feed-rule-executions', ruleId, limit],
    queryFn: () => FeedRulesService.getExecutions(ruleId, limit),
    staleTime: 30 * 1000,
  });
}

export function useExecuteFeedRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, feedId }: { ruleId: string; feedId?: string }) => 
      FeedRulesService.executeRule(ruleId, feedId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feed-rules'] });
      queryClient.invalidateQueries({ queryKey: ['feed-rule-executions'] });
      queryClient.invalidateQueries({ queryKey: ['feed-rules-stats'] });
      const matched = (data as any).products_matched ?? 0;
      const modified = (data as any).products_modified ?? 0;
      toast.success(`Règle exécutée: ${modified} produits modifiés sur ${matched} correspondants`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur d'exécution: ${error.message}`);
    },
  });
}

export function usePreviewFeedRule() {
  return useMutation({
    mutationFn: (ruleId: string) => FeedRulesService.previewRule(ruleId),
    onError: (error: Error) => {
      toast.error(`Erreur preview: ${error.message}`);
    },
  });
}

// ========== STATS ==========

export function useFeedRulesStats() {
  return useQuery({
    queryKey: ['feed-rules-stats'],
    queryFn: () => FeedRulesService.getStats(),
    staleTime: 60 * 1000,
  });
}

// ========== FIELD OPTIONS ==========

export function useFieldOptions() {
  return FeedRulesService.getFieldOptions();
}

export function useOperatorOptions(fieldType: string) {
  return FeedRulesService.getOperatorOptions(fieldType);
}

export function useActionOptions() {
  return FeedRulesService.getActionOptions();
}
