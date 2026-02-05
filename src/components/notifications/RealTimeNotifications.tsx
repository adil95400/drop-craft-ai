import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { productionLogger } from '@/utils/productionLogger';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
  user_id: string;
}

export const RealTimeNotifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Load initial notifications
    loadNotifications();

    // Set up real-time subscription for activity_logs as notifications source
    const channel = supabase
      .channel('activity_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const activityLog = payload.new as any;
          // Convert activity log to notification format
          const newNotification: Notification = {
            id: activityLog.id,
            title: activityLog.action,
            message: activityLog.description,
            type: activityLog.severity === 'error' ? 'error' : 'info',
            timestamp: new Date(activityLog.created_at),
            read: false,
            user_id: activityLog.user_id
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.type === 'error' ? 'destructive' : 'default'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const loadNotifications = async () => {
    if (!user) return;

    // Load activity logs as notifications
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      productionLogger.error('Error loading notifications', error as Error, 'RealTimeNotifications');
      return;
    }

    // Convert activity logs to notification format
    const notificationData: Notification[] = (data || []).map(log => ({
      id: log.id,
      title: log.action,
      message: log.description,
      type: log.severity === 'error' ? 'error' : 'info',
      timestamp: new Date(log.created_at),
      read: false, // Activity logs don't have read status
      user_id: log.user_id
    }));

    setNotifications(notificationData);
  };

  const markAsRead = async (notificationId: string) => {
    // For now, just update local state since activity_logs don't have read status
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = async () => {
    // For now, just update local state
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = async (notificationId: string) => {
    // For now, just update local state (we don't want to delete activity logs)
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const addTestNotification = async () => {
    if (!user) return;

    const testActivities = [
      {
        user_id: user.id,
        action: 'Nouvelle commande',
        description: 'Vous avez reçu une nouvelle commande #1234',
        entity_type: 'order',
        severity: 'info'
      },
      {
        user_id: user.id,
        action: 'Stock faible',
        description: '5 produits ont un stock inférieur à 10 unités',
        entity_type: 'product',
        severity: 'warning'
      },
      {
        user_id: user.id,
        action: 'Synchronisation terminée',
        description: 'Import de 24 nouveaux produits depuis Shopify',
        entity_type: 'import',
        severity: 'info'
      }
    ];

    const randomActivity = testActivities[Math.floor(Math.random() * testActivities.length)];

    const { error } = await supabase
      .from('activity_logs')
      .insert(randomActivity);

    if (error) {
      productionLogger.error('Error adding test notification', error as Error, 'RealTimeNotifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}j`;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 w-80 mt-2">
          <Card className="shadow-lg border">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addTestNotification}
                    className="text-xs"
                  >
                    Test
                  </Button>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Tout marquer lu
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune notification</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 ml-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full" />
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2">
                            {notification.action && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => {
                                  if (notification.action?.url) {
                                    navigate(notification.action.url);
                                  }
                                }}
                              >
                                {notification.action.label}
                              </Button>
                            )}
                            <div className="flex items-center gap-1 ml-auto">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t bg-muted/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/notifications');
                    }}
                  >
                    Voir toutes les notifications
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};