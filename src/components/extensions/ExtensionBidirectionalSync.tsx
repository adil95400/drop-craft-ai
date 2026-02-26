/**
 * Extension Bidirectional Sync - Synchronisation temps réel SaaS ↔ Extension
 * Gère les événements push/pull entre l'extension et le backend
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, CheckCircle, 
  AlertCircle, Clock, Package, DollarSign, Image, Settings,
  Zap, Activity, Database, Cloud, Loader2, Play, Pause, History
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SyncEvent {
  id: string;
  type: 'push' | 'pull';
  module: string;
  status: 'pending' | 'syncing' | 'success' | 'error';
  itemsCount: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

interface SyncStats {
  totalPush: number;
  totalPull: number;
  lastSync: string | null;
  pendingEvents: number;
}

export function ExtensionBidirectionalSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  // Fetch sync events
  const { data: syncEvents = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['extension-sync-events', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('extension_data')
        .select('*')
        .eq('user_id', user.id)
        .in('data_type', ['sync_event_push', 'sync_event_pull', 'config_push_event'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        type: item.data_type?.includes('push') ? 'push' : 'pull',
        module: (item.data as any)?.module || 'products',
        status: item.status === 'active' ? 'success' : item.status as SyncEvent['status'],
        itemsCount: (item.data as any)?.itemsCount || 1,
        createdAt: item.created_at,
        completedAt: item.updated_at,
        error: (item.data as any)?.error
      })) as SyncEvent[];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Fetch sync stats
  const { data: syncStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['extension-sync-stats', user?.id],
    queryFn: async () => {
      if (!user) return { totalPush: 0, totalPull: 0, lastSync: null, pendingEvents: 0 };

      const pushRes = await supabase
        .from('extension_data')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('data_type', 'sync_event_push');

      const pullRes = await supabase
        .from('extension_data')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('data_type', 'sync_event_pull');

      const pendingRes = await supabase
        .from('extension_data')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      const lastSyncRes = await supabase
        .from('extension_data')
        .select('updated_at')
        .eq('user_id', user.id)
        .in('data_type', ['sync_event_push', 'sync_event_pull'])
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        totalPush: pushRes.count || 0,
        totalPull: pullRes.count || 0,
        lastSync: lastSyncRes.data?.updated_at || null,
        pendingEvents: pendingRes.count || 0
      };
    },
    enabled: !!user,
  });

  // Trigger full sync
  const triggerSync = useMutation({
    mutationFn: async (direction: 'push' | 'pull' | 'both') => {
      setSyncInProgress(true);

      // Create sync event
      const { error } = await supabase
        .from('extension_data')
        .insert({
          user_id: user?.id,
          data_type: `sync_event_${direction}`,
          data: { 
            module: 'all',
            initiatedFrom: 'saas',
            timestamp: new Date().toISOString()
          },
          source_url: 'saas_bidirectional_sync',
          status: 'pending'
        });

      if (error) throw error;

      // Simulate sync process
      await new Promise(r => setTimeout(r, 2000));

      return { success: true };
    },
    onSuccess: (_, direction) => {
      setSyncInProgress(false);
      queryClient.invalidateQueries({ queryKey: ['extension-sync-events'] });
      queryClient.invalidateQueries({ queryKey: ['extension-sync-stats'] });
      toast.success(`Synchronisation ${direction === 'push' ? 'vers l\'extension' : direction === 'pull' ? 'depuis l\'extension' : 'complète'} lancée`);
    },
    onError: (error: any) => {
      setSyncInProgress(false);
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Realtime subscription for sync events
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('extension-sync-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extension_data',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Sync event received:', payload);
          queryClient.invalidateQueries({ queryKey: ['extension-sync-events'] });
          queryClient.invalidateQueries({ queryKey: ['extension-sync-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'products': return <Package className="h-4 w-4" />;
      case 'prices': return <DollarSign className="h-4 w-4" />;
      case 'images': return <Image className="h-4 w-4" />;
      case 'settings': return <Settings className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: SyncEvent['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Succès</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-500/10 text-blue-600"><Loader2 className="h-3 w-3 mr-1 animate-spin" />En cours</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-600"><AlertCircle className="h-3 w-3 mr-1" />Erreur</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <ArrowUpDown className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Synchronisation Bidirectionnelle</CardTitle>
                <CardDescription>SaaS ↔ Extension Chrome en temps réel</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoSync(!autoSync)}
                className={cn(autoSync && "border-green-500 text-green-600")}
              >
                {autoSync ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                Auto-sync {autoSync ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center gap-2"
              onClick={() => triggerSync.mutate('push')}
              disabled={syncInProgress}
            >
              <ArrowUp className="h-6 w-6 text-blue-500" />
              <span className="text-sm">Push vers Extension</span>
            </Button>
            <Button
              className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500"
              onClick={() => triggerSync.mutate('both')}
              disabled={syncInProgress}
            >
              {syncInProgress ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <ArrowUpDown className="h-6 w-6" />
              )}
              <span className="text-sm">Sync Complète</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center gap-2"
              onClick={() => triggerSync.mutate('pull')}
              disabled={syncInProgress}
            >
              <ArrowDown className="h-6 w-6 text-green-500" />
              <span className="text-sm">Pull depuis Extension</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowUp className="h-8 w-8 text-blue-500/30" />
              <div>
                <p className="text-2xl font-bold">{syncStats?.totalPush || 0}</p>
                <p className="text-xs text-muted-foreground">Push events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowDown className="h-8 w-8 text-green-500/30" />
              <div>
                <p className="text-2xl font-bold">{syncStats?.totalPull || 0}</p>
                <p className="text-xs text-muted-foreground">Pull events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500/30" />
              <div>
                <p className="text-2xl font-bold">{syncStats?.pendingEvents || 0}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-purple-500/30" />
              <div>
                <p className="text-sm font-medium">
                  {syncStats?.lastSync 
                    ? formatDistanceToNow(new Date(syncStats.lastSync), { addSuffix: true, locale: getDateFnsLocale() })
                    : 'Jamais'
                  }
                </p>
                <p className="text-xs text-muted-foreground">Dernière sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Events History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des synchronisations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {isLoadingEvents ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 p-3 border rounded-lg animate-pulse">
                    <div className="h-8 w-8 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-muted rounded" />
                      <div className="h-3 w-1/4 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : syncEvents.length === 0 ? (
              <div className="text-center py-12">
                <Cloud className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Aucun événement de sync</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => triggerSync.mutate('both')}
                >
                  Lancer une synchronisation
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {syncEvents.map((event) => (
                  <div 
                    key={event.id}
                    className={cn(
                      "flex items-center gap-4 p-3 border rounded-lg transition-colors",
                      event.type === 'push' ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-green-500"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      event.type === 'push' ? "bg-blue-500/10" : "bg-green-500/10"
                    )}>
                      {event.type === 'push' ? (
                        <ArrowUp className="h-5 w-5 text-blue-500" />
                      ) : (
                        <ArrowDown className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getModuleIcon(event.module)}
                        <span className="font-medium capitalize">{event.module}</span>
                        <Badge variant="outline" className="text-xs">
                          {event.itemsCount} items
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: getDateFnsLocale() })}
                      </p>
                    </div>
                    {getStatusBadge(event.status)}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
