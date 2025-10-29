import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CRMTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  contact_id?: string;
  lead_id?: string;
  deal_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  reminder_at?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export function useCRMTasks() {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['crm-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as CRMTask[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (taskData: Partial<CRMTask>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('crm_tasks')
        .insert([{
          user_id: user.id,
          title: taskData.title || '',
          description: taskData.description,
          contact_id: taskData.contact_id,
          lead_id: taskData.lead_id,
          deal_id: taskData.deal_id,
          priority: taskData.priority || 'medium',
          status: taskData.status || 'todo',
          due_date: taskData.due_date,
          completed_at: taskData.completed_at,
          reminder_at: taskData.reminder_at,
          tags: taskData.tags,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Tâche créée');
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMTask> & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_tasks')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Tâche mise à jour');
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tâche supprimée');
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
    },
  });

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => 
      t.status !== 'completed' && 
      t.due_date && 
      new Date(t.due_date) < new Date()
    ).length,
    highPriority: tasks.filter(t => 
      t.priority === 'high' || t.priority === 'urgent'
    ).length,
  };

  return {
    tasks,
    stats,
    isLoading,
    createTask: createTask.mutate,
    updateTask: updateTask.mutate,
    deleteTask: deleteTask.mutate,
    isCreating: createTask.isPending,
  };
}
