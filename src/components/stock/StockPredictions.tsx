import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, AlertTriangle, Brain, Calendar, Package, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface ProductPrediction {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  predictedDemand: number;
  daysUntilStockout: number | null;
  recommendedReorder: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  seasonalFactor: number;
}

export function StockPredictions() {
  const [timeframe, setTimeframe] = useState('30');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const predictions: ProductPrediction[] = [
    {
      id: '1',
      name: 'T-Shirt Premium Coton Bio',
      sku: 'TSH-BIO-001',
      currentStock: 45,
      predictedDemand: 120,
      daysUntilStockout: 12,
      recommendedReorder: 150,
      confidence: 92,
      trend: 'up',
      seasonalFactor: 1.3
    },
    {
      id: '2',
      name: 'Sneakers Urban Limited',
      sku: 'SNK-URB-042',
      currentStock: 8,
      predictedDemand: 35,
      daysUntilStockout: 5,
      recommendedReorder: 50,
      confidence: 88,
      trend: 'up',
      seasonalFactor: 1.1
    },
    {
      id: '3',
      name: 'Casquette Vintage',
      sku: 'CAP-VNT-015',
      currentStock: 200,
      predictedDemand: 45,
      daysUntilStockout: null,
      recommendedReorder: 0,
      confidence: 85,
      trend: 'down',
      seasonalFactor: 0.8
    },
    {
      id: '4',
      name: 'Sac à dos Weekender',
      sku: 'BAG-WKD-008',
      currentStock: 25,
      predictedDemand: 60,
      daysUntilStockout: 15,
      recommendedReorder: 80,
      confidence: 90,
      trend: 'stable',
      seasonalFactor: 1.0
    }
  ];

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      toast.success('Prédictions mises à jour');
    } catch {
      toast.error('Erreur d\'analyse');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStockoutBadge = (days: number | null) => {
    if (days === null) {
      return <Badge variant="outline" className="text-green-600 border-green-600">Stock suffisant</Badge>;
    }
    if (days <= 7) {
      return <Badge variant="destructive">Rupture dans {days}j</Badge>;
    }
    if (days <= 14) {
      return <Badge className="bg-orange-500">Rupture dans {days}j</Badge>;
    }
    return <Badge variant="secondary">Rupture dans {days}j</Badge>;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <span className="text-muted-foreground">→</span>;
    }
  };

  const criticalProducts = predictions.filter(p => p.daysUntilStockout !== null && p.daysUntilStockout <= 7);
  const totalReorderValue = predictions.reduce((sum, p) => sum + p.recommendedReorder, 0);

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="14">14 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={runAnalysis} disabled={isAnalyzing}>
          <Brain className="h-4 w-4 mr-2" />
          {isAnalyzing ? 'Analyse...' : 'Lancer l\'analyse IA'}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{criticalProducts.length}</div>
                <div className="text-xs text-muted-foreground">Produits critiques</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalReorderValue}</div>
                <div className="text-xs text-muted-foreground">Unités à commander</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Brain className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">89%</div>
                <div className="text-xs text-muted-foreground">Précision moyenne</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{timeframe}j</div>
                <div className="text-xs text-muted-foreground">Horizon de prévision</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes critiques */}
      {criticalProducts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes de rupture imminente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Stock actuel: {product.currentStock} • Rupture dans {product.daysUntilStockout} jours
                    </div>
                  </div>
                  <Button size="sm">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Commander {product.recommendedReorder} unités
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des prédictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Prédictions de demande
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.map(prediction => (
              <div key={prediction.id} className="border rounded-lg p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{prediction.name}</span>
                      {getTrendIcon(prediction.trend)}
                    </div>
                    <div className="text-sm text-muted-foreground">{prediction.sku}</div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Stock actuel</div>
                      <div className="font-semibold">{prediction.currentStock}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Demande prévue</div>
                      <div className="font-semibold">{prediction.predictedDemand}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">À commander</div>
                      <div className="font-semibold text-primary">{prediction.recommendedReorder}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Confiance IA</div>
                      <div className="flex items-center gap-2">
                        <Progress value={prediction.confidence} className="w-16 h-2" />
                        <span className="text-sm">{prediction.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStockoutBadge(prediction.daysUntilStockout)}
                    {prediction.seasonalFactor !== 1 && (
                      <Badge variant="outline">
                        Saisonnier: {prediction.seasonalFactor > 1 ? '+' : ''}{Math.round((prediction.seasonalFactor - 1) * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
