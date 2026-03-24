/**
 * useSavedWorkflows — Visual workflow canvas CRUD
 * Uses canonical `automation_workflows` table directly
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { WorkflowNode } from '@/components/workflows/VisualWorkflowCanvas';

export interface SavedWorkflow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  nodes: WorkflowNode[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger_type: string | null;
  last_run_at: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = ['saved-workflows'];

// Map automation_workflows row → SavedWorkflow
function mapToSaved(row: any): SavedWorkflow {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    nodes: row.steps || [],
    status: row.status || 'draft',
    trigger_type: row.trigger_type,
    last_run_at: row.last_run_at,
    run_count: row.run_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useSavedWorkflows() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map(mapToSaved);
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, description, nodes }: { name: string; description?: string; nodes: WorkflowNode[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const triggerNode = nodes.find(n => n.type === 'trigger');
      const { data, error } = await supabase
        .from('automation_workflows')
        .insert({
          user_id: user.id,
          name,
          description: description || `${nodes.length} étapes`,
          steps: nodes as any,
          trigger_type: triggerNode?.name || null,
          status: 'draft',
        })
        .select()
        .single();
      if (error) throw error;
      return mapToSaved(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      toast({ title: '✅ Workflow créé' });
    },
    onError: (err: any) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, nodes, status }: { id: string; name?: string; nodes?: WorkflowNode[]; status?: string }) => {
      const updates: Record<string, any> = {};
      if (name !== undefined) updates.name = name;
      if (nodes !== undefined) {
        updates.steps = nodes as any;
        updates.trigger_type = nodes.find(n => n.type === 'trigger')?.name || null;
      }
      if (status !== undefined) updates.status = status;
      const { error } = await supabase
        .from('automation_workflows')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      toast({ title: '✅ Workflow mis à jour' });
    },
    onError: (err: any) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      toast({ title: '🗑️ Workflow supprimé' });
    },
    onError: (err: any) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  return {
    workflows: query.data || [],
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
