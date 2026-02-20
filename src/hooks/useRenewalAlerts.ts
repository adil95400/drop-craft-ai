import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RenewalAlert {
  id: string;
  alert_type: string;
  subscription_end_date: string;
  channel: string;
  is_read: boolean;
  sent_at: string;
}

interface RenewalPreferences {
  alert_30_days: boolean;
  alert_7_days: boolean;
  alert_3_days: boolean;
  alert_1_day: boolean;
  channel: string;
}

export function useRenewalAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading: alertsLoading } = useQuery<RenewalAlert[]>({
    queryKey: ['renewal-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('renewal-alerts', {
        body: { action: 'get_alerts' },
      });
      if (error) throw error;
      return data.alerts;
    },
    staleTime: 60_000,
  });

  const { data: preferences, isLoading: prefsLoading } = useQuery<RenewalPreferences>({
    queryKey: ['renewal-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('renewal-alerts', {
        body: { action: 'get_preferences' },
      });
      if (error) throw error;
      return data;
    },
    staleTime: 120_000,
  });

  const updatePrefs = useMutation({
    mutationFn: async (prefs: Partial<RenewalPreferences>) => {
      const { data, error } = await supabase.functions.invoke('renewal-alerts', {
        body: { action: 'update_preferences', ...prefs },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Préférences mises à jour');
      queryClient.invalidateQueries({ queryKey: ['renewal-preferences'] });
    },
  });

  const markRead = useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase.functions.invoke('renewal-alerts', {
        body: { action: 'mark_read', alert_id: alertId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['renewal-alerts'] }),
  });

  const checkRenewal = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('renewal-alerts', {
        body: { action: 'check_renewal' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.alerts_created > 0) {
        toast.info(`${data.alerts_created} alerte(s) de renouvellement créée(s)`);
      } else {
        toast.success('Aucune alerte à envoyer');
      }
      queryClient.invalidateQueries({ queryKey: ['renewal-alerts'] });
    },
  });

  const unreadCount = alerts?.filter(a => !a.is_read).length || 0;

  return {
    alerts: alerts || [],
    preferences,
    unreadCount,
    isLoading: alertsLoading || prefsLoading,
    updatePreferences: updatePrefs.mutate,
    markRead: markRead.mutate,
    checkRenewal: checkRenewal.mutate,
    isChecking: checkRenewal.isPending,
  };
}
