import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { useChannelConnections } from '@/hooks/useChannelConnections';
import {
  useSyncStats,
  useUnifiedSyncQueue,
  useUnifiedSyncLogs,
  useTriggerFullSync,
  useTriggerModuleSync,
  useCancelSyncItem,
} from '@/hooks/useUnifiedSync';
import {
  Activity,
  FileText,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Zap,
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Store,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Animated stat card component
function SyncStatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  color,
  isLoading,
  onClick
}: { 
  icon: any; 
  label: string; 
  value: number | string; 
  trend?: string;
  color: string;
  isLoading?: boolean;
  onClick?: () => void;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-500',
    green: 'from-green-500/20 to-green-600/10 text-green-500',
    yellow: 'from-yellow-500/20 to-yellow-600/10 text-yellow-500',
    red: 'from-red-500/20 to-red-600/10 text-red-500',
    purple: 'from-purple-500/20 to-purple-600/10 text-purple-500',
    primary: 'from-primary/20 to-primary/10 text-primary',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn("relative overflow-hidden bg-card/60 backdrop-blur-xl border-border/50 p-5", onClick && "cursor-pointer")} onClick={onClick}>
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50",
          colorClasses[color]
        )} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className={cn("p-2.5 rounded-xl bg-gradient-to-br", colorClasses[color])}>
              <Icon className="h-5 w-5" />
            </div>
            {trend && (
              <Badge variant="outline" className="text-xs font-medium">
                {trend}
              </Badge>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mb-1" />
          ) : (
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
      </Card>
    </motion.div>
  );
}

// Connected store card
function ConnectedStoreCard({ connection, onSync }: { connection: any; onSync: () => void }) {
  const platformIcons: Record<string, string> = {
    shopify: '🛍️',
    woocommerce: '🛒',
    amazon: '📦',
    ebay: '🏷️',
    etsy: '🎨',
    google: '🔍',
    facebook: '📱',
    tiktok: '🎵',
  };

  const statusColors: Record<string, string> = {
    connected: 'bg-green-500',
    error: 'bg-red-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-muted',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all">
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {platformIcons[connection.platform_type] || '🌐'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{connection.platform_name}</p>
              <span className={cn("w-2 h-2 rounded-full", statusColors[connection.connection_status])} />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {connection.shop_domain || 'Non configuré'}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">{connection.products_synced} produits</p>
            <p className="text-muted-foreground text-xs">
              {connection.last_sync_at 
                ? formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true, locale: getDateFnsLocale() })
                : 'Jamais sync'
              }
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Queue item component
function QueueItemCard({ item, onCancel }: { item: any; onCancel: () => void }) {
  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pending: { icon: Clock, color: 'text-muted-foreground', label: 'En attente' },
    processing: { icon: Loader2, color: 'text-blue-500', label: 'En cours' },
    completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Terminé' },
    failed: { icon: XCircle, color: 'text-red-500', label: 'Échoué' },
    cancelled: { icon: XCircle, color: 'text-muted-foreground', label: 'Annulé' },
  };

  const config = statusConfig[item.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/30">
        <div className="flex items-center gap-4">
          <div className={cn("p-2 rounded-lg bg-muted/50", config.color)}>
            <StatusIcon className={cn("h-4 w-4", item.status === 'processing' && 'animate-spin')} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {item.sync_type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {item.action}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {item.entity_type} • Priorité {item.priority}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.scheduled_at), { addSuffix: true, locale: getDateFnsLocale() })}
            </span>
            {item.status === 'pending' && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0"
                onClick={onCancel}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Log item component
function LogItemCard({ log }: { log: any }) {
  const statusConfig: Record<string, { color: string; bgColor: string }> = {
    success: { color: 'text-green-500', bgColor: 'bg-green-500/10' },
    failed: { color: 'text-red-500', bgColor: 'bg-red-500/10' },
    partial: { color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    skipped: { color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
  };

  const config = statusConfig[log.status] || statusConfig.skipped;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className={cn(
        "p-4 rounded-lg border border-border/30 mb-2",
        config.bgColor
      )}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline">{log.sync_type}</Badge>
              <Badge variant="secondary">{log.platform}</Badge>
              <Badge className={cn("capitalize", config.color)} variant="outline">
                {log.status}
              </Badge>
            </div>
            <p className="text-sm">
              {log.items_succeeded}/{log.items_processed} éléments traités
              {log.items_failed > 0 && (
                <span className="text-red-500 ml-2">
                  ({log.items_failed} échecs)
                </span>
              )}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
            <p>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: getDateFnsLocale() })}</p>
            {log.duration_ms && <p>{log.duration_ms}ms</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Module sync button
function ModuleSyncButton({ 
  icon: Icon, 
  label, 
  syncType,
  isLoading,
  isDisabled,
  onClick 
}: { 
  icon: any; 
  label: string; 
  syncType: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div whileHover={{ scale: isDisabled ? 1 : 1.02 }} whileTap={{ scale: isDisabled ? 1 : 0.98 }}>
      <Button
        variant="outline"
        className={cn(
          "h-auto flex-col gap-2 p-4 w-full bg-card/40 backdrop-blur-sm hover:bg-card/60",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={onClick}
        disabled={isLoading || isDisabled}
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Icon className="h-6 w-6" />
        )}
        <span className="text-sm font-medium">{label}</span>
      </Button>
    </motion.div>
  );
}

export default function StoreSyncDashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch real data
  const { connections, stats: channelStats, isLoading: isLoadingConnections } = useChannelConnections();
  const { data: syncStats, isLoading: isLoadingStats } = useSyncStats();
  const { data: queue = [], isLoading: isLoadingQueue } = useUnifiedSyncQueue();
  const { data: logs = [], isLoading: isLoadingLogs } = useUnifiedSyncLogs(100);
  
  // Mutations
  const triggerFullSync = useTriggerFullSync();
  const triggerModuleSync = useTriggerModuleSync();
  const cancelSyncItem = useCancelSyncItem();

  // Connected stores only
  const connectedStores = connections.filter(c => c.connection_status === 'connected');
  const hasConnectedStores = connectedStores.length > 0;

  // Calculate global sync progress
  const activeQueueItems = queue.filter(q => q.status === 'processing' || q.status === 'pending');
  const processingCount = queue.filter(q => q.status === 'processing').length;
  const hasActiveSync = activeQueueItems.length > 0;
  const progressPercentage = hasActiveSync 
    ? Math.round((processingCount / activeQueueItems.length) * 100) 
    : 0;

  // Track which module is being synced
  const [activeSyncModule, setActiveSyncModule] = useState<string | null>(null);

  const handleModuleSync = (syncType: 'products' | 'prices' | 'stock' | 'orders' | 'customers' | 'tracking') => {
    if (!hasConnectedStores) {
      toast.error('Veuillez d\'abord connecter une boutique pour synchroniser vos données');
      return;
    }
    setActiveSyncModule(syncType);
    triggerModuleSync.mutate(
      { sync_type: syncType, direction: 'bidirectional' },
      {
        onSettled: () => setActiveSyncModule(null)
      }
    );
  };

  return (
    <ChannablePageWrapper
      title="Centre de Synchronisation"
      subtitle="SYNC HUB"
      description="Orchestrez la synchronisation de vos données en temps réel avec toutes vos boutiques connectées"
      heroImage="automation"
      badge={{ label: 'Multi-Canaux', icon: Zap }}
      actions={
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => triggerFullSync.mutate({ force_full_sync: true })}
            disabled={triggerFullSync.isPending}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {triggerFullSync.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Synchronisation Complète
          </Button>
        </div>
      }
    >
      {/* Global Progress */}
      <AnimatePresence>
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.storeSync} />

        {hasActiveSync && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    Synchronisation en cours
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {processingCount} tâche(s) en cours • {activeQueueItems.length - processingCount} en attente
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{progressPercentage}%</p>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SyncStatCard
          icon={Store}
          label="Boutiques Connectées"
          value={channelStats?.totalConnected || 0}
          color="primary"
          isLoading={isLoadingConnections}
          onClick={() => navigate('/stores-channels')}
        />
        <SyncStatCard
          icon={Package}
          label="Produits Synchronisés"
          value={channelStats?.totalProducts || 0}
          trend={syncStats?.totalSucceeded ? `+${syncStats.totalSucceeded}` : undefined}
          color="blue"
          isLoading={isLoadingConnections}
          onClick={() => navigate('/products')}
        />
        <SyncStatCard
          icon={ShoppingCart}
          label="Commandes"
          value={channelStats?.totalOrders || 0}
          color="green"
          isLoading={isLoadingConnections}
          onClick={() => navigate('/orders')}
        />
        <SyncStatCard
          icon={Activity}
          label="En Attente"
          value={syncStats?.pending || 0}
          color="yellow"
          isLoading={isLoadingStats}
        />
        <SyncStatCard
          icon={AlertTriangle}
          label="Erreurs Aujourd'hui"
          value={syncStats?.todayFailed || 0}
          color="red"
          isLoading={isLoadingStats}
        />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Left Column - Tabs */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/60 backdrop-blur-sm p-1 w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className={isMobile ? 'hidden' : ''}>Vue d'ensemble</span>
              </TabsTrigger>
              <TabsTrigger value="queue" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className={isMobile ? 'hidden' : ''}>File d'attente</span>
                {activeQueueItems.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {activeQueueItems.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className={isMobile ? 'hidden' : ''}>Historique</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* No stores warning */}
              {!isLoadingConnections && !hasConnectedStores && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-600 dark:text-yellow-400">
                          Aucune boutique connectée
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Connectez une boutique pour activer la synchronisation
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => window.location.href = '/stores-channels'}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-600 dark:text-yellow-400"
                      >
                        Connecter
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Quick Sync Actions */}
              <Card className="p-6 bg-card/60 backdrop-blur-xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Synchronisation Rapide
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  <ModuleSyncButton
                    icon={Package}
                    label="Produits"
                    syncType="products"
                    isLoading={activeSyncModule === 'products'}
                    isDisabled={!hasConnectedStores || (activeSyncModule !== null && activeSyncModule !== 'products')}
                    onClick={() => handleModuleSync('products')}
                  />
                  <ModuleSyncButton
                    icon={DollarSign}
                    label="Prix"
                    syncType="prices"
                    isLoading={activeSyncModule === 'prices'}
                    isDisabled={!hasConnectedStores || (activeSyncModule !== null && activeSyncModule !== 'prices')}
                    onClick={() => handleModuleSync('prices')}
                  />
                  <ModuleSyncButton
                    icon={ArrowUpCircle}
                    label="Stock"
                    syncType="stock"
                    isLoading={activeSyncModule === 'stock'}
                    isDisabled={!hasConnectedStores || (activeSyncModule !== null && activeSyncModule !== 'stock')}
                    onClick={() => handleModuleSync('stock')}
                  />
                  <ModuleSyncButton
                    icon={ShoppingCart}
                    label="Commandes"
                    syncType="orders"
                    isLoading={activeSyncModule === 'orders'}
                    isDisabled={!hasConnectedStores || (activeSyncModule !== null && activeSyncModule !== 'orders')}
                    onClick={() => handleModuleSync('orders')}
                  />
                  <ModuleSyncButton
                    icon={Users}
                    label="Clients"
                    syncType="customers"
                    isLoading={activeSyncModule === 'customers'}
                    isDisabled={!hasConnectedStores || (activeSyncModule !== null && activeSyncModule !== 'customers')}
                    onClick={() => handleModuleSync('customers')}
                  />
                  <ModuleSyncButton
                    icon={ArrowDownCircle}
                    label="Tracking"
                    syncType="tracking"
                    isLoading={activeSyncModule === 'tracking'}
                    isDisabled={!hasConnectedStores || (activeSyncModule !== null && activeSyncModule !== 'tracking')}
                    onClick={() => handleModuleSync('tracking')}
                  />
                </div>
              </Card>

              {/* Connected Stores */}
              <Card className="p-6 bg-card/60 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    Boutiques Connectées
                  </h3>
                  <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/stores-channels')}>
                    Voir tout <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {isLoadingConnections ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : connectedStores.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Aucune boutique connectée</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      Connecter une boutique
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connectedStores.slice(0, 5).map(connection => (
                      <ConnectedStoreCard 
                        key={connection.id} 
                        connection={connection}
                        onSync={() => handleModuleSync('products')}
                      />
                    ))}
                  </div>
                )}
              </Card>

              {/* Recent Activity */}
              <Card className="p-6 bg-card/60 backdrop-blur-xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Activité Récente
                </h3>
                {isLoadingLogs ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Aucune activité récente</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.slice(0, 5).map(log => (
                      <LogItemCard key={log.id} log={log} />
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="queue" className="mt-6">
              <Card className="p-6 bg-card/60 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">File d'attente de synchronisation</h3>
                  <Badge variant="outline">{activeQueueItems.length} tâche(s)</Badge>
                </div>
                
                {isLoadingQueue ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : activeQueueItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500/50" />
                    <p className="text-lg font-medium">Aucune synchronisation en attente</p>
                    <p className="text-sm">Toutes vos boutiques sont à jour</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <AnimatePresence mode="popLayout">
                      <div className="space-y-3">
                        {queue.map(item => (
                          <QueueItemCard 
                            key={item.id} 
                            item={item}
                            onCancel={() => cancelSyncItem.mutate(item.id)}
                          />
                        ))}
                      </div>
                    </AnimatePresence>
                  </ScrollArea>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="mt-6">
              <Card className="p-6 bg-card/60 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Historique de synchronisation</h3>
                  <Badge variant="outline">{logs.length} entrées</Badge>
                </div>
                
                {isLoadingLogs ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Aucun historique</p>
                    <p className="text-sm">Les logs de synchronisation apparaîtront ici</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    {logs.map(log => (
                      <LogItemCard key={log.id} log={log} />
                    ))}
                  </ScrollArea>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Sync Health */}
          <Card className="p-6 bg-card/60 backdrop-blur-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Santé Synchronisation
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Taux de réussite</span>
                  <span className="font-medium text-green-500">
                    {syncStats?.todaySuccess && syncStats.todaySuccess + (syncStats.todayFailed || 0) > 0
                      ? Math.round((syncStats.todaySuccess / (syncStats.todaySuccess + syncStats.todayFailed)) * 100)
                      : 100}%
                  </span>
                </div>
                <Progress 
                  value={syncStats?.todaySuccess && syncStats.todaySuccess + (syncStats.todayFailed || 0) > 0
                    ? Math.round((syncStats.todaySuccess / (syncStats.todaySuccess + syncStats.todayFailed)) * 100)
                    : 100} 
                  className="h-2" 
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Intégrations actives</span>
                  <span className="font-medium">{syncStats?.activeIntegrations || 0}</span>
                </div>
                <Progress 
                  value={Math.min((syncStats?.activeIntegrations || 0) * 20, 100)} 
                  className="h-2" 
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Éléments traités (24h)</span>
                  <span className="font-medium">{syncStats?.totalProcessed || 0}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6 bg-card/60 backdrop-blur-xl">
            <h3 className="text-lg font-semibold mb-4">Statistiques Rapides</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Réussies aujourd'hui</span>
                </div>
                <span className="font-semibold">{syncStats?.todaySuccess || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Partielles</span>
                </div>
                <span className="font-semibold">{syncStats?.todayPartial || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Échouées</span>
                </div>
                <span className="font-semibold">{syncStats?.todayFailed || 0}</span>
              </div>
            </div>
          </Card>

          {/* Platform Status */}
          <Card className="p-6 bg-card/60 backdrop-blur-xl">
            <h3 className="text-lg font-semibold mb-4">État des Plateformes</h3>
            <div className="space-y-2">
              {connectedStores.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Connectez une boutique pour voir son état
                </p>
              ) : (
                connectedStores.slice(0, 6).map(store => (
                  <div 
                    key={store.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        store.connection_status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      )} />
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {store.platform_name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {store.connection_status === 'connected' ? 'Actif' : 'Erreur'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </ChannablePageWrapper>
  );
}
