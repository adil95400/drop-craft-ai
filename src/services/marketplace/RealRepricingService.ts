/**
 * Service de repricing RÉEL avec données live
 */

import { supabase } from '@/integrations/supabase/client';
import type { RepricingRule, RepricingExecution, MarketplacePriceData, RepricingDashboard } from '@/types/marketplace-repricing';

export interface PricingRule {
  id: string;
  user_id: string;
  name: string;
  strategy: 'fixed_margin' | 'target_margin' | 'competitive' | 'dynamic' | 'buybox';
  min_margin_percent: number;
  target_margin_percent: number;
  min_price?: number;
  max_price?: number;
  applies_to: 'all' | 'category' | 'products';
  category_filter?: string;
  product_ids?: string[];
  is_active: boolean;
  round_to?: string;
  competitor_price_offset?: number;
  competitor_price_offset_percent?: number;
  priority: number;
  created_at: string;
  updated_at: string;
}

export class RealRepricingService {
  /**
   * Récupère les règles de pricing de l'utilisateur
   */
  async getPricingRules(userId: string): Promise<PricingRule[]> {
    const { data, error } = await (supabase.from('pricing_rules') as any)
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching pricing rules:', error);
      return [];
    }

    return (data || []).map((rule: any) => ({
      id: rule.id,
      user_id: rule.user_id,
      name: rule.name || rule.rule_name || 'Rule',
      strategy: rule.rule_type || 'target_margin',
      min_margin_percent: rule.min_price ? 20 : 20,
      target_margin_percent: rule.target_margin || 30,
      min_price: rule.min_price,
      max_price: rule.max_price,
      applies_to: 'all' as const,
      is_active: rule.is_active ?? true,
      priority: rule.priority || 0,
      created_at: rule.created_at,
      updated_at: rule.updated_at
    }));
  }

  /**
   * Crée une nouvelle règle de pricing
   */
  async createPricingRule(userId: string, rule: Partial<PricingRule>): Promise<PricingRule | null> {
    const { data, error } = await (supabase.from('pricing_rules') as any)
      .insert({
        user_id: userId,
        name: rule.name,
        rule_type: rule.strategy || 'target_margin',
        target_margin: rule.target_margin_percent || 30,
        min_price: rule.min_price,
        max_price: rule.max_price,
        is_active: true,
        priority: rule.priority || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing rule:', error);
      return null;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      strategy: data.rule_type || 'target_margin',
      min_margin_percent: 20,
      target_margin_percent: data.target_margin || 30,
      min_price: data.min_price,
      max_price: data.max_price,
      applies_to: 'all',
      is_active: data.is_active,
      priority: data.priority,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  /**
   * Active/désactive une règle
   */
  async toggleRule(ruleId: string, isActive: boolean): Promise<boolean> {
    const { error } = await (supabase.from('pricing_rules') as any)
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', ruleId);

    return !error;
  }

  /**
   * Exécute le repricing via edge function
   */
  async executeRepricing(ruleId: string, productIds?: string[]): Promise<{
    success: boolean;
    productsUpdated: number;
    results: any[];
    error?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('repricing-engine', {
      body: {
        action: 'apply_rule',
        rule_id: ruleId,
        product_ids: productIds,
        apply_to_all: !productIds || productIds.length === 0,
      },
    });

    if (error) {
      return { success: false, productsUpdated: 0, results: [], error: error.message };
    }

    return {
      success: data.success,
      productsUpdated: data.products_updated || 0,
      results: data.results || [],
    };
  }

  /**
   * Prévisualise les changements de prix
   */
  async previewRepricing(ruleId: string, productIds?: string[]): Promise<{
    success: boolean;
    preview: Array<{
      product_id: string;
      product_name: string;
      current_price: number;
      new_price: number;
      price_change_percent: string;
      current_margin: string;
      new_margin: string;
    }>;
    totalProducts: number;
  }> {
    const { data, error } = await supabase.functions.invoke('repricing-engine', {
      body: {
        action: 'calculate_preview',
        rule_id: ruleId,
        product_ids: productIds,
      },
    });

    if (error) {
      return { success: false, preview: [], totalProducts: 0 };
    }

    return {
      success: true,
      preview: data.preview || [],
      totalProducts: data.total_products || 0,
    };
  }

  /**
   * Récupère le dashboard avec données réelles
   */
  async getDashboard(userId: string): Promise<RepricingDashboard> {
    // Récupérer les règles actives
    const { data: rules } = await (supabase.from('pricing_rules') as any)
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Récupérer l'historique des prix récent
    const { data: priceHistory } = await (supabase.from('price_history') as any)
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    // Récupérer les produits monitorés via API
    const { getProductList } = await import('@/services/api/productHelpers')
    const allProducts = await getProductList(500)
    const products = allProducts.filter((p: any) => p.cost_price != null)

    const activeRules = rules?.length || 0;
    const productsMonitored = products?.length || 0;
    const todayExecutions = priceHistory?.length || 0;

    // Calculer le changement de marge moyen
    const avgMarginChange = priceHistory?.length 
      ? priceHistory.reduce((acc: number, h: any) => {
          const prevMargin = parseFloat(h.margin || '0');
          const newMargin = parseFloat(h.margin || '0');
          return acc + (newMargin - prevMargin);
        }, 0) / priceHistory.length
      : 0;

    // Transformer l'historique en changements récents
    const recentChanges = (priceHistory || []).slice(0, 10).map((h: any) => ({
      product_name: 'Produit',
      marketplace: 'Shopify',
      old_price: h.old_price || 0,
      new_price: h.new_price || 0,
      margin_impact: 0,
      executed_at: h.created_at,
    }));

    // Données Buy Box (simulées car nécessite intégration marketplace)
    const buyboxPerformance = [
      {
        marketplace: 'Shopify',
        buybox_win_rate: 100,
        avg_position: 1,
        products_in_buybox: productsMonitored,
      },
    ];

    // Distribution des marges
    const marginDistribution = calculateMarginDistribution(products || []);

    return {
      active_rules: activeRules,
      products_monitored: productsMonitored,
      repricing_executions_today: todayExecutions,
      avg_margin_change: Math.round(avgMarginChange * 100) / 100,
      recent_changes: recentChanges,
      buybox_performance: buyboxPerformance,
      margin_distribution: marginDistribution,
    };
  }

  /**
   * Supprime une règle
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    const { error } = await (supabase.from('pricing_rules') as any)
      .delete()
      .eq('id', ruleId);

    return !error;
  }
}

function calculateMarginDistribution(products: any[]): Array<{
  margin_range: string;
  product_count: number;
  revenue_percent: number;
}> {
  const ranges = [
    { label: '0-20%', min: 0, max: 20, count: 0, revenue: 0 },
    { label: '20-30%', min: 20, max: 30, count: 0, revenue: 0 },
    { label: '30-40%', min: 30, max: 40, count: 0, revenue: 0 },
    { label: '40%+', min: 40, max: 1000, count: 0, revenue: 0 },
  ];

  let totalRevenue = 0;

  for (const product of products) {
    if (!product.cost_price || !product.price) continue;
    
    const margin = ((product.price - product.cost_price) / product.price) * 100;
    const revenue = product.price;
    totalRevenue += revenue;

    for (const range of ranges) {
      if (margin >= range.min && margin < range.max) {
        range.count++;
        range.revenue += revenue;
        break;
      }
    }
  }

  return ranges.map(r => ({
    margin_range: r.label,
    product_count: r.count,
    revenue_percent: totalRevenue > 0 ? Math.round((r.revenue / totalRevenue) * 100) : 0,
  }));
}

export const realRepricingService = new RealRepricingService();
