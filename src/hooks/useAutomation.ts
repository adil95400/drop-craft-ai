/**
 * useAutomation — Unified automation hook
 * Combines trigger-based (legacy) and workflow-based (useRealAutomation) automation
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Re-export workflow-based automation as named export
export { useRealAutomation as useAutomationWorkflows } from './useRealAutomation'
export type { AutomationWorkflow } from './useRealAutomation'
// Avoid re-exporting AutomationExecution from useRealAutomation to prevent conflict

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
      if (!user?.id) return [];
      const { data, error } = await supabase.from('automation_triggers')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AutomationTrigger[];
    },
    enabled: !!user?.id,
  });

  const { data: actions = [], isLoading: isLoadingActions } = useQuery({
    queryKey: ['automation-actions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('automation_actions')
        .select('*').eq('user_id', user.id).order('execution_order', { ascending: true });
      if (error) throw error;
      return (data || []) as AutomationAction[];
    },
    enabled: !!user?.id,
  });

  const { data: executions = [], isLoading: isLoadingExecutions } = useQuery({
    queryKey: ['automation-executions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('automation_execution_logs')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data || []) as AutomationExecution[];
    },
    enabled: !!user?.id,
  });

  const createTrigger = useMutation({
    mutationFn: async (newTrigger: Omit<AutomationTrigger, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('automation_triggers')
        .insert({ ...newTrigger, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      toast({ title: "Déclencheur créé" });
    },
  });

  const updateTrigger = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutomationTrigger> }) => {
      const { data, error } = await supabase.from('automation_triggers')
        .update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      toast({ title: "Déclencheur mis à jour" });
    },
  });

  const deleteTrigger = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('automation_triggers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      queryClient.invalidateQueries({ queryKey: ['automation-actions'] });
      toast({ title: "Déclencheur supprimé" });
    },
  });

  const createAction = useMutation({
    mutationFn: async (newAction: Omit<AutomationAction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('automation_actions')
        .insert({ ...newAction, user_id: user.id, name: newAction.action_type, config: newAction.action_config }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-actions'] });
      toast({ title: "Action créée" });
    },
  });

  const processTrigger = useMutation({
    mutationFn: async ({ triggerId, contextData }: { triggerId: string; contextData?: any }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('automation_execution_logs')
        .insert({ user_id: user.id, trigger_id: triggerId, status: 'completed', input_data: contextData || {} })
        .select().single();
      if (error) throw error;
      return data;
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
