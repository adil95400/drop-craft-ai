/**
 * MultiCanalHubPage — Hub unifié multi-canal
 * Gestion canaux, sync bidirectionnelle, santé, queue, logs
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useMarketplaceIntegrations } from '@/hooks/useMarketplaceIntegrations';
import {
  useSyncConfigurations,
  useUnifiedSyncQueue,
  useUnifiedSyncLogs,
  useSyncStats,
  useTriggerFullSync,
  useTriggerModuleSync,
  useCancelSyncItem,
} from '@/hooks/useUnifiedSync';
import { MarketplaceConnectDialog } from '@/domains/marketplace/components/MarketplaceConnectDialog';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';
import { motion } from 'framer-motion';
import {
  Globe, Store, RefreshCw, Plug, Unplug, Activity, CheckCircle2,
  XCircle, Clock, AlertTriangle, ArrowUpDown, Package, DollarSign,
  ShoppingCart, Users, Truck, BarChart3, Loader2, Zap, Wifi, WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { key: 'shopify', name: 'Shopify', type: 'E-commerce', emoji: '🟢' },
  { key: 'woocommerce', name: 'WooCommerce', type: 'E-commerce', emoji: '🟣' },
  { key: 'amazon', name: 'Amazon', type: 'Marketplace', emoji: '📦' },
  { key: 'ebay', name: 'eBay', type: 'Marketplace', emoji: '🏷️' },
  { key: 'etsy', name: 'Etsy', type: 'Marketplace', emoji: '🎨' },
  { key: 'cdiscount', name: 'Cdiscount', type: 'Marketplace', emoji: '🔵' },
  { key: 'tiktok', name: 'TikTok Shop', type: 'Social', emoji: '🎵' },
  { key: 'prestashop', name: 'PrestaShop', type: 'E-commerce', emoji: '🛒' },
  { key: 'allegro', name: 'Allegro', type: 'Marketplace', emoji: '🇵🇱' },
  { key: 'manomano', name: 'ManoMano', type: 'Marketplace', emoji: '🔧' },
  { key: 'google_shopping', name: 'Google Shopping', type: 'Ads', emoji: '🔍' },
  { key: 'facebook', name: 'Facebook Shops', type: 'Social', emoji: '📘' },
];

const SYNC_MODULES = [
  { key: 'products', label: 'Produits', icon: Package },
  { key: 'prices', label: 'Prix', icon: DollarSign },
  { key: 'stock', label: 'Stock', icon: BarChart3 },
  { key: 'orders', label: 'Commandes', icon: ShoppingCart },
  { key: 'customers', label: 'Clients', icon: Users },
  { key: 'tracking', label: 'Tracking', icon: Truck },
] as const;

export default function MultiCanalHubPage() {
  const locale = useDateFnsLocale();
  const { integrations, connected, isLoading, connectPlatform, disconnectPlatform, syncPlatform, isConnecting } = useMarketplaceIntegrations();
  const { data: syncConfigs = [] } = useSyncConfigurations();
  const { data: syncQueue = [] } = useUnifiedSyncQueue();
  const { data: syncLogs = [] } = useUnifiedSyncLogs(30);
  const { data: syncStats } = useSyncStats();
  const triggerFullSync = useTriggerFullSync();
  const triggerModuleSync = useTriggerModuleSync();
  const cancelSyncItem = useCancelSyncItem();

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');

  const connectedKeys = new Set(connected.map(i => i.platform));
  const availablePlatforms = PLATFORMS.filter(p => !connectedKeys.has(p.key));

  const healthScore = useMemo(() => {
    if (!syncStats || syncStats.activeIntegrations === 0) return 0;
    const successRate = syncStats.todaySuccess + syncStats.todayFailed > 0
      ? (syncStats.todaySuccess / (syncStats.todaySuccess + syncStats.todayFailed)) * 100
      : 100;
    return Math.round(successRate);
  }, [syncStats]);

  const handleConnect = async (credentials: Record<string, string>) => {
    await connectPlatform({ platform: selectedPlatform, credentials });
  };

  if (isLoading) {
    return (
      <ChannablePageWrapper title="Multi-Canal Hub" description="Chargement..." heroImage="integrations" badge={{ label: 'Hub', icon: Globe }}>
        <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      </ChannablePageWrapper>
    );
  }

  return (
    <ChannablePageWrapper
      title="Multi-Canal Hub"
      subtitle="Gestion Canaux"
      description="Gérez tous vos canaux de vente, synchronisez vos produits, prix, stock et commandes en temps réel."
      heroImage="integrations"
      badge={{ label: 'Hub', icon: Globe }}
      actions={
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => triggerFullSync.mutate({})}
            disabled={triggerFullSync.isPending || connected.length === 0}
          >
            {triggerFullSync.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync Tout
          </Button>
          <Button size="sm" onClick={() => { setSelectedPlatform(availablePlatforms[0]?.key || 'shopify'); setConnectDialogOpen(true); }}>
            <Plug className="h-4 w-4 mr-2" /> Connecter
          </Button>
        </div>
      }
    >
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Globe className="h-3.5 w-3.5" /> Canaux
            </div>
            <p className="text-2xl font-bold">{connected.length}</p>
            <p className="text-xs text-muted-foreground">{availablePlatforms.length} disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="h-3.5 w-3.5" /> Santé
            </div>
            <div className="flex items-center gap-2">
              <p className={cn("text-2xl font-bold", healthScore >= 80 ? "text-green-600" : healthScore >= 50 ? "text-amber-600" : "text-red-600")}>
                {healthScore}%
              </p>
              {healthScore >= 80 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <ArrowUpDown className="h-3.5 w-3.5" /> En queue
            </div>
            <p className="text-2xl font-bold">{syncStats?.pending || 0}</p>
            <p className="text-xs text-muted-foreground">{syncStats?.processing || 0} en cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Aujourd'hui
            </div>
            <p className="text-2xl font-bold text-green-600">{syncStats?.todaySuccess || 0}</p>
            <p className="text-xs text-muted-foreground">{syncStats?.todayFailed || 0} erreurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Package className="h-3.5 w-3.5" /> Items sync
            </div>
            <p className="text-2xl font-bold">{(syncStats?.totalProcessed || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{(syncStats?.totalSucceeded || 0).toLocaleString()} réussis</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="channels"><Store className="h-4 w-4 mr-1" /> Canaux ({connected.length})</TabsTrigger>
          <TabsTrigger value="sync"><ArrowUpDown className="h-4 w-4 mr-1" /> Sync Modules</TabsTrigger>
          <TabsTrigger value="queue"><Clock className="h-4 w-4 mr-1" /> Queue ({syncQueue.length})</TabsTrigger>
          <TabsTrigger value="logs"><Activity className="h-4 w-4 mr-1" /> Logs</TabsTrigger>
          <TabsTrigger value="add"><Plug className="h-4 w-4 mr-1" /> Ajouter</TabsTrigger>
        </TabsList>

        {/* === CHANNELS TAB === */}
        <TabsContent value="channels" className="space-y-4">
          {connected.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun canal connecté</h3>
                <p className="text-muted-foreground mb-4">Connectez votre premier canal de vente pour démarrer</p>
                <Button onClick={() => { setSelectedPlatform('shopify'); setConnectDialogOpen(true); }}>
                  <Plug className="mr-2 h-4 w-4" /> Connecter Shopify
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {connected.map((integration, i) => {
                const platform = PLATFORMS.find(p => p.key === integration.platform);
                return (
                  <motion.div key={integration.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{platform?.emoji || '🔌'}</span>
                            <div>
                              <CardTitle className="text-base">{integration.platform_name || platform?.name || integration.platform}</CardTitle>
                              <CardDescription className="text-xs">
                                {integration.store_url || integration.store_id || platform?.type}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant={integration.is_active ? 'default' : 'secondary'} className="gap-1">
                            {integration.is_active ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                            {integration.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-xs text-muted-foreground">
                          {integration.last_sync_at ? (
                            <>Dernière sync : {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true, locale })}</>
                          ) : 'Jamais synchronisé'}
                        </div>
                        {integration.auto_sync_enabled && (
                          <div className="flex items-center gap-1 text-xs">
                            <Zap className="h-3 w-3 text-amber-500" />
                            <span className="text-muted-foreground">Auto-sync : {integration.sync_frequency || '15 min'}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button className="flex-1" variant="outline" size="sm" onClick={() => syncPlatform(integration.id)}>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => disconnectPlatform(integration.id)}>
                            <Unplug className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* === SYNC MODULES TAB === */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modules de Synchronisation</CardTitle>
              <CardDescription>Lancez des syncs ciblées par module</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SYNC_MODULES.map(mod => {
                  const Icon = mod.icon;
                  return (
                    <Card key={mod.key} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{mod.label}</p>
                            <p className="text-xs text-muted-foreground">Bidirectionnel</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={triggerModuleSync.isPending || connected.length === 0}
                          onClick={() => triggerModuleSync.mutate({ sync_type: mod.key as any })}
                        >
                          {triggerModuleSync.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === QUEUE TAB === */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File d'attente de synchronisation</CardTitle>
              <CardDescription>{syncQueue.length} élément(s) en attente ou en cours</CardDescription>
            </CardHeader>
            <CardContent>
              {syncQueue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">File d'attente vide — tout est synchronisé</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-2">
                    {syncQueue.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Badge variant={item.status === 'processing' ? 'default' : 'secondary'} className="text-xs">
                            {item.status === 'processing' ? 'En cours' : 'En attente'}
                          </Badge>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{item.sync_type} — {item.action}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.entity_type} • Priorité {item.priority}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.retry_count > 0 && (
                            <Badge variant="outline" className="text-xs">Retry {item.retry_count}/{item.max_retries}</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cancelSyncItem.mutate(item.id)}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === LOGS TAB === */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique de synchronisation</CardTitle>
              <CardDescription>Dernières {syncLogs.length} opérations</CardDescription>
            </CardHeader>
            <CardContent>
              {syncLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucun log de synchronisation</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {syncLogs.map(log => {
                      const statusConfig = {
                        success: { color: 'text-green-600', icon: CheckCircle2, label: 'Succès' },
                        failed: { color: 'text-red-600', icon: XCircle, label: 'Échec' },
                        partial: { color: 'text-amber-600', icon: AlertTriangle, label: 'Partiel' },
                        skipped: { color: 'text-muted-foreground', icon: Clock, label: 'Ignoré' },
                      };
                      const cfg = statusConfig[log.status] || statusConfig.skipped;
                      const StatusIcon = cfg.icon;

                      return (
                        <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <StatusIcon className={cn("h-4 w-4 flex-shrink-0", cfg.color)} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{log.platform} — {log.sync_type}</p>
                                <Badge variant="outline" className="text-xs">{log.action}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {log.items_succeeded}/{log.items_processed} items
                                {log.duration_ms ? ` • ${log.duration_ms}ms` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ADD CHANNEL TAB === */}
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Connecter un nouveau canal</CardTitle>
              <CardDescription>Étendez votre présence sur {availablePlatforms.length} plateformes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PLATFORMS.map(platform => {
                  const isConnected = connectedKeys.has(platform.key);
                  return (
                    <Card key={platform.key} className={cn("transition-all", isConnected ? "opacity-60" : "hover:shadow-md cursor-pointer")}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{platform.emoji}</span>
                          <div>
                            <h4 className="font-semibold text-sm">{platform.name}</h4>
                            <Badge variant="outline" className="text-xs">{platform.type}</Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isConnected ? 'secondary' : 'default'}
                          className="w-full"
                          disabled={isConnected || isConnecting}
                          onClick={() => { setSelectedPlatform(platform.key); setConnectDialogOpen(true); }}
                        >
                          {isConnected ? 'Déjà connecté' : 'Connecter'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MarketplaceConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        platform={selectedPlatform}
        onConnect={handleConnect}
      />
    </ChannablePageWrapper>
  );
}
