/**
 * Prescriptive Command Center V3
 * Hub de pilotage business prescriptif - pas seulement informatif
 * Hiérarchie visuelle radicale : action first
 */

import { memo, useCallback, useState, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { usePriceRules } from '@/hooks/usePriceRules'
import { ProductAuditResult } from '@/types/audit'

import { PrescriptiveHeader } from './PrescriptiveHeader'
import { PriorityCardsGrid } from './PriorityActionCard'
import { CollapsibleKPIBar } from './CollapsibleKPIBar'
import { ActionCelebrationModal, ActionResult } from './ActionCelebrationModal'
import { useAIPriorityEngine, PriorityCard } from './useAIPriorityEngine'
import { usePredictiveInsights, PredictiveAlert } from './usePredictiveInsights'
import { SmartFilterType } from '../types'
import { aggregateProductKPIs } from './utils/calculations'
import { PanelSkeleton, PriorityCardsSkeleton, HeaderSkeleton } from './utils/skeletons'
import { PRIORITY_CARD_CONFIG } from './labels'

// Lazy load heavy panels
const PredictiveAlertsPanel = lazy(() => 
  import('./PredictiveAlertsPanel').then(m => ({ default: m.PredictiveAlertsPanel }))
)
const ROIDashboardPanel = lazy(() => 
  import('./ROIDashboardPanel').then(m => ({ default: m.ROIDashboardPanel }))
)
const TrendAnalysisPanel = lazy(() => 
  import('./TrendAnalysisPanel').then(m => ({ default: m.TrendAnalysisPanel }))
)

interface GenericProduct {
  id: string
  name?: string
  stock_quantity?: number
  profit_margin?: number
  price?: number
  cost_price?: number
  updated_at?: string
}

interface PrescriptiveCommandCenterV3Props {
  products: GenericProduct[]
  auditResults: ProductAuditResult[]
  onFilterChange: (filter: SmartFilterType) => void
  onProductSelect?: (productIds: string[]) => void
  isLoading?: boolean
}

// Filter map constant
const FILTER_MAP: Record<string, SmartFilterType> = {
  stock_critical: 'at_risk',
  no_price_rule: 'no_price_rule',
  ai_opportunities: 'ai_recommended',
  not_synced: 'not_synced',
  quality_low: 'at_risk',
  margin_loss: 'losing_margin'
} as const

export const PrescriptiveCommandCenterV3 = memo(function PrescriptiveCommandCenterV3({
  products,
  auditResults,
  onFilterChange,
  onProductSelect,
  isLoading = false
}: PrescriptiveCommandCenterV3Props) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: priceRules = [] } = usePriceRules()
  
  // State for action feedback
  const [actionResult, setActionResult] = useState<ActionResult | null>(null)
  const [processingCardType, setProcessingCardType] = useState<string | null>(null)
  const [previousKPIs, setPreviousKPIs] = useState<typeof kpiData | undefined>()
  const [highlightedKPI, setHighlightedKPI] = useState<'avg_margin' | 'stock_value' | 'potential_profit' | 'profitable_products' | undefined>()
  
  // AI Priority Engine
  const priceRulesActive = priceRules.some((r: any) => r.is_active && r.apply_to === 'all')
  const { priorityCards, metrics } = useAIPriorityEngine({
    products,
    auditResults,
    priceRulesActive
  })
  
  // Predictive Insights
  const { 
    predictiveAlerts, 
    roiMetrics, 
    trendAnalysis,
    isLoading: predictiveLoading 
  } = usePredictiveInsights(products, auditResults)
  
  // Memoized KPI data
  const kpiData = aggregateProductKPIs(products)
  
  const hasIssues = priorityCards.some(card => card.count > 0)
  const totalIssues = priorityCards.reduce((sum, card) => sum + card.count, 0)
  
  // Get top priority action label
  const topPriorityCard = priorityCards.find(c => c.count > 0)
  const topPriorityAction = topPriorityCard 
    ? `${PRIORITY_CARD_CONFIG[topPriorityCard.type].ctaPrimary} ${topPriorityCard.count} produits`
    : undefined
  
  // Action handler with celebration feedback
  const handleCardAction = useCallback(async (card: PriorityCard, action: 'primary' | 'secondary') => {
    const filter = FILTER_MAP[card.type] || 'all'
    const config = PRIORITY_CARD_CONFIG[card.type]
    
    if (action === 'primary') {
      // Store previous KPIs for comparison
      setPreviousKPIs(kpiData)
      setProcessingCardType(card.type)
      
      // Apply filter
      onFilterChange(filter)
      
      // Simulate processing delay for demo
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Type-specific actions with celebration
      switch (card.type) {
        case 'stock_critical':
          toast({ title: 'Synchronisation', description: `Préparation de ${card.count} produits...` })
          setActionResult({
            type: 'success',
            title: 'Stock synchronisé',
            description: `${card.count} produits mis à jour`,
            riskReduced: 15,
            metrics: [
              { label: 'Produits traités', after: card.count, unit: '' },
              { label: 'Risque rupture', before: card.count, after: 0, unit: ' produits', improvement: true }
            ]
          })
          setHighlightedKPI('stock_value')
          break
          
        case 'no_price_rule':
          navigate('/pricing/rules')
          toast({ title: 'Règles de prix', description: 'Configurez vos règles de tarification' })
          break
          
        case 'ai_opportunities':
          toast({ title: 'Optimisation IA', description: `Analyse de ${card.count} opportunités...` })
          setActionResult({
            type: 'success',
            title: 'Optimisation lancée',
            description: `${card.count} produits en cours d'optimisation`,
            estimatedGain: card.estimatedImpact,
            scoreImprovement: 8,
            metrics: [
              { label: 'Gain potentiel', after: card.estimatedImpact, unit: '€' },
              { label: 'Produits optimisés', after: card.count, unit: '' }
            ]
          })
          setHighlightedKPI('potential_profit')
          break
          
        case 'not_synced':
          toast({ title: 'Resynchronisation', description: `${card.count} produits en cours...` })
          setActionResult({
            type: 'success',
            title: 'Synchronisation terminée',
            description: `${card.count} produits visibles en boutique`,
            metrics: [
              { label: 'Produits synchronisés', after: card.count, unit: '' }
            ]
          })
          break
          
        case 'quality_low':
          navigate('/audit/scoring')
          break
          
        case 'margin_loss':
          navigate('/pricing/optimization')
          setActionResult({
            type: 'info',
            title: 'Analyse des marges',
            description: 'Redirection vers l\'optimisation prix',
            estimatedGain: card.estimatedImpact
          })
          setHighlightedKPI('avg_margin')
          break
      }
      
      // Select products
      onProductSelect?.(card.productIds)
      setProcessingCardType(null)
      
    } else {
      // Secondary action: just filter
      onFilterChange(filter)
      toast({ title: 'Filtre appliqué', description: `${card.count} produits affichés` })
    }
  }, [onFilterChange, onProductSelect, navigate, toast, kpiData])

  const handleAlertAction = useCallback((alert: PredictiveAlert) => {
    switch (alert.type) {
      case 'stockout':
        onFilterChange('at_risk')
        toast({ title: 'Stock critique', description: 'Affichage des produits en rupture prévue' })
        break
      case 'margin_decline':
        onFilterChange('losing_margin')
        toast({ title: 'Marge critique', description: 'Affichage des produits à faible marge' })
        break
      case 'opportunity':
        onFilterChange('ai_recommended')
        toast({ title: 'Opportunités', description: 'Affichage des produits à fort potentiel' })
        break
    }
    onProductSelect?.([alert.productId])
  }, [onFilterChange, onProductSelect, toast])

  const handleCategoryFilter = useCallback((category: string) => {
    toast({ title: 'Filtre catégorie', description: `Filtrage sur: ${category}` })
  }, [toast])

  const handleViewAllAlerts = useCallback(() => {
    navigate('/analytics/predictions')
  }, [navigate])
  
  const handleCloseActionResult = useCallback(() => {
    setActionResult(null)
    setHighlightedKPI(undefined)
    setPreviousKPIs(undefined)
  }, [])
  
  // Loading state
  if (isLoading) {
    return (
      <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <HeaderSkeleton />
        <PriorityCardsSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={3} />
        </div>
      </motion.div>
    )
  }
  
  return (
    <>
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Prescriptive Header - Dominant */}
        <PrescriptiveHeader
          hasIssues={hasIssues}
          totalIssues={totalIssues}
          healthScore={metrics.healthScore}
          estimatedPotentialGain={metrics.estimatedPotentialGain}
          topPriorityAction={topPriorityAction}
          isLoading={isLoading}
        />
        
        {/* Priority Cards Grid - Zone principale d'action */}
        <PriorityCardsGrid
          cards={priorityCards}
          onCardAction={handleCardAction}
          isLoading={isLoading}
          maxCards={4}
          processingCardType={processingCardType as any}
        />

        {/* Predictive Insights Row - Secondary importance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Suspense fallback={<PanelSkeleton rows={3} />}>
            <PredictiveAlertsPanel
              alerts={predictiveAlerts}
              onAlertAction={handleAlertAction}
              onViewAll={handleViewAllAlerts}
              isLoading={predictiveLoading}
            />
          </Suspense>

          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <ROIDashboardPanel
              metrics={roiMetrics}
              isLoading={predictiveLoading}
            />
          </Suspense>

          <Suspense fallback={<PanelSkeleton rows={3} />}>
            <TrendAnalysisPanel
              trends={trendAnalysis}
              onCategoryClick={handleCategoryFilter}
              isLoading={predictiveLoading}
            />
          </Suspense>
        </div>
        
        {/* KPI Feedback Bar - Collapsed by default, feedback post-action */}
        <CollapsibleKPIBar
          data={kpiData}
          previousData={previousKPIs}
          isLoading={isLoading}
          currency="€"
          defaultExpanded={false}
          highlightedKPI={highlightedKPI}
        />
      </motion.div>
      
      {/* Action Celebration Modal */}
      <ActionCelebrationModal
        result={actionResult}
        onClose={handleCloseActionResult}
        autoCloseDelay={4000}
      />
    </>
  )
})
