/**
 * Command Center V3 - Phase 3: Predictive Insights
 * Combines stock predictions, trend analysis, and ROI calculations
 */

import { useMemo } from 'react'
import { useStockPredictions, StockPrediction } from '@/hooks/useStockPredictions'
import { ProductAuditResult } from '@/types/audit'

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

export function usePredictiveInsights(
  products: GenericProduct[],
  auditResults: ProductAuditResult[]
) {
  const { predictions, criticalAlerts, stats, isLoading } = useStockPredictions()

  // Build prediction map for quick lookup
  const predictionMap = useMemo(() => {
    const map = new Map<string, StockPrediction>()
    predictions.forEach(p => map.set(p.product_id, p))
    return map
  }, [predictions])

  // Generate predictive alerts
  const predictiveAlerts = useMemo((): PredictiveAlert[] => {
    const alerts: PredictiveAlert[] = []

    // Stock-out alerts from predictions
    criticalAlerts.forEach(alert => {
      const product = products.find(p => p.id === alert.productId)
      if (!product) return

      alerts.push({
        id: `stockout-${alert.productId}`,
        productId: alert.productId,
        productName: product.name || 'Produit sans nom',
        type: 'stockout',
        urgency: alert.urgency,
        title: `Rupture prévue dans ${alert.daysUntilStockout} jours`,
        description: `Stock actuel insuffisant pour couvrir la demande`,
        daysUntil: alert.daysUntilStockout,
        potentialImpact: (product.price || 0) * (product.stock_quantity || 0),
        recommendation: alert.recommendation,
        actionLabel: 'Commander stock'
      })
    })

    // Margin decline alerts (products with declining margins)
    products.forEach(product => {
      const margin = calculateMargin(product.price, product.cost_price)
      if (margin > 0 && margin < 15) {
        alerts.push({
          id: `margin-${product.id}`,
          productId: product.id,
          productName: product.name || 'Produit sans nom',
          type: 'margin_decline',
          urgency: margin < 5 ? 'critical' : margin < 10 ? 'high' : 'medium',
          title: `Marge critique: ${margin.toFixed(1)}%`,
          description: `La marge est en dessous du seuil de rentabilité`,
          potentialImpact: (product.price || 0) * (product.stock_quantity || 0) * 0.1,
          recommendation: 'Augmenter le prix ou réduire les coûts',
          actionLabel: 'Optimiser prix'
        })
      }
    })

    // Opportunity alerts (high margin + good stock)
    products.forEach(product => {
      const margin = calculateMargin(product.price, product.cost_price)
      const stock = product.stock_quantity || 0
      if (margin >= 30 && stock > 50) {
        alerts.push({
          id: `opportunity-${product.id}`,
          productId: product.id,
          productName: product.name || 'Produit sans nom',
          type: 'opportunity',
          urgency: 'low',
          title: `Opportunité de vente`,
          description: `Produit rentable avec bon stock disponible`,
          potentialImpact: (product.price || 0) * stock * margin / 100,
          recommendation: 'Augmenter la visibilité et les promotions',
          actionLabel: 'Promouvoir'
        })
      }
    })

    // Sort by urgency and impact
    return alerts.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      }
      return b.potentialImpact - a.potentialImpact
    })
  }, [products, criticalAlerts])

  // Calculate ROI metrics
  const roiMetrics = useMemo((): ROIMetrics => {
    let totalCost = 0
    let totalRevenue = 0
    let atRiskRevenue = 0
    let potentialGain = 0

    products.forEach(product => {
      const price = product.price || 0
      const cost = product.cost_price || 0
      const stock = product.stock_quantity || 0
      const margin = calculateMargin(price, cost)

      totalCost += cost * stock
      totalRevenue += price * stock

      // At risk revenue (low stock or low margin)
      const prediction = predictionMap.get(product.id)
      if (prediction && (prediction.predicted_days_until_stockout || 999) <= 14) {
        atRiskRevenue += price * stock
      }

      // Potential gain from optimization
      if (margin < 20 && margin > 0) {
        potentialGain += price * stock * 0.05 // 5% improvement potential
      }
    })

    const currentROI = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0
    const projectedROI = currentROI * 1.1 // Projected 10% improvement with optimization

    return {
      currentROI,
      projectedROI,
      roiTrend: projectedROI > currentROI ? 'up' : projectedROI < currentROI ? 'down' : 'stable',
      potentialGainWithOptimization: potentialGain,
      totalStockValue: totalRevenue,
      projectedRevenue30d: totalRevenue * 0.3, // Estimate 30% turnover in 30 days
      atRiskRevenue
    }
  }, [products, predictionMap])

  // Category trend analysis
  const trendAnalysis = useMemo((): TrendAnalysis[] => {
    const categoryStats = new Map<string, { count: number; totalMargin: number; lowStock: number }>()

    products.forEach(product => {
      const auditResult = auditResults.find(a => a.productId === product.id)
      const category = (auditResult as any)?.category || 'Non catégorisé'
      const margin = calculateMargin(product.price, product.cost_price)
      const stock = product.stock_quantity || 0

      const existing = categoryStats.get(category) || { count: 0, totalMargin: 0, lowStock: 0 }
      existing.count++
      existing.totalMargin += margin
      if (stock < 10) existing.lowStock++
      categoryStats.set(category, existing)
    })

    return Array.from(categoryStats.entries())
      .filter(([_, stats]) => stats.count >= 5)
      .map(([category, stats]) => {
        const avgMargin = stats.totalMargin / stats.count
        const lowStockRatio = stats.lowStock / stats.count

        let trend: 'growing' | 'declining' | 'stable' = 'stable'
        let recommendation = 'Maintenir le niveau actuel'

        if (avgMargin > 25 && lowStockRatio < 0.2) {
          trend = 'growing'
          recommendation = 'Augmenter le stock et la visibilité'
        } else if (avgMargin < 15 || lowStockRatio > 0.5) {
          trend = 'declining'
          recommendation = 'Revoir la stratégie prix ou déstocker'
        }

        return {
          category,
          trend,
          changePercent: avgMargin - 20, // Deviation from 20% target
          recommendation
        }
      })
      .sort((a, b) => {
        const trendOrder = { growing: 0, stable: 1, declining: 2 }
        return trendOrder[a.trend] - trendOrder[b.trend]
      })
  }, [products, auditResults])

  // Top recommendations
  const topRecommendations = useMemo(() => {
    return predictiveAlerts
      .filter(a => a.urgency === 'critical' || a.urgency === 'high')
      .slice(0, 5)
  }, [predictiveAlerts])

  return {
    predictiveAlerts,
    roiMetrics,
    trendAnalysis,
    topRecommendations,
    stockPredictionStats: stats,
    isLoading
  }
}

function calculateMargin(price?: number, costPrice?: number): number {
  if (!price || !costPrice || price === 0) return 0
  return ((price - costPrice) / price) * 100
}
