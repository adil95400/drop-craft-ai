import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Star,
  ArrowRight,
  Calendar,
  DollarSign,
  Users,
  ShoppingCart
} from 'lucide-react'
import { toast } from 'sonner'

interface BusinessInsight {
  id: string
  type: 'opportunity' | 'risk' | 'optimization' | 'trend'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  estimatedValue: string
  timeframe: string
  actionRequired: boolean
  implementation: 'easy' | 'medium' | 'complex'
}

interface MarketTrend {
  category: string
  growth: number
  seasonality: 'high' | 'medium' | 'low'
  opportunity: string
  confidence: number
}

export function BusinessIntelligence() {
  const [insights, setInsights] = useState<BusinessInsight[]>([])
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    generateInsights()
  }, [])

  const generateInsights = () => {
    const mockInsights: BusinessInsight[] = [
      {
        id: '1',
        type: 'opportunity',
        title: 'Expansion Marché Mobile',
        description: 'L\'audience mobile représente 73% du trafic mais seulement 45% des conversions. Optimisation urgente nécessaire.',
        impact: 'high',
        confidence: 89,
        estimatedValue: '+15,000€/mois',
        timeframe: '2-4 semaines',
        actionRequired: true,
        implementation: 'medium'
      },
      {
        id: '2',
        type: 'risk',
        title: 'Concurrence Agressive',
        description: 'Baisse des prix de 18% détectée chez 3 concurrents majeurs sur vos produits phares.',
        impact: 'critical',
        confidence: 95,
        estimatedValue: '-8,500€/mois',
        timeframe: 'Immédiat',
        actionRequired: true,
        implementation: 'easy'
      },
      {
        id: '3',
        type: 'optimization',
        title: 'Cross-selling Intelligent',
        description: 'Algorithme détecte 234 opportunités de vente croisée non exploitées.',
        impact: 'medium',
        confidence: 76,
        estimatedValue: '+4,200€/mois',
        timeframe: '1-2 semaines',
        actionRequired: false,
        implementation: 'easy'
      },
      {
        id: '4',
        type: 'trend',
        title: 'Saisonnalité Q4',
        description: 'Prévision d\'une hausse de 45% des ventes dans 6 semaines. Stock insuffisant détecté.',
        impact: 'high',
        confidence: 92,
        estimatedValue: '+22,000€ potentiel',
        timeframe: '6 semaines',
        actionRequired: true,
        implementation: 'complex'
      }
    ]

    const mockTrends: MarketTrend[] = [
      { category: 'Electronics', growth: 28, seasonality: 'high', opportunity: 'Black Friday preparation', confidence: 87 },
      { category: 'Fashion', growth: -12, seasonality: 'low', opportunity: 'Winter collection launch', confidence: 73 },
      { category: 'Home & Garden', growth: 15, seasonality: 'medium', opportunity: 'Holiday decorations', confidence: 82 },
      { category: 'Sports', growth: 8, seasonality: 'high', opportunity: 'Fitness equipment surge', confidence: 69 }
    ]

    setInsights(mockInsights)
    setMarketTrends(mockTrends)
    setLastUpdate(new Date())
  }

  const runAnalysis = async () => {
    setAnalyzing(true)
    toast.loading('Analyse Business Intelligence en cours...', { id: 'bi-analysis' })

    try {
      await new Promise(resolve => setTimeout(resolve, 4000))
      generateInsights()
      
      toast.success(
        '✅ Analyse terminée ! Nouvelles opportunités détectées.',
        { id: 'bi-analysis', duration: 4000 }
      )
    } catch (error) {
      toast.error('Erreur lors de l\'analyse BI', { id: 'bi-analysis' })
    } finally {
      setAnalyzing(false)
    }
  }

  const getImpactColor = (impact: BusinessInsight['impact']) => {
    switch (impact) {
      case 'low': return 'bg-gray-500'
      case 'medium': return 'bg-yellow-500'
      case 'high': return 'bg-orange-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: BusinessInsight['type']) => {
    switch (type) {
      case 'opportunity': return <Lightbulb className="h-5 w-5 text-green-500" />
      case 'risk': return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'optimization': return <Target className="h-5 w-5 text-blue-500" />
      case 'trend': return <TrendingUp className="h-5 w-5 text-purple-500" />
      default: return <Brain className="h-5 w-5 text-gray-500" />
    }
  }

  const getImplementationColor = (implementation: BusinessInsight['implementation']) => {
    switch (implementation) {
      case 'easy': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'complex': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const implementInsight = async (insightId: string) => {
    const insight = insights.find(i => i.id === insightId)
    if (!insight) return

    toast.loading(`Implémentation: ${insight.title}...`, { id: `implement-${insightId}` })
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      setInsights(current => 
        current.map(i => 
          i.id === insightId ? { ...i, actionRequired: false } : i
        )
      )
      
      toast.success(`✅ ${insight.title} implémenté avec succès !`, { 
        id: `implement-${insightId}`,
        duration: 3000 
      })
    } catch (error) {
      toast.error('Erreur lors de l\'implémentation', { id: `implement-${insightId}` })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-500" />
                Business Intelligence IA
              </CardTitle>
              <CardDescription>
                Insights stratégiques et recommandations pour optimiser vos performances
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm text-gray-500">
                <div>Dernière analyse</div>
                <div>{lastUpdate.toLocaleTimeString('fr-FR')}</div>
              </div>
              <Button 
                onClick={runAnalysis}
                disabled={analyzing}
                className="flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Brain className="h-4 w-4 animate-pulse" />
                    Analyse...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Nouvelle Analyse
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.map((insight) => (
          <Card key={insight.id} className={`border-l-4 ${
            insight.impact === 'critical' ? 'border-l-red-500' :
            insight.impact === 'high' ? 'border-l-orange-500' :
            insight.impact === 'medium' ? 'border-l-yellow-500' : 'border-l-gray-500'
          }`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getTypeIcon(insight.type)}
                  <div>
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getImpactColor(insight.impact)} text-white text-xs`}>
                        {insight.impact}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Confiance: {insight.confidence}%
                      </Badge>
                    </div>
                  </div>
                </div>
                {insight.actionRequired && (
                  <AlertCircle className="h-5 w-5 text-orange-500 animate-pulse" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{insight.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Impact Financier
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {insight.estimatedValue}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Délai
                    </div>
                    <div className="text-lg font-semibold">{insight.timeframe}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-500">Complexité: </span>
                    <span className={`font-medium ${getImplementationColor(insight.implementation)}`}>
                      {insight.implementation === 'easy' ? 'Facile' :
                       insight.implementation === 'medium' ? 'Modérée' : 'Complexe'}
                    </span>
                  </div>
                  
                  {insight.actionRequired && (
                    <Button
                      size="sm"
                      onClick={() => implementInsight(insight.id)}
                      className="flex items-center gap-2"
                    >
                      Implémenter
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Progress de confiance */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Niveau de confiance</span>
                    <span>{insight.confidence}%</span>
                  </div>
                  <Progress value={insight.confidence} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Tendances du Marché
          </CardTitle>
          <CardDescription>
            Analyse des tendances sectorielles et opportunités saisonnières
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketTrends.map((trend, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">{trend.category}</h4>
                  <Badge 
                    className={`${trend.growth > 0 ? 'bg-green-500' : 'bg-red-500'} text-white text-xs`}
                  >
                    {trend.growth > 0 ? '+' : ''}{trend.growth}%
                  </Badge>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saisonnalité:</span>
                    <span className={`font-medium ${
                      trend.seasonality === 'high' ? 'text-red-500' :
                      trend.seasonality === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {trend.seasonality === 'high' ? 'Élevée' :
                       trend.seasonality === 'medium' ? 'Modérée' : 'Faible'}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-gray-600 mb-1">Opportunité:</div>
                    <div className="font-medium">{trend.opportunity}</div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Confiance</span>
                      <span>{trend.confidence}%</span>
                    </div>
                    <Progress value={trend.confidence} className="h-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">87%</div>
            <div className="text-sm text-gray-500">Précision Prédictions</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">+24%</div>
            <div className="text-sm text-gray-500">ROI Moyen</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">156</div>
            <div className="text-sm text-gray-500">Insights Générés</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">92%</div>
            <div className="text-sm text-gray-500">Taux d'Adoption</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}