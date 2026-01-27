/**
 * Command Center V3 - Phase 3: Predictive Command Center - Optimized
 * Complete integration of predictive insights with lazy loading
 */

import { memo, useCallback, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { usePriceRules } from '@/hooks/usePriceRules'
import { ProductAuditResult } from '@/types/audit'

import { CommandCenterHeaderV3 } from './CommandCenterHeaderV3'
import { PriorityCardsGrid } from './PriorityActionCard'
import { KPIFeedbackBar } from './KPIFeedbackBar'
import { useAIPriorityEngine, PriorityCard } from './useAIPriorityEngine'
import { usePredictiveInsights, PredictiveAlert } from './usePredictiveInsights'
import { SmartFilterType } from '../types'
import { aggregateProductKPIs } from './utils/calculations'
import { PanelSkeleton, PriorityCardsSkeleton, KPIBarSkeleton, HeaderSkeleton } from './utils/skeletons'

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

interface PredictiveCommandCenterProps {
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

export const PredictiveCommandCenter = memo(function PredictiveCommandCenter({
  products,
  auditResults,
  onFilterChange,
  onProductSelect,
  isLoading = false
}: PredictiveCommandCenterProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: priceRules = [] } = usePriceRules()
  
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
  
  // Memoized KPI data using centralized aggregation
  const kpiData = aggregateProductKPIs(products)
  
  const hasIssues = priorityCards.some(card => card.count > 0)
  const totalIssues = priorityCards.reduce((sum, card) => sum + card.count, 0)
  
  // Memoized handlers
  const handleCardAction = useCallback((card: PriorityCard, action: 'primary' | 'secondary') => {
    const filter = FILTER_MAP[card.type] || 'all'
    
    if (action === 'primary') {
      onFilterChange(filter)
      
      switch (card.type) {
        case 'stock_critical':
          toast({ title: 'Synchronisation', description: `Préparation de ${card.count} produits à synchroniser...` })
          break
        case 'no_price_rule':
          navigate('/pricing/rules')
          toast({ title: 'Règles de prix', description: 'Configurez vos règles de tarification' })
          break
        case 'ai_opportunities':
          toast({ title: 'Optimisation IA', description: `Analyse de ${card.count} opportunités en cours...` })
          break
        case 'not_synced':
          toast({ title: 'Resynchronisation', description: `${card.count} produits en cours de synchronisation...` })
          break
        case 'quality_low':
          navigate('/audit/scoring')
          break
        case 'margin_loss':
          navigate('/pricing/optimization')
          break
      }
      
      onProductSelect?.(card.productIds)
    } else {
      onFilterChange(filter)
      toast({ title: 'Filtre appliqué', description: `${card.count} produits affichés` })
    }
  }, [onFilterChange, onProductSelect, navigate, toast])

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
  
  // Loading state
  if (isLoading) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <HeaderSkeleton />
        <PriorityCardsSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={3} />
        </div>
        <KPIBarSkeleton />
      </motion.div>
    )
  }
  
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

      {/* Predictive Insights Row - Lazy Loaded */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
      
      {/* KPI Feedback Bar */}
      <KPIFeedbackBar
        data={kpiData}
        isLoading={isLoading}
        currency="€"
      />
    </motion.div>
  )
})
