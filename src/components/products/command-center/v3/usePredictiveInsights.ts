/**
 * Command Center V3 - Phase 3: Predictive Insights - Optimized
 * Combines stock predictions, trend analysis, and ROI calculations
 */

import { useMemo } from 'react'
import { useStockPredictions, StockPrediction } from '@/hooks/useStockPredictions'
import { ProductAuditResult } from '@/types/audit'
import { calculateMargin, aggregateProductKPIs } from './utils/calculations'

interface GenericProduct {
  id: string
  name?: string
  stock_quantity?: number
  profit_margin?: number
  price?: number
  cost_price?: number
  updated_at?: string
}

export interface PredictiveAlert {
  id: string
  productId: string
  productName: string
  type: 'stockout' | 'margin_decline' | 'opportunity' | 'trend_up' | 'trend_down'
  urgency: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  daysUntil?: number
  potentialImpact: number
  recommendation: string
  actionLabel: string
}

export interface ROIMetrics {
  currentROI: number
  projectedROI: number
  roiTrend: 'up' | 'down' | 'stable'
  potentialGainWithOptimization: number
  totalStockValue: number
  projectedRevenue30d: number
  atRiskRevenue: number
}

export interface TrendAnalysis {
  category: string
  trend: 'growing' | 'declining' | 'stable'
  changePercent: number
  recommendation: string
}

const URGENCY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const

export function usePredictiveInsights(
  products: GenericProduct[],
  auditResults: ProductAuditResult[]
) {
  const { predictions, criticalAlerts, stats, isLoading } = useStockPredictions()

  // Memoize prediction map
  const predictionMap = useMemo(() => 
    new Map(predictions.map(p => [p.product_id, p])),
    [predictions]
  )

  // Memoize product map for quick lookup
  const productMap = useMemo(() => 
    new Map(products.map(p => [p.id, p])),
    [products]
  )

  // Generate predictive alerts - optimized with single pass
  const predictiveAlerts = useMemo((): PredictiveAlert[] => {
    const alerts: PredictiveAlert[] = []

    // Stock-out alerts from predictions
    for (const alert of criticalAlerts) {
      const product = productMap.get(alert.productId)
      if (!product) continue

      alerts.push({
        id: `stockout-${alert.productId}`,
        productId: alert.productId,
        productName: product.name || 'Produit sans nom',
        type: 'stockout',
        urgency: alert.urgency,
        title: `Rupture prévue dans ${alert.daysUntilStockout} jours`,
        description: 'Stock actuel insuffisant pour couvrir la demande',
        daysUntil: alert.daysUntilStockout,
        potentialImpact: (product.price || 0) * (product.stock_quantity || 0),
        recommendation: alert.recommendation,
        actionLabel: 'Commander stock'
      })
    }

    // Process products in single pass for margin and opportunity alerts
    for (const product of products) {
      const margin = calculateMargin(product.price, product.cost_price)
      const stock = product.stock_quantity || 0
      const price = product.price || 0

      // Margin decline alerts
      if (margin > 0 && margin < 15) {
        alerts.push({
          id: `margin-${product.id}`,
          productId: product.id,
          productName: product.name || 'Produit sans nom',
          type: 'margin_decline',
          urgency: margin < 5 ? 'critical' : margin < 10 ? 'high' : 'medium',
          title: `Marge critique: ${margin.toFixed(1)}%`,
          description: 'La marge est en dessous du seuil de rentabilité',
          potentialImpact: price * stock * 0.1,
          recommendation: 'Augmenter le prix ou réduire les coûts',
          actionLabel: 'Optimiser prix'
        })
      }

      // Opportunity alerts
      if (margin >= 30 && stock > 50) {
        alerts.push({
          id: `opportunity-${product.id}`,
          productId: product.id,
          productName: product.name || 'Produit sans nom',
          type: 'opportunity',
          urgency: 'low',
          title: 'Opportunité de vente',
          description: 'Produit rentable avec bon stock disponible',
          potentialImpact: price * stock * margin / 100,
          recommendation: 'Augmenter la visibilité et les promotions',
          actionLabel: 'Promouvoir'
        })
      }
    }

    // Sort by urgency and impact
    return alerts.sort((a, b) => {
      const urgencyDiff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
      return urgencyDiff !== 0 ? urgencyDiff : b.potentialImpact - a.potentialImpact
    })
  }, [products, criticalAlerts, productMap])

  // Calculate ROI metrics - optimized with aggregation utility
  const roiMetrics = useMemo((): ROIMetrics => {
    const kpis = aggregateProductKPIs(products)
    let atRiskRevenue = 0
    let potentialGain = 0

    for (const product of products) {
      const price = product.price || 0
      const stock = product.stock_quantity || 0
      const margin = calculateMargin(product.price, product.cost_price)
      
      const prediction = predictionMap.get(product.id)
      if (prediction && (prediction.predicted_days_until_stockout || 999) <= 14) {
        atRiskRevenue += price * stock
      }

      if (margin < 20 && margin > 0) {
        potentialGain += price * stock * 0.05
      }
    }

    const currentROI = kpis.totalCost > 0 
      ? ((kpis.totalRevenue - kpis.totalCost) / kpis.totalCost) * 100 
      : 0
    const projectedROI = currentROI * 1.1

    return {
      currentROI,
      projectedROI,
      roiTrend: projectedROI > currentROI ? 'up' : projectedROI < currentROI ? 'down' : 'stable',
      potentialGainWithOptimization: potentialGain,
      totalStockValue: kpis.totalRevenue,
      projectedRevenue30d: kpis.totalRevenue * 0.3,
      atRiskRevenue
    }
  }, [products, predictionMap])

  // Category trend analysis - optimized
  const trendAnalysis = useMemo((): TrendAnalysis[] => {
    const categoryStats = new Map<string, { count: number; totalMargin: number; lowStock: number }>()

    for (const product of products) {
      const auditResult = auditResults.find(a => a.productId === product.id)
      const category = (auditResult as any)?.category || 'Non catégorisé'
      const margin = calculateMargin(product.price, product.cost_price)
      const stock = product.stock_quantity || 0

      const existing = categoryStats.get(category) || { count: 0, totalMargin: 0, lowStock: 0 }
      existing.count++
      existing.totalMargin += margin
      if (stock < 10) existing.lowStock++
      categoryStats.set(category, existing)
    }

    return Array.from(categoryStats.entries())
      .filter(([_, s]) => s.count >= 5)
      .map(([category, s]) => {
        const avgMargin = s.totalMargin / s.count
        const lowStockRatio = s.lowStock / s.count

        let trend: 'growing' | 'declining' | 'stable' = 'stable'
        let recommendation = 'Maintenir le niveau actuel'

        if (avgMargin > 25 && lowStockRatio < 0.2) {
          trend = 'growing'
          recommendation = 'Augmenter le stock et la visibilité'
        } else if (avgMargin < 15 || lowStockRatio > 0.5) {
          trend = 'declining'
          recommendation = 'Revoir la stratégie prix ou déstocker'
        }

        return { category, trend, changePercent: avgMargin - 20, recommendation }
      })
      .sort((a, b) => {
        const trendOrder = { growing: 0, stable: 1, declining: 2 }
        return trendOrder[a.trend] - trendOrder[b.trend]
      })
  }, [products, auditResults])

  // Top recommendations
  const topRecommendations = useMemo(() => 
    predictiveAlerts.filter(a => a.urgency === 'critical' || a.urgency === 'high').slice(0, 5),
    [predictiveAlerts]
  )

  return {
    predictiveAlerts,
    roiMetrics,
    trendAnalysis,
    topRecommendations,
    stockPredictionStats: stats,
    isLoading
  }
}
