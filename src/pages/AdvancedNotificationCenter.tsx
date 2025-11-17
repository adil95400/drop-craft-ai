import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { Bell, Settings, CheckCheck, Mail, MessageSquare, Webhook } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdvancedNotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationSystem();

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      sent: 'bg-blue-500',
      delivered: 'bg-green-500',
      failed: 'bg-red-500',
      pending: 'bg-yellow-500',
      read: 'bg-gray-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Centre de Notifications Avancé</h1>
          <p className="text-muted-foreground mt-1">
            Gérez toutes vos notifications multi-canaux et alertes intelligentes
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={() => markAllAsRead()}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Préférences
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{notifications.length}</p>
            </div>
            <Bell className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Non lues</p>
              <p className="text-2xl font-bold">{unreadCount}</p>
            </div>
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {unreadCount}
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Livrées</p>
              <p className="text-2xl font-bold">
                {notifications.filter(n => n.status === 'delivered').length}
              </p>
            </div>
            <CheckCheck className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Échecs</p>
              <p className="text-2xl font-bold">
                {notifications.filter(n => n.status === 'failed').length}
              </p>
            </div>
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {notifications.filter(n => n.status === 'failed').length}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Toutes ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Non lues ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="in_app">
            In-App
          </TabsTrigger>
          <TabsTrigger value="email">
            Email
          </TabsTrigger>
          <TabsTrigger value="failed">
            Échecs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="p-6">
            {isLoadingNotifications ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                        notification.status !== 'read'
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-background'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getChannelIcon(notification.channel)}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <Badge
                              className={`${getStatusColor(notification.status)} text-white ml-2`}
                            >
                              {notification.status}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <span className="capitalize">{notification.channel}</span>
                              <span>•</span>
                              <span className="capitalize">
                                {notification.notification_type}
                              </span>
                            </div>
                            <span>
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="unread">
          <Card className="p-6">
            {notifications.filter(n => n.status !== 'read').length === 0 ? (
              <div className="text-center py-12">
                <CheckCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Toutes les notifications sont lues</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {notifications
                    .filter(n => n.status !== 'read')
                    .map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 border rounded-lg bg-primary/5 border-primary/20 cursor-pointer"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getChannelIcon(notification.channel)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{notification.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="in_app">
          <Card className="p-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {notifications
                  .filter(n => n.channel === 'in_app')
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg cursor-pointer ${
                        notification.status !== 'read'
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-background'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <h3 className="font-semibold">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="p-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {notifications
                  .filter(n => n.channel === 'email')
                  .map((notification) => (
                    <div key={notification.id} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`${getStatusColor(notification.status)} text-white`}>
                              {notification.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="failed">
          <Card className="p-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {notifications
                  .filter(n => n.status === 'failed')
                  .map((notification) => (
                    <div key={notification.id} className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <h3 className="font-semibold text-red-700 dark:text-red-400">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      {notification.failed_reason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          Erreur: {notification.failed_reason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
