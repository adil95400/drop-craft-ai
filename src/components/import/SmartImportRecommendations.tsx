import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Zap,
  BarChart3,
  ShoppingCart,
  DollarSign,
  Globe,
  Star
} from 'lucide-react'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

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

/**
 * Generate real recommendations from product data analysis
 */
function deriveRecommendations(products: any[]): ImportRecommendation[] {
  if (!products || products.length === 0) return []
  
  const recommendations: ImportRecommendation[] = []
  
  // Check for products without descriptions (SEO)
  const noDescription = products.filter(p => !p.description || p.description.length < 20)
  if (noDescription.length > 0) {
    recommendations.push({
      id: 'seo-descriptions',
      type: 'optimization',
      title: 'Amélioration SEO Automatique',
      description: `${noDescription.length} produits ont des descriptions manquantes ou trop courtes`,
      impact: noDescription.length > 10 ? 'high' : 'medium',
      category: 'seo',
      confidence: 95,
      estimatedValue: `+${Math.min(noDescription.length * 2, 40)}% visibilité`,
      actionRequired: false,
      autoApplyAvailable: true,
      data: { products: noDescription.length }
    })
  }

  // Check for products without images
  const noImages = products.filter(p => !p.image_urls || (Array.isArray(p.image_urls) && p.image_urls.length === 0))
  if (noImages.length > 0) {
    recommendations.push({
      id: 'quality-images',
      type: 'warning',
      title: 'Produits sans Images',
      description: `${noImages.length} produits n'ont aucune image, impactant les conversions`,
      impact: 'high',
      category: 'quality',
      confidence: 100,
      estimatedValue: '+15% conversion',
      actionRequired: true,
      autoApplyAvailable: false,
      data: { lowQualityImages: noImages.length }
    })
  }

  // Check for pricing opportunities (products with no cost_price set)
  const noCost = products.filter(p => !p.cost_price || p.cost_price === 0)
  if (noCost.length > 0) {
    recommendations.push({
      id: 'pricing-cost',
      type: 'opportunity',
      title: 'Prix d\'achat manquants',
      description: `${noCost.length} produits n'ont pas de prix d'achat — impossible de calculer la marge`,
      impact: noCost.length > 5 ? 'high' : 'medium',
      category: 'pricing',
      confidence: 100,
      estimatedValue: 'Marges inconnues',
      actionRequired: true,
      autoApplyAvailable: false,
      data: { affectedProducts: noCost.length }
    })
  }

  // Check for draft products that could be published
  const drafts = products.filter(p => p.status === 'draft')
  if (drafts.length > 5) {
    recommendations.push({
      id: 'inventory-drafts',
      type: 'insight',
      title: 'Produits en attente de publication',
      description: `${drafts.length} produits sont en brouillon — prêts à être publiés ?`,
      impact: 'medium',
      category: 'inventory',
      confidence: 80,
      estimatedValue: `${drafts.length} produits`,
      actionRequired: false,
      autoApplyAvailable: true,
      data: { draftCount: drafts.length }
    })
  }

  return recommendations
}

export const SmartImportRecommendations = () => {
  const navigate = useNavigate()
  const { hasFeature } = useUnifiedPlan()
  const aiImportEnabled = hasFeature('ai-import')
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set())
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Fetch real products to derive recommendations
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-for-recommendations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, cost_price, status, image_urls, tags, category')
        .eq('user_id', user.id)
        .limit(500)
      if (error) throw error
      return data || []
    }
  })

  const recommendations = deriveRecommendations(products)

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
    // Trigger real AI analysis via edge function (placeholder for FastAPI migration)
    try {
      const { error } = await supabase.functions.invoke('ai-product-optimizer', {
        body: { action: 'analyze_catalog' }
      })
      if (error) throw error
      toast.success('Analyse IA terminée — Recommandations mises à jour')
    } catch {
      toast.info('Recommandations basées sur l\'analyse locale des données')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const applyRecommendation = async (recommendationId: string) => {
    const recommendation = recommendations.find(r => r.id === recommendationId)
    if (!recommendation) return
    // Mark as applied (real backend action will be handled by FastAPI)
    setAppliedRecommendations(prev => new Set([...prev, recommendationId]))
    toast.success(`Recommandation "${recommendation.title}" marquée comme appliquée`)
  }

  if (!aiImportEnabled) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Recommandations IA</h3>
          <p className="text-muted-foreground mb-4">
            Fonctionnalité disponible avec le plan Pro et Ultra Pro
          </p>
          <Button onClick={() => navigate('/subscription')}>
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
            Optimisations basées sur l'analyse réelle de vos {products.length} produits
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

      {recommendations.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {products.length === 0 ? 'Aucun produit' : 'Aucune Recommandation'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {products.length === 0 
                ? 'Importez des produits pour obtenir des recommandations personnalisées'
                : 'Tous vos produits sont bien configurés !'}
            </p>
            {products.length === 0 && (
              <Button onClick={() => navigate('/products/import')} className="flex items-center gap-2">
                Importer des produits
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Analyse de vos produits...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
