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
  Star,
  AlertCircle,
  CheckCircle,
  Zap,
  BarChart3,
  ShoppingCart,
  DollarSign,
  Globe
} from 'lucide-react'
import { useUnifiedPlan } from '@/components/plan/UnifiedPlanProvider'
import { toast } from 'sonner'

interface ImportRecommendation {
  id: string
  type: 'optimization' | 'opportunity' | 'warning' | 'insight'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: 'pricing' | 'seo' | 'inventory' | 'market' | 'quality'
  confidence: number
  estimatedValue?: string
  actionRequired: boolean
  autoApplyAvailable: boolean
  data: any
}

const mockRecommendations: ImportRecommendation[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Opportunité Prix Concurrentiel',
    description: 'Vos prix sont 15% plus élevés que la concurrence sur 23 produits électroniques',
    impact: 'high',
    category: 'pricing',
    confidence: 92,
    estimatedValue: '+€2,340/mois',
    actionRequired: true,
    autoApplyAvailable: true,
    data: { affectedProducts: 23, potentialIncrease: 15 }
  },
  {
    id: '2',
    type: 'optimization',
    title: 'Amélioration SEO Automatique',
    description: '89 produits manquent de mots-clés optimisés pour le référencement',
    impact: 'high',
    category: 'seo',
    confidence: 87,
    estimatedValue: '+35% visibilité',
    actionRequired: false,
    autoApplyAvailable: true,
    data: { products: 89, keywordGap: 35 }
  },
  {
    id: '3',
    type: 'warning',
    title: 'Rupture de Stock Prédite',
    description: '12 produits bestsellers risquent une rupture dans les 7 prochains jours',
    impact: 'high',
    category: 'inventory',
    confidence: 95,
    estimatedValue: '-€1,200 pertes',
    actionRequired: true,
    autoApplyAvailable: false,
    data: { products: 12, daysToStockout: 7 }
  },
  {
    id: '4',
    type: 'insight',
    title: 'Tendance Marché Émergente',
    description: 'Les produits "éco-responsables" montrent +45% de recherches ce mois',
    impact: 'medium',
    category: 'market',
    confidence: 78,
    estimatedValue: 'Opportunité',
    actionRequired: false,
    autoApplyAvailable: false,
    data: { trendIncrease: 45, searchVolume: 15000 }
  },
  {
    id: '5',
    type: 'optimization',
    title: 'Qualité Images Perfectible',
    description: '156 produits ont des images de moins de 800px, impactant les conversions',
    impact: 'medium',
    category: 'quality',
    confidence: 84,
    estimatedValue: '+12% conversion',
    actionRequired: false,
    autoApplyAvailable: true,
    data: { lowQualityImages: 156, conversionImpact: 12 }
  }
]

export const SmartImportRecommendations = () => {
  const { getFeatureConfig } = useUnifiedPlan()
  const config = getFeatureConfig('ai-import')
  const [recommendations, setRecommendations] = useState<ImportRecommendation[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Simulate loading recommendations
    const timer = setTimeout(() => {
      setRecommendations(mockRecommendations)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-5 h-5" />
      case 'optimization': return <Target className="w-5 h-5" />
      case 'warning': return <AlertCircle className="w-5 h-5" />
      default: return <Lightbulb className="w-5 h-5" />
    }
  }

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-green-600 bg-green-100'
      case 'optimization': return 'text-blue-600 bg-blue-100'
      case 'warning': return 'text-red-600 bg-red-100'
      default: return 'text-purple-600 bg-purple-100'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-orange-600 bg-orange-100'
      default: return 'text-green-600 bg-green-100'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pricing': return <DollarSign className="w-4 h-4" />
      case 'seo': return <Globe className="w-4 h-4" />
      case 'inventory': return <ShoppingCart className="w-4 h-4" />
      case 'market': return <BarChart3 className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  const runAIAnalysis = async () => {
    setIsAnalyzing(true)
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    toast.success('Analyse IA terminée - Nouvelles recommandations disponibles')
    setIsAnalyzing(false)
  }

  const applyRecommendation = async (recommendationId: string) => {
    const recommendation = recommendations.find(r => r.id === recommendationId)
    if (!recommendation) return

    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          setAppliedRecommendations(prev => new Set([...prev, recommendationId]))
          resolve('success')
        }, 2000)
      }),
      {
        loading: `Application de: ${recommendation.title}...`,
        success: 'Recommandation appliquée avec succès',
        error: 'Erreur lors de l\'application'
      }
    )
  }

  if (!config.enabled) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Recommandations IA</h3>
          <p className="text-muted-foreground mb-4">
            Fonctionnalité disponible avec le plan Pro et Ultra Pro
          </p>
          <Button onClick={() => window.location.href = '/subscription'}>
            Voir les Plans
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Recommandations IA
          </h2>
          <p className="text-muted-foreground">
            Optimisations personnalisées basées sur l'analyse de vos données
          </p>
        </div>
        
        <Button 
          onClick={runAIAnalysis} 
          disabled={isAnalyzing}
          className="flex items-center gap-2"
        >
          {isAnalyzing && <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          <Brain className="w-4 h-4" />
          {isAnalyzing ? 'Analyse en cours...' : 'Analyser'}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recommandations</p>
                <p className="text-2xl font-bold">{recommendations.length}</p>
              </div>
              <Lightbulb className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Impact Élevé</p>
                <p className="text-2xl font-bold text-red-600">
                  {recommendations.filter(r => r.impact === 'high').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-applicables</p>
                <p className="text-2xl font-bold text-green-600">
                  {recommendations.filter(r => r.autoApplyAvailable).length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Appliquées</p>
                <p className="text-2xl font-bold text-blue-600">{appliedRecommendations.size}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((recommendation) => {
          const isApplied = appliedRecommendations.has(recommendation.id)
          
          return (
            <Card key={recommendation.id} className={isApplied ? 'opacity-60 border-green-200' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getRecommendationColor(recommendation.type)}`}>
                      {getRecommendationIcon(recommendation.type)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {recommendation.title}
                        {isApplied && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {recommendation.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getImpactColor(recommendation.impact)}>
                      Impact {recommendation.impact}
                    </Badge>
                    {recommendation.estimatedValue && (
                      <span className="text-sm font-semibold text-green-600">
                        {recommendation.estimatedValue}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Confidence and Category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {getCategoryIcon(recommendation.category)}
                      <span className="text-sm text-muted-foreground capitalize">
                        {recommendation.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Confiance:</span>
                      <div className="flex items-center gap-1">
                        <Progress value={recommendation.confidence} className="w-16 h-2" />
                        <span className="text-sm font-medium">{recommendation.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {!isApplied && recommendation.autoApplyAvailable && (
                    <Button 
                      size="sm" 
                      onClick={() => applyRecommendation(recommendation.id)}
                      className="flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      Appliquer
                    </Button>
                  )}
                </div>

                {/* Action Required Warning */}
                {recommendation.actionRequired && !isApplied && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">Action manuelle requise</span>
                  </div>
                )}

                {isApplied && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">Recommandation appliquée</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {recommendations.length === 0 && !isAnalyzing && (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune Recommandation</h3>
            <p className="text-muted-foreground mb-4">
              Lancez une analyse pour découvrir des optimisations personnalisées
            </p>
            <Button onClick={runAIAnalysis} className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Démarrer l'Analyse
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}