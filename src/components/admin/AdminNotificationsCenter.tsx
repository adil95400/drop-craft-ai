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
  MessageSquare,
  Settings
} from 'lucide-react';

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

  useEffect(() => {
    const mockNotifications: AdminNotification[] = [
      {
        id: '1',
        type: 'user',
        title: 'Nouvel utilisateur Premium',
        message: 'John Doe vient de s\'abonner au plan Ultra Pro',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'medium',
        actionUrl: '/admin/users'
      },
      {
        id: '2',
        type: 'security',
        title: 'Tentative d\'accès non autorisé',
        message: 'Plusieurs tentatives de connexion échouées détectées depuis l\'IP 192.168.1.100',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        priority: 'high',
        actionUrl: '/admin/security'
      },
      {
        id: '3',
        type: 'order',
        title: 'Commande importante',
        message: 'Nouvelle commande de €2,500 nécessitant validation',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        priority: 'high',
        actionUrl: '/admin/orders'
      },
      {
        id: '4',
        type: 'system',
        title: 'Sauvegarde terminée',
        message: 'La sauvegarde quotidienne s\'est terminée avec succès (2.3GB)',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
        priority: 'low'
      },
      {
        id: '5',
        type: 'performance',
        title: 'Performance système',
        message: 'Le temps de réponse API a diminué de 15% cette semaine',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        read: true,
        priority: 'medium'
      }
    ];

    setNotifications(mockNotifications);
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
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune notification à afficher</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-blue-200 shadow-sm'
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
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
                            <Button variant="ghost" size="sm">
                              Voir détails
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