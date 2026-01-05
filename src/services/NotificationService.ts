import { supabase } from '@/integrations/supabase/client';

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  category: 'general' | 'order' | 'stock' | 'price' | 'sync' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  metadata: Record<string, any>;
  expires_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  categories: Record<string, boolean>;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  digest_frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  created_at: string;
  updated_at: string;
}

export const NotificationService = {
  async getNotifications(filters?: { unreadOnly?: boolean; category?: string }): Promise<UserNotification[]> {
    let query = supabase
      .from('user_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters?.unreadOnly) {
      query = query.eq('is_read', false);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as UserNotification[];
  },

  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  async createNotification(notification: Partial<UserNotification>): Promise<UserNotification> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_notifications')
      .insert({
        title: notification.title || 'Notification',
        message: notification.message || '',
        notification_type: notification.notification_type || 'info',
        category: notification.category || 'general',
        priority: notification.priority || 'normal',
        action_url: notification.action_url,
        action_label: notification.action_label,
        metadata: notification.metadata || {},
        expires_at: notification.expires_at,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as UserNotification;
  },

  // Preferences
  async getPreferences(): Promise<NotificationPreferences | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as NotificationPreferences | null;
  },

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update({ ...preferences, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as NotificationPreferences;
    } else {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({ ...preferences, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as NotificationPreferences;
    }
  },

  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('is_read, category, priority');

    if (error) throw error;

    const notifications = data || [];
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    notifications.forEach(n => {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
    });

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      byCategory,
      byPriority
    };
  }
};
