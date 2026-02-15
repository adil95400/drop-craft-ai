import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CheckCircle, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function AutoOrders() {
  const { data: monitors, isLoading } = useQuery({
    queryKey: ['auto-orders-monitors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('stock_quantity', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Commandes Automatiques</h2>
          <p className="text-muted-foreground">Système d'auto-ordering configuré</p>
        </div>
      </div>

      <div className="grid gap-4">
        {monitors?.map((monitor: any) => (
          <Card key={monitor.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    {monitor.catalog_product?.name || 'Produit'}
                  </CardTitle>
                  <CardDescription>
                    Réapprovisionnement automatique configuré
                  </CardDescription>
                </div>
                <Badge variant="default">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Actif
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Seuil de stock</div>
                    <div className="text-2xl font-bold">
                      {monitor.stock_alert_threshold || 10} unités
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Prix max</div>
                    <div className="text-2xl font-bold">
                      {monitor.price_adjustment_rules?.max_price || 'N/A'}€
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Fréquence</div>
                    <div className="text-2xl font-bold">
                      {monitor.check_frequency_minutes || 60} min
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Configuration du réapprovisionnement</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Le système surveille automatiquement le stock et passe des commandes 
                        lorsque le seuil est atteint, en respectant le prix maximum configuré.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {monitors?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune commande automatique configurée</p>
              <p className="text-sm text-muted-foreground mt-2">
                Configurez le monitoring pour activer l'auto-ordering
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
