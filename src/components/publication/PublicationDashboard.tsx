import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePublishProducts } from '@/hooks/usePublishProducts';
import {
  CheckCircle2, XCircle, Clock, Loader2, ExternalLink,
  Store, Share2, Megaphone, Calendar, X, BarChart3,
  Facebook, Instagram, Twitter, Linkedin, ShoppingCart
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { PublicationLog, ScheduledPublication } from '@/services/publishProducts.service';

const channelIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  shopify: <ShoppingCart className="h-4 w-4" />,
  woocommerce: <Store className="h-4 w-4" />,
  amazon: <Store className="h-4 w-4" />,
  ebay: <Store className="h-4 w-4" />,
  etsy: <Store className="h-4 w-4" />,
  tiktok: <Share2 className="h-4 w-4" />,
  pinterest: <Share2 className="h-4 w-4" />,
};

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  success: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Publié' },
  failed: { color: 'bg-destructive/10 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="h-3 w-3" />, label: 'Échoué' },
  pending: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: <Clock className="h-3 w-3" />, label: 'En attente' },
  scheduled: { color: 'bg-info/10 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <Calendar className="h-3 w-3" />, label: 'Planifié' },
  publishing: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: <Loader2 className="h-3 w-3 animate-spin" />, label: 'En cours' },
  cancelled: { color: 'bg-muted text-muted-foreground', icon: <X className="h-3 w-3" />, label: 'Annulé' },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge variant="outline" className={`${config.color} gap-1 text-[10px]`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

function LogItem({ log }: { log: PublicationLog }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
      <div className="flex-shrink-0">
        {channelIcons[log.channel_id] || <Store className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{log.channel_name}</span>
          <Badge variant="outline" className="text-[10px]">{log.channel_type}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
          {log.duration_ms && ` • ${log.duration_ms}ms`}
        </div>
        {log.error_message && (
          <p className="text-xs text-destructive mt-1 truncate">{log.error_message}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={log.status} />
        {log.external_url && (
          <a href={log.external_url} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

function ScheduledItem({ item, onCancel }: { item: ScheduledPublication; onCancel: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="flex-shrink-0">
        {channelIcons[item.channel_id] || <Calendar className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{item.channel_name}</span>
          <StatusBadge status={item.status} />
        </div>
        <div className="text-xs text-muted-foreground">
          Prévu {formatDistanceToNow(new Date(item.scheduled_at), { addSuffix: true, locale: fr })}
        </div>
      </div>
      {item.status === 'scheduled' && (
        <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={() => onCancel(item.id)}>
          Annuler
        </Button>
      )}
    </div>
  );
}

export function PublicationDashboard() {
  const {
    publicationLogs,
    scheduledPublications,
    publicationStats,
    isLoadingLogs,
    isLoadingScheduled,
    cancelScheduled,
  } = usePublishProducts();

  const byStatus = (publicationStats?.byStatus || {}) as { success?: number; failed?: number; pending?: number };
  const successRate = publicationStats?.total && publicationStats.total > 0
    ? Math.round(((byStatus.success || 0) / publicationStats.total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{publicationStats?.total || 0}</div>
            <div className="text-xs text-muted-foreground">Publications totales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{byStatus.success || 0}</div>
            <div className="text-xs text-muted-foreground">Réussies</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-destructive">{byStatus.failed || 0}</div>
            <div className="text-xs text-muted-foreground">Échouées</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{successRate}%</div>
            <div className="text-xs text-muted-foreground">Taux de succès</div>
          </CardContent>
        </Card>
      </div>

      {/* Channel breakdown */}
      {publicationStats?.byChannel && Object.keys(publicationStats.byChannel).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Par canal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(publicationStats.byChannel).map(([channel, rawStats]) => {
              const stats = rawStats as { success: number; failed: number; pending: number };
              const total = stats.success + stats.failed + stats.pending;
              const rate = total > 0 ? Math.round((stats.success / total) * 100) : 0;
              return (
                <div key={channel} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {channelIcons[channel] || <Store className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium capitalize flex-1">{channel}</span>
                  <span className="text-xs text-muted-foreground">{stats.success}/{total}</span>
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${rate}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="logs">
        <TabsList className="w-full">
          <TabsTrigger value="logs" className="flex-1 text-xs">
            Historique ({publicationLogs.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex-1 text-xs">
            Planifiées ({scheduledPublications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <ScrollArea className="h-[400px]">
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : publicationLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucune publication récente
              </div>
            ) : (
              <div className="space-y-2">
                {publicationLogs.map(log => <LogItem key={log.id} log={log} />)}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="scheduled">
          <ScrollArea className="h-[400px]">
            {isLoadingScheduled ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : scheduledPublications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucune publication planifiée
              </div>
            ) : (
              <div className="space-y-2">
                {scheduledPublications.map(item => (
                  <ScheduledItem key={item.id} item={item} onCancel={cancelScheduled} />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
