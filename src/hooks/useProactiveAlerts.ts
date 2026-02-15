/**
 * Sprint 9: Proactive Alerts Hook
 * Real-time notifications from user_notifications table with Supabase Realtime subscription
 */
import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface ProactiveAlert {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  notification_type: string;
  category: string | null;
  priority: string | null;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  action_label: string | null;
  metadata: Record<string, any> | null;
  expires_at: string | null;
  created_at: string;
}

export type AlertFilter = 'all' | 'unread' | 'critical' | 'stock' | 'price' | 'quota' | 'sync';

export function useProactiveAlerts(filter: AlertFilter = 'all') {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['proactive-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as ProactiveAlert[];
    },
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('proactive-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newAlert = payload.new as ProactiveAlert;
          queryClient.setQueryData<ProactiveAlert[]>(
            ['proactive-alerts', user.id],
            (old = []) => [newAlert, ...old]
          );
          // Toast for high priority
          if (newAlert.priority === 'critical' || newAlert.priority === 'high') {
            toast.warning(newAlert.title, { description: newAlert.message || undefined });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proactive-alerts'] }),
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proactive-alerts'] });
      toast.success('Toutes les alertes marquées comme lues');
    },
  });

  // Delete notification
  const deleteAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proactive-alerts'] }),
  });

  // Filter alerts
  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      switch (filter) {
        case 'unread': return !a.is_read;
        case 'critical': return a.priority === 'critical' || a.priority === 'high';
        case 'stock': return a.notification_type === 'stock_low' || a.category === 'inventory';
        case 'price': return a.notification_type === 'price_change' || a.category === 'pricing';
        case 'quota': return a.notification_type === 'quota_warning' || a.category === 'quota';
        case 'sync': return a.notification_type === 'sync_failure' || a.category === 'integrations';
        default: return true;
      }
    });
  }, [alerts, filter]);

  const unreadCount = useMemo(() => alerts.filter((a) => !a.is_read).length, [alerts]);

  const criticalCount = useMemo(
    () => alerts.filter((a) => !a.is_read && (a.priority === 'critical' || a.priority === 'high')).length,
    [alerts]
  );

  return {
    alerts: filtered,
    allAlerts: alerts,
    unreadCount,
    criticalCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteAlert: deleteAlert.mutate,
  };
}
