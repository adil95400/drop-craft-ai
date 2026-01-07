import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, Mail, Package, AlertTriangle, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface NotificationPreferences {
  email: boolean;
  orders: boolean;
  stock: boolean;
  products: boolean;
  reports: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email: true,
  orders: true,
  stock: true,
  products: false,
  reports: false,
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { profile } = useUnifiedAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(n => ({
        id: n.id,
        type: (n.type || 'info') as 'success' | 'error' | 'info' | 'warning',
        title: n.title,
        message: n.message || '',
        read: n.is_read || false,
        created_at: n.created_at,
        metadata: n.metadata as Record<string, unknown> | undefined
      })) as Notification[];
    },
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Toutes les notifications marquées comme lues');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification supprimée');
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notifications lues supprimées');
    },
  });

  // Handlers
  const handlePreferenceChange = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    toast.success(`Préférence ${value ? 'activée' : 'désactivée'}`);
  }, []);

  const getIcon = useCallback((type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  }, []);

  const getBadgeVariant = useCallback((type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  }, []);

  // Computed values
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const readCount = useMemo(() => notifications.filter(n => n.read).length, [notifications]);

  const preferenceItems = [
    { key: 'email' as const, icon: Mail, title: 'Notifications email', desc: 'Recevoir les notifications importantes par email' },
    { key: 'orders' as const, icon: Package, title: 'Notifications de commande', desc: 'Être alerté des nouvelles commandes' },
    { key: 'stock' as const, icon: AlertTriangle, title: 'Alertes de stock', desc: 'Recevoir des alertes pour les stocks faibles' },
    { key: 'products' as const, icon: TrendingUp, title: 'Mises à jour produits', desc: 'Notifications pour les changements de produits' },
    { key: 'reports' as const, icon: Calendar, title: 'Rapports hebdomadaires', desc: 'Résumé de votre activité chaque semaine' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? (
                  <span className="text-primary font-medium">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
                ) : (
                  'Toutes vos notifications sont à jour'
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualiser
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Tout marquer lu
              </Button>
            )}
            {readCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Vider les lues
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Mail className="h-4 w-4" />
              Préférences
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Historique</CardTitle>
                  <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="text-xs px-3">
                        Toutes
                      </TabsTrigger>
                      <TabsTrigger value="unread" className="text-xs px-3">
                        Non lues
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-4 p-4 rounded-lg border">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <Bell className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="font-medium text-muted-foreground">
                      {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Vos notifications apparaîtront ici
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`group flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 ${
                          !notification.read 
                            ? 'bg-primary/5 border-primary/20 shadow-sm' 
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">{getIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium truncate">{notification.title}</h4>
                                {!notification.read && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    Nouveau
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                  Marquer lu
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Préférences de notifications</CardTitle>
                <CardDescription>
                  Personnalisez les notifications que vous souhaitez recevoir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {preferenceItems.map(({ key, icon: Icon, title, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences[key]}
                      onCheckedChange={(checked) => handlePreferenceChange(key, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Statistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-accent/50">
                    <p className="text-2xl font-bold text-primary">{notifications.length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-accent/50">
                    <p className="text-2xl font-bold text-warning">{unreadCount}</p>
                    <p className="text-xs text-muted-foreground">Non lues</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-accent/50">
                    <p className="text-2xl font-bold text-emerald-500">{readCount}</p>
                    <p className="text-xs text-muted-foreground">Lues</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-accent/50">
                    <p className="text-2xl font-bold text-primary">
                      {Object.values(preferences).filter(Boolean).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Actives</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}