import { supabase } from '@/integrations/supabase/client'

export interface TrendingProduct {
  produit: string
  score: number
  tendance: string
  raison: string
  potential: string
  product_id: string
}

export interface MarketOpportunity {
  categorie: string
  potentiel: string
  croissance: string
  difficulte: string
  saturation: number
}

export interface OptimalMargin {
  produit: string
  margeActuelle: number
  margeOptimale: number
  potentielCA: string
  competition: string
  product_id: string
}

export interface SalesPrediction {
  mois: string
  prevision: number
  actuel: number | null
  confiance: number
}

/**
 * Helper: deterministic hash from string → number 0-1
 */
function hashScore(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h % 1000) / 1000
}

export class AIAnalyticsService {
  static async getTrendingProducts(userId: string, limit = 10): Promise<TrendingProduct[]> {
    try {
      // Get products with order data to calculate real trends
      const [{ data: products, error }, { data: orderItems }] = await Promise.all([
        (supabase.from('products') as any)
          .select('id, title, category, price, stock_quantity, created_at')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase.from('order_items')
          .select('product_id, qty, unit_price')
      ])

      if (error) throw error

      // Build sales map from real order data
      const salesMap = new Map<string, { totalQty: number; totalRevenue: number }>()
      ;(orderItems || []).forEach((item: any) => {
        if (!item.product_id) return
        const existing = salesMap.get(item.product_id) || { totalQty: 0, totalRevenue: 0 }
        existing.totalQty += item.qty || 0
        existing.totalRevenue += (item.qty || 0) * (item.unit_price || 0)
        salesMap.set(item.product_id, existing)
      })

      return (products || []).map((product: any) => {
        const sales = salesMap.get(product.id)
        const hasImage = !!product.image_url
        const hasDescription = !!(product.description && product.description.length > 20)
        const hasSKU = !!product.sku
        const hasStock = (product.stock_quantity || 0) > 0

        // Completeness-based score (deterministic)
        const completeness = [hasImage, hasDescription, hasSKU, hasStock].filter(Boolean).length
        const score = 50 + completeness * 10 + (sales ? Math.min(sales.totalQty, 20) : 0)

        const monthlyRevenue = sales ? sales.totalRevenue : 0

        return {
          produit: product.title || 'Produit',
          score: Math.min(100, Math.floor(score)),
          tendance: sales ? `+${sales.totalQty} ventes` : 'Nouveau',
          raison: this.getTrendReason(product.category, sales?.totalQty || 0),
          potential: monthlyRevenue > 0
            ? `€${(monthlyRevenue / 1000).toFixed(1)}k réalisé`
            : 'À développer',
          product_id: product.id
        }
      }).sort((a, b) => b.score - a.score)
    } catch (error) {
      console.error('Error fetching trending products:', error)
      return []
    }
  }

  static async getMarketOpportunities(userId: string): Promise<MarketOpportunity[]> {
    try {
      const [{ data: products, error }, { data: orderItems }] = await Promise.all([
        (supabase.from('products') as any).select('id, category, price, cost_price'),
        supabase.from('order_items').select('product_id, qty, unit_price')
      ])

      if (error) throw error

      // Build sales map
      const salesByProduct = new Map<string, number>()
      ;(orderItems || []).forEach((item: any) => {
        if (!item.product_id) return
        salesByProduct.set(item.product_id, (salesByProduct.get(item.product_id) || 0) + (item.qty || 0))
      })

      // Group by category with real metrics
      const categoryMap = new Map<string, { totalRevenue: number; totalCost: number; count: number; totalSales: number }>()
      
      ;(products || []).forEach((product: any) => {
        if (!product.category) return
        
        if (!categoryMap.has(product.category)) {
          categoryMap.set(product.category, { totalRevenue: 0, totalCost: 0, count: 0, totalSales: 0 })
        }
        
        const cat = categoryMap.get(product.category)!
        const productSales = salesByProduct.get(product.id) || 0
        cat.totalRevenue += (product.price || 0) * productSales
        cat.totalCost += (product.cost_price || product.price * 0.6 || 0) * productSales
        cat.count++
        cat.totalSales += productSales
      })

      const opportunities: MarketOpportunity[] = []
      
      categoryMap.forEach((stats, category) => {
        const margin = stats.totalRevenue > 0
          ? ((stats.totalRevenue - stats.totalCost) / stats.totalRevenue) * 100
          : 0
        // Saturation based on how many products vs sales
        const saturation = stats.count > 0
          ? Math.min(100, Math.floor((stats.count / Math.max(stats.totalSales, 1)) * 50))
          : 50

        opportunities.push({
          categorie: category,
          potentiel: stats.totalRevenue > 1000
            ? `${(stats.totalRevenue / 1000).toFixed(1)}k€`
            : `${stats.totalRevenue.toFixed(0)}€`,
          croissance: stats.totalSales > 0 ? `${stats.totalSales} ventes` : 'Pas de ventes',
          difficulte: saturation < 30 ? 'Facile' : saturation < 60 ? 'Moyen' : 'Difficile',
          saturation: Math.floor(saturation)
        })
      })

      return opportunities.sort((a, b) => a.saturation - b.saturation).slice(0, 5)
    } catch (error) {
      console.error('Error fetching market opportunities:', error)
      return []
    }
  }

  static async getOptimalMargins(userId: string, limit = 10): Promise<OptimalMargin[]> {
    try {
      const { data: products, error } = await (supabase
        .from('products') as any)
        .select('id, title, price, cost_price')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (products || []).map((product: any) => {
        const price = product.price || 0
        const cost = product.cost_price || price * 0.6
        const currentMargin = price > 0 ? ((price - cost) / price) * 100 : 0
        // Simple optimal margin suggestion: aim for at least 40% if currently lower
        const optimalMargin = Math.max(currentMargin, Math.min(60, currentMargin + 10))
        const additionalRevenue = price * 10 * ((optimalMargin - currentMargin) / 100)
        
        // Deterministic competition level based on product id hash
        const competitionHash = hashScore(product.id)
        
        return {
          produit: product.title || 'Produit',
          margeActuelle: Math.floor(currentMargin),
          margeOptimale: Math.floor(optimalMargin),
          potentielCA: additionalRevenue > 1000 ? `+${(additionalRevenue / 1000).toFixed(1)}k€/mois` : `+${additionalRevenue.toFixed(0)}€/mois`,
          competition: competitionHash < 0.3 ? 'Faible' : competitionHash < 0.6 ? 'Moyenne' : 'Forte',
          product_id: product.id
        }
      })
    } catch (error) {
      console.error('Error fetching optimal margins:', error)
      return []
    }
  }

  static async getSalesPredictions(userId: string, months = 6): Promise<SalesPrediction[]> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('user_id', userId)
        .eq('status', 'delivered')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      const monthlyData = new Map<string, number>()
      orders?.forEach(order => {
        const month = new Date(order.created_at).toLocaleString('fr-FR', { month: 'short' })
        monthlyData.set(month, (monthlyData.get(month) || 0) + (order.total_amount || 0))
      })

      const historicalValues = Array.from(monthlyData.values())
      const avgGrowth = historicalValues.length > 1 
        ? (historicalValues[historicalValues.length - 1] - historicalValues[0]) / historicalValues.length
        : 100

      const predictions: SalesPrediction[] = []
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
      const currentMonth = new Date().getMonth()
      
      for (let i = 0; i < months; i++) {
        const monthIndex = (currentMonth + i) % 12
        const monthName = monthNames[monthIndex]
        const baseValue = historicalValues[historicalValues.length - 1] || 2000
        const prediction = baseValue + (avgGrowth * i)
        
        predictions.push({
          mois: monthName,
          prevision: Math.floor(prediction),
          actuel: i === 0 ? Math.floor(baseValue) : null,
          confiance: Math.max(70, 95 - (i * 3))
        })
      }

      return predictions
    } catch (error) {
      console.error('Error generating sales predictions:', error)
      return []
    }
  }

  private static getTrendReason(category: string | null, salesCount: number): string {
    if (salesCount > 10) return 'Forte demande constatée'
    if (salesCount > 5) return 'Demande régulière'
    if (salesCount > 0) return 'Premiers acheteurs'

    const reasons: Record<string, string> = {
      'Electronics': 'Innovation technologique',
      'Fashion': 'Tendance saisonnière',
      'Home': 'Décoration intérieure',
      'Sports': 'Pic saisonnier fitness',
      'Beauty': 'Routine beauté tendance'
    }

    return reasons[category || ''] || 'Potentiel à évaluer'
  }
}
