/**
 * Command Center V3 - Phase 3: Predictive Command Center
 * Complete integration of predictive insights
 */

import { motion } from 'framer-motion'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { usePriceRules } from '@/hooks/usePriceRules'
import { ProductAuditResult } from '@/types/audit'

import { CommandCenterHeaderV3 } from './CommandCenterHeaderV3'
import { PriorityCardsGrid } from './PriorityActionCard'
import { KPIFeedbackBar } from './KPIFeedbackBar'
import { PredictiveAlertsPanel } from './PredictiveAlertsPanel'
import { ROIDashboardPanel } from './ROIDashboardPanel'
import { TrendAnalysisPanel } from './TrendAnalysisPanel'
import { useAIPriorityEngine, PriorityCard } from './useAIPriorityEngine'
import { usePredictiveInsights, PredictiveAlert } from './usePredictiveInsights'
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

interface PredictiveCommandCenterProps {
  products: GenericProduct[]
  auditResults: ProductAuditResult[]
  onFilterChange: (filter: SmartFilterType) => void
  onProductSelect?: (productIds: string[]) => void
  isLoading?: boolean
}

export function PredictiveCommandCenter({
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
  const priceRulesActive = priceRules.some(r => r.is_active && r.apply_to === 'all')
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
  
  // Calculer les KPIs
  const kpiData = {
    avgMargin: products.reduce((sum, p) => {
      const margin = p.profit_margin ?? calculateMargin(p.price, p.cost_price)
      return sum + margin
    }, 0) / Math.max(products.length, 1),
    stockValue: products.reduce((sum, p) => sum + (p.price ?? 0) * (p.stock_quantity ?? 0), 0),
    potentialProfit: products.reduce((sum, p) => {
      const margin = p.profit_margin ?? calculateMargin(p.price, p.cost_price)
      return sum + ((p.price ?? 0) * margin / 100 * (p.stock_quantity ?? 0))
    }, 0),
    profitableProducts: products.filter(p => {
      const margin = p.profit_margin ?? calculateMargin(p.price, p.cost_price)
      return margin >= 20
    }).length,
    totalProducts: products.length
  }
  
  const hasIssues = priorityCards.some(card => card.count > 0)
  const totalIssues = priorityCards.reduce((sum, card) => sum + card.count, 0)
  
  // Handlers
  const handleCardAction = useCallback((card: PriorityCard, action: 'primary' | 'secondary') => {
    const filterMap: Record<string, SmartFilterType> = {
      stock_critical: 'at_risk',
      no_price_rule: 'no_price_rule',
      ai_opportunities: 'ai_recommended',
      not_synced: 'not_synced',
      quality_low: 'at_risk',
      margin_loss: 'losing_margin'
    }
    
    if (action === 'primary') {
      onFilterChange(filterMap[card.type] || 'all')
      
      switch (card.type) {
        case 'stock_critical':
          toast({ 
            title: 'Synchronisation', 
            description: `Préparation de ${card.count} produits à synchroniser...` 
          })
          break
        case 'no_price_rule':
          navigate('/pricing/rules')
          toast({ 
            title: 'Règles de prix', 
            description: 'Configurez vos règles de tarification' 
          })
          break
        case 'ai_opportunities':
          toast({ 
            title: 'Optimisation IA', 
            description: `Analyse de ${card.count} opportunités en cours...` 
          })
          break
        case 'not_synced':
          toast({ 
            title: 'Resynchronisation', 
            description: `${card.count} produits en cours de synchronisation...` 
          })
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
      onFilterChange(filterMap[card.type] || 'all')
      toast({ 
        title: 'Filtre appliqué', 
        description: `${card.count} produits affichés` 
      })
    }
  }, [onFilterChange, onProductSelect, navigate, toast])

  const handleAlertAction = useCallback((alert: PredictiveAlert) => {
    switch (alert.type) {
      case 'stockout':
        onFilterChange('at_risk')
        toast({
          title: 'Stock critique',
          description: `Affichage des produits en rupture prévue`
        })
        break
      case 'margin_decline':
        onFilterChange('losing_margin')
        toast({
          title: 'Marge critique',
          description: 'Affichage des produits à faible marge'
        })
        break
      case 'opportunity':
        onFilterChange('ai_recommended')
        toast({
          title: 'Opportunités',
          description: 'Affichage des produits à fort potentiel'
        })
        break
    }
    onProductSelect?.([alert.productId])
  }, [onFilterChange, onProductSelect, toast])

  const handleCategoryFilter = useCallback((category: string) => {
    toast({
      title: 'Filtre catégorie',
      description: `Filtrage sur: ${category}`
    })
  }, [toast])
  
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

      {/* Predictive Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Predictive Alerts */}
        <PredictiveAlertsPanel
          alerts={predictiveAlerts}
          onAlertAction={handleAlertAction}
          onViewAll={() => navigate('/analytics/predictions')}
          isLoading={predictiveLoading}
        />

        {/* ROI Dashboard */}
        <ROIDashboardPanel
          metrics={roiMetrics}
          isLoading={predictiveLoading}
        />

        {/* Trend Analysis */}
        <TrendAnalysisPanel
          trends={trendAnalysis}
          onCategoryClick={handleCategoryFilter}
          isLoading={predictiveLoading}
        />
      </div>
      
      {/* KPI Feedback Bar */}
      <KPIFeedbackBar
        data={kpiData}
        isLoading={isLoading}
        currency="€"
      />
    </motion.div>
  )
}

function calculateMargin(price?: number, costPrice?: number): number {
  if (!price || !costPrice || price === 0) return 0
  return ((price - costPrice) / price) * 100
}
