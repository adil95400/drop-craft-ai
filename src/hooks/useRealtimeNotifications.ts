/**
 * useRealtimeNotifications — Global WebSocket listener for user_notifications
 * Shows live toast notifications when new alerts arrive via Supabase Realtime.
 * Mount once in MainLayout to cover the entire app.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

interface RealtimeNotification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  notification_type: string;
  category: string | null;
  priority: string | null;
  action_url: string | null;
  action_label: string | null;
  created_at: string;
}

const PRIORITY_CONFIG: Record<string, { toastFn: typeof toast.success; icon: string }> = {
  critical: { toastFn: toast.error, icon: '🚨' },
  high: { toastFn: toast.warning, icon: '⚠️' },
  medium: { toastFn: toast.info, icon: 'ℹ️' },
  low: { toastFn: toast.success, icon: '✅' },
};

const CATEGORY_ICONS: Record<string, string> = {
  inventory: '📦',
  pricing: '💰',
  integrations: '🔌',
  orders: '🛒',
  quota: '📊',
  security: '🔒',
  system: '⚙️',
};

export function useRealtimeNotifications() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('global-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new as RealtimeNotification;

          // Invalidate notification queries so badges/lists update
          queryClient.invalidateQueries({ queryKey: ['proactive-alerts'] });
          queryClient.invalidateQueries({ queryKey: ['header-notifications'] });

          // Determine toast style based on priority
          const priority = notif.priority || 'medium';
          const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
          const categoryIcon = CATEGORY_ICONS[notif.category || ''] || '';
          const icon = categoryIcon || config.icon;

          // Show toast notification
          config.toastFn(`${icon} ${notif.title}`, {
            description: notif.message || undefined,
            duration: priority === 'critical' ? 10000 : priority === 'high' ? 7000 : 4000,
            action: notif.action_url
              ? {
                  label: notif.action_label || 'Voir',
                  onClick: () => {
                    window.location.href = notif.action_url!;
                  },
                }
              : undefined,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new as any;

          // Skip device registration records
          if (notif.type === 'device_token') return;

          queryClient.invalidateQueries({ queryKey: ['header-notifications'] });

          const typeMap: Record<string, typeof toast.success> = {
            success: toast.success,
            warning: toast.warning,
            error: toast.error,
            info: toast.info,
          };
          const toastFn = typeMap[notif.type] || toast.info;

          toastFn(notif.title || 'Notification', {
            description: notif.message || undefined,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
