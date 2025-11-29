/**
 * Service de repricing dynamique avancé
 * Analyse les prix concurrents et ajuste automatiquement
 */

import { supabase } from '@/integrations/supabase/client'
import type { RepricingRule, RepricingExecution, MarketplacePriceData, RepricingDashboard } from '@/types/marketplace-repricing'

export class DynamicRepricingService {
  /**
   * Analyse les prix concurrents pour un produit (mock pour maintenant)
   */
  async analyzeCompetitorPrices(
    productId: string,
    marketplace: string
  ): Promise<MarketplacePriceData> {
    // Mock competitor analysis
    const currentPrice = 49.99
    const competitorPrices = [45.99, 47.50, 52.00, 48.99]
    
    return {
      marketplace,
      product_id: productId,
      current_price: currentPrice,
      competitor_count: competitorPrices.length,
      min_competitor_price: Math.min(...competitorPrices),
      avg_competitor_price: competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length,
      buybox_price: Math.min(...competitorPrices),
      buybox_seller: 'CompetitorA',
      last_checked_at: new Date().toISOString()
    }
  }

  /**
   * Calcule le prix optimal selon la stratégie
   */
  calculateOptimalPrice(
    currentPrice: number,
    rule: RepricingRule,
    marketData: MarketplacePriceData,
    costPrice: number
  ): { newPrice: number; reason: string; marginPercent: number } {
    let newPrice = currentPrice
    let reason = 'No change'
    
    switch (rule.strategy) {
      case 'buybox':
        // Stratégie Buy Box: viser le prix le plus bas + petit écart
        newPrice = marketData.buybox_price - 0.01
        reason = `Buy Box strategy: target price ${marketData.buybox_price}`
        break
        
      case 'competitive':
        // Stratégie compétitive: prix moyen des concurrents
        newPrice = marketData.avg_competitor_price
        reason = `Competitive pricing: avg competitor ${marketData.avg_competitor_price.toFixed(2)}`
        break
        
      case 'margin_based':
        // Stratégie basée sur marge cible
        newPrice = costPrice * (1 + rule.target_margin_percent / 100)
        reason = `Margin-based: target ${rule.target_margin_percent}% margin`
        break
        
      case 'dynamic':
        // Stratégie dynamique: mix de tout
        const buyboxPrice = marketData.buybox_price - 0.01
        const marginPrice = costPrice * (1 + rule.target_margin_percent / 100)
        newPrice = Math.max(buyboxPrice, marginPrice)
        reason = `Dynamic: balance between buybox (${buyboxPrice.toFixed(2)}) and margin (${marginPrice.toFixed(2)})`
        break
    }
    
    // Appliquer contraintes min/max
    if (rule.min_price && newPrice < rule.min_price) {
      newPrice = rule.min_price
      reason += ` (min price floor applied)`
    }
    
    if (rule.max_price && newPrice > rule.max_price) {
      newPrice = rule.max_price
      reason += ` (max price ceiling applied)`
    }
    
    // Vérifier marge minimale
    const marginPercent = ((newPrice - costPrice) / costPrice) * 100
    if (marginPercent < rule.min_margin_percent) {
      newPrice = costPrice * (1 + rule.min_margin_percent / 100)
      reason += ` (min margin ${rule.min_margin_percent}% enforced)`
    }
    
    // Appliquer stratégie d'arrondi
    newPrice = this.applyRounding(newPrice, rule.rounding_strategy)
    
    return {
      newPrice: Math.round(newPrice * 100) / 100,
      reason,
      marginPercent
    }
  }

  /**
   * Applique stratégie d'arrondi
   */
  private applyRounding(price: number, strategy: string): number {
    switch (strategy) {
      case 'up':
        return Math.ceil(price)
      case 'down':
        return Math.floor(price)
      case 'nearest_99':
        return Math.floor(price) + 0.99
      case 'nearest_95':
        return Math.floor(price) + 0.95
      case 'none':
      default:
        return price
    }
  }

  /**
   * Exécute repricing pour un produit
   */
  async repriceProduc(
    productId: string,
    ruleId: string,
    marketplace: string
  ): Promise<RepricingExecution> {
    // Récupérer produit
    const { data: product } = await supabase
      .from('products')
      .select('id, name, price, cost_price')
      .eq('id', productId)
      .single()
    
    if (!product) {
      throw new Error('Product not found')
    }
    
    // Récupérer règle (mock pour maintenant)
    const rule: RepricingRule = {
      id: ruleId,
      user_id: '',
      name: 'Buy Box Strategy',
      applies_to: 'all',
      strategy: 'buybox',
      min_margin_percent: 20,
      target_margin_percent: 30,
      rounding_strategy: 'nearest_99',
      competitor_analysis_enabled: true,
      update_frequency_minutes: 60,
      is_active: true,
      execution_count: 0,
      success_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Analyser marché
    const marketData = await this.analyzeCompetitorPrices(productId, marketplace)
    
    // Calculer nouveau prix
    const { newPrice, reason, marginPercent } = this.calculateOptimalPrice(
      product.price,
      rule,
      marketData,
      product.cost_price || 0
    )
    
    // Créer exécution record
    const execution: RepricingExecution = {
      id: crypto.randomUUID(),
      rule_id: ruleId,
      product_id: productId,
      marketplace,
      old_price: product.price,
      new_price: newPrice,
      price_change_percent: ((newPrice - product.price) / product.price) * 100,
      competitor_prices: [
        { seller: 'Competitor A', price: 45.99, is_buybox_winner: true },
        { seller: 'Competitor B', price: 47.50, is_buybox_winner: false },
        { seller: 'Competitor C', price: 52.00, is_buybox_winner: false }
      ],
      strategy_used: rule.strategy,
      margin_before: ((product.price - (product.cost_price || 0)) / (product.cost_price || 1)) * 100,
      margin_after: marginPercent,
      decision_reason: reason,
      sync_status: 'pending',
      executed_at: new Date().toISOString()
    }
    
    return execution
  }

  /**
   * Exécute repricing pour tous les produits d'une règle
   */
  async executeRepricingRule(ruleId: string): Promise<RepricingExecution[]> {
    // Récupérer règle (mock pour maintenant)
    const rule: RepricingRule = {
      id: ruleId,
      user_id: '',
      name: 'Global Repricing',
      applies_to: 'all',
      strategy: 'competitive',
      min_margin_percent: 20,
      target_margin_percent: 30,
      rounding_strategy: 'nearest_99',
      competitor_analysis_enabled: true,
      update_frequency_minutes: 60,
      is_active: true,
      execution_count: 0,
      success_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Récupérer produits applicables
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .limit(10)
    
    const executions: RepricingExecution[] = []
    
    for (const product of products || []) {
      try {
        const execution = await this.repriceProduc(product.id, ruleId, 'amazon')
        executions.push(execution)
      } catch (error) {
        console.error('Repricing error for product', product.id, error)
      }
    }
    
    return executions
  }

  /**
   * Récupère dashboard repricing
   */
  async getDashboard(userId: string): Promise<RepricingDashboard> {
    // Mock dashboard data
    return {
      active_rules: 3,
      products_monitored: 450,
      repricing_executions_today: 127,
      avg_margin_change: 2.3,
      
      recent_changes: [
        {
          product_name: 'Chaise ergonomique',
          marketplace: 'Amazon',
          old_price: 129.99,
          new_price: 124.99,
          margin_impact: -1.2,
          executed_at: new Date().toISOString()
        },
        {
          product_name: 'Bureau réglable',
          marketplace: 'eBay',
          old_price: 349.99,
          new_price: 359.99,
          margin_impact: +2.5,
          executed_at: new Date().toISOString()
        }
      ],
      
      buybox_performance: [
        {
          marketplace: 'Amazon',
          buybox_win_rate: 78.5,
          avg_position: 1.3,
          products_in_buybox: 245
        },
        {
          marketplace: 'eBay',
          buybox_win_rate: 65.2,
          avg_position: 2.1,
          products_in_buybox: 156
        }
      ],
      
      margin_distribution: [
        { margin_range: '0-20%', product_count: 45, revenue_percent: 12 },
        { margin_range: '20-30%', product_count: 180, revenue_percent: 38 },
        { margin_range: '30-40%', product_count: 150, revenue_percent: 35 },
        { margin_range: '40%+', product_count: 75, revenue_percent: 15 }
      ]
    }
  }
}

export const dynamicRepricingService = new DynamicRepricingService()
