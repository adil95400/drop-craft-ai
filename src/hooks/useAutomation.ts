/**
 * useAutomation — Unified automation hook (API V1)
 * All CRUD delegated to /v1/automation/* endpoints
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { automationApi } from '@/services/api/client';

// Re-export workflow-based automation as named export
export { useRealAutomation as useAutomationWorkflows } from './useRealAutomation'
export type { AutomationWorkflow } from './useRealAutomation'

export interface AutomationTrigger {
  id: string; user_id: string; name: string; description?: string;
  trigger_type: string; conditions: any; is_active: boolean;
  created_at: string; updated_at: string;
}

export interface AutomationAction {
  id: string; user_id: string; trigger_id?: string; name: string;
  action_type: string; config?: any; action_config?: any;
  execution_order?: number; is_active: boolean; created_at: string; updated_at: string;
}

export interface AutomationExecution {
  id: string; user_id: string; trigger_id?: string; action_id?: string;
  status: string; input_data: any; output_data: any; error_message?: string;
  duration_ms?: number; executed_at?: string; created_at?: string;
}

export const useAutomation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: triggers = [], isLoading: isLoadingTriggers } = useQuery({
    queryKey: ['automation-triggers', user?.id],
    queryFn: async () => {
      const res = await automationApi.listTriggers();
      return (res.items || []) as AutomationTrigger[];
    },
    enabled: !!user?.id,
  });

  const { data: actions = [], isLoading: isLoadingActions } = useQuery({
    queryKey: ['automation-actions', user?.id],
    queryFn: async () => {
      const res = await automationApi.listActions();
      return (res.items || []) as AutomationAction[];
    },
    enabled: !!user?.id,
  });

  const { data: executions = [], isLoading: isLoadingExecutions } = useQuery({
    queryKey: ['automation-executions', user?.id],
    queryFn: async () => {
      const res = await automationApi.listExecutions({ limit: 100 });
      return (res.items || []) as AutomationExecution[];
    },
    enabled: !!user?.id,
  });

  const createTrigger = useMutation({
    mutationFn: async (newTrigger: Omit<AutomationTrigger, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      return await automationApi.createTrigger(newTrigger);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      toast({ title: "Déclencheur créé" });
    },
  });

  const updateTrigger = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutomationTrigger> }) => {
      return await automationApi.updateTrigger(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      toast({ title: "Déclencheur mis à jour" });
    },
  });

  const deleteTrigger = useMutation({
    mutationFn: async (id: string) => {
      return await automationApi.deleteTrigger(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      queryClient.invalidateQueries({ queryKey: ['automation-actions'] });
      toast({ title: "Déclencheur supprimé" });
    },
  });

  const createAction = useMutation({
    mutationFn: async (newAction: Omit<AutomationAction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      return await automationApi.createAction(newAction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-actions'] });
      toast({ title: "Action créée" });
    },
  });

  const processTrigger = useMutation({
    mutationFn: async ({ triggerId, contextData }: { triggerId: string; contextData?: any }) => {
      return await automationApi.execute(triggerId, contextData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      toast({ title: "Automatisation exécutée" });
    },
  });

  const stats = {
    totalTriggers: triggers.length,
    activeTriggers: triggers.filter(t => t.is_active).length,
    totalActions: actions.length,
    activeActions: actions.filter(a => a.is_active).length,
    totalExecutions: executions.length,
    successfulExecutions: executions.filter(e => e.status === 'completed').length,
    failedExecutions: executions.filter(e => e.status === 'failed').length,
  };

  return {
    triggers, actions, executions, stats,
    isLoading: isLoadingTriggers || isLoadingActions || isLoadingExecutions,
    createTrigger: createTrigger.mutate, updateTrigger: updateTrigger.mutate,
    deleteTrigger: deleteTrigger.mutate, createAction: createAction.mutate,
    processTrigger: processTrigger.mutate,
    isCreatingTrigger: createTrigger.isPending, isUpdatingTrigger: updateTrigger.isPending,
    isDeletingTrigger: deleteTrigger.isPending, isCreatingAction: createAction.isPending,
    isProcessing: processTrigger.isPending,
  };
};
