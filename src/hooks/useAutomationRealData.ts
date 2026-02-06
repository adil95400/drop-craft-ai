/**
 * Hook pour gérer les automatisations — via FastAPI
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  conditions: any;
  steps: any;
  workflow_data: any;
  execution_count: number;
  last_run_at: string | null;
  success_rate: number;
}

export interface AutomationStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
  executionsToday: number;
  executionsThisWeek: number;
}

export function useAutomationWorkflows() {
  return useQuery({
    queryKey: ['automation-workflows'],
    queryFn: async (): Promise<AutomationWorkflow[]> => {
      const res = await shopOptiApi.getWorkflows();
      if (!res.success) throw new Error(res.error || 'Failed to fetch workflows');
      return res.data || [];
    }
  });
}

export function useAutomationStats() {
  return useQuery({
    queryKey: ['automation-stats'],
    queryFn: async (): Promise<AutomationStats> => {
      const res = await shopOptiApi.request<AutomationStats>('/automation/stats');
      if (!res.success) {
        return {
          totalWorkflows: 0,
          activeWorkflows: 0,
          totalExecutions: 0,
          successRate: 100,
          executionsToday: 0,
          executionsThisWeek: 0
        };
      }
      return res.data!;
    }
  });
}

export function useCreateAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      trigger_type: string;
      conditions?: any;
      steps?: any[];
    }) => {
      const res = await shopOptiApi.createWorkflow({
        name: data.name,
        trigger_type: data.trigger_type,
        description: data.description,
        steps: data.steps,
      });
      if (!res.success) throw new Error(res.error || 'Failed to create workflow');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast.success('Automatisation créée avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
}

export function useToggleAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await shopOptiApi.toggleWorkflow(id, !isActive);
      if (!res.success) throw new Error(res.error || 'Failed to toggle workflow');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast.success(variables.isActive ? 'Automatisation mise en pause' : 'Automatisation activée');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
}

export function useDeleteAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.deleteWorkflow(id);
      if (!res.success) throw new Error(res.error || 'Failed to delete workflow');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast.success('Automatisation supprimée');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
}

export function useRunAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflowId: string) => {
      const res = await shopOptiApi.runWorkflow(workflowId);
      if (!res.success) throw new Error(res.error || 'Failed to run workflow');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast.success('Automatisation exécutée avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur d'exécution: ${error.message}`);
    }
  });
}
