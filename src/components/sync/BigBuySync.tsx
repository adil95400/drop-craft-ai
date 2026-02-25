import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Download, Clock, CheckCircle, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fromTable } from '@/integrations/supabase/typedClient';

interface SyncJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  total_products: number;
  processed_products: number;
  imported_products: number;
  failed_products: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  sync_type: string;
}

export const BigBuySync = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSyncType, setSelectedSyncType] = useState<'full' | 'incremental' | 'trending'>('incremental');

  // Fetch last sync job from jobs table
  const { data: lastSyncJob, isLoading } = useQuery({
    queryKey: ['bigbuy-sync-status'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data } = await fromTable('jobs')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('job_type', 'sync')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return null;

      const meta = (data.metadata as any) || {};
      return {
        id: data.id,
        status: data.status as SyncJob['status'],
        progress: data.total_items > 0 ? Math.round((data.processed_items / data.total_items) * 100) : 0,
        total_products: data.total_items || 0,
        processed_products: data.processed_items || 0,
        imported_products: (data.processed_items || 0) - (data.failed_items || 0),
        failed_products: data.failed_items || 0,
        started_at: data.started_at,
        completed_at: data.completed_at,
        error_message: data.error_message,
        sync_type: meta.sync_type || 'incremental',
      } as SyncJob;
    }
  });

  // Sync history from jobs table
  const { data: syncHistory } = useQuery({
    queryKey: ['bigbuy-sync-history'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data } = await fromTable('jobs')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('job_type', 'sync')
        .order('created_at', { ascending: false })
        .limit(10);

      return (data || []).map((j: any) => ({
        date: new Date(j.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type: (j.metadata as any)?.sync_type || 'incremental',
        status: j.status,
        products: j.processed_items || 0,
        duration: j.started_at && j.completed_at
          ? `${Math.round((new Date(j.completed_at).getTime() - new Date(j.started_at).getTime()) / 60000)} min`
          : '-',
      }));
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (syncType: string) => {
      const { data, error } = await supabase.functions.invoke('real-data-sync', {
        body: { platforms: ['bigbuy'], syncType: 'products', batchSize: syncType === 'full' ? 1000 : 100 }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Synchronisation lancée', description: 'La synchronisation BigBuy a été démarrée avec succès' });
      queryClient.invalidateQueries({ queryKey: ['bigbuy-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['bigbuy-sync-history'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur de synchronisation', description: error.message, variant: 'destructive' });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return RefreshCw;
      case 'failed': return AlertCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg"><TrendingUp className="w-5 h-5 text-orange-600" /></div>
            Synchronisation BigBuy
          </CardTitle>
          <CardDescription>Synchronisez votre catalogue avec les produits BigBuy en temps réel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold">Type de synchronisation</h3>
              <div className="flex gap-2">
                {(['incremental', 'full', 'trending'] as const).map((type) => (
                  <Button key={type} variant={selectedSyncType === type ? 'default' : 'outline'} size="sm" onClick={() => setSelectedSyncType(type)}>
                    {type === 'incremental' && 'Incrémentale'}{type === 'full' && 'Complète'}{type === 'trending' && 'Tendances'}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={() => syncMutation.mutate(selectedSyncType)} disabled={syncMutation.isPending || lastSyncJob?.status === 'running'} className="flex items-center gap-2">
              {syncMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {syncMutation.isPending ? 'Lancement...' : 'Synchroniser'}
            </Button>
          </div>

          <Separator />

          {lastSyncJob && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Dernière synchronisation</h3>
                <Badge className={lastSyncJob.status === 'completed' ? 'bg-green-100 text-green-800' : lastSyncJob.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                  {lastSyncJob.status === 'completed' && 'Terminée'}{lastSyncJob.status === 'running' && 'En cours'}{lastSyncJob.status === 'failed' && 'Échouée'}{lastSyncJob.status === 'pending' && 'En attente'}
                </Badge>
              </div>
              {lastSyncJob.status === 'running' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Progression</span><span>{lastSyncJob.progress}%</span></div>
                  <Progress value={lastSyncJob.progress} className="w-full" />
                </div>
              )}
              {lastSyncJob.status === 'completed' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg"><p className="text-2xl font-bold text-green-600">{lastSyncJob.imported_products}</p><p className="text-sm text-green-700">Importés</p></div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg"><p className="text-2xl font-bold text-blue-600">{lastSyncJob.processed_products}</p><p className="text-sm text-blue-700">Traités</p></div>
                  <div className="text-center p-4 bg-red-50 rounded-lg"><p className="text-2xl font-bold text-red-600">{lastSyncJob.failed_products}</p><p className="text-sm text-red-700">Échoués</p></div>
                </div>
              )}
            </div>
          )}
          {!lastSyncJob && !isLoading && <p className="text-center text-muted-foreground py-4">Aucune synchronisation précédente</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historique des synchronisations</CardTitle></CardHeader>
        <CardContent>
          {(syncHistory || []).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun historique disponible</p>
          ) : (
            <div className="space-y-4">
              {(syncHistory || []).map((sync: any, index: number) => {
                const StatusIcon = getStatusIcon(sync.status);
                return (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`w-5 h-5 ${sync.status === 'completed' ? 'text-green-600' : sync.status === 'failed' ? 'text-red-600' : 'text-blue-600'}`} />
                      <div>
                        <p className="font-medium">{sync.date}</p>
                        <p className="text-sm text-muted-foreground">{sync.type === 'incremental' ? 'Incrémentale' : sync.type === 'full' ? 'Complète' : 'Tendances'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{sync.products} produits</p>
                      <p className="text-sm text-muted-foreground">{sync.duration}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
