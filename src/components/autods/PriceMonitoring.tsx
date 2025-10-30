import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { usePriceStockMonitor } from '@/hooks/usePriceStockMonitor';

export function PriceMonitoring() {
  const { monitors, monitorsLoading, checkAll, updateMonitor, isChecking } = usePriceStockMonitor();

  if (monitorsLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Surveillance des Prix</h2>
          <p className="text-muted-foreground">Monitoring automatique des prix fournisseurs</p>
        </div>
        <Button
          onClick={() => checkAll()}
          disabled={isChecking}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          Vérifier tous les prix
        </Button>
      </div>

      <div className="grid gap-4">
        {monitors?.map((monitor: any) => {
          const priceChange = monitor.price_change_percentage || 0;
          const isIncrease = priceChange > 0;
          
          return (
            <Card key={monitor.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {monitor.catalog_product?.name || monitor.product?.name || 'Produit'}
                    </CardTitle>
                    <CardDescription>{monitor.catalog_product?.supplier_url || 'URL non disponible'}</CardDescription>
                  </div>
                  <Badge variant={monitor.is_active ? 'default' : 'secondary'}>
                    {monitor.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Prix actuel</div>
                      <div className="text-2xl font-bold">
                        {monitor.current_price?.toFixed(2) || '0.00'}€
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Variation</div>
                      <div className={`text-2xl font-bold flex items-center gap-1 ${
                        isIncrease ? 'text-red-500' : priceChange < 0 ? 'text-green-500' : ''
                      }`}>
                        {isIncrease ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : priceChange < 0 ? (
                          <TrendingDown className="w-5 h-5" />
                        ) : null}
                        {Math.abs(priceChange).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Dernière vérification</div>
                      <div className="text-sm">
                        {monitor.last_checked_at
                          ? new Date(monitor.last_checked_at).toLocaleString('fr-FR')
                          : 'Jamais'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMonitor({ 
                        monitorId: monitor.id, 
                        updates: { is_active: !monitor.is_active } 
                      })}
                      className="gap-2"
                    >
                      {monitor.is_active ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Activer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {monitors?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun monitoring configuré</p>
              <p className="text-sm text-muted-foreground mt-2">
                Configurez des alertes pour surveiller les prix
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
