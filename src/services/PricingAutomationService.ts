import { supabase } from '@/integrations/supabase/client';

// Define types locally since these tables don't exist in the schema
interface PricingRule {
  id: string;
  name: string;
  rule_type?: string;
  is_active: boolean;
  priority?: number;
  conditions?: any;
  actions?: any;
  created_at?: string;
}

interface SupplierCost {
  id: string;
  product_id?: string;
  cost_price: number;
  currency?: string;
  shipping_cost?: number;
  created_at?: string;
}

interface ProfitCalculation {
  id: string;
  product_id?: string;
  net_margin_percent?: number;
  net_profit?: number;
  calculation_date?: string;
}

interface CompetitorPrice {
  id: string;
  product_id?: string;
  competitor_name: string;
  price: number;
  last_checked_at?: string;
}

export class PricingAutomationService {
  
  // === PRICING RULES ===
  static async getPricingRules(): Promise<PricingRule[]> {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (error) throw error;
    return (data || []) as PricingRule[];
  }

  static async createPricingRule(rule: any): Promise<PricingRule> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('pricing_rules')
      .insert({ 
        name: rule.rule_name || rule.name,
        rule_type: rule.strategy || 'fixed_margin',
        target_margin: rule.target_margin_percent,
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
      .update(updates as any)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data as PricingRule;
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
    let query = (supabase
      .from('competitive_intelligence') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((d: any) => ({
      id: d.id,
      product_id: d.product_id,
      cost_price: d.competitor_price || 0,
      currency: 'EUR',
      shipping_cost: 0,
      created_at: d.created_at
    })) as SupplierCost[];
  }

  static async addSupplierCost(cost: any): Promise<SupplierCost> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('competitive_intelligence')
      .insert({ 
        competitor_name: cost.supplier_name || 'Unknown',
        competitor_price: cost.cost_price,
        product_id: cost.product_id,
        user_id: currentUser.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      product_id: data.product_id,
      cost_price: data.competitor_price || 0,
      created_at: data.created_at
    } as SupplierCost;
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
    // Use price_history as a proxy for profit calculations
    let query = supabase
      .from('price_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((d: any) => ({
      id: d.id,
      product_id: d.product_id,
      net_margin_percent: d.margin || 0,
      net_profit: (d.new_price || 0) - (d.old_price || 0),
      calculation_date: d.created_at
    })) as ProfitCalculation[];
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
      .from('competitive_intelligence')
      .select('*')
      .order('last_checked_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((d: any) => ({
      id: d.id,
      product_id: d.product_id,
      competitor_name: d.competitor_name,
      price: d.competitor_price || 0,
      last_checked_at: d.last_checked_at
    })) as CompetitorPrice[];
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
