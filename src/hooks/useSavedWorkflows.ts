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

export function useSavedWorkflows() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_workflows' as any)
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as SavedWorkflow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, description, nodes }: { name: string; description?: string; nodes: WorkflowNode[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const triggerNode = nodes.find(n => n.type === 'trigger');
      const { data, error } = await supabase
        .from('saved_workflows' as any)
        .insert({
          user_id: user.id,
          name,
          description: description || `${nodes.length} étapes`,
          nodes: nodes as any,
          trigger_type: triggerNode?.name || null,
          status: 'draft',
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SavedWorkflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: '✅ Workflow créé' });
    },
    onError: (err: any) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, nodes, status }: { id: string; name?: string; nodes?: WorkflowNode[]; status?: string }) => {
      const updates: Record<string, any> = {};
      if (name !== undefined) updates.name = name;
      if (nodes !== undefined) {
        updates.nodes = nodes as any;
        updates.trigger_type = nodes.find(n => n.type === 'trigger')?.name || null;
      }
      if (status !== undefined) updates.status = status;
      const { error } = await supabase
        .from('saved_workflows' as any)
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: '✅ Workflow mis à jour' });
    },
    onError: (err: any) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_workflows' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
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
