import React, { useState, useEffect } from 'react';
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
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface StockAlert {
  id: string;
  severity: string;
  alert_type: string;
  product_name: string;
  message: string;
  current_stock: number;
  threshold: number;
  created_at: string;
}

export function StockAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load alerts from products with low stock
  useEffect(() => {
    const loadAlerts = async () => {
      setIsLoading(true);
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select('id, title, stock_quantity')
          .lt('stock_quantity', 10)
          .order('stock_quantity', { ascending: true });

        if (error) throw error;

        // Create mock alerts from low stock products
        const mockAlerts: StockAlert[] = (products || []).map(product => ({
          id: product.id,
          severity: product.stock_quantity === 0 ? 'critical' : product.stock_quantity < 5 ? 'high' : 'medium',
          alert_type: product.stock_quantity === 0 ? 'stockout' : 'low_stock',
          product_name: product.title,
          message: product.stock_quantity === 0 
            ? 'Ce produit est en rupture de stock'
            : `Stock faible: ${product.stock_quantity} unités restantes`,
          current_stock: product.stock_quantity || 0,
          threshold: 10,
          created_at: new Date().toISOString()
        }));

        setAlerts(mockAlerts);
      } catch (error) {
        console.error('Error loading stock alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlerts();
  }, []);

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    toast({
      title: "Alerte résolue",
      description: "L'alerte a été marquée comme résolue",
    });
  };

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

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const mediumAlerts = alerts.filter(a => a.severity === 'medium');
  const lowAlerts = alerts.filter(a => a.severity === 'low');

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
                {alerts.length} alerte{alerts.length !== 1 ? 's' : ''} nécessitant votre attention
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
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
                              Stock actuel: <strong>{alert.current_stock}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Seuil: <strong>{alert.threshold}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Voir Produit
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
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