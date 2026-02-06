import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';
import { toast } from 'sonner';

export interface CRMActivity {
  id: string;
  user_id: string;
  contact_id?: string;
  lead_id?: string;
  activity_type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'sms';
  subject: string;
  description?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  scheduled_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  outcome?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export function useCRMActivities(leadId?: string) {
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['crm-activities', leadId],
    queryFn: async () => {
      const params = leadId ? `?lead_id=${leadId}` : '';
      const res = await shopOptiApi.request<CRMActivity[]>(`/crm/activities${params}`);
      return res.data || [];
    },
  });

  const createActivity = useMutation({
    mutationFn: async (activityData: Partial<CRMActivity>) => {
      const res = await shopOptiApi.request('/crm/activities', {
        method: 'POST',
        body: activityData,
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Activité créée');
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  const updateActivity = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMActivity> & { id: string }) => {
      const res = await shopOptiApi.request(`/crm/activities/${id}`, {
        method: 'PUT',
        body: updates,
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Activité mise à jour');
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.request(`/crm/activities/${id}`, { method: 'DELETE' });
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Activité supprimée');
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
    },
  });

  return {
    activities,
    isLoading,
    createActivity: createActivity.mutate,
    updateActivity: updateActivity.mutate,
    deleteActivity: deleteActivity.mutate,
    isCreating: createActivity.isPending,
  };
}
