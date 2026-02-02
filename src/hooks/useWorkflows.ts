import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkflowService, WorkflowTemplate } from '@/services/WorkflowService';
import { toast } from 'sonner';

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: () => WorkflowService.getWorkflows(),
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflows', id],
    queryFn: () => WorkflowService.getWorkflow(id),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (workflow: Partial<WorkflowTemplate>) => WorkflowService.createWorkflow(workflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow créé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WorkflowTemplate> }) => 
      WorkflowService.updateWorkflow(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => WorkflowService.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useExecuteWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workflowId, inputData }: { workflowId: string; inputData?: Record<string, any> }) => {
      // Use the real workflow-executor edge function
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('workflow-executor', {
        body: {
          workflowId,
          triggerData: inputData,
          manualExecution: true
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Workflow execution failed');
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(`Workflow exécuté en ${(data.executionTime / 1000).toFixed(1)}s`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useWorkflowExecutions(workflowId?: string) {
  return useQuery({
    queryKey: ['workflow-executions', workflowId],
    queryFn: () => WorkflowService.getExecutions(workflowId),
  });
}

export function useStepDefinitions() {
  return useQuery({
    queryKey: ['step-definitions'],
    queryFn: () => WorkflowService.getStepDefinitions(),
  });
}

export function useWorkflowStats() {
  return useQuery({
    queryKey: ['workflow-stats'],
    queryFn: () => WorkflowService.getWorkflowStats(),
  });
}
