/**
 * Panel de synchronisation des prix vers les boutiques connectées
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Store, 
  Link2, 
  Activity,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { usePriceSyncQueue, usePriceSyncLogs, usePriceSyncStats } from '@/hooks/usePriceSync';
import { useIntegrationsUnified } from '@/hooks/unified';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

const platformIcons: Record<string, string> = {
  shopify: '🛍️',
  woocommerce: '🔵',
  prestashop: '🔴',
  amazon: '📦',
  ebay: '🏷️',
  etsy: '🧡',
};

export function PriceSyncPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: stats, isLoading: statsLoading } = usePriceSyncStats();
  const { data: queue } = usePriceSyncQueue();
  const { data: logs } = usePriceSyncLogs(30);
  const integrationsResult = useIntegrationsUnified();

  // Filter connected stores - check multiple possible field names
  const connectedStores = integrationsResult?.integrations?.filter((i: any) => 
    i.enabled || i.is_connected || i.is_active || i.connection_status === 'connected'
  ) || [];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Synchronisation Prix → Boutiques
            </CardTitle>
            <CardDescription>
              Synchronisez automatiquement vos prix avec les boutiques connectées
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Store className="h-3 w-3" />
            {connectedStores.length} boutique(s)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-2">
              <Clock className="h-4 w-4" />
              File d'attente
              {queue && queue.filter(q => q.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {queue.filter(q => q.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Mappings actifs"
                value={stats?.totalMappings || 0}
                icon={Link2}
                loading={statsLoading}
              />
              <StatCard
                label="Synchronisés"
                value={stats?.syncedCount || 0}
                icon={CheckCircle2}
                variant="success"
                loading={statsLoading}
              />
              <StatCard
                label="En erreur"
                value={stats?.errorCount || 0}
                icon={XCircle}
                variant={stats?.errorCount ? 'error' : 'default'}
                loading={statsLoading}
              />
              <StatCard
                label="En attente"
                value={stats?.pendingQueue || 0}
                icon={Clock}
                variant={stats?.pendingQueue ? 'warning' : 'default'}
                loading={statsLoading}
              />
            </div>

            {/* Connected Stores */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Boutiques connectées</CardTitle>
              </CardHeader>
              <CardContent>
                {connectedStores.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune boutique connectée</p>
                    <Button variant="link" className="mt-2">
                      Connecter une boutique
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {connectedStores.map((store: any) => (
                      <div 
                        key={store.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {platformIcons[store.platform] || '🏪'}
                          </span>
                          <div>
                            <p className="font-medium">{store.name || store.platform}</p>
                            <p className="text-sm text-muted-foreground">
                              {store.platform}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={(store.enabled || store.is_connected) ? 'default' : 'secondary'}
                          className="gap-1"
                        >
                          {(store.enabled || store.is_connected) ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Connecté
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              Déconnecté
                            </>
                          )}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Activity */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm text-muted-foreground">Synchronisations aujourd'hui</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    {stats?.successToday || 0} réussies
                  </span>
                  <span className="flex items-center gap-1 text-red-500">
                    <XCircle className="h-4 w-4" />
                    {stats?.errorsToday || 0} erreurs
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="queue" className="mt-4">
            <ScrollArea className="h-[400px]">
              {!queue || queue.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune synchronisation en attente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {queue.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon status={item.status} />
                          <div>
                            <p className="font-medium text-sm">
                              {item.old_price ? `${item.old_price}€` : '—'} → {item.new_price}€
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.created_at), { 
                                addSuffix: true, 
                                locale: getDateFnsLocale() 
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <ScrollArea className="h-[400px]">
              {!logs || logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun historique de synchronisation</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {platformIcons[log.platform] || '🏪'}
                        </span>
                        <div>
                          <p className="font-medium text-sm">
                            {log.old_price ? `${log.old_price}€` : '—'} → {log.new_price}€
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.external_product_id} • {log.duration_ms}ms
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : log.status === 'error' ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { 
                            addSuffix: true, 
                            locale: getDateFnsLocale() 
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  variant = 'default',
  loading = false
}: { 
  label: string; 
  value: number; 
  icon: any; 
  variant?: 'default' | 'success' | 'error' | 'warning';
  loading?: boolean;
}) {
  const variantColors = {
    default: 'text-muted-foreground',
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500'
  };

  return (
    <div className="p-4 rounded-lg bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${variantColors[variant]}`} />
      </div>
      <p className="text-2xl font-bold">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'processing':
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'processing':
      return 'secondary';
    default:
      return 'outline';
  }
}
