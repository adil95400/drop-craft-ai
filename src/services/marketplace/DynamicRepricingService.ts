/**
 * Service de repricing dynamique avancé
 * Connecté aux vraies tables Supabase: price_rules, price_history, competitive_intelligence
 */

import { supabase } from '@/integrations/supabase/client'
import type { RepricingRule, RepricingExecution, MarketplacePriceData, RepricingDashboard } from '@/types/marketplace-repricing'

// Helper pour accéder aux propriétés JSON de manière type-safe
const getJsonProp = (json: any, prop: string, defaultValue: any = undefined) => {
  if (json && typeof json === 'object' && prop in json) {
    return json[prop]
  }
  return defaultValue
}

export class DynamicRepricingService {
  /**
   * Récupère les règles de repricing depuis la base
   */
  async getRepricingRules(userId: string): Promise<RepricingRule[]> {
    const { data, error } = await supabase
      .from('price_rules')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: false })

    if (error) throw error

    return (data || []).map(rule => ({
      id: rule.id,
      user_id: rule.user_id,
      name: rule.name,
      description: rule.description || undefined,
      applies_to: (rule.apply_to as RepricingRule['applies_to']) || 'all',
      target_products: getJsonProp(rule.apply_filter, 'product_ids'),
      target_categories: getJsonProp(rule.apply_filter, 'categories'),
      target_marketplaces: getJsonProp(rule.apply_filter, 'marketplaces'),
      strategy: this.mapRuleTypeToStrategy(rule.rule_type),
      min_margin_percent: getJsonProp(rule.calculation, 'min_margin', 15),
      target_margin_percent: getJsonProp(rule.calculation, 'target_margin', 25),
      max_discount_percent: getJsonProp(rule.calculation, 'max_discount'),
      min_price: getJsonProp(rule.calculation, 'min_price'),
      max_price: getJsonProp(rule.calculation, 'max_price'),
      rounding_strategy: getJsonProp(rule.calculation, 'rounding', 'nearest_99'),
      competitor_analysis_enabled: getJsonProp(rule.conditions, 'competitor_analysis', true),
      buybox_target_position: getJsonProp(rule.conditions, 'buybox_target'),
      price_match_threshold_percent: getJsonProp(rule.conditions, 'price_threshold'),
      update_frequency_minutes: getJsonProp(rule.conditions, 'frequency', 60),
      is_active: rule.is_active ?? true,
      last_executed_at: rule.last_applied_at || undefined,
      execution_count: rule.products_affected || 0,
      success_count: rule.products_affected || 0,
      created_at: rule.created_at || new Date().toISOString(),
      updated_at: rule.updated_at || new Date().toISOString()
    }))
  }

  private mapRuleTypeToStrategy(ruleType: string): RepricingRule['strategy'] {
    const mapping: Record<string, RepricingRule['strategy']> = {
      'buybox': 'buybox',
      'competitive': 'competitive',
      'margin': 'margin_based',
      'fixed_margin': 'margin_based',
      'dynamic': 'dynamic',
      'beat_competition': 'competitive',
      'match_competition': 'competitive'
    }
    return mapping[ruleType] || 'margin_based'
  }

  /**
   * Crée une nouvelle règle de repricing
   */
  async createRepricingRule(userId: string, rule: Partial<RepricingRule>): Promise<RepricingRule> {
    const { data, error } = await (supabase
      .from('price_rules') as any)
      .insert({
        user_id: userId,
        name: rule.name || 'Nouvelle règle',
        description: rule.description,
        rule_type: rule.strategy || 'margin_based',
        apply_to: rule.applies_to || 'all',
        apply_filter: {
          product_ids: rule.target_products,
          categories: rule.target_categories,
          marketplaces: rule.target_marketplaces
        },
        calculation: {
          min_margin: rule.min_margin_percent || 15,
          target_margin: rule.target_margin_percent || 25,
          max_discount: rule.max_discount_percent,
          min_price: rule.min_price,
          max_price: rule.max_price,
          rounding: rule.rounding_strategy || 'nearest_99'
        },
        conditions: {
          competitor_analysis: rule.competitor_analysis_enabled ?? true,
          buybox_target: rule.buybox_target_position,
          price_threshold: rule.price_match_threshold_percent,
          frequency: rule.update_frequency_minutes || 60
        },
        is_active: rule.is_active ?? false,
        priority: 1
      })
      .select()
      .single()

    if (error) throw error

    return this.mapDbRuleToRepricingRule(data)
  }

  /**
   * Met à jour une règle de repricing
   */
  async updateRepricingRule(ruleId: string, updates: Partial<RepricingRule>): Promise<RepricingRule> {
    const updateData: Record<string, any> = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active
    if (updates.strategy !== undefined) updateData.rule_type = updates.strategy
    
    if (updates.min_margin_percent !== undefined || updates.target_margin_percent !== undefined) {
      updateData.calculation = {
        min_margin: updates.min_margin_percent,
        target_margin: updates.target_margin_percent,
        max_discount: updates.max_discount_percent,
        rounding: updates.rounding_strategy
      }
    }

    const { data, error } = await supabase
      .from('price_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single()

    if (error) throw error

    return this.mapDbRuleToRepricingRule(data)
  }

  /**
   * Supprime une règle de repricing
   */
  async deleteRepricingRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('price_rules')
      .delete()
      .eq('id', ruleId)

    if (error) throw error
  }

  private mapDbRuleToRepricingRule(rule: any): RepricingRule {
    return {
      id: rule.id,
      user_id: rule.user_id,
      name: rule.name,
      description: rule.description,
      applies_to: rule.apply_to || 'all',
      strategy: this.mapRuleTypeToStrategy(rule.rule_type),
      min_margin_percent: getJsonProp(rule.calculation, 'min_margin', 15),
      target_margin_percent: getJsonProp(rule.calculation, 'target_margin', 25),
      max_discount_percent: getJsonProp(rule.calculation, 'max_discount'),
      rounding_strategy: getJsonProp(rule.calculation, 'rounding', 'nearest_99'),
      competitor_analysis_enabled: getJsonProp(rule.conditions, 'competitor_analysis', true),
      update_frequency_minutes: getJsonProp(rule.conditions, 'frequency', 60),
      is_active: rule.is_active ?? true,
      execution_count: rule.products_affected || 0,
      success_count: rule.products_affected || 0,
      created_at: rule.created_at,
      updated_at: rule.updated_at
    }
  }

  /**
   * Analyse les prix concurrents depuis competitive_intelligence
   */
  async analyzeCompetitorPrices(
    productId: string,
    marketplace: string
  ): Promise<MarketplacePriceData> {
    // Récupérer données concurrentielles réelles
    const { data: competitorData } = await supabase
      .from('competitive_intelligence')
      .select('*')
      .eq('product_id', productId)
      .order('last_checked_at', { ascending: false })
      .limit(10)

    // Récupérer prix actuel du produit
    const { data: product } = await supabase
      .from('products')
      .select('price')
      .eq('id', productId)
      .single()

    const currentPrice = product?.price || 0
    const competitorPrices = (competitorData || []).map(c => c.competitor_price || 0).filter(p => p > 0)
    
    if (competitorPrices.length === 0) {
      // Pas de données concurrentielles, utiliser le prix actuel
      return {
        marketplace,
        product_id: productId,
        current_price: currentPrice,
        competitor_count: 0,
        min_competitor_price: currentPrice,
        avg_competitor_price: currentPrice,
        buybox_price: currentPrice,
        buybox_seller: 'N/A',
        last_checked_at: new Date().toISOString()
      }
    }

    const minPrice = Math.min(...competitorPrices)
    const avgPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
    const buyboxWinner = competitorData?.find(c => c.competitor_price === minPrice)

    return {
      marketplace,
      product_id: productId,
      current_price: currentPrice,
      competitor_count: competitorPrices.length,
      min_competitor_price: minPrice,
      avg_competitor_price: avgPrice,
      buybox_price: minPrice,
      buybox_seller: buyboxWinner?.competitor_name || 'Unknown',
      last_checked_at: competitorData?.[0]?.last_checked_at || new Date().toISOString()
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
        newPrice = marketData.buybox_price - 0.01
        reason = `Buy Box strategy: target price ${marketData.buybox_price}`
        break
        
      case 'competitive':
        newPrice = marketData.avg_competitor_price
        reason = `Competitive pricing: avg competitor ${marketData.avg_competitor_price.toFixed(2)}`
        break
        
      case 'margin_based':
        newPrice = costPrice * (1 + rule.target_margin_percent / 100)
        reason = `Margin-based: target ${rule.target_margin_percent}% margin`
        break
        
      case 'dynamic':
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
    const marginPercent = costPrice > 0 ? ((newPrice - costPrice) / costPrice) * 100 : 0
    if (marginPercent < rule.min_margin_percent && costPrice > 0) {
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
   * Exécute repricing pour un produit et enregistre dans price_history
   */
  async repriceProduct(
    productId: string,
    rule: RepricingRule,
    marketplace: string
  ): Promise<RepricingExecution> {
    const { data: product } = await supabase
      .from('products')
      .select('id, name, price, cost_price, user_id')
      .eq('id', productId)
      .single()
    
    if (!product) {
      throw new Error('Product not found')
    }
    
    const marketData = await this.analyzeCompetitorPrices(productId, marketplace)
    
    const { newPrice, reason, marginPercent } = this.calculateOptimalPrice(
      product.price || 0,
      rule,
      marketData,
      product.cost_price || 0
    )
    
    // Enregistrer dans price_history
    const { data: historyEntry } = await supabase
      .from('price_history')
      .insert({
        product_id: productId,
        user_id: product.user_id,
        old_price: product.price,
        new_price: newPrice,
        change_reason: reason,
        rule_id: rule.id,
        margin: marginPercent,
        price_change: newPrice - (product.price || 0)
      })
      .select()
      .single()

    // Mettre à jour le prix du produit
    await supabase
      .from('products')
      .update({ price: newPrice })
      .eq('id', productId)

    // Mettre à jour le compteur de la règle
    await (supabase
      .from('price_rules') as any)
      .update({ 
        last_applied_at: new Date().toISOString(),
        products_affected: (rule.execution_count || 0) + 1
      })
      .eq('id', rule.id)
    
    const execution: RepricingExecution = {
      id: historyEntry?.id || crypto.randomUUID(),
      rule_id: rule.id,
      product_id: productId,
      marketplace,
      old_price: product.price || 0,
      new_price: newPrice,
      price_change_percent: product.price ? ((newPrice - product.price) / product.price) * 100 : 0,
      competitor_prices: [],
      strategy_used: rule.strategy,
      margin_before: product.cost_price && product.price ? ((product.price - product.cost_price) / product.cost_price) * 100 : 0,
      margin_after: marginPercent,
      decision_reason: reason,
      sync_status: 'applied',
      applied_at: new Date().toISOString(),
      executed_at: new Date().toISOString()
    }
    
    return execution
  }

  /**
   * Exécute repricing pour tous les produits d'une règle
   */
  async executeRepricingRule(ruleId: string): Promise<RepricingExecution[]> {
    const { data: rule } = await supabase
      .from('price_rules')
      .select('*')
      .eq('id', ruleId)
      .single()

    if (!rule) {
      throw new Error('Rule not found')
    }

    const repricingRule = this.mapDbRuleToRepricingRule(rule)

    // Récupérer produits applicables
    let query = supabase
      .from('products')
      .select('id')
      .eq('user_id', rule.user_id)
      .limit(50)

    // Appliquer filtres si définis
    const filterCategories = getJsonProp(rule.apply_filter, 'categories', [])
    if (filterCategories?.length > 0) {
      query = query.in('category', filterCategories)
    }

    const { data: products } = await query
    
    const executions: RepricingExecution[] = []
    
    for (const product of products || []) {
      try {
        const execution = await this.repriceProduct(product.id, repricingRule, 'amazon')
        executions.push(execution)
      } catch (error) {
        console.error('Repricing error for product', product.id, error)
      }
    }
    
    return executions
  }

  /**
   * Récupère l'historique des changements de prix
   */
  async getPriceHistory(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('price_history')
      .select(`
        *,
        products:product_id (name, sku)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map(h => ({
      id: h.id,
      date: h.created_at,
      product: (h.products as any)?.name || 'Unknown',
      oldPrice: h.old_price,
      newPrice: h.new_price,
      reason: h.change_reason || 'N/A',
      rule: h.rule_id ? 'Règle appliquée' : 'Manuel',
      margin: h.margin || 0
    }))
  }

  /**
   * Récupère dashboard repricing avec vraies données
   */
  async getDashboard(userId: string): Promise<RepricingDashboard> {
    // Récupérer règles actives
    const { data: rules } = await supabase
      .from('price_rules')
      .select('id, is_active, products_affected')
      .eq('user_id', userId)

    const activeRules = (rules || []).filter(r => r.is_active).length
    const productsMonitored = (rules || []).reduce((sum, r) => sum + (r.products_affected || 0), 0)

    // Récupérer changements récents depuis price_history
    const { data: recentChanges } = await supabase
      .from('price_history')
      .select(`
        *,
        products:product_id (name)
      `)
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculer stats
    const todayExecutions = recentChanges?.length || 0
    const avgMarginChange = recentChanges && recentChanges.length > 0
      ? recentChanges.reduce((sum, c) => sum + (c.margin || 0), 0) / recentChanges.length
      : 0

    // Récupérer données buy box depuis competitive_intelligence
    const { data: buyboxData } = await supabase
      .from('competitive_intelligence')
      .select('market_position, competitor_price, price_difference')
      .eq('user_id', userId)
      .not('market_position', 'is', null)

    // Grouper par marketplace
    const buyboxByMarketplace = (buyboxData || []).reduce((acc: Record<string, any>, item) => {
      const mp = item.market_position || 'Other'
      if (!acc[mp]) {
        acc[mp] = { total: 0, wins: 0, positions: [] }
      }
      acc[mp].total++
      if (item.price_difference !== null && item.price_difference <= 0) {
        acc[mp].wins++
        acc[mp].positions.push(1)
      } else {
        acc[mp].positions.push(2)
      }
      return acc
    }, {})

    const buyboxPerformance = Object.entries(buyboxByMarketplace).map(([marketplace, data]: [string, any]) => ({
      marketplace,
      buybox_win_rate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
      avg_position: data.positions.length > 0 
        ? data.positions.reduce((a: number, b: number) => a + b, 0) / data.positions.length 
        : 0,
      products_in_buybox: data.wins
    }))

    // Distribution des marges
    const { data: products } = await supabase
      .from('products')
      .select('price, cost_price')
      .eq('user_id', userId)
      .not('cost_price', 'is', null)

    const marginRanges = [
      { range: '0-20%', min: 0, max: 20 },
      { range: '20-30%', min: 20, max: 30 },
      { range: '30-40%', min: 30, max: 40 },
      { range: '40%+', min: 40, max: 1000 }
    ]

    const marginDistribution = marginRanges.map(range => {
      const matching = (products || []).filter(p => {
        if (!p.cost_price || p.cost_price === 0) return false
        const margin = ((p.price - p.cost_price) / p.cost_price) * 100
        return margin >= range.min && margin < range.max
      })
      return {
        margin_range: range.range,
        product_count: matching.length,
        revenue_percent: products && products.length > 0 
          ? (matching.length / products.length) * 100 
          : 0
      }
    })

    return {
      active_rules: activeRules,
      products_monitored: productsMonitored || (products?.length || 0),
      repricing_executions_today: todayExecutions,
      avg_margin_change: avgMarginChange,
      
      recent_changes: (recentChanges || []).map(c => ({
        product_name: (c.products as any)?.name || 'Unknown',
        marketplace: 'ShopOpti',
        old_price: c.old_price || 0,
        new_price: c.new_price || 0,
        margin_impact: c.margin || 0,
        executed_at: c.created_at || new Date().toISOString()
      })),
      
      buybox_performance: buyboxPerformance.length > 0 ? buyboxPerformance : [
        { marketplace: 'Amazon', buybox_win_rate: 0, avg_position: 0, products_in_buybox: 0 },
        { marketplace: 'eBay', buybox_win_rate: 0, avg_position: 0, products_in_buybox: 0 }
      ],
      
      margin_distribution: marginDistribution
    }
  }
}

export const dynamicRepricingService = new DynamicRepricingService()
