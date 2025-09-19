import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  ShoppingCart, 
  Heart, 
  Star,
  Users,
  DollarSign,
  Package,
  BarChart3,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface ProductPerformanceAnalyticsProps {
  productId: string
}

export function ProductPerformanceAnalytics({ productId }: ProductPerformanceAnalyticsProps) {
  // Simulation de données analytiques
  const analytics = {
    sales: {
      total: 1247,
      thisMonth: 89,
      trend: 12.5,
      revenue: 32456.78
    },
    views: {
      total: 15634,
      thisMonth: 2340,
      trend: -8.2,
      conversionRate: 5.7
    },
    inventory: {
      current: 48,
      reserved: 12,
      available: 36,
      turnoverRate: 8.3
    },
    customer: {
      rating: 4.2,
      reviews: 156,
      satisfaction: 87,
      repeatPurchase: 34
    }
  }

  const recommendations = [
    {
      type: 'warning',
      title: 'Stock faible détecté',
      description: 'Le stock actuel est inférieur au seuil recommandé',
      action: 'Réapprovisionner maintenant',
      priority: 'high'
    },
    {
      type: 'success',
      title: 'Performance prix optimale',
      description: 'Le prix actuel maximise les conversions et la marge',
      action: 'Maintenir le prix',
      priority: 'low'
    },
    {
      type: 'info',
      title: 'Opportunité de cross-selling',
      description: 'Ce produit se vend souvent avec "Accessoire Premium"',
      action: 'Créer un bundle',
      priority: 'medium'
    }
  ]

  const competitorAnalysis = [
    { name: 'Concurrent A', price: 45.99, rating: 3.9, availability: 'En stock' },
    { name: 'Concurrent B', price: 52.50, rating: 4.1, availability: 'Stock limité' },
    { name: 'Concurrent C', price: 38.75, rating: 3.7, availability: 'Rupture' }
  ]

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle
      case 'success': return CheckCircle
      default: return BarChart3
    }
  }

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-warning'
      case 'success': return 'text-success'
      default: return 'text-info'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Analyse de performance</h3>
        <p className="text-sm text-muted-foreground">
          Données détaillées et recommandations pour optimiser votre produit
        </p>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingCart className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold">{analytics.sales.total}</div>
            <div className="text-sm text-muted-foreground">Ventes totales</div>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="h-3 w-3 text-success mr-1" />
              <span className="text-xs text-success">+{analytics.sales.trend}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-8 w-8 text-info mx-auto mb-2" />
            <div className="text-2xl font-bold">{analytics.views.total.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Vues produit</div>
            <div className="flex items-center justify-center mt-1">
              <TrendingDown className="h-3 w-3 text-destructive mr-1" />
              <span className="text-xs text-destructive">{analytics.views.trend}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold">{analytics.customer.rating}</div>
            <div className="text-sm text-muted-foreground">Note moyenne</div>
            <div className="text-xs text-muted-foreground mt-1">
              {analytics.customer.reviews} avis
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{analytics.sales.revenue.toLocaleString()}€</div>
            <div className="text-sm text-muted-foreground">Chiffre d'affaires</div>
            <div className="text-xs text-muted-foreground mt-1">
              Ce mois: {analytics.sales.thisMonth} ventes
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="inventory">Inventaire</TabsTrigger>
          <TabsTrigger value="competition">Concurrence</TabsTrigger>
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion et engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Taux de conversion</span>
                    <span className="text-sm font-medium">{analytics.views.conversionRate}%</span>
                  </div>
                  <Progress value={analytics.views.conversionRate * 10} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Au-dessus de la moyenne de la catégorie (4.2%)
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Satisfaction client</span>
                    <span className="text-sm font-medium">{analytics.customer.satisfaction}%</span>
                  </div>
                  <Progress value={analytics.customer.satisfaction} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Fidélisation</span>
                    <span className="text-sm font-medium">{analytics.customer.repeatPurchase}%</span>
                  </div>
                  <Progress value={analytics.customer.repeatPurchase} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Clients avec achat répété
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendances récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Ventes en hausse</span>
                    </div>
                    <Badge variant="outline" className="text-success">+12.5%</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">Vues en baisse</span>
                    </div>
                    <Badge variant="outline" className="text-destructive">-8.2%</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-info/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-info" />
                      <span className="text-sm font-medium">Nouvelle évaluation</span>
                    </div>
                    <Badge variant="outline" className="text-info">5★</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Gestion des stocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{analytics.inventory.current}</div>
                  <div className="text-sm text-muted-foreground">Stock total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">{analytics.inventory.reserved}</div>
                  <div className="text-sm text-muted-foreground">Réservé</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{analytics.inventory.available}</div>
                  <div className="text-sm text-muted-foreground">Disponible</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Rotation des stocks</span>
                    <span className="text-sm font-medium">{analytics.inventory.turnoverRate} fois/an</span>
                  </div>
                  <Progress value={analytics.inventory.turnoverRate * 10} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Excellent taux de rotation
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Seuil d'alerte</div>
                    <div className="text-lg font-bold">10 unités</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Prochaine commande</div>
                    <div className="text-lg font-bold">Dans 5 jours</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse concurrentielle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitorAnalysis.map((competitor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{competitor.name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-current" />
                        {competitor.rating}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{competitor.price}€</div>
                      <Badge variant={competitor.availability === 'En stock' ? 'outline' : 'secondary'}>
                        {competitor.availability}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {recommendations.map((rec, index) => {
              const IconComponent = getRecommendationIcon(rec.type)
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <IconComponent className={`h-5 w-5 mt-0.5 ${getRecommendationColor(rec.type)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                            {rec.priority === 'high' ? 'Urgent' : rec.priority === 'medium' ? 'Moyen' : 'Faible'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <div className="text-sm font-medium text-primary">{rec.action}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}