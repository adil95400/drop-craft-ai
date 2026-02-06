import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface CRMActivity {
  id: string; user_id: string; contact_id?: string; lead_id?: string;
  activity_type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'sms';
  subject: string; description?: string; status: 'scheduled' | 'completed' | 'cancelled';
  scheduled_at?: string; completed_at?: string; duration_minutes?: number;
  outcome?: string; metadata?: any; created_at: string; updated_at: string;
}

export function useCRMActivities(leadId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['crm-activities', user?.id, leadId],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = (supabase.from('crm_activities') as any).select('*').eq('user_id', user.id);
      if (leadId) query = query.eq('lead_id', leadId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CRMActivity[];
    },
    enabled: !!user?.id,
  });

  const createActivity = useMutation({
    mutationFn: async (activityData: Partial<CRMActivity>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await (supabase.from('crm_activities') as any)
        .insert({ ...activityData, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success('Activité créée'); queryClient.invalidateQueries({ queryKey: ['crm-activities'] }); },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateActivity = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMActivity> & { id: string }) => {
      const { data, error } = await (supabase.from('crm_activities') as any)
        .update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success('Activité mise à jour'); queryClient.invalidateQueries({ queryKey: ['crm-activities'] }); },
  });

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('crm_activities') as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Activité supprimée'); queryClient.invalidateQueries({ queryKey: ['crm-activities'] }); },
  });

  return { activities, isLoading, createActivity: createActivity.mutate, updateActivity: updateActivity.mutate, deleteActivity: deleteActivity.mutate, isCreating: createActivity.isPending };
}
