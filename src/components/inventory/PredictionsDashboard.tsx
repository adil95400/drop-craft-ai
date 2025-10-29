import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInventoryPredictor } from '@/hooks/useInventoryPredictor';
import { TrendingUp, TrendingDown, Minus, Calendar, Target } from 'lucide-react';

export function PredictionsDashboard() {
  const { predictions, isLoadingPredictions } = useInventoryPredictor();

  if (isLoadingPredictions) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Prédictions IA
        </h2>
        <p className="text-muted-foreground mt-1">
          Analyse prédictive basée sur l'historique de ventes
        </p>
      </div>

      {(!predictions || predictions.length === 0) ? (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Aucune prédiction disponible. Cliquez sur "Analyser IA" dans l'onglet Stock pour générer des prédictions.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {predictions.map((prediction: any) => (
            <Card key={prediction.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {prediction.inventory_items?.product_name || 'Produit'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Prédiction du {new Date(prediction.prediction_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(prediction.trend_direction)}
                  <Badge variant="outline" className="capitalize">
                    {prediction.trend_direction === 'up' ? 'Hausse' : 
                     prediction.trend_direction === 'down' ? 'Baisse' : 'Stable'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Demande Prévue</p>
                  <p className="text-2xl font-bold">{prediction.predicted_demand}</p>
                  <p className="text-xs text-muted-foreground">30 prochains jours</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jours Avant Rupture</p>
                  <p className={`text-2xl font-bold ${
                    prediction.days_until_stockout <= 7 ? 'text-red-600' : 
                    prediction.days_until_stockout <= 14 ? 'text-orange-600' : ''
                  }`}>
                    {prediction.days_until_stockout}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confiance</p>
                  <p className={`text-2xl font-bold ${getConfidenceColor(prediction.confidence_score)}`}>
                    {(prediction.confidence_score * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Facteur Saisonnier</p>
                  <p className="text-2xl font-bold">
                    {prediction.seasonal_factor?.toFixed(2) || '1.00'}x
                  </p>
                </div>
              </div>

              {prediction.recommended_reorder_date && (
                <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Date de Réapprovisionnement Recommandée</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(prediction.recommended_reorder_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}