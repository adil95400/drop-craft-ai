import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';
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
      const res = await shopOptiApi.request<CRMTask[]>('/crm/tasks');
      return res.data || [];
    },
  });

  const createTask = useMutation({
    mutationFn: async (taskData: Partial<CRMTask>) => {
      const res = await shopOptiApi.request('/crm/tasks', {
        method: 'POST',
        body: taskData,
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
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
      const res = await shopOptiApi.request(`/crm/tasks/${id}`, {
        method: 'PUT',
        body: updates,
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Tâche mise à jour');
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.request(`/crm/tasks/${id}`, { method: 'DELETE' });
      if (!res.success) throw new Error(res.error);
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
