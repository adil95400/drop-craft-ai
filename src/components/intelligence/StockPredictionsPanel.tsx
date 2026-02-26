import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useStockPredictions, 
  useAnalyzeStock,
  StockPrediction 
} from '@/hooks/useDropshippingIntelligence';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  Package,
  RefreshCw,
  Calendar,
  ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function StockPredictionsPanel() {
  const { data: predictions, isLoading } = useStockPredictions();
  const analyzeStock = useAnalyzeStock();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getUrgencyColor = (days: number | null) => {
    if (days === null) return 'bg-muted';
    if (days <= 3) return 'bg-red-500';
    if (days <= 7) return 'bg-orange-500';
    if (days <= 14) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUrgencyBadge = (days: number | null) => {
    if (days === null) return <Badge variant="outline">Stock OK</Badge>;
    if (days <= 3) return <Badge variant="destructive">Critique</Badge>;
    if (days <= 7) return <Badge className="bg-orange-500">Urgent</Badge>;
    if (days <= 14) return <Badge className="bg-yellow-500 text-black">À surveiller</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const criticalProducts = predictions?.filter(p => p.days_until_stockout !== null && p.days_until_stockout <= 7) || [];
  const normalProducts = predictions?.filter(p => p.days_until_stockout === null || p.days_until_stockout > 7) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Prédictions de Stock
          </CardTitle>
          <CardDescription>
            Analyse prédictive des ruptures de stock basée sur l'historique des ventes
          </CardDescription>
        </div>
        <Button 
          onClick={() => analyzeStock.mutate(undefined)}
          disabled={analyzeStock.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${analyzeStock.isPending ? 'animate-spin' : ''}`} />
          Analyser
        </Button>
      </CardHeader>
      <CardContent>
        {predictions?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune prédiction disponible</p>
            <p className="text-sm">Cliquez sur "Analyser" pour générer des prédictions</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Produits critiques */}
            {criticalProducts.length > 0 && (
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Attention requise ({criticalProducts.length})
                </h3>
                <div className="space-y-3">
                  {criticalProducts.map(prediction => (
                    <PredictionCard key={prediction.id} prediction={prediction} />
                  ))}
                </div>
              </div>
            )}

            {/* Autres produits */}
            {normalProducts.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-muted-foreground">
                  Autres produits ({normalProducts.length})
                </h3>
                <div className="space-y-3">
                  {normalProducts.slice(0, 5).map(prediction => (
                    <PredictionCard key={prediction.id} prediction={prediction} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PredictionCard({ prediction }: { prediction: StockPrediction }) {
  const daysLeft = prediction.days_until_stockout;
  const stockPercentage = daysLeft !== null 
    ? Math.min(100, Math.max(0, (daysLeft / 30) * 100))
    : 100;

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium">{prediction.products?.title || 'Produit inconnu'}</h4>
          <p className="text-sm text-muted-foreground">SKU: {prediction.products?.sku || '-'}</p>
        </div>
        {daysLeft !== null && daysLeft <= 7 ? (
          <Badge variant="destructive">
            {daysLeft <= 0 ? 'Rupture!' : `${daysLeft}j restants`}
          </Badge>
        ) : (
          <Badge variant="secondary">
            {daysLeft ? `${daysLeft}j` : 'Stock OK'}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Stock actuel</p>
          <p className="font-semibold">{prediction.current_stock} unités</p>
        </div>
        <div>
          <p className="text-muted-foreground">Ventes/jour</p>
          <p className="font-semibold flex items-center gap-1">
            {prediction.average_daily_sales.toFixed(1)}
            {prediction.sales_trend === 'increasing' && <TrendingUp className="h-3 w-3 text-green-500" />}
            {prediction.sales_trend === 'decreasing' && <TrendingDown className="h-3 w-3 text-red-500" />}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Réappro. suggéré</p>
          <p className="font-semibold">{prediction.recommended_reorder_qty} unités</p>
        </div>
        <div>
          <p className="text-muted-foreground">Commander avant</p>
          <p className="font-semibold">
            {prediction.recommended_reorder_date 
              ? format(new Date(prediction.recommended_reorder_date), 'dd MMM', { locale: getDateFnsLocale() })
              : '-'}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Niveau de stock</span>
          <span>Confiance: {prediction.confidence_score}%</span>
        </div>
        <Progress 
          value={stockPercentage} 
          className={`h-2 ${daysLeft !== null && daysLeft <= 7 ? '[&>div]:bg-red-500' : ''}`}
        />
      </div>
    </div>
  );
}
