import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AutomationEngineService, AutomationRule } from '@/services/AutomationEngine';

export function useAutomationRules() {
  return useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => AutomationEngineService.getAllRules(),
  });
}

export function useCreateAutomationRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ruleData: {
      name: string;
      description?: string;
      rule_type: string;
      trigger_conditions?: any;
      ai_conditions?: any;
      actions?: any;
      is_active?: boolean;
      priority?: number;
    }) => AutomationEngineService.createRule(ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });
}

export function useToggleRuleStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      AutomationEngineService.toggleRuleStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });
}

export function useExecuteAutomationRule() {
  return useMutation({
    mutationFn: ({ ruleId, inputData }: { ruleId: string; inputData: any }) => 
      AutomationEngineService.executeRule(ruleId, inputData),
  });
}