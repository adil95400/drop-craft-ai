import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function StockAlerts() {
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select('*, catalog_products(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const checkStockMutation = useMutation({
    mutationFn: async (alertId?: string) => {
      setIsChecking(true);
      const { data, error } = await supabase.functions.invoke('stock-monitor', {
        body: { action: 'check_stock', alertId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Stocks vérifiés',
        description: `${data.checked} produits vérifiés`
      });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      setIsChecking(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
      setIsChecking(false);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'low_stock':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'out_of_stock':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'En stock';
      case 'low_stock':
        return 'Stock faible';
      case 'out_of_stock':
        return 'Rupture de stock';
      default:
        return 'Inconnu';
    }
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" => {
    switch (status) {
      case 'in_stock':
        return 'default';
      case 'low_stock':
        return 'secondary';
      case 'out_of_stock':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alertes de Stock</h2>
          <p className="text-muted-foreground">Surveillance automatique des niveaux de stock</p>
        </div>
        <Button
          onClick={() => checkStockMutation.mutate()}
          disabled={isChecking}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          Vérifier tous les stocks
        </Button>
      </div>

      <div className="grid gap-4">
        {alerts?.map((alert) => (
          <Card key={alert.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(alert.stock_status)}
                    {alert.catalog_products?.name || 'Produit'}
                  </CardTitle>
                  <CardDescription>{alert.supplier_url}</CardDescription>
                </div>
                <Badge variant={getStatusVariant(alert.stock_status)}>
                  {getStatusLabel(alert.stock_status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Stock actuel</div>
                    <div className="text-2xl font-bold">
                      {alert.current_stock || 0} unités
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Seuil d'alerte</div>
                    <div className="text-2xl font-bold">
                      {alert.alert_threshold} unités
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Dernière vérification</div>
                    <div className="text-sm">
                      {alert.last_checked_at
                        ? new Date(alert.last_checked_at).toLocaleString('fr-FR')
                        : 'Jamais'}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => checkStockMutation.mutate(alert.id)}
                  disabled={isChecking}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Vérifier maintenant
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {alerts?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune alerte configurée</p>
              <p className="text-sm text-muted-foreground mt-2">
                Configurez des alertes pour surveiller vos stocks
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
