/**
 * Command Center V3 - Section principale
 * Intègre Header, Priority Cards et KPI Feedback
 * Sprint 3: Enhanced with business feedback and KPI animations
 */

import { motion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePriceRules } from '@/hooks/usePriceRules'
import { useBusinessFeedback } from '@/hooks/useBusinessFeedback'
import { ProductAuditResult } from '@/types/audit'

import { CommandCenterHeaderV3 } from './CommandCenterHeaderV3'
import { PriorityCardsGrid } from './PriorityActionCard'
import { KPIFeedbackBar } from './KPIFeedbackBar'
import { useAIPriorityEngine, PriorityCard } from './useAIPriorityEngine'
import { SmartFilterType } from '../types'

interface GenericProduct {
  id: string
  name?: string
  stock_quantity?: number
  profit_margin?: number
  price?: number
  cost_price?: number
  updated_at?: string
}

interface CommandCenterV3Props {
  products: GenericProduct[]
  auditResults: ProductAuditResult[]
  onFilterChange: (filter: SmartFilterType) => void
  onProductSelect?: (productIds: string[]) => void
  isLoading?: boolean
}

export function CommandCenterV3({
  products,
  auditResults,
  onFilterChange,
  onProductSelect,
  isLoading = false
}: CommandCenterV3Props) {
  const navigate = useNavigate()
  const { data: priceRules = [] } = usePriceRules()
  
  // Business feedback hook for enriched toasts
  const { 
    showOptimizationSuccess, 
    showRiskEliminated, 
    showPriceRuleApplied,
    showSyncComplete 
  } = useBusinessFeedback()
  
  // State for KPI highlight animation
  const [highlightedKPI, setHighlightedKPI] = useState<string | undefined>()
  
  // AI Priority Engine
  const priceRulesActive = priceRules.some(r => r.is_active && r.apply_to === 'all')
  const { priorityCards, metrics } = useAIPriorityEngine({
    products,
    auditResults,
    priceRulesActive
  })
  
  // Calculer les KPIs avec utilitaire centralisé
  const kpiData = useMemo(() => {
    let totalMargin = 0
    let stockValue = 0
    let potentialProfit = 0
    let profitableProducts = 0
    let totalCost = 0
    let totalRevenue = 0

    for (const p of products) {
      const price = p.price ?? 0
      const cost = p.cost_price ?? 0
      const stock = p.stock_quantity ?? 0
      const margin = p.profit_margin ?? calculateMargin(price, cost)

      totalMargin += margin
      stockValue += price * stock
      potentialProfit += (price * margin / 100) * stock
      totalCost += cost * stock
      totalRevenue += price * stock

      if (margin >= 20) profitableProducts++
    }

    return {
      avgMargin: totalMargin / Math.max(products.length, 1),
      stockValue,
      potentialProfit,
      profitableProducts,
      totalProducts: products.length,
      totalCost,
      totalRevenue
    }
  }, [products])
  
  const hasIssues = priorityCards.some(card => card.count > 0)
  const totalIssues = priorityCards.reduce((sum, card) => sum + card.count, 0)
  
  // Helper to trigger KPI highlight
  const triggerKPIHighlight = useCallback((kpiKey: string) => {
    setHighlightedKPI(kpiKey)
    setTimeout(() => setHighlightedKPI(undefined), 1000)
  }, [])
  
  // Handlers with enriched business feedback
  const handleCardAction = useCallback((card: PriorityCard, action: 'primary' | 'secondary') => {
    // Map card type to smart filter
    const filterMap: Record<string, SmartFilterType> = {
      stock_critical: 'at_risk',
      no_price_rule: 'no_price_rule',
      ai_opportunities: 'ai_recommended',
      not_synced: 'not_synced',
      quality_low: 'at_risk',
      margin_loss: 'losing_margin'
    }
    
    // Estimate potential gain based on card type
    const estimateGain = (type: string, count: number): number => {
      const gainPerProduct: Record<string, number> = {
        stock_critical: 15,
        no_price_rule: 25,
        ai_opportunities: 50,
        margin_loss: 35,
        quality_low: 20,
        not_synced: 10
      }
      return (gainPerProduct[type] || 10) * count
    }
    
    if (action === 'primary') {
      // Action principale: appliquer le filtre + déclencher l'action avec feedback enrichi
      onFilterChange(filterMap[card.type] || 'all')
      
      // Actions spécifiques par type avec business feedback
      switch (card.type) {
        case 'stock_critical':
          showSyncComplete(card.count)
          triggerKPIHighlight('stock_value')
          break
        case 'no_price_rule':
          navigate('/pricing/rules')
          showPriceRuleApplied(card.count, estimateGain(card.type, card.count))
          triggerKPIHighlight('potential_profit')
          break
        case 'ai_opportunities':
          showOptimizationSuccess(card.count, estimateGain(card.type, card.count))
          triggerKPIHighlight('potential_profit')
          break
        case 'not_synced':
          showSyncComplete(card.count)
          break
        case 'quality_low':
          navigate('/audit/scoring')
          showRiskEliminated(card.count)
          break
        case 'margin_loss':
          navigate('/pricing/optimization')
          showOptimizationSuccess(card.count, estimateGain(card.type, card.count))
          triggerKPIHighlight('avg_margin')
          break
      }
      
      // Sélectionner les produits concernés
      onProductSelect?.(card.productIds)
    } else {
      // Action secondaire: juste filtrer avec feedback léger
      onFilterChange(filterMap[card.type] || 'all')
      showOptimizationSuccess(card.count, 0)
    }
  }, [onFilterChange, onProductSelect, navigate, showOptimizationSuccess, showRiskEliminated, showPriceRuleApplied, showSyncComplete, triggerKPIHighlight])
  
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header V3 avec badge IA */}
      <CommandCenterHeaderV3
        hasIssues={hasIssues}
        totalIssues={totalIssues}
        healthScore={metrics.healthScore}
        estimatedPotentialGain={metrics.estimatedPotentialGain}
        isLoading={isLoading}
      />
      
      {/* Priority Cards Grid */}
      <PriorityCardsGrid
        cards={priorityCards}
        onCardAction={handleCardAction}
        isLoading={isLoading}
        maxCards={4}
      />
      
      {/* KPI Feedback Bar with highlight animation */}
      <KPIFeedbackBar
        data={kpiData}
        isLoading={isLoading}
        currency="€"
        highlightedKPI={highlightedKPI}
      />
    </motion.div>
  )
}

function calculateMargin(price?: number, costPrice?: number): number {
  if (!price || !costPrice || price === 0) return 0
  return ((price - costPrice) / price) * 100
}
