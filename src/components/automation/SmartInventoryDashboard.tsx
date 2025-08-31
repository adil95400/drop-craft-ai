import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Zap,
  ShoppingCart,
  Clock,
  Target
} from 'lucide-react';
import { useHighRiskItems, useReorderRecommendations, useInventoryMetrics, usePredictiveInsights } from '@/hooks/useSmartInventory';
import { Skeleton } from '@/components/ui/skeleton';

export function SmartInventoryDashboard() {
  const { data: highRiskItems, isLoading: highRiskLoading } = useHighRiskItems();
  const { data: reorderRecs, isLoading: reorderLoading } = useReorderRecommendations();
  const { data: metrics, isLoading: metricsLoading } = useInventoryMetrics();
  const { data: insights, isLoading: insightsLoading } = usePredictiveInsights();

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'Critique';
      case 'high': return 'Élevé';
      case 'medium': return 'Moyen';
      case 'low': return 'Faible';
      default: return riskLevel;
    }
  };

  if (highRiskLoading || reorderLoading || metricsLoading || insightsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques d'inventaire */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produits Suivis</p>
                <p className="text-2xl font-bold">{metrics?.totalProducts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risque Critique</p>
                <p className="text-2xl font-bold text-red-600">{metrics?.criticalRisk || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auto-Réappro</p>
                <p className="text-2xl font-bold">{metrics?.autoReorderEnabled || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Moyen</p>
                <p className="text-2xl font-bold">{metrics?.averageStockLevel || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes et actions urgentes */}
      {highRiskItems && highRiskItems.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Actions Urgentes Requises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highRiskItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium">Produit #{item.product_id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {item.current_stock} (Seuil: {item.minimum_threshold})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getRiskColor(item.stock_risk_level)}>
                      {getRiskLabel(item.stock_risk_level)}
                    </Badge>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Réapprovisionner
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommandations de réapprovisionnement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recommandations de Réapprovisionnement IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!reorderRecs || reorderRecs.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tous les stocks sont optimaux</h3>
              <p className="text-muted-foreground">
                L'IA surveille continuellement vos niveaux de stock
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reorderRecs.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Package className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        Produit #{rec.product_id.slice(0, 8)}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Stock actuel: {rec.current_stock} | Point de réappro: {rec.reorder_point}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">
                          <span className="text-muted-foreground">Quantité suggérée:</span>
                          <span className="font-semibold ml-1">{rec.reorder_quantity}</span>
                        </span>
                        <Progress 
                          value={(rec.current_stock / rec.optimal_stock) * 100} 
                          className="w-32"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge className={getRiskColor(rec.stock_risk_level)}>
                      {getRiskLabel(rec.stock_risk_level)}
                    </Badge>
                    <Button size="sm">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Commander
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights prédictifs */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Insights Prédictifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">Prochains 7 jours</h4>
                <p className="text-2xl font-bold text-blue-600">{insights.next7Days}</p>
                <p className="text-sm text-blue-600">réapprovisionnements</p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-700 mb-2">Actions Critiques</h4>
                <p className="text-2xl font-bold text-orange-600">{insights.criticalActions}</p>
                <p className="text-sm text-orange-600">requises</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-700 mb-2">Total Prévu</h4>
                <p className="text-2xl font-bold text-green-600">{insights.upcomingReorders}</p>
                <p className="text-sm text-green-600">réapprovisionnements</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h5 className="font-medium mb-2">Recommandations IA :</h5>
              <ul className="space-y-1">
                {insights.recommendations?.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}