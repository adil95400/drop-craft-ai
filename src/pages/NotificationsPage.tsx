/**
 * Page Notifications - Style Channable avec préférences persistées
 * Centre de notifications avec design moderne et catégories enrichies
 * 
 * Optimisations appliquées:
 * - Préférences persistées via useNotificationPreferences
 * - Catégories de notifications avec filtrage
 * - Accessibilité WCAG 2.1 AA
 * - Support prefers-reduced-motion
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, CheckCircle2, AlertCircle, Info, Trash2, Mail, Package, 
  AlertTriangle, TrendingUp, Calendar, RefreshCw, ShoppingCart,
  Megaphone, Settings, Tag, BarChart3, Filter
} from 'lucide-react';
import { useState, useMemo, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useNotificationPreferences, NOTIFICATION_CATEGORIES, type NotificationPreferences } from '@/hooks/useNotificationPreferences';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { ChannableStatsGrid } from '@/components/channable';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { ChannableStat } from '@/components/channable/types';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

// Icon map for categories
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  orders: ShoppingCart,
  stock: Package,
  marketing: Megaphone,
  system: Settings,
  products: Tag,
  reports: BarChart3,
};

// Color map for categories
const CATEGORY_COLORS: Record<string, string> = {
  orders: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  stock: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  marketing: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
  system: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  products: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  reports: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
};

// Memoized notification item
const NotificationItem = memo(({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  getIcon,
  prefersReducedMotion 
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getIcon: (type: string) => React.ReactNode;
  prefersReducedMotion: boolean;
}) => {
  const categoryColor = CATEGORY_COLORS[notification.category || 'system'] || CATEGORY_COLORS.system;
  const CategoryIcon = CATEGORY_ICONS[notification.category || 'system'] || Info;

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, x: -10 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, x: 10 }}
      className={cn(
        "group flex items-start gap-3 p-4 rounded-lg border transition-all duration-200",
        !notification.read 
          ? 'bg-primary/5 border-primary/20 shadow-sm' 
          : 'hover:bg-accent/50 border-border/50'
      )}
      role="listitem"
      aria-label={`${notification.title} - ${notification.read ? 'Lu' : 'Non lu'}`}
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
              {notification.category && (
                <Badge 
                  variant="outline" 
                  className={cn("text-[10px] px-1.5 py-0 border", categoryColor)}
                >
                  <CategoryIcon className="h-2.5 w-2.5 mr-1" aria-hidden="true" />
                  {notification.category}
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
              locale: getDateFnsLocale(),
            })}
          </span>
          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
                aria-label="Marquer comme lu"
              >
                Marquer lu
              </button>
            )}
            <button
              onClick={() => onDelete(notification.id)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 rounded"
              aria-label="Supprimer la notification"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
NotificationItem.displayName = 'NotificationItem';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { profile } = useUnifiedAuth();
  const prefersReducedMotion = useReducedMotion();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  // Use persisted preferences
  const { preferences, updatePreference, isSaving } = useNotificationPreferences();

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
        category: (n.metadata as any)?.category || 'system',
        metadata: n.metadata as Record<string, unknown> | undefined
      })) as Notification[];
    },
  });

  // Filter by category
  const filteredNotifications = useMemo(() => {
    if (!categoryFilter) return notifications;
    return notifications.filter(n => n.category === categoryFilter);
  }, [notifications, categoryFilter]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach(n => {
      const cat = n.category || 'system';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [notifications]);

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

  const getIcon = useCallback((type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />;
      default:
        return <Info className="h-5 w-5 text-primary" aria-hidden="true" />;
    }
  }, []);

  // Computed values
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const readCount = useMemo(() => notifications.filter(n => n.read).length, [notifications]);

  // Channable Stats
  const stats: ChannableStat[] = [
    {
      label: 'Total',
      value: notifications.length.toString(),
      icon: Bell,
      color: 'primary'
    },
    {
      label: 'Non lues',
      value: unreadCount.toString(),
      icon: AlertCircle,
      color: unreadCount > 0 ? 'warning' : 'success'
    },
    {
      label: 'Lues',
      value: readCount.toString(),
      icon: CheckCircle2,
      color: 'success'
    },
    {
      label: 'Alertes actives',
      value: Object.values(preferences).filter(Boolean).length.toString(),
      icon: Bell,
      color: 'info'
    }
  ];

  const handleRefresh = () => {
    refetch();
    toast.success('Notifications actualisées');
  };

  return (
    <ChannablePageWrapper
      title="Centre de Notifications"
      subtitle="Alertes & Messages"
      description="Consultez vos notifications, gérez vos préférences d'alertes et restez informé de l'activité de votre boutique."
      heroImage="notifications"
      badge={{
        label: unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'À jour',
        icon: Bell
      }}
      actions={
        <div className="flex gap-2">
          <Button onClick={() => markAllAsReadMutation.mutate()} variant="default" size="sm">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Tout marquer lu
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      }
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.notifications} />
      {/* Stats Grid */}
      <ChannableStatsGrid stats={stats} columns={4} compact />

      {/* Main Content */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" aria-hidden="true" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Préférences
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {/* Category Filters */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium text-muted-foreground mr-2">Filtrer par :</span>
              <Button
                variant={categoryFilter === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(null)}
                className="h-7 text-xs"
              >
                Toutes ({notifications.length})
              </Button>
              {NOTIFICATION_CATEGORIES.slice(0, 4).map(cat => {
                const Icon = CATEGORY_ICONS[cat.id];
                const count = categoryCounts[cat.id] || 0;
                return (
                  <Button
                    key={cat.id}
                    variant={categoryFilter === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
                    className={cn("h-7 text-xs gap-1", categoryFilter !== cat.id && CATEGORY_COLORS[cat.id])}
                  >
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    {cat.title} ({count})
                  </Button>
                );
              })}
            </div>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
                  Historique
                </CardTitle>
                <div className="flex gap-2">
                  <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="text-xs px-3">Toutes</TabsTrigger>
                      <TabsTrigger value="unread" className="text-xs px-3">Non lues</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {readCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearAllMutation.mutate()}
                      disabled={clearAllMutation.isPending}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Supprimer les notifications lues"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3" role="status" aria-label="Chargement des notifications">
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
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12" role="status">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <Bell className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
                  </div>
                  <p className="font-medium text-muted-foreground">
                    {filter === 'unread' ? 'Aucune notification non lue' : categoryFilter ? `Aucune notification "${categoryFilter}"` : 'Aucune notification'}
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Vous êtes à jour !
                  </p>
                </div>
              ) : (
                <div className="space-y-3" role="list" aria-label="Liste des notifications">
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                        onDelete={(id) => deleteNotificationMutation.mutate(id)}
                        getIcon={getIcon}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Préférences de notification
              </CardTitle>
              <CardDescription>
                Choisissez les notifications que vous souhaitez recevoir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {NOTIFICATION_CATEGORIES.map((category) => {
                const Icon = CATEGORY_ICONS[category.id] || Bell;
                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", CATEGORY_COLORS[category.id])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{category.title}</p>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences[category.id as keyof NotificationPreferences] ?? true}
                      onCheckedChange={(checked) => updatePreference(category.id as keyof NotificationPreferences, checked)}
                      disabled={isSaving}
                      aria-label={`Activer les notifications ${category.title}`}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
