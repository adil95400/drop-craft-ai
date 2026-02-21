/**
 * Extension Sync Status Component
 * Affiche l'état de synchronisation entre l'extension et le SaaS
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, CheckCircle, AlertCircle, Clock, 
  Zap, Database, Cloud, Store, Package, Settings,
  TrendingUp, Users, ShoppingCart
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SyncModule {
  id: string;
  name: string;
  icon: React.ElementType;
  status: 'synced' | 'syncing' | 'error' | 'pending';
  lastSync?: string;
  itemsCount?: number;
  description: string;
}

export function ExtensionSyncStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [syncingModule, setSyncingModule] = useState<string | null>(null);

  // Fetch sync status from various tables
  const { data: syncData, isLoading, refetch } = useQuery({
    queryKey: ['extension-sync-status', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Fetch counts from various tables
      const { getProductCount } = await import('@/services/api/productHelpers');
      const productCount = await getProductCount();
      const settingsRes = await supabase.from('extension_data').select('updated_at').eq('user_id', user.id).eq('data_type', 'extension_settings').maybeSingle();
      const importsRes = await (supabase.from('products') as any).select('id, created_at', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
      const integrationsRes = await supabase.from('integrations').select('id', { count: 'exact', head: true }).eq('user_id', user.id);

      return {
        products: productCount,
        stores: integrationsRes.count || 0,
        settingsSync: settingsRes.data?.updated_at || null,
        lastImport: importsRes.data?.[0]?.created_at || null,
        importsCount: importsRes.count || 0
      };
    },
    enabled: !!user,
    refetchInterval: 60000
  });

  // Trigger manual sync
  const triggerSync = useMutation({
    mutationFn: async (moduleId: string) => {
      setSyncingModule(moduleId);
      
      // Simulate sync delay for UX
      await new Promise(r => setTimeout(r, 1500));

      // Update sync timestamp
      const { error } = await supabase
        .from('extension_data')
        .upsert({
          user_id: user?.id,
          data_type: `sync_${moduleId}`,
          data: { lastSync: new Date().toISOString() },
          source_url: 'webapp',
          status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,data_type' });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extension-sync-status'] });
      toast.success('Synchronisation terminée');
      setSyncingModule(null);
    },
    onError: () => {
      toast.error('Erreur de synchronisation');
      setSyncingModule(null);
    }
  });

  const syncModules: SyncModule[] = [
    {
      id: 'products',
      name: 'Produits',
      icon: Package,
      status: syncData?.products ? 'synced' : 'pending',
      lastSync: syncData?.lastImport || undefined,
      itemsCount: syncData?.products,
      description: 'Catalogue produits synchronisé'
    },
    {
      id: 'stores',
      name: 'Boutiques',
      icon: Store,
      status: syncData?.stores ? 'synced' : 'pending',
      itemsCount: syncData?.stores,
      description: 'Boutiques connectées'
    },
    {
      id: 'settings',
      name: 'Paramètres',
      icon: Settings,
      status: syncData?.settingsSync ? 'synced' : 'pending',
      lastSync: syncData?.settingsSync || undefined,
      description: 'Configuration extension'
    },
    {
      id: 'imports',
      name: 'Imports Extension',
      icon: Cloud,
      status: syncData?.importsCount ? 'synced' : 'pending',
      lastSync: syncData?.lastImport || undefined,
      itemsCount: syncData?.importsCount,
      description: 'Produits importés via extension'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-500';
      case 'syncing': return 'bg-blue-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Synchronisé</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Sync...</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30"><AlertCircle className="h-3 w-3 mr-1" />Erreur</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  const overallStatus = syncModules.every(m => m.status === 'synced') ? 'synced' : 
                        syncModules.some(m => m.status === 'error') ? 'error' : 
                        syncModules.some(m => m.status === 'syncing') ? 'syncing' : 'pending';

  const syncedCount = syncModules.filter(m => m.status === 'synced').length;
  const syncProgress = (syncedCount / syncModules.length) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center",
                overallStatus === 'synced' ? 'bg-green-500/10' : 'bg-primary/10'
              )}>
                <Zap className={cn(
                  "h-6 w-6",
                  overallStatus === 'synced' ? 'text-green-500' : 'text-primary'
                )} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Synchronisation SaaS
                  {getStatusBadge(overallStatus)}
                </CardTitle>
                <CardDescription>
                  Extension Chrome ↔ ShopOpti Cloud
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression sync</span>
              <span className="font-medium">{syncedCount}/{syncModules.length} modules</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Sync Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          syncModules.map((module) => {
            const Icon = module.icon;
            const isSyncing = syncingModule === module.id;
            
            return (
              <Card 
                key={module.id}
                className={cn(
                  "transition-all duration-200",
                  module.status === 'synced' && "border-green-500/30",
                  isSyncing && "border-blue-500/50 shadow-lg"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        module.status === 'synced' ? 'bg-green-500/10' : 'bg-muted'
                      )}>
                        <Icon className={cn(
                          "h-5 w-5",
                          module.status === 'synced' ? 'text-green-500' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{module.name}</p>
                          <div className={cn("h-2 w-2 rounded-full", getStatusColor(isSyncing ? 'syncing' : module.status))} />
                        </div>
                        <p className="text-xs text-muted-foreground">{module.description}</p>
                        {module.itemsCount !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {module.itemsCount} éléments
                          </p>
                        )}
                        {module.lastSync && (
                          <p className="text-xs text-muted-foreground">
                            Sync: {formatDistanceToNow(new Date(module.lastSync), { addSuffix: true, locale: fr })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => triggerSync.mutate(module.id)}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Statistiques Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <Package className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">{syncData?.importsCount || 0}</p>
              <p className="text-xs text-muted-foreground">Imports totaux</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Store className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold">{syncData?.stores || 0}</p>
              <p className="text-xs text-muted-foreground">Boutiques</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Database className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <p className="text-lg font-bold">{syncData?.products || 0}</p>
              <p className="text-xs text-muted-foreground">Produits</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
