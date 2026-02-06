/**
 * Hook dédié au Cockpit Business - agrège les données pour les KPIs et analyses
 */
import { useMemo } from 'react'
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified/useProductsUnified'
import { useStockPredictions } from '@/hooks/useStockPredictions'
import { useUserKPIs } from '@/hooks/useUserKPIs'

export interface CockpitKPI {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
}

export interface CockpitProductHealth {
  healthy: number
  warning: number
  critical: number
  total: number
}

export interface CockpitROI {
  totalRevenuePotential: number
  totalCost: number
  averageMargin: number
  bestMarginProducts: UnifiedProduct[]
  worstMarginProducts: UnifiedProduct[]
}

export interface CockpitAIPriority {
  id: string
  name: string
  sku?: string
  image_url?: string
  score: number
  issues: string[]
  category: 'seo' | 'content' | 'pricing' | 'stock'
}

export function useCockpitData() {
  const { products, stats, isLoading: productsLoading } = useProductsUnified()
  const { criticalAlerts, stats: stockStats, isLoading: stockLoading } = useStockPredictions()
  const { kpis, isLoading: kpisLoading } = useUserKPIs()

  // KPIs principaux
  const mainKPIs = useMemo((): CockpitKPI[] => {
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0)
    const avgMargin = products.filter(p => p.profit_margin).reduce((sum, p) => sum + (p.profit_margin || 0), 0) / (products.filter(p => p.profit_margin).length || 1)
    const lowStockCount = products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < 10).length
    const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0).length

    return [
      { label: 'Produits actifs', value: stats.active, trend: 'up' as const },
      { label: 'Valeur stock', value: `${(totalValue / 1000).toFixed(1)}k €`, trend: 'neutral' as const },
      { label: 'Marge moyenne', value: `${avgMargin.toFixed(1)}%`, trend: avgMargin > 30 ? 'up' as const : 'down' as const },
      { label: 'Stock faible', value: lowStockCount, trend: lowStockCount > 5 ? 'down' as const : 'up' as const },
      { label: 'Ruptures', value: outOfStock, trend: outOfStock > 0 ? 'down' as const : 'up' as const },
      { label: 'Alertes critiques', value: stockStats.criticalCount, trend: stockStats.criticalCount > 0 ? 'down' as const : 'up' as const },
    ]
  }, [products, stats, stockStats])

  // Santé du catalogue
  const catalogHealth = useMemo((): CockpitProductHealth => {
    let healthy = 0, warning = 0, critical = 0
    
    products.forEach(p => {
      let score = 0
      if (p.name && p.name.length >= 10) score++
      if (p.description && p.description.length >= 50) score++
      if (p.image_url) score++
      if (p.sku) score++
      if (p.price > 0) score++
      
      if (score >= 4) healthy++
      else if (score >= 2) warning++
      else critical++
    })

    return { healthy, warning, critical, total: products.length }
  }, [products])

  // Analyse ROI
  const roiAnalysis = useMemo((): CockpitROI => {
    const withMargin = products.filter(p => p.profit_margin && p.profit_margin > 0)
    const sorted = [...withMargin].sort((a, b) => (b.profit_margin || 0) - (a.profit_margin || 0))
    
    const totalRevenue = products.reduce((sum, p) => sum + p.price * (p.stock_quantity || 0), 0)
    const totalCost = products.reduce((sum, p) => sum + (p.cost_price || 0) * (p.stock_quantity || 0), 0)
    const avgMargin = withMargin.length > 0
      ? withMargin.reduce((sum, p) => sum + (p.profit_margin || 0), 0) / withMargin.length
      : 0

    return {
      totalRevenuePotential: totalRevenue,
      totalCost,
      averageMargin: avgMargin,
      bestMarginProducts: sorted.slice(0, 5),
      worstMarginProducts: sorted.slice(-5).reverse(),
    }
  }, [products])

  // Priorités IA (produits à optimiser)
  const aiPriorities = useMemo((): CockpitAIPriority[] => {
    return products
      .map(p => {
        const issues: string[] = []
        let score = 100

        if (!p.description || p.description.length < 50) { issues.push('Description manquante/courte'); score -= 25 }
        if (!p.seo_title) { issues.push('Titre SEO manquant'); score -= 20 }
        if (!p.seo_description) { issues.push('Meta description manquante'); score -= 15 }
        if (!p.image_url) { issues.push('Image manquante'); score -= 20 }
        if (!p.sku) { issues.push('SKU manquant'); score -= 10 }
        if (p.price === 0) { issues.push('Prix à 0€'); score -= 10 }

        const category = !p.description || !p.image_url ? 'content' as const
          : !p.seo_title ? 'seo' as const
          : p.price === 0 ? 'pricing' as const
          : 'stock' as const

        return { id: p.id, name: p.name, sku: p.sku, image_url: p.image_url, score: Math.max(0, score), issues, category }
      })
      .filter(p => p.score < 80)
      .sort((a, b) => a.score - b.score)
      .slice(0, 20)
  }, [products])

  return {
    mainKPIs,
    catalogHealth,
    roiAnalysis,
    aiPriorities,
    criticalAlerts,
    stockStats,
    userKPIs: kpis,
    products,
    stats,
    isLoading: productsLoading || stockLoading || kpisLoading,
  }
}
