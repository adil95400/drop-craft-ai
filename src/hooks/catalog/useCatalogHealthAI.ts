/**
 * useCatalogHealthAI - Hook IA pour l'optimisation de la santé catalogue
 * Analyse prédictive, recommandations et plan d'action automatisé
 * Connecté au edge function catalog-ai-hub
 */
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCatalogHealth } from './useCatalogHealth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// Types pour les stats IA de santé catalogue
export interface CatalogHealthAIStats {
  healthTrendPrediction: 'improving' | 'stable' | 'declining'
  predictedScoreIn7Days: number
  predictedScoreIn30Days: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  automationPotential: number
  estimatedTimeToFullHealth: number
  priorityActions: HealthPriorityAction[]
  categoryInsights: CategoryHealthInsight[]
  benchmarkComparison: {
    industryAverage: number
    percentile: number
    topPerformerGap: number
  }
}

export interface HealthPriorityAction {
  id: string
  type: 'critical' | 'high' | 'medium' | 'low'
  category: 'images' | 'stock' | 'pricing' | 'attributes' | 'category'
  title: string
  description: string
  impactScore: number // 0-100
  effortScore: number // 1-5 (1 = facile)
  estimatedGain: number // points de score
  affectedProducts: number
  automatable: boolean
}

export interface CategoryHealthInsight {
  category: string
  healthScore: number
  productCount: number
  trend: 'up' | 'stable' | 'down'
  issues: string[]
  recommendation: string
}

export interface HealthRecommendation {
  id: string
  type: 'quick_win' | 'strategic' | 'automation' | 'batch_fix'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'minimal' | 'moderate' | 'significant'
  estimatedScoreGain: number
  estimatedTimeMinutes: number
  affectedProducts: number
  actionType: string
  priority: number
}

/**
 * Hook pour les statistiques IA de santé catalogue
 */
export function useCatalogHealthAIStats() {
  const { metrics, products, isLoading } = useCatalogHealth()

  const aiStats = useMemo<CatalogHealthAIStats | null>(() => {
    if (!metrics || !products || products.length === 0) return null

    const currentScore = metrics.globalScore
    
    // Prédiction de tendance basée sur les métriques actuelles
    const healthTrendPrediction: 'improving' | 'stable' | 'declining' = 
      metrics.trend > 3 ? 'improving' :
      metrics.trend < -3 ? 'declining' : 'stable'

    // Prédictions de score
    const trendMultiplier = healthTrendPrediction === 'improving' ? 1.5 : 
                           healthTrendPrediction === 'declining' ? -1 : 0.5
    const predictedScoreIn7Days = Math.min(100, Math.max(0, currentScore + (metrics.trend * trendMultiplier)))
    const predictedScoreIn30Days = Math.min(100, Math.max(0, currentScore + (metrics.trend * trendMultiplier * 3)))

    // Niveau de risque
    const riskLevel: 'low' | 'medium' | 'high' | 'critical' =
      currentScore >= 80 ? 'low' :
      currentScore >= 60 ? 'medium' :
      currentScore >= 40 ? 'high' : 'critical'

    // Potentiel d'automatisation
    const automationPotential = Math.round(
      ((metrics.details.withImages < metrics.total ? 30 : 0) +
       (metrics.toProcessCount > 0 ? 40 : 0) +
       (metrics.blockingCount > 0 ? 30 : 0)) / 3 * 0.7
    )

    // Temps estimé pour atteindre 100%
    const gapToFull = 100 - currentScore
    const dailyImprovement = Math.max(0.5, metrics.trend / 7)
    const estimatedTimeToFullHealth = Math.ceil(gapToFull / dailyImprovement)

    // Actions prioritaires
    const priorityActions: HealthPriorityAction[] = []

    // Analyse des images
    const missingImages = metrics.total - metrics.details.withImages
    if (missingImages > 0) {
      priorityActions.push({
        id: 'fix_images',
        type: missingImages > metrics.total * 0.3 ? 'critical' : 'high',
        category: 'images',
        title: 'Enrichir les images produits',
        description: `${missingImages} produits sans image impactent votre visibilité`,
        impactScore: Math.round((missingImages / metrics.total) * 100),
        effortScore: 2,
        estimatedGain: Math.round((missingImages / metrics.total) * 25),
        affectedProducts: missingImages,
        automatable: true
      })
    }

    // Analyse du stock
    const outOfStock = metrics.total - metrics.details.withStock
    if (outOfStock > 0) {
      priorityActions.push({
        id: 'fix_stock',
        type: outOfStock > metrics.total * 0.2 ? 'critical' : 'high',
        category: 'stock',
        title: 'Réapprovisionner les stocks',
        description: `${outOfStock} produits en rupture = perte de revenus`,
        impactScore: Math.round((outOfStock / metrics.total) * 100),
        effortScore: 3,
        estimatedGain: Math.round((outOfStock / metrics.total) * 25),
        affectedProducts: outOfStock,
        automatable: false
      })
    }

    // Analyse des catégories
    const missingCategories = metrics.total - metrics.details.withCategory
    if (missingCategories > 0) {
      priorityActions.push({
        id: 'fix_categories',
        type: 'medium',
        category: 'category',
        title: 'Catégoriser les produits',
        description: `${missingCategories} produits sans catégorie = mauvais SEO`,
        impactScore: Math.round((missingCategories / metrics.total) * 80),
        effortScore: 2,
        estimatedGain: Math.round((missingCategories / metrics.total) * 20),
        affectedProducts: missingCategories,
        automatable: true
      })
    }

    // Analyse des marges
    const lowMargin = metrics.total - metrics.details.withMargin
    if (lowMargin > metrics.total * 0.3) {
      priorityActions.push({
        id: 'fix_pricing',
        type: 'high',
        category: 'pricing',
        title: 'Optimiser les prix',
        description: `${lowMargin} produits avec marge < 10%`,
        impactScore: Math.round((lowMargin / metrics.total) * 70),
        effortScore: 4,
        estimatedGain: Math.round((lowMargin / metrics.total) * 10),
        affectedProducts: lowMargin,
        automatable: true
      })
    }

    // Tri par impact
    priorityActions.sort((a, b) => b.impactScore - a.impactScore)

    // Insights par catégorie (simulé pour l'instant)
    const categories = [...new Set(products.map(p => p.category || 'Sans catégorie'))]
    const categoryInsights: CategoryHealthInsight[] = categories.slice(0, 5).map(cat => {
      const catProducts = products.filter(p => (p.category || 'Sans catégorie') === cat)
      const catWithImages = catProducts.filter(p => p.image_url).length
      const catWithStock = catProducts.filter(p => (p.stock_quantity || 0) > 0).length
      const catHealthScore = Math.round(
        ((catWithImages / catProducts.length) * 50 + (catWithStock / catProducts.length) * 50)
      )

      const issues: string[] = []
      if (catWithImages < catProducts.length * 0.8) issues.push('Images manquantes')
      if (catWithStock < catProducts.length * 0.7) issues.push('Ruptures fréquentes')

      return {
        category: cat,
        healthScore: catHealthScore,
        productCount: catProducts.length,
        trend: catHealthScore > 70 ? 'up' : catHealthScore > 50 ? 'stable' : 'down',
        issues,
        recommendation: issues.length > 0 
          ? `Priorité: ${issues[0].toLowerCase()}`
          : 'Catégorie en bonne santé'
      }
    })

    // Benchmark (valeurs simulées)
    const benchmarkComparison = {
      industryAverage: 65,
      percentile: currentScore >= 80 ? 90 : currentScore >= 60 ? 60 : 30,
      topPerformerGap: Math.max(0, 95 - currentScore)
    }

    return {
      healthTrendPrediction,
      predictedScoreIn7Days: Math.round(predictedScoreIn7Days),
      predictedScoreIn30Days: Math.round(predictedScoreIn30Days),
      riskLevel,
      automationPotential,
      estimatedTimeToFullHealth,
      priorityActions,
      categoryInsights,
      benchmarkComparison
    }
  }, [metrics, products])

  return {
    aiStats,
    metrics,
    isLoading
  }
}

/**
 * Hook pour les recommandations IA de santé
 */
export function useHealthRecommendations() {
  const { aiStats, metrics } = useCatalogHealthAIStats()

  const recommendations = useMemo<HealthRecommendation[]>(() => {
    if (!aiStats || !metrics) return []

    const recs: HealthRecommendation[] = []

    // Quick wins basés sur les actions prioritaires automatisables
    aiStats.priorityActions
      .filter(a => a.automatable && a.effortScore <= 2)
      .forEach((action, idx) => {
        recs.push({
          id: `quick_${action.id}`,
          type: 'quick_win',
          title: `🚀 ${action.title}`,
          description: action.description,
          impact: action.impactScore > 50 ? 'high' : action.impactScore > 25 ? 'medium' : 'low',
          effort: 'minimal',
          estimatedScoreGain: action.estimatedGain,
          estimatedTimeMinutes: action.affectedProducts * 0.5,
          affectedProducts: action.affectedProducts,
          actionType: action.id,
          priority: idx + 1
        })
      })

    // Recommandations stratégiques
    if (aiStats.riskLevel === 'critical' || aiStats.riskLevel === 'high') {
      recs.push({
        id: 'strategic_recovery',
        type: 'strategic',
        title: '📊 Plan de récupération catalogue',
        description: 'Votre catalogue nécessite une intervention structurée pour remonter au-dessus de 70%',
        impact: 'high',
        effort: 'significant',
        estimatedScoreGain: 30,
        estimatedTimeMinutes: 120,
        affectedProducts: metrics.blockingCount + metrics.toProcessCount,
        actionType: 'recovery_plan',
        priority: 1
      })
    }

    // Automatisations suggérées
    if (aiStats.automationPotential > 30) {
      recs.push({
        id: 'setup_automation',
        type: 'automation',
        title: '⚡ Configurer l\'automatisation',
        description: `${aiStats.automationPotential}% de vos problèmes peuvent être résolus automatiquement`,
        impact: 'high',
        effort: 'moderate',
        estimatedScoreGain: Math.round(aiStats.automationPotential * 0.3),
        estimatedTimeMinutes: 30,
        affectedProducts: Math.round(metrics.total * aiStats.automationPotential / 100),
        actionType: 'setup_automation',
        priority: 2
      })
    }

    // Batch fixes
    aiStats.priorityActions
      .filter(a => a.affectedProducts > 10)
      .slice(0, 2)
      .forEach((action, idx) => {
        recs.push({
          id: `batch_${action.id}`,
          type: 'batch_fix',
          title: `🔧 Correction en lot: ${action.category}`,
          description: `Traiter ${action.affectedProducts} produits en une seule opération`,
          impact: action.impactScore > 50 ? 'high' : 'medium',
          effort: 'moderate',
          estimatedScoreGain: action.estimatedGain,
          estimatedTimeMinutes: action.affectedProducts * 0.2,
          affectedProducts: action.affectedProducts,
          actionType: `batch_${action.id}`,
          priority: 5 + idx
        })
      })

    return recs.sort((a, b) => a.priority - b.priority)
  }, [aiStats, metrics])

  return {
    recommendations,
    isLoading: !aiStats
  }
}

/**
 * Hook pour appliquer une recommandation de santé via edge function
 */
export function useApplyHealthRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recommendation: HealthRecommendation) => {
      console.log('[Health AI] Applying recommendation:', recommendation.actionType)
      
      const { data, error } = await supabase.functions.invoke('catalog-ai-hub', {
        body: {
          module: 'health',
          action: 'apply',
          recommendationId: recommendation.actionType,
          productIds: [],
          context: { recommendation }
        }
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Failed to apply recommendation')

      return {
        success: true,
        appliedTo: data.result?.updatedCount || recommendation.affectedProducts,
        scoreGain: recommendation.estimatedScoreGain,
        message: data.result?.message
      }
    },
    onSuccess: (data, recommendation) => {
      toast.success(`✅ ${recommendation.title} appliquée`, {
        description: data.message || `${data.appliedTo} produits traités • +${data.scoreGain} pts de score`
      })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-ai-recommendations'] })
    },
    onError: (error) => {
      console.error('[Health AI] Apply error:', error)
      toast.error('Erreur lors de l\'application', {
        description: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }
  })
}

/**
 * Hook pour récupérer les recommandations IA depuis le backend
 */
export function useAIRecommendationsFromBackend(module: 'health' | 'backlog' | 'media' | 'variants' | 'attributes' | 'categories') {
  return useQuery({
    queryKey: ['catalog-ai-recommendations', module],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('catalog-ai-hub', {
        body: { module, action: 'recommend' }
      })

      if (error) throw error
      return data?.data || { recommendations: [], insights: [] }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })
}
