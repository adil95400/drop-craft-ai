/**
 * AutomationAlertCenter - Real-time alerts with filtering, priority, mark as read
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProactiveAlerts, type AlertFilter } from '@/hooks/useProactiveAlerts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertTriangle, Bell, BellOff, CheckCircle2, DollarSign,
  ExternalLink, Package, RefreshCw, Trash2, XCircle
} from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  inventory: { icon: Package, color: 'text-warning' },
  pricing: { icon: DollarSign, color: 'text-chart-2' },
  system: { icon: XCircle, color: 'text-destructive' },
  integrations: { icon: RefreshCw, color: 'text-primary' },
  quota: { icon: AlertTriangle, color: 'text-warning' },
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'border-l-4 border-l-destructive bg-destructive/5',
  high: 'border-l-4 border-l-warning bg-warning/5',
  medium: 'border-l-4 border-l-primary',
  low: '',
};

export function AutomationAlertCenter() {
  const [filter, setFilter] = useState<AlertFilter>('all');
  const { alerts, unreadCount, criticalCount, isLoading, markAsRead, markAllAsRead, deleteAlert } = useProactiveAlerts(filter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Alertes en temps réel</h3>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} non lues</Badge>}
          {criticalCount > 0 && <Badge variant="outline" className="text-destructive border-destructive">{criticalCount} critiques</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={() => markAllAsRead()} disabled={unreadCount === 0}>
          <BellOff className="h-3.5 w-3.5 mr-1.5" />
          Tout marquer lu
        </Button>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as AlertFilter)}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="unread">Non lues</TabsTrigger>
          <TabsTrigger value="critical">Critiques</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="price">Prix</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Alert list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>}

        {!isLoading && alerts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
              <p className="font-medium">Aucune alerte</p>
              <p className="text-sm text-muted-foreground">Tout fonctionne correctement</p>
            </CardContent>
          </Card>
        )}

        {alerts.map((alert) => {
          const catConfig = CATEGORY_CONFIG[alert.category || ''] || { icon: Bell, color: 'text-muted-foreground' };
          const CatIcon = catConfig.icon;

          return (
            <Card key={alert.id} className={`${PRIORITY_STYLES[alert.priority || 'low']} ${!alert.is_read ? 'shadow-sm' : 'opacity-70'} transition-all`}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <CatIcon className={`h-4 w-4 mt-0.5 ${catConfig.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-medium truncate ${!alert.is_read ? '' : 'text-muted-foreground'}`}>{alert.title}</p>
                      {alert.priority && ['critical', 'high'].includes(alert.priority) && (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1">
                          {alert.priority}
                        </Badge>
                      )}
                    </div>
                    {alert.message && <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {alert.action_url && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={alert.action_url}><ExternalLink className="h-3 w-3" /></a>
                      </Button>
                    )}
                    {!alert.is_read && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsRead(alert.id)}>
                        <CheckCircle2 className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteAlert(alert.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
