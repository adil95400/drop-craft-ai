/**
 * useProductBacklogAI - Intelligence artificielle pour le backlog produit
 * Phase 2: Analyse prédictive et actions automatisées
 * Connecté au edge function catalog-ai-hub
 */
import { useMemo } from 'react'
import { useProductBacklog, BacklogItem } from './useProductBacklog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface BacklogAIStats {
  efficiencyScore: number // 0-100
  potentialGainPerHour: number // € saved per hour of work
  automationPotential: number // % of tasks automatable
  urgencyDistribution: {
    critical: number
    high: number
    medium: number
    low: number
  }
  topIssueTypes: Array<{
    type: string
    count: number
    totalImpact: number
  }>
}

export interface BacklogRecommendation {
  id: string
  type: 'batch_restock' | 'price_optimization' | 'media_enrichment' | 'category_mapping' | 'automation_rule'
  title: string
  description: string
  affectedProducts: number
  estimatedImpact: number
  estimatedTime: string
  priority: 'critical' | 'high' | 'medium'
  actionLabel: string
}

export function useBacklogAIStats() {
  const { backlogItems, counts, totalEstimatedImpact } = useProductBacklog()

  const stats = useMemo<BacklogAIStats>(() => {
    if (backlogItems.length === 0) {
      return {
        efficiencyScore: 100,
        potentialGainPerHour: 0,
        automationPotential: 0,
        urgencyDistribution: { critical: 0, high: 0, medium: 0, low: 0 },
        topIssueTypes: []
      }
    }

    // Calculate urgency distribution
    const urgencyDistribution = {
      critical: backlogItems.filter(i => i.priority === 'critical').length,
      high: backlogItems.filter(i => i.priority === 'high').length,
      medium: backlogItems.filter(i => i.priority === 'medium').length,
      low: backlogItems.filter(i => i.priority === 'low').length
    }

    // Calculate efficiency score (inverse of problem severity)
    const avgScore = backlogItems.reduce((sum, i) => sum + i.score, 0) / backlogItems.length
    const efficiencyScore = Math.max(0, Math.round(100 - avgScore))

    // Estimate time to process (5 min per simple issue, 15 min per critical)
    const estimatedMinutes = backlogItems.reduce((sum, item) => {
      if (item.priority === 'critical') return sum + 15
      if (item.priority === 'high') return sum + 10
      return sum + 5
    }, 0)
    const estimatedHours = estimatedMinutes / 60
    const potentialGainPerHour = estimatedHours > 0 ? Math.round(totalEstimatedImpact / estimatedHours) : 0

    // Automation potential based on issue types
    const automatableIssues = backlogItems.filter(item =>
      item.reasons.some(r => 
        r.includes('Image') || 
        r.includes('Catégorie') || 
        r.includes('Marge')
      )
    ).length
    const automationPotential = Math.round((automatableIssues / backlogItems.length) * 100)

    // Group by issue type
    const issueTypeMap = new Map<string, { count: number; impact: number }>()
    for (const item of backlogItems) {
      for (const reason of item.reasons) {
        const key = reason.split('(')[0].trim()
        const existing = issueTypeMap.get(key) || { count: 0, impact: 0 }
        issueTypeMap.set(key, {
          count: existing.count + 1,
          impact: existing.impact + item.estimatedImpact
        })
      }
    }

    const topIssueTypes = Array.from(issueTypeMap.entries())
      .map(([type, data]) => ({ type, count: data.count, totalImpact: data.impact }))
      .sort((a, b) => b.totalImpact - a.totalImpact)
      .slice(0, 5)

    return {
      efficiencyScore,
      potentialGainPerHour,
      automationPotential,
      urgencyDistribution,
      topIssueTypes
    }
  }, [backlogItems, totalEstimatedImpact])

  return { stats, isLoading: false }
}

export function useBacklogRecommendations() {
  const { backlogItems, counts } = useProductBacklog()

  const recommendations = useMemo<BacklogRecommendation[]>(() => {
    const recs: BacklogRecommendation[] = []

    // Group items by issue type for batch recommendations
    const stockIssues = backlogItems.filter(i => 
      i.reasons.some(r => r.includes('stock') || r.includes('Rupture'))
    )
    const marginIssues = backlogItems.filter(i => 
      i.reasons.some(r => r.includes('Marge'))
    )
    const imageIssues = backlogItems.filter(i => 
      i.reasons.some(r => r.includes('Image'))
    )
    const categoryIssues = backlogItems.filter(i => 
      i.reasons.some(r => r.includes('Catégorie'))
    )

    // Batch restock recommendation
    if (stockIssues.length >= 3) {
      const totalImpact = stockIssues.reduce((sum, i) => sum + i.estimatedImpact, 0)
      recs.push({
        id: 'batch_restock',
        type: 'batch_restock',
        title: 'Réapprovisionnement groupé',
        description: `${stockIssues.length} produits avec stock critique. Créer une commande fournisseur groupée pour optimiser les frais.`,
        affectedProducts: stockIssues.length,
        estimatedImpact: totalImpact,
        estimatedTime: '15 min',
        priority: 'critical',
        actionLabel: 'Créer commande groupée'
      })
    }

    // Price optimization recommendation
    if (marginIssues.length >= 2) {
      const totalImpact = marginIssues.reduce((sum, i) => sum + i.estimatedImpact, 0)
      recs.push({
        id: 'price_optimization',
        type: 'price_optimization',
        title: 'Optimisation tarifaire IA',
        description: `Appliquer une règle de marge automatique sur ${marginIssues.length} produits sous-performants.`,
        affectedProducts: marginIssues.length,
        estimatedImpact: totalImpact,
        estimatedTime: '5 min',
        priority: 'high',
        actionLabel: 'Créer règle de prix'
      })
    }

    // Media enrichment recommendation
    if (imageIssues.length >= 2) {
      const totalImpact = imageIssues.reduce((sum, i) => sum + i.estimatedImpact, 0)
      recs.push({
        id: 'media_enrichment',
        type: 'media_enrichment',
        title: 'Enrichissement média IA',
        description: `${imageIssues.length} produits sans image. Lancer une recherche automatique depuis les fournisseurs.`,
        affectedProducts: imageIssues.length,
        estimatedImpact: totalImpact,
        estimatedTime: '10 min',
        priority: 'high',
        actionLabel: 'Enrichir les images'
      })
    }

    // Category mapping recommendation
    if (categoryIssues.length >= 2) {
      recs.push({
        id: 'category_mapping',
        type: 'category_mapping',
        title: 'Classification automatique',
        description: `Classifier automatiquement ${categoryIssues.length} produits sans catégorie avec l'IA.`,
        affectedProducts: categoryIssues.length,
        estimatedImpact: categoryIssues.length * 5, // Small SEO impact
        estimatedTime: '2 min',
        priority: 'medium',
        actionLabel: 'Classifier avec IA'
      })
    }

    // Automation rule suggestion
    if (counts.total >= 10) {
      recs.push({
        id: 'automation_rule',
        type: 'automation_rule',
        title: 'Créer une règle d\'automatisation',
        description: `Avec ${counts.total} produits à traiter régulièrement, une règle automatique réduirait ce backlog de 70%.`,
        affectedProducts: Math.round(counts.total * 0.7),
        estimatedImpact: 0,
        estimatedTime: '10 min',
        priority: 'medium',
        actionLabel: 'Créer une règle'
      })
    }

    return recs.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [backlogItems, counts])

  return { recommendations, isLoading: false }
}

export function useApplyBacklogRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recommendation: BacklogRecommendation) => {
      console.log('[Backlog AI] Applying recommendation:', recommendation.type)
      
      const { data, error } = await supabase.functions.invoke('catalog-ai-hub', {
        body: {
          module: 'backlog',
          action: 'apply',
          recommendationId: recommendation.type,
          context: { recommendation }
        }
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Failed to apply recommendation')

      return {
        success: true,
        processed: data.result?.updatedCount || recommendation.affectedProducts,
        recommendation,
        message: data.result?.message
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-ai-recommendations'] })
      toast.success(
        `✅ ${data.recommendation.title}`,
        { description: data.message || `${data.processed} produits traités. Impact: +${data.recommendation.estimatedImpact}€` }
      )
    },
    onError: (error) => {
      console.error('[Backlog AI] Apply error:', error)
      toast.error('Erreur lors de l\'application de la recommandation', {
        description: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }
  })
}
