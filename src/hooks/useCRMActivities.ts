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

  // Use activity_logs table as CRM activities source
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['crm-activities', leadId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('action', ['call', 'email', 'meeting', 'note', 'task', 'sms']);

      if (leadId) {
        query = query.eq('entity_id', leadId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((log: any) => ({
        id: log.id,
        user_id: log.user_id,
        contact_id: log.entity_id,
        lead_id: log.entity_id,
        activity_type: log.action || 'note',
        subject: log.description || '',
        description: log.description,
        status: 'completed',
        scheduled_at: log.created_at,
        completed_at: log.created_at,
        duration_minutes: 0,
        outcome: '',
        metadata: log.details,
        created_at: log.created_at,
        updated_at: log.created_at
      })) as CRMActivity[];
    },
  });

  const createActivity = useMutation({
    mutationFn: async (activityData: Partial<CRMActivity>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('activity_logs')
        .insert([{
          user_id: user.id,
          entity_type: 'crm_activity',
          entity_id: activityData.contact_id || activityData.lead_id,
          action: activityData.activity_type || 'note',
          description: activityData.subject || '',
          details: {
            description: activityData.description,
            status: activityData.status || 'completed',
            scheduled_at: activityData.scheduled_at,
            duration_minutes: activityData.duration_minutes,
            outcome: activityData.outcome,
            metadata: activityData.metadata,
          },
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
        .from('activity_logs')
        .update({
          action: updates.activity_type,
          description: updates.subject,
          details: {
            description: updates.description,
            status: updates.status,
          }
        })
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
        .from('activity_logs')
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
