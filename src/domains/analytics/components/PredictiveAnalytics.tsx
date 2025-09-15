/**
 * PHASE 3: Analytics prédictifs avec IA et forecasting avancé
 * Fonctionnalité différenciante pour la prise de décision
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, TrendingDown, Brain, Target, AlertTriangle,
  Eye, Calendar, DollarSign, Users, Package, Zap,
  BarChart3, LineChart, PieChart, Activity, CheckCircle
} from 'lucide-react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { usePlanContext } from '@/components/plan'

interface Prediction {
  id: string
  type: 'revenue' | 'sales' | 'inventory' | 'customer_behavior' | 'market_trend'
  title: string
  description: string
  confidence: number
  timeframe: string
  current_value: number
  predicted_value: number
  change_percentage: number
  trend: 'up' | 'down' | 'stable'
  impact: 'high' | 'medium' | 'low'
  recommendations: string[]
  factors: Array<{
    name: string
    impact: number
    description: string
  }>
  created_at: string
}

interface TrendAnalysis {
  period: string
  data_points: Array<{
    date: string
    actual?: number
    predicted: number
    confidence_upper: number
    confidence_lower: number
  }>
  accuracy: number
  r_squared: number
}

interface MarketInsight {
  id: string
  category: string
  insight: string
  opportunity_score: number
  market_size: number
  competition_level: 'low' | 'medium' | 'high'
  entry_barrier: 'low' | 'medium' | 'high'
  recommendation: string
}

export const PredictiveAnalytics: React.FC = () => {
  const { user } = useAuthOptimized()
  const { hasFeature } = usePlanContext()
  
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([])
  const [trends, setTrends] = useState<TrendAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [activeTab, setActiveTab] = useState('predictions')

  useEffect(() => {
    if (user && hasFeature('predictive_analytics')) {
      fetchPredictiveData()
    }
  }, [user, hasFeature, selectedTimeframe, selectedMetric])

  const fetchPredictiveData = async () => {
    setLoading(true)
    
    try {
      // Simulation de données prédictives - en production, appeler l'API ML
      const mockPredictions: Prediction[] = [
        {
          id: '1',
          type: 'revenue',
          title: 'Prévision de revenus Q1 2024',
          description: 'Basé sur les tendances saisonnières et les données historiques',
          confidence: 87,
          timeframe: '3 mois',
          current_value: 45280,
          predicted_value: 58640,
          change_percentage: 29.5,
          trend: 'up',
          impact: 'high',
          recommendations: [
            'Augmenter le stock des produits haute performance',
            'Préparer une campagne marketing pour janvier',
            'Optimiser la logistique pour la croissance prévue'
          ],
          factors: [
            { name: 'Saisonnalité', impact: 0.35, description: 'Forte demande janvier-mars' },
            { name: 'Tendances marché', impact: 0.28, description: 'Croissance du secteur' },
            { name: 'Campagnes marketing', impact: 0.22, description: 'ROI historique élevé' },
            { name: 'Nouveaux produits', impact: 0.15, description: 'Lancement prévu' }
          ],
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          type: 'customer_behavior',
          title: 'Risque de churn segment Premium',
          description: 'Analyse comportementale prédictive des clients VIP',
          confidence: 92,
          timeframe: '6 semaines',
          current_value: 8,
          predicted_value: 23,
          change_percentage: 187.5,
          trend: 'up',
          impact: 'high',
          recommendations: [
            'Lancer une campagne de rétention ciblée',
            'Proposer des offres exclusives personnalisées',
            'Améliorer le service client premium'
          ],
          factors: [
            { name: 'Fréquence d\'achat', impact: 0.4, description: 'Diminution significative' },
            { name: 'Engagement email', impact: 0.25, description: 'Taux d\'ouverture en baisse' },
            { name: 'Support client', impact: 0.2, description: 'Tickets de réclamation' },
            { name: 'Concurrence', impact: 0.15, description: 'Nouvelles offres marché' }
          ],
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          type: 'inventory',
          title: 'Optimisation stock Q4',
          description: 'Prédiction des besoins en inventaire par catégorie',
          confidence: 78,
          timeframe: '4 mois',
          current_value: 89,
          predicted_value: 156,
          change_percentage: 75.3,
          trend: 'up',
          impact: 'medium',
          recommendations: [
            'Anticiper les commandes fournisseurs',
            'Négocier des conditions de paiement flexibles',
            'Diversifier les sources d\'approvisionnement'
          ],
          factors: [
            { name: 'Demande saisonnière', impact: 0.45, description: 'Pic automne/hiver' },
            { name: 'Croissance historique', impact: 0.30, description: 'Tendance sur 2 ans' },
            { name: 'Nouveaux marchés', impact: 0.25, description: 'Expansion géographique' }
          ],
          created_at: new Date().toISOString()
        }
      ]

      const mockMarketInsights: MarketInsight[] = [
        {
          id: '1',
          category: 'Gaming Accessories',
          insight: 'Croissance de 340% sur les accessoires gaming RGB',
          opportunity_score: 92,
          market_size: 2400000,
          competition_level: 'medium',
          entry_barrier: 'low',
          recommendation: 'Expansion immédiate recommandée - fenêtre d\'opportunité limitée'
        },
        {
          id: '2',
          category: 'Eco-Friendly Products',
          insight: 'Demande croissante pour produits éco-responsables (+45%)',
          opportunity_score: 78,
          market_size: 1800000,
          competition_level: 'low',
          entry_barrier: 'medium',
          recommendation: 'Développer une gamme éco-responsable dans les 6 mois'
        },
        {
          id: '3',
          category: 'Smart Home',
          insight: 'Marché domotique en expansion rapide (+120% annuel)',
          opportunity_score: 85,
          market_size: 5200000,
          competition_level: 'high',
          entry_barrier: 'high',
          recommendation: 'Partenariats stratégiques nécessaires pour l\'entrée'
        }
      ]

      const mockTrends: TrendAnalysis = {
        period: selectedTimeframe,
        data_points: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
          actual: i < 20 ? 1000 + Math.sin(i * 0.2) * 200 + Math.random() * 100 : undefined,
          predicted: 1000 + Math.sin(i * 0.2) * 200 + i * 15,
          confidence_upper: 1000 + Math.sin(i * 0.2) * 200 + i * 15 + 150,
          confidence_lower: 1000 + Math.sin(i * 0.2) * 200 + i * 15 - 150
        })),
        accuracy: 0.894,
        r_squared: 0.847
      }

      setPredictions(mockPredictions)
      setMarketInsights(mockMarketInsights)
      setTrends(mockTrends)
      
    } catch (error) {
      console.error('Error fetching predictive data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (!hasFeature('predictive_analytics')) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Brain className="h-6 w-6 text-muted-foreground" />
            Analytics Prédictifs
          </CardTitle>
          <CardDescription>
            Fonctionnalité disponible avec le plan Ultra Pro
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground mb-4">
            Accédez aux prédictions IA et aux insights marché avancés
          </div>
          <Button>Passer au plan Ultra Pro</Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Brain className="h-8 w-8 mr-3 text-primary" />
            Analytics Prédictifs
            <Badge className="ml-3 bg-gradient-to-r from-purple-500 to-pink-500">
              IA Avancée
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Prédictions intelligentes et insights marché pour optimiser votre stratégie
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Exporter rapport
          </Button>
        </div>
      </div>

      {/* Résumé des prédictions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prédictions actives</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictions.length}</div>
            <p className="text-xs text-muted-foreground">
              Confiance moyenne: {Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunités détectées</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketInsights.length}</div>
            <p className="text-xs text-muted-foreground">
              Score moyen: {Math.round(marketInsights.reduce((sum, i) => sum + i.opportunity_score, 0) / marketInsights.length)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Précision du modèle</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trends ? (trends.accuracy * 100).toFixed(1) : 0}%</div>
            <p className="text-xs text-muted-foreground">
              R² = {trends ? trends.r_squared.toFixed(3) : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {predictions.filter(p => p.impact === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Impact élevé
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions">Prédictions</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="market">Marché</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {predictions.map((prediction) => (
              <Card key={prediction.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {getTrendIcon(prediction.trend)}
                        {prediction.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {prediction.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${getImpactColor(prediction.impact)} text-white`}>
                        {prediction.impact === 'high' ? 'Critique' : 
                         prediction.impact === 'medium' ? 'Moyen' : 'Faible'}
                      </Badge>
                      <div className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                        {prediction.confidence}% confiance
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Prédiction principale */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Prédiction ({prediction.timeframe})</span>
                      <span className={`text-lg font-bold ${
                        prediction.change_percentage > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {prediction.change_percentage > 0 ? '+' : ''}{prediction.change_percentage.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Valeur actuelle</div>
                        <div className="font-bold">{prediction.current_value.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Valeur prédite</div>
                        <div className="font-bold">{prediction.predicted_value.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Facteurs d'influence */}
                  <div>
                    <div className="text-sm font-medium mb-3">Facteurs d'influence</div>
                    <div className="space-y-2">
                      {prediction.factors.map((factor, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{factor.name}</div>
                            <div className="text-xs text-muted-foreground">{factor.description}</div>
                          </div>
                          <div className="ml-4 min-w-[80px]">
                            <Progress value={factor.impact * 100} className="h-2" />
                            <div className="text-xs text-center mt-1">{(factor.impact * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommandations */}
                  <div>
                    <div className="text-sm font-medium mb-2">Recommandations</div>
                    <ul className="space-y-1">
                      {prediction.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des tendances</CardTitle>
              <CardDescription>
                Évolution historique et prédictions avec intervalles de confiance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-4" />
                  <p>Graphique des tendances à implémenter avec Recharts</p>
                  <p className="text-sm mt-2">
                    Précision actuelle: {trends ? (trends.accuracy * 100).toFixed(1) : 0}% | 
                    R² = {trends ? trends.r_squared.toFixed(3) : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <div className="grid gap-4">
            {marketInsights.map((insight) => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{insight.category}</CardTitle>
                      <CardDescription className="mt-1">
                        {insight.insight}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-50">
                      Score: {insight.opportunity_score}%
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Taille marché</div>
                      <div className="font-bold">{(insight.market_size / 1000000).toFixed(1)}M €</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Concurrence</div>
                      <div className={`font-bold ${getCompetitionColor(insight.competition_level)}`}>
                        {insight.competition_level === 'low' ? 'Faible' :
                         insight.competition_level === 'medium' ? 'Modérée' : 'Élevée'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Barrière d'entrée</div>
                      <div className={`font-bold ${getCompetitionColor(insight.entry_barrier)}`}>
                        {insight.entry_barrier === 'low' ? 'Faible' :
                         insight.entry_barrier === 'medium' ? 'Modérée' : 'Élevée'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">Recommandation stratégique</div>
                    <div className="text-sm text-blue-700">{insight.recommendation}</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Target className="h-3 w-3 mr-1" />
                      Analyser en détail
                    </Button>
                    <Button size="sm">
                      <Zap className="h-3 w-3 mr-1" />
                      Créer plan d'action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions prioritaires recommandées</CardTitle>
              <CardDescription>
                Basé sur l'analyse prédictive et les opportunités marché
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.filter(p => p.impact === 'high').map((prediction, idx) => (
                  <div key={prediction.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div className="font-medium">{prediction.title}</div>
                      </div>
                      <Badge variant="destructive">Priorité haute</Badge>
                    </div>
                    
                    <div className="space-y-2 ml-8">
                      {prediction.recommendations.map((rec, recIdx) => (
                        <div key={recIdx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="ml-8 mt-3">
                      <Button size="sm">
                        <Zap className="h-3 w-3 mr-1" />
                        Implémenter maintenant
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}