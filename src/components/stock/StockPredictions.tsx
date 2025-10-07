import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StockPredictionsProps {
  productId: string;
  warehouseId: string;
  currentStock: number;
}

export function StockPredictions({ productId, warehouseId, currentStock }: StockPredictionsProps) {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generatePrediction = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stock-prediction', {
        body: { product_id: productId, warehouse_id: warehouseId, prediction_days: 30 }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      setPrediction(data.prediction);
      toast({
        title: "Prédiction générée",
        description: "Les prédictions ML ont été générées avec succès",
      });
    } catch (error: any) {
      console.error('Prediction error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer les prédictions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, any> = {
      low: { variant: 'default', className: 'bg-green-500' },
      medium: { variant: 'secondary', className: 'bg-yellow-500' },
      high: { variant: 'destructive', className: '' }
    };
    return variants[risk] || variants.low;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Prédictions ML de Stock
              </CardTitle>
              <CardDescription>
                Prédictions basées sur l'IA pour les 30 prochains jours
              </CardDescription>
            </div>
            <Button 
              onClick={generatePrediction} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Générer Prédictions
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {prediction && (
          <CardContent className="space-y-6">
            {/* Risk Level & Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Niveau de Risque</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge {...getRiskBadge(prediction.risk_level)}>
                    {prediction.risk_level?.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Point de Réapprovisionnement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{prediction.reorder_point} unités</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quantité Optimale</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{prediction.optimal_quantity} unités</p>
                </CardContent>
              </Card>
            </div>

            {/* Predictions Chart */}
            {prediction.predictions && prediction.predictions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Prévisions de Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={prediction.predictions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
                        formatter={(value: any) => [`${value} unités`, 'Stock prévu']}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="predicted_quantity" 
                        stroke="#8884d8" 
                        fill="#8884d8"
                        fillOpacity={0.3}
                        name="Quantité prévue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="confidence" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="Confiance"
                        yAxisId={1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Insights */}
            {prediction.insights && prediction.insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    Insights IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {prediction.insights.map((insight: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {prediction.recommendations && prediction.recommendations.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommandations:</strong>
                  <ul className="mt-2 space-y-1">
                    {prediction.recommendations.map((rec: string, index: number) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Prediction Details */}
            <Card>
              <CardHeader>
                <CardTitle>Détails des Prédictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prediction.predictions?.slice(0, 7).map((pred: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(pred.trend)}
                        <span className="font-medium">
                          {new Date(pred.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">
                          {pred.predicted_quantity} unités
                        </span>
                        <Badge variant="outline">
                          {Math.round(pred.confidence * 100)}% confiance
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
