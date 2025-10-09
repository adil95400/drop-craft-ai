import { useState, useEffect } from 'react';
import { logError } from '@/utils/consoleCleanup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Target,
  Brain,
  Zap,
  DollarSign,
  Users,
  Package,
  Activity,
  RefreshCw,
  Lightbulb,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PredictionData {
  revenue_forecast: {
    next_month: number;
    next_quarter: number;
    next_year: number;
    confidence_intervals: {
      low: number;
      high: number;
    };
    key_drivers: string[];
  };
  market_predictions: {
    market_size_growth: number;
    competitive_intensity: string;
    technology_disruption: string;
    regulatory_impact: string;
  };
  customer_predictions: {
    churn_probability: {
      high_risk: number;
      medium_risk: number;
      low_risk: number;
    };
    lifetime_value_forecast: number;
    acquisition_cost_trend: string;
  };
  product_predictions: {
    demand_forecast: Array<{
      product: string;
      growth_potential: string;
      demand_increase: number;
    }>;
    innovation_opportunities: string[];
  };
}

interface RiskAnalysis {
  business_risks: Array<{
    risk: string;
    probability: number;
    impact: string;
  }>;
  mitigation_strategies: string[];
}

export function PredictiveInsights() {
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(0);

  useEffect(() => {
    loadPredictiveInsights();
  }, []);

  const loadPredictiveInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('advanced-analytics', {
        body: {
          action: 'generate_predictive_insights',
          forecastPeriod: '12_months',
          dataPoints: ['revenue', 'customers', 'products', 'market']
        }
      });

      if (error) throw error;
      
      setPredictions(data.predictions);
      setRiskAnalysis(data.risk_analysis);
      setConfidenceScore(data.model_accuracy * 100);
      
    } catch (error) {
      logError(error, 'PredictiveInsights.loadPredictiveInsights');
      toast.error('Erreur lors du chargement des prédictions');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRiskColor = (probability: number) => {
    if (probability > 0.7) return 'text-red-600 bg-red-100';
    if (probability > 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getGrowthIcon = (potential: string) => {
    switch (potential) {
      case 'high': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'medium': return <Activity className="h-4 w-4 text-yellow-600" />;
      case 'low': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with confidence score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Insights Prédictifs IA
              </CardTitle>
              <CardDescription>
                Prédictions basées sur l'analyse avancée de vos données
              </CardDescription>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{confidenceScore.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Fiabilité</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">Fiabilité du modèle:</span>
            <Progress value={confidenceScore} className="flex-1" />
          </div>
          <p className="text-xs text-muted-foreground">
            Basé sur l'analyse de {'>10,000'} points de données historiques
          </p>
        </CardContent>
      </Card>

      {/* Revenue Predictions */}
      {predictions?.revenue_forecast && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Prédictions de Revenus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(predictions.revenue_forecast.next_month)}
                  </div>
                  <div className="text-sm text-muted-foreground">Mois prochain</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(predictions.revenue_forecast.next_quarter)}
                  </div>
                  <div className="text-sm text-muted-foreground">Trimestre prochain</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(predictions.revenue_forecast.next_year)}
                  </div>
                  <div className="text-sm text-muted-foreground">Année prochaine</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Facteurs Clés de Croissance</h4>
                <div className="flex flex-wrap gap-2">
                  {predictions.revenue_forecast.key_drivers.map((driver, index) => (
                    <Badge key={index} variant="outline">
                      {driver.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Predictions */}
          {predictions.customer_predictions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Prédictions Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Risque de Désabonnement</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Risque élevé</span>
                        <Badge className="text-red-600 bg-red-100">
                          {predictions.customer_predictions.churn_probability.high_risk} clients
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Risque moyen</span>
                        <Badge className="text-yellow-600 bg-yellow-100">
                          {predictions.customer_predictions.churn_probability.medium_risk} clients
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Risque faible</span>
                        <Badge className="text-green-600 bg-green-100">
                          {predictions.customer_predictions.churn_probability.low_risk} clients
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-4">Valeur Vie Client</h4>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {formatCurrency(predictions.customer_predictions.lifetime_value_forecast)}
                      </div>
                      <div className="text-sm text-muted-foreground">Prédiction LTV</div>
                      <Badge className="mt-2" variant="outline">
                        Coût d'acquisition: {predictions.customer_predictions.acquisition_cost_trend}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Demand Forecast */}
          {predictions.product_predictions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Prédictions Produits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-medium">Prévisions de Demande</h4>
                  {predictions.product_predictions.demand_forecast.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getGrowthIcon(product.growth_potential)}
                        <div>
                          <div className="font-medium">{product.product}</div>
                          <div className="text-sm text-muted-foreground">
                            Potentiel: {product.growth_potential}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        +{product.demand_increase}%
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Opportunités d'Innovation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {predictions.product_predictions.innovation_opportunities.map((opportunity, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <span className="text-sm">{opportunity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market Predictions */}
          {predictions.market_predictions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Prédictions Marché
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      +{predictions.market_predictions.market_size_growth}%
                    </div>
                    <div className="text-sm text-muted-foreground">Croissance marché</div>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      {predictions.market_predictions.competitive_intensity}
                    </Badge>
                    <div className="text-sm text-muted-foreground">Intensité concurrentielle</div>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      {predictions.market_predictions.technology_disruption}
                    </Badge>
                    <div className="text-sm text-muted-foreground">Disruption tech</div>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      {predictions.market_predictions.regulatory_impact}
                    </Badge>
                    <div className="text-sm text-muted-foreground">Impact réglementaire</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Analysis */}
          {riskAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Analyse des Risques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Risques Identifiés</h4>
                    <div className="space-y-3">
                      {riskAnalysis.business_risks.map((risk, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{risk.risk}</div>
                            <div className="text-sm text-muted-foreground">
                              Impact: {risk.impact}
                            </div>
                          </div>
                          <Badge className={getRiskColor(risk.probability)}>
                            {(risk.probability * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-4">Stratégies d'Atténuation</h4>
                    <div className="space-y-2">
                      {riskAnalysis.mitigation_strategies.map((strategy, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                          <Star className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{strategy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-medium">Prédictions mises à jour automatiquement</span>
            </div>
            <Button onClick={loadPredictiveInsights} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser les prédictions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}