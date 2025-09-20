/**
 * PHASE 4: Business Intelligence
 * Dashboard BI avec insights IA et analytics prédictifs
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, Brain, Target, Eye,
  DollarSign, Users, ShoppingCart, AlertTriangle,
  Lightbulb, Zap, BarChart3, PieChart
} from 'lucide-react'

export const BusinessIntelligence: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('insights')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Brain className="h-8 w-8 mr-3 text-primary" />
            Business Intelligence
            <Badge variant="secondary" className="ml-3">
              PHASE 4
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Insights IA et analytics prédictifs pour optimiser votre business
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Rapport complet
          </Button>
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            Analyse IA
          </Button>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA prédictif</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€24.8K</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12.3% vs prévision
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients à risque</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Churn probable sous 30j
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunités</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              <Lightbulb className="h-3 w-3 inline mr-1" />
              Actions recommandées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score IA</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87/100</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Excellent
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
          <TabsTrigger value="predictions">Prédictions</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunités</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {[
              {
                title: "Tendance saisonnière détectée",
                description: "Les ventes de mobilier d'extérieur augmentent de 45% en mars",
                insight: "Recommandation: Augmenter le stock de 30% dès février pour capturer la demande",
                confidence: 92,
                impact: "high",
                category: "Saisonalité"
              },
              {
                title: "Segment client à fort potentiel",
                description: "Les clients 25-35 ans ont un panier moyen 2.3x supérieur",
                insight: "Recommandation: Cibler ce segment avec des campagnes premium",
                confidence: 87,
                impact: "high",
                category: "Segmentation"
              },
              {
                title: "Corrélation prix-conversion identifiée",
                description: "Les produits entre €50-150 ont le meilleur taux de conversion",
                insight: "Recommandation: Repositionner les produits hors de cette tranche",
                confidence: 78,
                impact: "medium",
                category: "Pricing"
              }
            ].map((insight, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-yellow-500" />
                          <h3 className="font-semibold">{insight.title}</h3>
                          <Badge variant="outline">{insight.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                      <Badge variant={insight.impact === 'high' ? 'default' : 'secondary'}>
                        Impact {insight.impact}
                      </Badge>
                    </div>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {insight.insight}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Brain className="h-4 w-4" />
                        Confiance: {insight.confidence}%
                      </div>
                      <Button size="sm">
                        Appliquer recommandation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Prévisions de ventes</CardTitle>
                <CardDescription>Prédictions pour les 3 prochains mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { month: "Février 2024", predicted: "€26.4K", confidence: 89, trend: "up" },
                    { month: "Mars 2024", predicted: "€31.2K", confidence: 82, trend: "up" },
                    { month: "Avril 2024", predicted: "€28.8K", confidence: 76, trend: "down" }
                  ].map((prediction) => (
                    <div key={prediction.month} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{prediction.month}</div>
                        <div className="text-sm text-muted-foreground">
                          Confiance: {prediction.confidence}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{prediction.predicted}</div>
                        <div className="flex items-center gap-1 text-sm">
                          <TrendingUp className={`h-4 w-4 ${prediction.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                          <span className={prediction.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                            {prediction.trend === 'up' ? '+18%' : '-8%'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produits à surveiller</CardTitle>
                <CardDescription>Prédictions de performance par produit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { product: "Chaise bureau ergonomique", trend: "strong", prediction: "+35% demande" },
                    { product: "Table basse vintage", trend: "declining", prediction: "-12% demande" },
                    { product: "Étagère modulaire", trend: "stable", prediction: "Stable" }
                  ].map((item) => (
                    <div key={item.product} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{item.product}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          item.trend === 'strong' ? 'default' :
                          item.trend === 'declining' ? 'destructive' : 'secondary'
                        }>
                          {item.prediction}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid gap-4">
            {[
              {
                title: "Nouveau segment de marché",
                description: "Les professionnels du télétravail représentent une opportunité de €45K",
                action: "Créer une collection 'Home Office Premium'",
                potential: "€45K",
                effort: "Medium",
                timeline: "2-3 mois"
              },
              {
                title: "Optimisation des prix",
                description: "7 produits sont sous-évalués par rapport à la concurrence",
                action: "Augmenter les prix de 8-15% selon le produit",
                potential: "€12K",
                effort: "Low",
                timeline: "1 semaine"
              },
              {
                title: "Cross-selling automatisé",
                description: "Potentiel de ventes croisées non exploité",
                action: "Implémenter des recommandations IA sur le site",
                potential: "€8K",
                effort: "High",
                timeline: "1 mois"
              }
            ].map((opportunity, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 text-green-500" />
                          <h3 className="font-semibold">{opportunity.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{opportunity.potential}</div>
                        <div className="text-xs text-muted-foreground">Potentiel</div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Action: {opportunity.action}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div>Effort: {opportunity.effort}</div>
                        <div>Délai: {opportunity.timeline}</div>
                      </div>
                      <Button size="sm">
                        Lancer le projet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Évolution CA</CardTitle>
                <CardDescription>Tendances sur 12 mois avec prédictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>Graphiques de CA avec IA</p>
                    <p className="text-sm">Intégration avec charts à venir</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des ventes</CardTitle>
                <CardDescription>Analyse par catégorie et canal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded">
                  <div className="text-center text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-4" />
                    <p>Répartition intelligente</p>
                    <p className="text-sm">Analyse multidimensionnelle</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}