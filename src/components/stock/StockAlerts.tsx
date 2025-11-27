import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingDown,
  Bell,
  BellOff,
  RefreshCw,
  Package,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function StockAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select('*')
        .eq('alert_status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    }
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('stock_alerts')
        .update({ 
          alert_status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      toast({
        title: "Alerte résolue",
        description: "L'alerte a été marquée comme résolue",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50 dark:bg-red-950/20';
      case 'high': return 'text-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      default: return 'text-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high': return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case 'medium': return <Clock className="h-5 w-5 text-yellow-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'low_stock': 'Stock Faible',
      'stockout': 'Rupture de Stock',
      'overstock': 'Surstock',
      'expiring_soon': 'Expiration Proche',
      'reorder_needed': 'Réapprovisionnement Nécessaire'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const criticalAlerts = alerts?.filter(a => a.severity === 'critical') || [];
  const highAlerts = alerts?.filter(a => a.severity === 'high') || [];
  const mediumAlerts = alerts?.filter(a => a.severity === 'medium') || [];
  const lowAlerts = alerts?.filter(a => a.severity === 'low') || [];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{criticalAlerts.length}</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              Élevées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-500">{highAlerts.length}</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Moyennes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-500">{mediumAlerts.length}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" />
              Faibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">{lowAlerts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alertes Actives</CardTitle>
              <CardDescription>
                {alerts?.length || 0} alerte{alerts?.length !== 1 ? 's' : ''} nécessitant votre attention
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">
                              {getAlertTypeLabel(alert.alert_type)}
                            </Badge>
                            <Badge variant={
                              alert.severity === 'critical' ? 'destructive' :
                              alert.severity === 'high' ? 'default' :
                              'secondary'
                            }>
                              {alert.severity}
                            </Badge>
                          </div>
                          
                          <div className="mb-2">
                            <p className="font-medium">{alert.product_name}</p>
                          </div>

                          <p className="text-sm mb-2">{alert.message}</p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Stock actuel: <strong>{alert.current_stock || 0}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Seuil: <strong>{alert.threshold || 0}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(alert.created_at), { 
                                addSuffix: true,
                                locale: fr 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Navigate to product details
                          }}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Voir Produit
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => resolveAlertMutation.mutate(alert.id)}
                          disabled={resolveAlertMutation.isPending}
                        >
                          {resolveAlertMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Marquer Résolue
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Aucune alerte active</p>
              <p className="text-sm text-muted-foreground">
                Tous les niveaux de stock sont normaux
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
