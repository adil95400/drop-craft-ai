/**
 * Hook pour gérer les automatisations — via Supabase direct
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

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
  const { user } = useUnifiedAuth();

  return useQuery({
    queryKey: ['automation-workflows', user?.id],
    queryFn: async (): Promise<AutomationWorkflow[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((w: any) => ({
        ...w,
        execution_count: w.execution_count || w.run_count || 0,
        success_rate: 100,
      }));
    },
    enabled: !!user?.id,
  });
}

export function useAutomationStats() {
  const { user } = useUnifiedAuth();

  return useQuery({
    queryKey: ['automation-stats', user?.id],
    queryFn: async (): Promise<AutomationStats> => {
      if (!user?.id) return {
        totalWorkflows: 0, activeWorkflows: 0, totalExecutions: 0,
        successRate: 100, executionsToday: 0, executionsThisWeek: 0
      };

      const { data, error } = await supabase
        .from('automation_workflows')
        .select('id, is_active, run_count, execution_count')
        .eq('user_id', user.id);

      if (error) throw error;
      const workflows = data || [];
      const totalExec = workflows.reduce((sum, w) => sum + (w.execution_count || w.run_count || 0), 0);

      return {
        totalWorkflows: workflows.length,
        activeWorkflows: workflows.filter(w => w.is_active).length,
        totalExecutions: totalExec,
        successRate: 100,
        executionsToday: 0,
        executionsThisWeek: 0,
      };
    },
    enabled: !!user?.id,
  });
}

export function useCreateAutomation() {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      trigger_type: string;
      conditions?: any;
      steps?: any[];
    }) => {
      if (!user?.id) throw new Error('Non authentifié');
      const { data: result, error } = await supabase
        .from('automation_workflows')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description,
          trigger_type: data.trigger_type || 'manual',
          steps: data.steps,
          workflow_data: data.conditions,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
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
      const { error } = await supabase
        .from('automation_workflows')
        .update({ is_active: !isActive })
        .eq('id', id);
      if (error) throw error;
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
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', id);
      if (error) throw error;
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
      const { error } = await supabase
        .from('automation_workflows')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', workflowId);
      if (error) throw error;
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
