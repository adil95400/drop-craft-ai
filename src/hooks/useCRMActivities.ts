import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let query = supabase
        .from('crm_activities')
        .select('*')
        .eq('user_id', user.id);

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMActivity[];
    },
  });

  const createActivity = useMutation({
    mutationFn: async (activityData: Partial<CRMActivity>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('crm_activities')
        .insert([{
          user_id: user.id,
          contact_id: activityData.contact_id,
          lead_id: activityData.lead_id,
          activity_type: activityData.activity_type || 'note',
          subject: activityData.subject || '',
          description: activityData.description,
          status: activityData.status || 'completed',
          scheduled_at: activityData.scheduled_at,
          completed_at: activityData.completed_at,
          duration_minutes: activityData.duration_minutes,
          outcome: activityData.outcome,
          metadata: activityData.metadata,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('crm_activities')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Activité mise à jour');
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
