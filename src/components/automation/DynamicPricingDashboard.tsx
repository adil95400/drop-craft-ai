import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { usePendingPricingRecommendations, useApplyPricingRecommendation, useRejectPricingRecommendation, usePricingPerformanceMetrics } from '@/hooks/useDynamicPricing';
import { Skeleton } from '@/components/ui/skeleton';

export function DynamicPricingDashboard() {
  const { data: recommendations, isLoading } = usePendingPricingRecommendations();
  const { data: metrics, isLoading: metricsLoading } = usePricingPerformanceMetrics();
  const applyRecommendation = useApplyPricingRecommendation();
  const rejectRecommendation = useRejectPricingRecommendation();

  const getPriceChangeIcon = (currentPrice: number, suggestedPrice: number) => {
    return suggestedPrice > currentPrice ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getPriceChangeColor = (currentPrice: number, suggestedPrice: number) => {
    return suggestedPrice > currentPrice ? 'text-green-600' : 'text-red-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading || metricsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques de performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recommandations</p>
                <p className="text-2xl font-bold">{metrics?.totalRecommendations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Appliquées</p>
                <p className="text-2xl font-bold">{metrics?.appliedRecommendations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confiance Moyenne</p>
                <p className="text-2xl font-bold">{metrics?.averageConfidence || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Impact Profit</p>
                <p className="text-2xl font-bold">+{metrics?.totalProfitImpact || 0}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommandations en attente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recommandations de Prix en Attente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recommendations || recommendations.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune recommandation en attente</h3>
              <p className="text-muted-foreground">
                L'IA analyse continuellement vos prix pour identifier des opportunités d'optimisation
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getPriceChangeIcon(rec.current_price, rec.suggested_price)}
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        Prix optimisé suggéré
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {rec.price_change_reason}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">
                          <span className="text-muted-foreground">Actuel:</span>
                          <span className="font-semibold ml-1">{rec.current_price}€</span>
                        </span>
                        <span className="text-sm">
                          <span className="text-muted-foreground">Suggéré:</span>
                          <span className={`font-semibold ml-1 ${getPriceChangeColor(rec.current_price, rec.suggested_price)}`}>
                            {rec.suggested_price}€
                          </span>
                        </span>
                        <span className="text-sm">
                          <span className="text-muted-foreground">Variation:</span>
                          <span className={`font-semibold ml-1 ${getPriceChangeColor(rec.current_price, rec.suggested_price)}`}>
                            {((rec.suggested_price - rec.current_price) / rec.current_price * 100).toFixed(1)}%
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={getConfidenceColor(rec.ai_confidence)}
                      >
                        {rec.ai_confidence}% confiance
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        Impact: +{rec.profit_impact.toFixed(2)}€
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectRecommendation.mutate(rec.id)}
                        disabled={rejectRecommendation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => applyRecommendation.mutate(rec.id)}
                        disabled={applyRecommendation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Appliquer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}