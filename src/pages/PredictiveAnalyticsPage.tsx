import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePredictiveAnalytics } from '@/hooks/useMarketplacePhase2';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';
import { useAuthOptimized } from '@/shared';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function PredictiveAnalyticsPage() {
  const { user } = useAuthOptimized()
  const { dashboard, isLoadingDashboard } = usePredictiveAnalytics(user?.id || '');

  return (
    <>
      <Helmet>
        <title>Analytics Prédictive - ShopOpti</title>
        <meta name="description" content="Anticipez vos ventes et optimisez votre stock avec l'IA" />
      </Helmet>

      <ChannablePageWrapper
        title="Analytics Prédictive"
        description="Anticipez vos ventes et optimisez votre stratégie avec l'intelligence artificielle"
        heroImage="analytics"
        badge={{ label: 'Prédictif', icon: TrendingUp }}
      >
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.predictiveAnalytics} />

        {/* Forecast Cards */}
        {dashboard && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Prévisions 30 Jours</CardTitle>
                <CardDescription>Estimation basée sur l'historique et les tendances</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Revenus prévus</span>
                  <span className="text-2xl font-bold">{dashboard.next_30_days_forecast.revenue.toLocaleString()}€</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Commandes prévues</span>
                  <span className="text-2xl font-bold">{dashboard.next_30_days_forecast.orders}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confiance</span>
                  <span className="font-medium">{dashboard.next_30_days_forecast.confidence}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prévisions 90 Jours</CardTitle>
                <CardDescription>Projection à moyen terme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Revenus prévus</span>
                  <span className="text-2xl font-bold">{dashboard.next_90_days_forecast.revenue.toLocaleString()}€</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Commandes prévues</span>
                  <span className="text-2xl font-bold">{dashboard.next_90_days_forecast.orders}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confiance</span>
                  <span className="font-medium">{dashboard.next_90_days_forecast.confidence}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
            <TabsTrigger value="alerts">Alertes Stock</TabsTrigger>
            <TabsTrigger value="trends">Tendances</TabsTrigger>
            <TabsTrigger value="pricing">Prix Optimaux</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recommandations Restockage</CardTitle>
                  <CardDescription>Produits à réapprovisionner</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDashboard ? (
                    <div className="space-y-3 py-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}</div>
                  ) : dashboard?.restock_recommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Aucune recommandation</div>
                  ) : (
                    <div className="space-y-4">
                      {dashboard?.restock_recommendations.slice(0, 5).map((rec) => (
                        <div key={rec.id} className="border-b pb-3 last:border-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">Produit #{rec.product_id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">Stock: {rec.current_stock} | Recommandé: {rec.recommended_restock_quantity}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${rec.urgency === 'critical' ? 'bg-destructive/20 text-destructive' : rec.urgency === 'high' ? 'bg-orange-500/20 text-orange-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{rec.urgency}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommandations Prix</CardTitle>
                  <CardDescription>Optimisations de prix suggérées</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDashboard ? (
                    <div className="space-y-3 py-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}</div>
                  ) : dashboard?.pricing_recommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Aucune recommandation</div>
                  ) : (
                    <div className="space-y-4">
                      {dashboard?.pricing_recommendations.slice(0, 5).map((rec) => (
                        <div key={rec.id} className="border-b pb-3 last:border-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Produit #{rec.product_id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">{rec.marketplace}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className="line-through text-muted-foreground">{rec.current_price}€</span>
                                <DollarSign className="h-3 w-3" />
                                <span className="font-bold text-primary">{rec.recommended_price}€</span>
                              </div>
                              <p className="text-xs text-green-500">+{rec.expected_sales_lift_percent}% ventes</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alertes Rupture de Stock</CardTitle>
                <CardDescription>Produits en risque de rupture</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.stockout_alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Aucune alerte stock</div>
                ) : (
                  <div className="space-y-3">
                    {dashboard?.stockout_alerts.map((alert, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          <div>
                            <p className="font-medium">{alert.product_name}</p>
                            <p className="text-sm text-muted-foreground">Rupture dans {alert.days_until_stockout} jours</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-destructive/20 text-destructive">{alert.urgency}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Produits en Hausse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard?.trending_up.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Aucune tendance</div>
                  ) : (
                    <div className="space-y-3">
                      {dashboard?.trending_up.map((trend, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <p className="font-medium">{trend.product_name}</p>
                          <span className="text-green-500 font-bold">+{trend.growth_rate.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                    Produits en Baisse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard?.trending_down.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Aucune tendance</div>
                  ) : (
                    <div className="space-y-3">
                      {dashboard?.trending_down.map((trend, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <p className="font-medium">{trend.product_name}</p>
                          <span className="text-destructive font-bold">{trend.decline_rate.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Analyse d'Élasticité des Prix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">Analyse d'élasticité à venir</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}