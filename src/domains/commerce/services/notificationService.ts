import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
  metadata?: Record<string, any>;
}

type NotificationCallback = (notification: Notification) => void;

class NotificationService {
  private listeners: Set<NotificationCallback> = new Set();
  private notifications: Notification[] = [];
  private subscription: any = null;

  /**
   * Initialize real-time notifications
   */
  async init(userId: string) {
    // Subscribe to real-time notifications from Supabase
    this.subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const notification = this.transformPayload(payload.new);
          this.addNotification(notification);
        }
      )
      .subscribe();

    // Load existing unread notifications
    await this.loadUnreadNotifications(userId);
  }

  /**
   * Clean up subscriptions
   */
  cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  /**
   * Subscribe to notifications
   */
  subscribe(callback: NotificationCallback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Add a notification
   */
  private addNotification(notification: Notification) {
    this.notifications.unshift(notification);
    this.notifyListeners(notification);
    this.showBrowserNotification(notification);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(notification: Notification) {
    this.listeners.forEach(listener => listener(notification));
  }

  /**
   * Show browser notification
   */
  private async showBrowserNotification(notification: Notification) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.png',
        badge: '/badge.png'
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.png',
          badge: '/badge.png'
        });
      }
    }
  }

  /**
   * Load unread notifications
   */
  private async loadUnreadNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      this.notifications = (data || []).map(this.transformPayload);
    } catch (error) {
      console.error('[NotificationService] Error loading notifications:', error);
    }
  }

  /**
   * Transform database payload to Notification
   */
  private transformPayload(payload: any): Notification {
    return {
      id: payload.id,
      type: payload.type || 'info',
      title: payload.title,
      message: payload.message,
      timestamp: new Date(payload.created_at),
      read: payload.read || false,
      action: payload.action,
      metadata: payload.metadata
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      this.notifications = this.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
    } catch (error) {
      console.error('[NotificationService] Error marking as read:', error);
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    } catch (error) {
      console.error('[NotificationService] Error marking all as read:', error);
    }
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return this.notifications;
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Request browser notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return await Notification.requestPermission();
  }
}

export const notificationService = new NotificationService();
