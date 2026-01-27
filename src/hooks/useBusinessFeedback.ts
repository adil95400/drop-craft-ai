/**
 * Business Feedback Hook
 * Provides enriched toast notifications with business impact metrics
 */

import { useCallback } from 'react'
import { toast } from '@/hooks/use-toast'

export type FeedbackType = 'success' | 'warning' | 'info' | 'risk_eliminated' | 'opportunity_captured'

export interface BusinessImpact {
  gain?: number
  gainPercent?: number
  riskReduced?: number
  productsAffected?: number
  marginImproved?: number
}

export interface BusinessFeedbackOptions {
  type: FeedbackType
  title: string
  description?: string
  impact?: BusinessImpact
  actionLabel?: string
  actionHref?: string
  currency?: string
}

// Format currency with locale
function formatCurrency(amount: number, currency = '€'): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
  return `${formatted} ${currency}`
}

// Build impact message from metrics
function buildImpactMessage(impact: BusinessImpact, currency = '€'): string {
  const parts: string[] = []
  
  if (impact.gain && impact.gain > 0) {
    parts.push(`+${formatCurrency(impact.gain, currency)} potentiel`)
  }
  
  if (impact.gainPercent && impact.gainPercent > 0) {
    parts.push(`+${impact.gainPercent.toFixed(1)}% de marge`)
  }
  
  if (impact.riskReduced && impact.riskReduced > 0) {
    parts.push(`${impact.riskReduced} risque${impact.riskReduced > 1 ? 's' : ''} éliminé${impact.riskReduced > 1 ? 's' : ''}`)
  }
  
  if (impact.productsAffected && impact.productsAffected > 0) {
    parts.push(`${impact.productsAffected} produit${impact.productsAffected > 1 ? 's' : ''} optimisé${impact.productsAffected > 1 ? 's' : ''}`)
  }
  
  if (impact.marginImproved && impact.marginImproved > 0) {
    parts.push(`Marge +${impact.marginImproved.toFixed(1)}%`)
  }
  
  return parts.join(' • ')
}

export function useBusinessFeedback() {
  const showFeedback = useCallback((options: BusinessFeedbackOptions) => {
    const { type, title, description, impact, currency = '€' } = options
    
    // Build the enriched description with impact metrics
    let enrichedDescription = description || ''
    
    if (impact) {
      const impactMessage = buildImpactMessage(impact, currency)
      if (impactMessage) {
        enrichedDescription = impactMessage
      }
    }
    
    // Determine variant based on type
    const variant = type === 'warning' ? 'destructive' : 'default'
    
    // Show the toast
    toast({
      title,
      description: enrichedDescription || undefined,
      variant,
      duration: 5000,
    })
    
    // Return impact for potential KPI animation triggers
    return { impact, type }
  }, [])
  
  // Convenience methods for common feedback scenarios
  const showOptimizationSuccess = useCallback((
    productsCount: number, 
    estimatedGain: number,
    currency = '€'
  ) => {
    return showFeedback({
      type: 'opportunity_captured',
      title: 'Optimisation appliquée',
      impact: {
        gain: estimatedGain,
        productsAffected: productsCount
      },
      currency
    })
  }, [showFeedback])
  
  const showRiskEliminated = useCallback((
    riskCount: number,
    description?: string
  ) => {
    return showFeedback({
      type: 'risk_eliminated',
      title: 'Risques corrigés',
      description,
      impact: {
        riskReduced: riskCount
      }
    })
  }, [showFeedback])
  
  const showMarginImproved = useCallback((
    marginPercent: number,
    productsCount: number
  ) => {
    return showFeedback({
      type: 'success',
      title: 'Marge optimisée',
      impact: {
        marginImproved: marginPercent,
        productsAffected: productsCount
      }
    })
  }, [showFeedback])
  
  const showSyncComplete = useCallback((productsCount: number) => {
    return showFeedback({
      type: 'success',
      title: 'Synchronisation terminée',
      impact: {
        productsAffected: productsCount
      }
    })
  }, [showFeedback])
  
  const showPriceRuleApplied = useCallback((
    productsCount: number,
    estimatedGain: number,
    currency = '€'
  ) => {
    return showFeedback({
      type: 'opportunity_captured',
      title: 'Règle de prix appliquée',
      impact: {
        gain: estimatedGain,
        productsAffected: productsCount
      },
      currency
    })
  }, [showFeedback])
  
  return {
    showFeedback,
    showOptimizationSuccess,
    showRiskEliminated,
    showMarginImproved,
    showSyncComplete,
    showPriceRuleApplied
  }
}
