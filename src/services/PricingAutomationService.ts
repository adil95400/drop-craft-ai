import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PricingRule = Database['public']['Tables']['pricing_rules']['Row'];
type SupplierCost = Database['public']['Tables']['supplier_costs']['Row'];
type ProfitCalculation = Database['public']['Tables']['profit_calculations']['Row'];
type CompetitorPrice = Database['public']['Tables']['competitor_prices']['Row'];

export class PricingAutomationService {
  
  // === PRICING RULES ===
  static async getPricingRules(): Promise<PricingRule[]> {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createPricingRule(rule: any): Promise<PricingRule> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('pricing_rules')
      .insert({ 
        rule_name: rule.rule_name,
        rule_type: rule.rule_type,
        conditions: rule.conditions || {},
        actions: rule.actions || {},
        priority: rule.priority || 1,
        is_active: rule.is_active !== undefined ? rule.is_active : true,
        user_id: currentUser.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as PricingRule;
  }

  static async updatePricingRule(ruleId: string, updates: Partial<PricingRule>): Promise<PricingRule> {
    const { data, error } = await supabase
      .from('pricing_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePricingRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  }

  static async evaluatePricingRules(productId: string, currentPrice: number, costPrice: number, applyRules = false): Promise<any> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('pricing-rules-engine', {
      body: {
        userId: currentUser.user.id,
        productId,
        currentPrice,
        costPrice,
        applyRules
      }
    });

    if (error) throw error;
    return data;
  }

  // === SUPPLIER COSTS ===
  static async getSupplierCosts(productId?: string): Promise<SupplierCost[]> {
    let query = supabase
      .from('supplier_costs')
      .select('*')
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async addSupplierCost(cost: any): Promise<SupplierCost> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('supplier_costs')
      .insert({ 
        cost_price: cost.cost_price,
        currency: cost.currency || 'EUR',
        shipping_cost: cost.shipping_cost || 0,
        tax_amount: cost.tax_amount || 0,
        supplier_id: cost.supplier_id,
        product_id: cost.product_id,
        valid_from: cost.valid_from || new Date().toISOString(),
        valid_until: cost.valid_until,
        notes: cost.notes,
        user_id: currentUser.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as SupplierCost;
  }

  // === PROFIT CALCULATIONS ===
  static async calculateProfit(
    productId: string,
    sellingPrice: number,
    costPrice: number,
    additionalCosts?: any
  ): Promise<any> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('profit-calculator', {
      body: {
        userId: currentUser.user.id,
        productId,
        sellingPrice,
        costPrice,
        additionalCosts
      }
    });

    if (error) throw error;
    return data;
  }

  static async getProfitCalculations(productId?: string): Promise<ProfitCalculation[]> {
    let query = supabase
      .from('profit_calculations')
      .select('*')
      .order('calculation_date', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // === COMPETITOR TRACKING ===
  static async trackCompetitors(
    productId: string,
    myPrice: number,
    competitors: Array<{
      name: string;
      url?: string;
      price: number;
      shippingCost?: number;
    }>
  ): Promise<any> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('competitor-tracker', {
      body: {
        userId: currentUser.user.id,
        productId,
        myPrice,
        competitors
      }
    });

    if (error) throw error;
    return data;
  }

  static async getCompetitorPrices(productId?: string): Promise<CompetitorPrice[]> {
    let query = supabase
      .from('competitor_prices')
      .select('*')
      .order('last_checked_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // === ANALYTICS ===
  static async getPricingAnalytics(): Promise<any> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    // Récupérer toutes les données en parallèle
    const [rulesData, profitsData, competitorsData] = await Promise.all([
      this.getPricingRules(),
      this.getProfitCalculations(),
      this.getCompetitorPrices()
    ]);

    const avgMargin = profitsData.length > 0
      ? profitsData.reduce((sum, p) => sum + (p.net_margin_percent || 0), 0) / profitsData.length
      : 0;

    const totalProfit = profitsData.reduce((sum, p) => sum + (p.net_profit || 0), 0);

    return {
      total_rules: rulesData.length,
      active_rules: rulesData.filter(r => r.is_active).length,
      products_tracked: new Set(profitsData.map(p => p.product_id)).size,
      competitors_tracked: new Set(competitorsData.map(c => c.competitor_name)).size,
      avg_margin_percent: Math.round(avgMargin * 100) / 100,
      total_net_profit: Math.round(totalProfit * 100) / 100,
      recent_calculations: profitsData.slice(0, 10)
    };
  }
}