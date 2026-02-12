import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { crmApi } from '@/services/api/client';

export interface CRMTask {
  id: string; user_id: string; title: string; description?: string;
  contact_id?: string; lead_id?: string; deal_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string; completed_at?: string; reminder_at?: string; tags?: string[];
  created_at: string; updated_at: string;
}

export function useCRMTasks() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['crm-tasks', user?.id],
    queryFn: async () => {
      const res = await crmApi.listTasks();
      return (res.items || []) as CRMTask[];
    },
    enabled: !!user?.id,
  });

  const createTask = useMutation({
    mutationFn: async (taskData: Partial<CRMTask>) => crmApi.createTask(taskData),
    onSuccess: () => { toast.success('Tâche créée'); queryClient.invalidateQueries({ queryKey: ['crm-tasks'] }); },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMTask> & { id: string }) => crmApi.updateTask(id, updates),
    onSuccess: () => { toast.success('Tâche mise à jour'); queryClient.invalidateQueries({ queryKey: ['crm-tasks'] }); },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => crmApi.deleteTask(id),
    onSuccess: () => { toast.success('Tâche supprimée'); queryClient.invalidateQueries({ queryKey: ['crm-tasks'] }); },
  });

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()).length,
    highPriority: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
  };

  return { tasks, stats, isLoading, createTask: createTask.mutate, updateTask: updateTask.mutate, deleteTask: deleteTask.mutate, isCreating: createTask.isPending };
}
