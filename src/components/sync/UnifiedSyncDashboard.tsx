import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Package, 
  DollarSign, 
  Warehouse, 
  ShoppingCart,
  Users,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Play,
  Settings,
  Store
} from 'lucide-react';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { 
  useSyncConfigurations, 
  useUnifiedSyncQueue,
  useUnifiedSyncLogs,
  useSyncStats,
  useTriggerFullSync,
  useTriggerModuleSync,
  useUpsertSyncConfiguration
} from '@/hooks/useUnifiedSync';

const SYNC_MODULES = [
  { id: 'products', label: 'Produits', icon: Package, color: 'bg-blue-500' },
  { id: 'prices', label: 'Prix', icon: DollarSign, color: 'bg-green-500' },
  { id: 'stock', label: 'Stock', icon: Warehouse, color: 'bg-orange-500' },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart, color: 'bg-purple-500' },
  { id: 'customers', label: 'Clients', icon: Users, color: 'bg-pink-500' },
  { id: 'tracking', label: 'Tracking', icon: Truck, color: 'bg-cyan-500' },
];

export function UnifiedSyncDashboard() {
  const { data: configs, isLoading: configsLoading } = useSyncConfigurations();
  const { data: queue, isLoading: queueLoading } = useUnifiedSyncQueue();
  const { data: logs, isLoading: logsLoading } = useUnifiedSyncLogs(100);
  const { data: stats } = useSyncStats();
  
  const triggerFullSync = useTriggerFullSync();
  const triggerModuleSync = useTriggerModuleSync();
  const updateConfig = useUpsertSyncConfiguration();

  const handleFullSync = () => {
    triggerFullSync.mutate({ force_full_sync: true });
  };

  const handleModuleSync = (moduleId: string) => {
    triggerModuleSync.mutate({ 
      sync_type: moduleId as any,
      direction: 'bidirectional'
    });
  };

  const handleToggleSync = (config: any, field: string, value: boolean) => {
    updateConfig.mutate({
      integration_id: config.integration_id,
      platform: config.platform,
      [field]: value,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      success: 'default',
      completed: 'default',
      failed: 'destructive',
      partial: 'secondary',
      pending: 'outline',
      processing: 'secondary',
    };
    return variants[status] || 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Synchronisation Unifiée</h2>
          <p className="text-muted-foreground">
            Synchronisez automatiquement tous vos modules avec vos boutiques
          </p>
        </div>
        <Button 
          onClick={handleFullSync}
          disabled={triggerFullSync.isPending}
          size="lg"
        >
          {triggerFullSync.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Synchroniser tout
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{stats?.processing || 0}</p>
              </div>
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Réussies (24h)</p>
                <p className="text-2xl font-bold text-green-600">{stats?.todaySuccess || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échouées (24h)</p>
                <p className="text-2xl font-bold text-red-600">{stats?.todayFailed || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {SYNC_MODULES.map(module => (
          <Card 
            key={module.id} 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleModuleSync(module.id)}
          >
            <CardContent className="pt-6 text-center">
              <div className={`mx-auto w-12 h-12 rounded-full ${module.color} flex items-center justify-center mb-3`}>
                <module.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-medium">{module.label}</h3>
              <Button variant="ghost" size="sm" className="mt-2">
                <Play className="h-3 w-3 mr-1" />
                Sync
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">
            File d'attente ({queue?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="logs">
            Historique
          </TabsTrigger>
          <TabsTrigger value="config">
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Queue Tab */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>File d'attente de synchronisation</CardTitle>
              <CardDescription>
                Opérations en attente et en cours de traitement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : queue && queue.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {queue.map(item => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(item.status)}
                          <div>
                            <p className="font-medium capitalize">
                              {item.sync_type} - {item.action}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.entity_type} • Priorité {item.priority}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadge(item.status)}>
                            {item.status}
                          </Badge>
                          {item.retry_count > 0 && (
                            <Badge variant="outline">
                              Retry {item.retry_count}/{item.max_retries}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), 'HH:mm', { locale: getDateFnsLocale() })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Aucune synchronisation en attente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Historique des synchronisations</CardTitle>
              <CardDescription>
                Dernières opérations de synchronisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : logs && logs.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {logs.map(log => (
                      <div 
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="font-medium capitalize">
                              {log.sync_type} → {log.platform}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {log.items_succeeded}/{log.items_processed} éléments
                              {log.duration_ms && ` • ${log.duration_ms}ms`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadge(log.status)}>
                            {log.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: getDateFnsLocale() })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Aucun historique de synchronisation</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuration par boutique</CardTitle>
              <CardDescription>
                Activez/désactivez la synchronisation par module et par boutique
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : configs && configs.length > 0 ? (
                <div className="space-y-6">
                  {configs.map(config => (
                    <div key={config.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Store className="h-5 w-5" />
                        <div>
                          <h4 className="font-medium capitalize">{config.platform}</h4>
                          <p className="text-sm text-muted-foreground">
                            {(config as any).integrations?.store_url || 'Non configuré'}
                          </p>
                        </div>
                        <Badge variant={config.is_active ? 'default' : 'secondary'} className="ml-auto">
                          {config.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                          { key: 'sync_products', label: 'Produits' },
                          { key: 'sync_prices', label: 'Prix' },
                          { key: 'sync_stock', label: 'Stock' },
                          { key: 'sync_orders', label: 'Commandes' },
                          { key: 'sync_customers', label: 'Clients' },
                          { key: 'sync_tracking', label: 'Tracking' },
                        ].map(field => (
                          <div key={field.key} className="flex items-center justify-between">
                            <span className="text-sm">{field.label}</span>
                            <Switch
                              checked={(config as any)[field.key]}
                              onCheckedChange={(value) => handleToggleSync(config, field.key, value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Aucune configuration de synchronisation</p>
                  <p className="text-sm mt-2">
                    Connectez d'abord une boutique pour configurer la synchronisation
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UnifiedSyncDashboard;
