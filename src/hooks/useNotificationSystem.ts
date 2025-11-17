import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AlertRule {
  id: string;
  user_id: string;
  rule_name: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  alert_trigger_type: string;
  trigger_conditions: any;
  notification_channels: string[];
  email_enabled: boolean;
  sms_enabled: boolean;
  webhook_enabled: boolean;
  webhook_url: string | null;
  alert_template: any;
  throttle_minutes: number;
  last_triggered_at: string | null;
  trigger_count: number;
  applies_to_stores: string[] | null;
  applies_to_products: string[] | null;
  applies_to_categories: string[] | null;
  group_alerts: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  alert_rule_id: string | null;
  notification_type: string;
  channel: string;
  title: string;
  message: string;
  metadata: any;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_reason: string | null;
  action_taken: string | null;
  action_taken_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  email_address: string | null;
  email_frequency: string;
  email_digest: boolean;
  phone_number: string | null;
  sms_for_critical_only: boolean;
  push_tokens: any;
  stock_alerts_pref: boolean;
  order_alerts_pref: boolean;
  customer_alerts_pref: boolean;
  financial_alerts_pref: boolean;
  system_alerts_pref: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string;
  created_at: string;
  updated_at: string;
}

export function useNotificationSystem() {
  const queryClient = useQueryClient();

  // Fetch alert rules
  const {
    data: alertRules = [],
    isLoading: isLoadingRules,
  } = useQuery({
    queryKey: ['advanced-alert-rules'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('advanced_alert_rules')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as AlertRule[];
    },
  });

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading: isLoadingNotifications,
  } = useQuery({
    queryKey: ['notification-history'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('notification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as NotificationItem[];
    },
  });

  // Fetch user preferences
  const {
    data: preferences,
    isLoading: isLoadingPreferences,
  } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as NotificationPreferences | null;
    },
  });

  // Create alert rule
  const createAlertRule = useMutation({
    mutationFn: async (rule: Partial<AlertRule>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('advanced_alert_rules')
        .insert({
          ...rule,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-alert-rules'] });
      toast.success('Règle d\'alerte créée');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la règle');
    },
  });

  // Update alert rule
  const updateAlertRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlertRule> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('advanced_alert_rules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-alert-rules'] });
      toast.success('Règle mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Delete alert rule
  const deleteAlertRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await (supabase as any)
        .from('advanced_alert_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-alert-rules'] });
      toast.success('Règle supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  // Toggle alert rule
  const toggleAlertRule = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const { error } = await (supabase as any)
        .from('advanced_alert_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-alert-rules'] });
      toast.success('Règle mise à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await (supabase as any)
        .from('notification_history')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('notification_history')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.user.id)
        .neq('status', 'read');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
      toast.success('Toutes les notifications marquées comme lues');
    },
    onError: () => {
      toast.error('Erreur');
    },
  });

  // Update preferences
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('notification_preferences')
        .upsert({
          ...updates,
          user_id: user.user.id,
        })
        .eq('user_id', user.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Préférences mises à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const unreadCount = notifications.filter(n => n.status !== 'read').length;

  return {
    alertRules,
    notifications,
    preferences,
    unreadCount,
    isLoadingRules,
    isLoadingNotifications,
    isLoadingPreferences,
    createAlertRule: createAlertRule.mutate,
    updateAlertRule: updateAlertRule.mutate,
    deleteAlertRule: deleteAlertRule.mutate,
    toggleAlertRule: toggleAlertRule.mutate,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    updatePreferences: updatePreferences.mutate,
    isCreatingRule: createAlertRule.isPending,
    isUpdatingRule: updateAlertRule.isPending,
    isDeletingRule: deleteAlertRule.isPending,
    isUpdatingPreferences: updatePreferences.isPending,
  };
}
