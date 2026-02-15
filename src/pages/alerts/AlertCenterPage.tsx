/**
 * Sprint 9: Alert Center Page
 * Proactive alerts dashboard with filters, preferences and real-time updates
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useProactiveAlerts, type AlertFilter, type ProactiveAlert } from '@/hooks/useProactiveAlerts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import AlertPreferencesPanel from '@/components/alerts/AlertPreferencesPanel';
import {
  Bell, BellRing, Check, Trash2, AlertTriangle, Info,
  CheckCircle2, Package, TrendingDown, Gauge, Zap,
  Clock, ShieldAlert, Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const filterOptions: { value: AlertFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Toutes', icon: <Bell className="h-3.5 w-3.5" /> },
  { value: 'unread', label: 'Non lues', icon: <BellRing className="h-3.5 w-3.5" /> },
  { value: 'critical', label: 'Critiques', icon: <ShieldAlert className="h-3.5 w-3.5" /> },
  { value: 'stock', label: 'Stock', icon: <Package className="h-3.5 w-3.5" /> },
  { value: 'price', label: 'Prix', icon: <TrendingDown className="h-3.5 w-3.5" /> },
  { value: 'quota', label: 'Quotas', icon: <Gauge className="h-3.5 w-3.5" /> },
  { value: 'sync', label: 'Sync', icon: <Zap className="h-3.5 w-3.5" /> },
];

function getPriorityStyle(priority: string | null) {
  switch (priority) {
    case 'critical': return 'border-destructive/50 bg-destructive/5';
    case 'high': return 'border-destructive/30 bg-destructive/3';
    case 'medium': return 'border-accent/50';
    default: return '';
  }
}

function getPriorityBadge(priority: string | null) {
  switch (priority) {
    case 'critical': return <Badge variant="destructive" className="text-[10px] px-1.5">Critique</Badge>;
    case 'high': return <Badge variant="destructive" className="text-[10px] px-1.5 opacity-80">Haute</Badge>;
    case 'medium': return <Badge variant="secondary" className="text-[10px] px-1.5">Moyenne</Badge>;
    default: return <Badge variant="outline" className="text-[10px] px-1.5">Basse</Badge>;
  }
}

function getAlertIcon(type: string, category: string | null) {
  if (type === 'stock_low' || category === 'inventory') return <Package className="h-4 w-4 text-accent-foreground" />;
  if (type === 'price_change' || category === 'pricing') return <TrendingDown className="h-4 w-4 text-primary" />;
  if (type === 'quota_warning' || category === 'quota') return <Gauge className="h-4 w-4 text-accent-foreground" />;
  if (type === 'sync_failure' || category === 'integrations') return <Zap className="h-4 w-4 text-destructive" />;
  if (type === 'order_anomaly') return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (type === 'success') return <CheckCircle2 className="h-4 w-4 text-primary" />;
  return <Info className="h-4 w-4 text-muted-foreground" />;
}

function AlertCard({
  alert,
  onMarkRead,
  onDelete,
}: {
  alert: ProactiveAlert;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className={`transition-all ${!alert.is_read ? 'ring-1 ring-primary/20' : 'opacity-80'} ${getPriorityStyle(alert.priority)}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getAlertIcon(alert.notification_type, alert.category)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium text-sm">{alert.title}</span>
              {getPriorityBadge(alert.priority)}
              {!alert.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </div>
            {alert.message && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-1.5">{alert.message}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: fr })}
              {alert.category && (
                <Badge variant="outline" className="text-[10px] px-1">{alert.category}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {alert.action_url && (
              <Button size="sm" variant="outline" className="text-xs h-7" asChild>
                <a href={alert.action_url}>{alert.action_label || 'Voir'}</a>
              </Button>
            )}
            {!alert.is_read && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onMarkRead(alert.id)}>
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(alert.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AlertCenterPage() {
  const [filter, setFilter] = useState<AlertFilter>('all');
  const { alerts, unreadCount, criticalCount, isLoading, markAsRead, markAllAsRead, deleteAlert } = useProactiveAlerts(filter);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Centre d'Alertes | ShopOpti</title>
        <meta name="description" content="Alertes proactives en temps réel pour votre boutique" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BellRing className="h-6 w-6 text-primary" />
              Centre d'Alertes
            </h1>
            <p className="text-muted-foreground">
              Alertes proactives en temps réel — stock, prix, quotas, synchronisation
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              <Check className="h-4 w-4 mr-1" />
              Tout marquer lu ({unreadCount})
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total alertes</span>
              </div>
              <span className="text-2xl font-bold">{alerts.length}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BellRing className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Non lues</span>
              </div>
              <span className="text-2xl font-bold">{unreadCount}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Critiques</span>
              </div>
              <span className="text-2xl font-bold">{criticalCount}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Résolues</span>
              </div>
              <span className="text-2xl font-bold">
                {alerts.filter(a => a.is_read).length}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <Tabs defaultValue="alerts">
          <TabsList>
            <TabsTrigger value="alerts">Alertes</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4 mt-4">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((f) => (
                <Button
                  key={f.value}
                  variant={filter === f.value ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setFilter(f.value)}
                >
                  {f.icon}
                  {f.label}
                </Button>
              ))}
            </div>

            {/* Alerts list */}
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-2">
                {alerts.length === 0 ? (
                  <div className="text-center py-16">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">Aucune alerte pour ce filtre</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onMarkRead={markAsRead}
                      onDelete={deleteAlert}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preferences" className="mt-4">
            <AlertPreferencesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
