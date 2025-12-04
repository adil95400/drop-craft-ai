import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Check, 
  X, 
  Users, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminNotification {
  id: string;
  type: 'user' | 'order' | 'system' | 'security' | 'performance';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

export const AdminNotificationsCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRealNotifications = async () => {
    setIsLoading(true);
    try {
      // Fetch real data from multiple sources
      const [securityEvents, activityLogs, orders] = await Promise.all([
        supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('orders')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const realNotifications: AdminNotification[] = [];

      // Convert security events to notifications
      if (securityEvents.data) {
        securityEvents.data.forEach((event: any) => {
          realNotifications.push({
            id: `security_${event.id}`,
            type: 'security',
            title: event.event_type || 'Événement de sécurité',
            message: event.description || 'Événement de sécurité détecté',
            timestamp: new Date(event.created_at),
            read: false,
            priority: event.severity === 'critical' ? 'high' : event.severity === 'warning' ? 'medium' : 'low',
            actionUrl: '/admin/security'
          });
        });
      }

      // Convert activity logs to notifications
      if (activityLogs.data) {
        activityLogs.data.forEach((log: any) => {
          realNotifications.push({
            id: `activity_${log.id}`,
            type: log.action?.includes('user') ? 'user' : 'system',
            title: log.action || 'Activité système',
            message: log.description || 'Action effectuée',
            timestamp: new Date(log.created_at),
            read: false,
            priority: log.severity === 'critical' ? 'high' : 'medium'
          });
        });
      }

      // Convert pending orders to notifications
      if (orders.data) {
        orders.data.forEach((order: any) => {
          realNotifications.push({
            id: `order_${order.id}`,
            type: 'order',
            title: 'Nouvelle commande',
            message: `Commande ${order.order_number || order.id.slice(0, 8)} - ${order.total_amount || 0}€`,
            timestamp: new Date(order.created_at),
            read: false,
            priority: (order.total_amount || 0) > 500 ? 'high' : 'medium',
            actionUrl: `/dashboard/orders/${order.id}`
          });
        });
      }

      // Sort by timestamp
      realNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // If no real data, show empty state
      setNotifications(realNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, () => {
        fetchRealNotifications();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
        fetchRealNotifications();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        fetchRealNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getTypeIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4 text-blue-500" />;
      case 'order': return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'system': return <Settings className="h-4 w-4 text-gray-500" />;
      case 'security': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'performance': return <TrendingUp className="h-4 w-4 text-purple-500" />;
    }
  };

  const getPriorityColor = (priority: AdminNotification['priority']) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-red-100 text-red-800';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread': return !notif.read;
      case 'high': return notif.priority === 'high';
      default: return true;
    }
  });

  const unreadCount = notifications.filter(notif => !notif.read).length;
  const highPriorityCount = notifications.filter(notif => notif.priority === 'high' && !notif.read).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Centre de Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchRealNotifications}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check className="h-4 w-4 mr-1" />
              Tout lire
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Toutes ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Non lues ({unreadCount})
          </Button>
          <Button
            variant={filter === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('high')}
          >
            Priorité élevée ({highPriorityCount})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p>Chargement des notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune notification à afficher</p>
                <p className="text-sm mt-2">Les notifications apparaîtront ici en temps réel</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    notification.read 
                      ? 'bg-muted/50 border-border' 
                      : 'bg-card border-primary/20 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getTypeIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </h4>
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority.toUpperCase()}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp.toLocaleString()}
                          </span>
                          {notification.actionUrl && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={notification.actionUrl}>Voir détails</a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
