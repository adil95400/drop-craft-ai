import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Download, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  sync_type: 'full' | 'incremental' | 'trending';
}

export const BigBuySync = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSyncType, setSelectedSyncType] = useState<'full' | 'incremental' | 'trending'>('incremental');

  // Fetch last sync job
  const { data: lastSyncJob, isLoading } = useQuery({
    queryKey: ['bigbuy-sync-status'],
    queryFn: async () => {
      // Mock data since we don't have sync_jobs table yet
      const mockJob: SyncJob = {
        id: 'mock-sync-1',
        status: 'completed',
        progress: 100,
        total_products: 1500,
        processed_products: 1500,
        imported_products: 1320,
        failed_products: 180,
        started_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date().toISOString(),
        sync_type: 'incremental'
      };
      return mockJob;
    }
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (syncType: 'full' | 'incremental' | 'trending') => {
      const { data, error } = await supabase.functions.invoke('real-data-sync', {
        body: {
          platforms: ['bigbuy'],
          syncType: 'products',
          batchSize: syncType === 'full' ? 1000 : 100
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Synchronisation lancée",
        description: "La synchronisation BigBuy a été démarrée avec succès"
      });
      queryClient.invalidateQueries({ queryKey: ['bigbuy-sync-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSync = () => {
    syncMutation.mutate(selectedSyncType);
  };

  const getSyncTypeDescription = (type: string) => {
    switch (type) {
      case 'full':
        return 'Synchronise tout le catalogue BigBuy (peut prendre du temps)';
      case 'incremental':
        return 'Synchronise uniquement les nouveaux produits et mises à jour';
      case 'trending':
        return 'Synchronise uniquement les produits tendance et bestsellers';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            Synchronisation BigBuy
          </CardTitle>
          <CardDescription>
            Synchronisez votre catalogue avec les produits BigBuy en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sync Controls */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold">Type de synchronisation</h3>
              <div className="flex gap-2">
                {(['incremental', 'full', 'trending'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={selectedSyncType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSyncType(type)}
                  >
                    {type === 'incremental' && 'Incrémentale'}
                    {type === 'full' && 'Complète'}
                    {type === 'trending' && 'Tendances'}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {getSyncTypeDescription(selectedSyncType)}
              </p>
            </div>

            <Button
              onClick={handleSync}
              disabled={syncMutation.isPending || lastSyncJob?.status === 'running'}
              className="flex items-center gap-2"
            >
              {syncMutation.isPending || lastSyncJob?.status === 'running' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {syncMutation.isPending ? 'Lancement...' : 'Synchroniser'}
            </Button>
          </div>

          <Separator />

          {/* Last Sync Status */}
          {lastSyncJob && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Dernière synchronisation</h3>
                <Badge className={getStatusColor(lastSyncJob.status)}>
                  {lastSyncJob.status === 'completed' && 'Terminée'}
                  {lastSyncJob.status === 'running' && 'En cours'}
                  {lastSyncJob.status === 'failed' && 'Échouée'}
                  {lastSyncJob.status === 'pending' && 'En attente'}
                </Badge>
              </div>

              {lastSyncJob.status === 'running' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>{lastSyncJob.progress}%</span>
                  </div>
                  <Progress value={lastSyncJob.progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {lastSyncJob.processed_products} / {lastSyncJob.total_products} produits traités
                  </p>
                </div>
              )}

              {lastSyncJob.status === 'completed' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {lastSyncJob.imported_products}
                    </p>
                    <p className="text-sm text-green-700">Importés</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {lastSyncJob.processed_products}
                    </p>
                    <p className="text-sm text-blue-700">Traités</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {lastSyncJob.failed_products}
                    </p>
                    <p className="text-sm text-red-700">Échoués</p>
                  </div>
                </div>
              )}

              {lastSyncJob.error_message && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Erreur:</strong> {lastSyncJob.error_message}
                  </p>
                </div>
              )}

              <div className="text-sm text-muted-foreground space-y-1">
                {lastSyncJob.started_at && (
                  <p>
                    <strong>Démarrée:</strong>{' '}
                    {new Date(lastSyncJob.started_at).toLocaleString('fr-FR')}
                  </p>
                )}
                {lastSyncJob.completed_at && (
                  <p>
                    <strong>Terminée:</strong>{' '}
                    {new Date(lastSyncJob.completed_at).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des synchronisations</CardTitle>
          <CardDescription>
            Consultez l'historique de vos synchronisations BigBuy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock history data */}
            {[
              {
                date: '2024-01-15 14:30',
                type: 'incremental',
                status: 'completed',
                products: 150,
                duration: '5 min'
              },
              {
                date: '2024-01-14 09:15',
                type: 'full',
                status: 'completed',
                products: 1500,
                duration: '45 min'
              },
              {
                date: '2024-01-13 16:20',
                type: 'trending',
                status: 'failed',
                products: 0,
                duration: '2 min'
              }
            ].map((sync, index) => {
              const StatusIcon = getStatusIcon(sync.status);
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${
                      sync.status === 'completed' ? 'text-green-600' :
                      sync.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                    <div>
                      <p className="font-medium">{sync.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {sync.type === 'incremental' && 'Synchronisation incrémentale'}
                        {sync.type === 'full' && 'Synchronisation complète'}
                        {sync.type === 'trending' && 'Synchronisation tendances'}
                      </p>
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
        </CardContent>
      </Card>
    </div>
  );
};