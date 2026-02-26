import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useStockIntelligence } from '@/hooks/useStockIntelligence';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function StockPredictionsDashboard() {
  const { predictions, isLoadingPredictions, generatePredictions, isGeneratingPredictions } = useStockIntelligence();

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[urgency as keyof typeof colors] || 'bg-muted';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'decreasing') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (isLoadingPredictions) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  const criticalCount = predictions.filter(p => p.reorder_urgency === 'critical').length;
  const highCount = predictions.filter(p => p.reorder_urgency === 'high').length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Prédictions de Stock</h2>
          <p className="text-muted-foreground">Analysez les ruptures de stock potentielles</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={() => generatePredictions()} disabled={isGeneratingPredictions}>
            {isGeneratingPredictions ? 'Analyse...' : 'Générer Prédictions IA'}
          </Button>
          {criticalCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {criticalCount} critique{criticalCount > 1 && 's'}
            </Badge>
          )}
          {highCount > 0 && (
            <Badge className="bg-orange-500 hover:bg-orange-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {highCount} urgent{highCount > 1 && 's'}
            </Badge>
          )}
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune prédiction disponible</p>
          <p className="text-sm text-muted-foreground">
            Les prédictions seront générées automatiquement
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Stock actuel</TableHead>
                <TableHead>Ventes/jour</TableHead>
                <TableHead>Tendance</TableHead>
                <TableHead>Rupture estimée</TableHead>
                <TableHead>Urgence</TableHead>
                <TableHead>Confiance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictions.map((prediction) => (
                <TableRow key={prediction.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{(prediction as any).product_name || prediction.product_id}</span>
                      {prediction.store_id && (
                        <span className="text-xs text-muted-foreground">Store: {prediction.store_id}</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-semibold">{prediction.current_stock}</span> unités
                  </TableCell>

                  <TableCell>
                    {prediction.daily_sale_velocity.toFixed(1)} unités
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(prediction.trend_direction)}
                      <span className="text-sm capitalize">
                        {prediction.trend_direction}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {prediction.predicted_days_until_stockout !== null ? (
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {prediction.predicted_days_until_stockout} jours
                        </span>
                        {prediction.predicted_stockout_date && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(prediction.predicted_stockout_date),
                              { addSuffix: true, locale: getDateFnsLocale() }
                            )}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={`${getUrgencyColor(prediction.reorder_urgency)} text-white capitalize`}
                    >
                      {prediction.reorder_urgency}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <Progress
                        value={prediction.confidence_score}
                        className="h-2 w-16"
                      />
                      <span className="text-xs text-muted-foreground">
                        {prediction.confidence_score}%
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        title="Créer commande de réassort"
                      >
                        Commander {prediction.reorder_quantity}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
