import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ErrorRetryDashboard() {
  const [period, setPeriod] = useState('24h');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['error-summary', period],
    queryFn: async () => {
      const response = await supabase.functions.invoke('automation-security-engine', {
        body: { action: 'get_error_summary', period },
      });
      if (response.error) throw response.error;
      return response.data;
    },
  });

  const retryMutation = useMutation({
    mutationFn: async ({ entity_type, entity_id }: { entity_type: string; entity_id: string }) => {
      const response = await supabase.functions.invoke('automation-security-engine', {
        body: { action: 'retry_failed', entity_type, entity_id },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({ title: 'Retry lancé', description: 'L\'opération sera retentée sous peu' });
      queryClient.invalidateQueries({ queryKey: ['error-summary'] });
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Erreurs & Mécanisme de Retry
        </h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 heures</SelectItem>
            <SelectItem value="7d">7 jours</SelectItem>
            <SelectItem value="30d">30 jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total erreurs', value: summary?.total_errors, icon: AlertTriangle, color: 'text-red-500' },
          { label: 'Commandes échouées', value: summary?.order_errors, icon: XCircle, color: 'text-orange-500' },
          { label: 'Syncs échouées', value: summary?.sync_errors, icon: RefreshCw, color: 'text-yellow-500' },
          { label: 'Événements critiques', value: summary?.critical_events, icon: AlertTriangle, color: 'text-red-600' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <div>
                  <p className="text-2xl font-bold">{isLoading ? '...' : item.value ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Failed Orders with Retry */}
      {data?.failed_orders?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commandes Échouées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.failed_orders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Commande {order.order_id?.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground truncate">{order.error_message || 'Erreur inconnue'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Retry {order.retry_count}/{order.max_retries}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(order.updated_at), 'dd MMM HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={retryMutation.isPending || order.retry_count >= order.max_retries}
                  onClick={() => retryMutation.mutate({ entity_type: 'auto_order', entity_id: order.id })}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Failed Syncs with Retry */}
      {data?.failed_syncs?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Synchronisations Échouées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.failed_syncs.map((sync: any) => (
              <div key={sync.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Sync {sync.sync_type}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {typeof sync.error_details === 'string' ? sync.error_details : JSON.stringify(sync.error_details)?.slice(0, 80)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={retryMutation.isPending}
                  onClick={() => retryMutation.mutate({ entity_type: 'supplier_sync', entity_id: sync.id })}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Critical Events */}
      {data?.critical_events?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Événements Critiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.critical_events.map((evt: any) => (
              <div key={evt.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-900/30">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500/10 text-red-500 text-xs">{evt.severity}</Badge>
                    <p className="text-sm font-medium">{evt.action}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{evt.description}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(evt.created_at), 'dd MMM HH:mm', { locale: fr })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!isLoading && (summary?.total_errors ?? 0) === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-lg font-medium">Aucune erreur détectée</p>
            <p className="text-sm text-muted-foreground">
              Tous les systèmes fonctionnent normalement sur la période sélectionnée
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
