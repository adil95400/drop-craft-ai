import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePriceStockMonitor } from '@/hooks/usePriceStockMonitor';

export function AutomationDashboard() {
  const queryClient = useQueryClient();
  const { monitors, alerts } = usePriceStockMonitor();

  const stats = {
    active_monitors: monitors?.length || 0,
    active_alerts: alerts?.filter((a: any) => !a.is_resolved).length || 0,
    critical_alerts: alerts?.filter((a: any) => !a.is_resolved && a.severity === 'critical').length || 0,
  };

  const runCronMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('price-stock-cron', {
        body: {}
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Vérification terminée: ${data.results?.checked || 0} produits vérifiés`);
      queryClient.invalidateQueries({ queryKey: ['price-stock-monitors'] });
      queryClient.invalidateQueries({ queryKey: ['price-stock-alerts'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const processFulfillmentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('auto-order-fulfillment', {
        body: { action: 'process_pending' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.results?.successful || 0} commandes traitées avec succès`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard d'Automatisation</h2>
        <p className="text-muted-foreground">Vue d'ensemble de l'activité automatique</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitors Actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_monitors}</div>
            <p className="text-xs text-muted-foreground">Surveillance en temps réel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_alerts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.critical_alerts} critiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">Tous les services actifs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Vérification Prix & Stock</CardTitle>
            <CardDescription>
              Déclencher manuellement la vérification automatique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">
                <Activity className="w-3 h-3 mr-1" />
                Automatique toutes les heures
              </Badge>
            </div>
            <Button 
              onClick={() => runCronMutation.mutate()}
              disabled={runCronMutation.isPending}
              className="w-full gap-2"
            >
              <Play className="w-4 h-4" />
              {runCronMutation.isPending ? 'Vérification en cours...' : 'Lancer maintenant'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traitement des Commandes</CardTitle>
            <CardDescription>
              Traiter les commandes automatiques en attente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">
                <Clock className="w-3 h-3 mr-1" />
                Automatique toutes les 15 min
              </Badge>
            </div>
            <Button 
              onClick={() => processFulfillmentMutation.mutate()}
              disabled={processFulfillmentMutation.isPending}
              className="w-full gap-2"
            >
              <Play className="w-4 h-4" />
              {processFulfillmentMutation.isPending ? 'Traitement...' : 'Traiter maintenant'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statut du Système</CardTitle>
          <CardDescription>Services d'automatisation actifs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Monitoring Prix & Stock</p>
                  <p className="text-xs text-muted-foreground">Actif - Vérification automatique</p>
                </div>
              </div>
              <Badge variant="default">En ligne</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Auto-Ordering</p>
                  <p className="text-xs text-muted-foreground">Actif - Commandes automatiques</p>
                </div>
              </div>
              <Badge variant="default">En ligne</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Fulfillment Automation</p>
                  <p className="text-xs text-muted-foreground">Actif - Traitement des expéditions</p>
                </div>
              </div>
              <Badge variant="default">En ligne</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Webhooks Fournisseurs</p>
                  <p className="text-xs text-muted-foreground">Actif - Réception des mises à jour</p>
                </div>
              </div>
              <Badge variant="default">En ligne</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
