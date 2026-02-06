import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';

export interface AutomationTrigger {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_type: 'order_status' | 'customer_behavior' | 'inventory_level' | 'price_change' | 'scheduled';
  conditions: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationAction {
  id: string;
  user_id: string;
  trigger_id: string;
  action_type: 'send_email' | 'update_inventory' | 'create_order' | 'update_customer' | 'price_adjustment' | 'notification';
  action_config: any;
  execution_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecution {
  id: string;
  user_id: string;
  trigger_id: string;
  action_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input_data: any;
  output_data: any;
  error_message?: string;
  execution_time_ms?: number;
  started_at: string;
  completed_at?: string;
}

export const useAutomation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch automation triggers via FastAPI
  const { data: triggers = [], isLoading: isLoadingTriggers } = useQuery({
    queryKey: ['automation-triggers'],
    queryFn: async () => {
      const res = await shopOptiApi.request<AutomationTrigger[]>('/automation/triggers');
      if (!res.success) return [];
      return res.data || [];
    },
  });

  // Fetch automation actions via FastAPI
  const { data: actions = [], isLoading: isLoadingActions } = useQuery({
    queryKey: ['automation-actions'],
    queryFn: async () => {
      const res = await shopOptiApi.request<AutomationAction[]>('/automation/actions');
      if (!res.success) return [];
      return res.data || [];
    },
  });

  // Fetch execution logs via FastAPI
  const { data: executions = [], isLoading: isLoadingExecutions } = useQuery({
    queryKey: ['automation-executions'],
    queryFn: async () => {
      const res = await shopOptiApi.getWorkflowExecutions(undefined, 100);
      if (!res.success) return [];
      return (res.data || []) as AutomationExecution[];
    },
  });

  // Create automation trigger
  const createTrigger = useMutation({
    mutationFn: async (newTrigger: Omit<AutomationTrigger, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const res = await shopOptiApi.request('/automation/triggers', {
        method: 'POST',
        body: newTrigger,
      });
      if (!res.success) throw new Error(res.error || 'Failed to create trigger');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      toast({
        title: "Déclencheur créé",
        description: "Le déclencheur d'automatisation a été créé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le déclencheur",
        variant: "destructive",
      });
    },
  });

  // Update automation trigger
  const updateTrigger = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutomationTrigger> }) => {
      const res = await shopOptiApi.request(`/automation/triggers/${id}`, {
        method: 'PATCH',
        body: updates,
      });
      if (!res.success) throw new Error(res.error || 'Failed to update trigger');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      toast({
        title: "Déclencheur mis à jour",
        description: "Le déclencheur a été modifié avec succès",
      });
    },
  });

  // Delete automation trigger
  const deleteTrigger = useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.request(`/automation/triggers/${id}`, {
        method: 'DELETE',
      });
      if (!res.success) throw new Error(res.error || 'Failed to delete trigger');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-triggers'] });
      queryClient.invalidateQueries({ queryKey: ['automation-actions'] });
      toast({
        title: "Déclencheur supprimé",
        description: "Le déclencheur a été supprimé avec succès",
      });
    },
  });

  // Create automation action
  const createAction = useMutation({
    mutationFn: async (newAction: Omit<AutomationAction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const res = await shopOptiApi.request('/automation/actions', {
        method: 'POST',
        body: newAction,
      });
      if (!res.success) throw new Error(res.error || 'Failed to create action');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-actions'] });
      toast({
        title: "Action créée",
        description: "L'action d'automatisation a été créée avec succès",
      });
    },
  });

  // Process automation trigger (run)
  const processTrigger = useMutation({
    mutationFn: async ({ triggerId, contextData }: { triggerId: string; contextData?: any }) => {
      const res = await shopOptiApi.request(`/automation/triggers/${triggerId}/execute`, {
        method: 'POST',
        body: { context: contextData },
      });
      if (!res.success) throw new Error(res.error || 'Failed to process trigger');
      return res.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      toast({
        title: "Automatisation exécutée",
        description: `${data?.actions_executed || 0} action(s) exécutée(s) avec succès`,
      });
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
    triggers,
    actions,
    executions,
    stats,
    isLoading: isLoadingTriggers || isLoadingActions || isLoadingExecutions,
    createTrigger: createTrigger.mutate,
    updateTrigger: updateTrigger.mutate,
    deleteTrigger: deleteTrigger.mutate,
    createAction: createAction.mutate,
    processTrigger: processTrigger.mutate,
    isCreatingTrigger: createTrigger.isPending,
    isUpdatingTrigger: updateTrigger.isPending,
    isDeletingTrigger: deleteTrigger.isPending,
    isCreatingAction: createAction.isPending,
    isProcessing: processTrigger.isPending,
  };
};
