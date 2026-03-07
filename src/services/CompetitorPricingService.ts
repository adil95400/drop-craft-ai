/**
 * Competitor Pricing Service
 * Service pour le repricing concurrentiel — données réelles via Supabase
 */

import { supabase } from '@/integrations/supabase/client';

export interface Competitor {
  id: string;
  name: string;
  website: string;
  isActive: boolean;
  lastScraped?: string;
  productsTracked: number;
  avgPriceDiff: number;
}

export interface CompetitorPrice {
  id: string;
  productId: string;
  productTitle: string;
  competitorId: string;
  competitorName: string;
  ourPrice: number;
  competitorPrice: number;
  priceDiff: number;
  priceDiffPercent: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  inStock: boolean;
}

export interface RepricingRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  strategy: 'match' | 'undercut' | 'premium' | 'dynamic';
  offset: number;
  offsetType: 'percentage' | 'fixed';
  minMargin: number;
  maxDiscount: number;
  competitorIds: string[];
  productFilter?: {
    categories?: string[];
    brands?: string[];
    minPrice?: number;
    maxPrice?: number;
  };
  schedule: 'realtime' | 'hourly' | 'daily' | 'weekly';
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  productsAffected: number;
}

export interface RepricingStats {
  totalCompetitors: number;
  activeRules: number;
  productsMonitored: number;
  priceChangesToday: number;
  avgSavings: number;
  competitivePosition: 'leader' | 'competitive' | 'behind';
}

function mapCompetitor(row: any): Competitor {
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    isActive: row.is_active,
    lastScraped: row.last_scraped_at,
    productsTracked: row.products_tracked || 0,
    avgPriceDiff: Number(row.avg_price_diff) || 0,
  };
}

function mapPrice(row: any, competitorName: string): CompetitorPrice {
  return {
    id: row.id,
    productId: row.product_id,
    productTitle: row.product_title,
    competitorId: row.competitor_id,
    competitorName,
    ourPrice: Number(row.our_price),
    competitorPrice: Number(row.competitor_price),
    priceDiff: Number(row.price_diff),
    priceDiffPercent: Number(row.price_diff_percent),
    lastUpdated: row.last_updated,
    trend: (row.trend as 'up' | 'down' | 'stable') || 'stable',
    inStock: row.in_stock ?? true,
  };
}

function mapRule(row: any): RepricingRule {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    strategy: row.strategy,
    offset: Number(row.price_offset),
    offsetType: row.offset_type,
    minMargin: Number(row.min_margin),
    maxDiscount: Number(row.max_discount),
    competitorIds: row.competitor_ids || [],
    productFilter: row.product_filter || {},
    schedule: row.schedule,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastExecutedAt: row.last_executed_at,
    productsAffected: row.products_affected || 0,
  };
}

export const CompetitorPricingService = {
  async getCompetitors(): Promise<Competitor[]> {
    const { data, error } = await supabase
      .from('competitor_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapCompetitor);
  },

  async addCompetitor(competitor: Omit<Competitor, 'id' | 'productsTracked' | 'avgPriceDiff'>): Promise<Competitor> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('competitor_profiles')
      .insert({
        user_id: user.id,
        name: competitor.name,
        website: competitor.website,
        is_active: competitor.isActive,
      })
      .select()
      .single();

    if (error) throw error;
    return mapCompetitor(data);
  },

  async removeCompetitor(id: string): Promise<void> {
    const { error } = await supabase
      .from('competitor_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleCompetitor(id: string): Promise<Competitor> {
    // First get current state
    const { data: current, error: fetchError } = await supabase
      .from('competitor_profiles')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('competitor_profiles')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapCompetitor(data);
  },

  async getCompetitorPrices(filters?: { competitorId?: string; productId?: string }): Promise<CompetitorPrice[]> {
    let query = supabase
      .from('competitor_prices')
      .select('*, competitor_profiles(name)')
      .order('last_updated', { ascending: false });

    if (filters?.competitorId) {
      query = query.eq('competitor_id', filters.competitorId);
    }
    if (filters?.productId) {
      query = query.eq('product_id', filters.productId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => 
      mapPrice(row, row.competitor_profiles?.name || 'Inconnu')
    );
  },

  async refreshPrices(competitorId?: string): Promise<{ updated: number; failed: number }> {
    // Invoke the edge function to scrape competitor prices
    const { data, error } = await supabase.functions.invoke('competitor-tracker', {
      body: { action: 'refresh', competitor_id: competitorId }
    });

    if (error) {
      console.warn('Competitor tracker invoke failed, returning partial result');
      return { updated: 0, failed: 0 };
    }

    return data || { updated: 0, failed: 0 };
  },

  async getRepricingRules(): Promise<RepricingRule[]> {
    const { data, error } = await supabase
      .from('repricing_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRule);
  },

  async createRepricingRule(rule: Omit<RepricingRule, 'id' | 'createdAt' | 'updatedAt' | 'productsAffected'>): Promise<RepricingRule> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('repricing_rules')
      .insert({
        user_id: user.id,
        name: rule.name,
        description: rule.description,
        is_active: rule.isActive,
        strategy: rule.strategy,
        price_offset: rule.offset,
        offset_type: rule.offsetType,
        min_margin: rule.minMargin,
        max_discount: rule.maxDiscount,
        competitor_ids: rule.competitorIds,
        product_filter: rule.productFilter || {},
        schedule: rule.schedule,
      })
      .select()
      .single();

    if (error) throw error;
    return mapRule(data);
  },

  async updateRepricingRule(id: string, updates: Partial<RepricingRule>): Promise<RepricingRule> {
    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.strategy !== undefined) dbUpdates.strategy = updates.strategy;
    if (updates.offset !== undefined) dbUpdates.price_offset = updates.offset;
    if (updates.offsetType !== undefined) dbUpdates.offset_type = updates.offsetType;
    if (updates.minMargin !== undefined) dbUpdates.min_margin = updates.minMargin;
    if (updates.maxDiscount !== undefined) dbUpdates.max_discount = updates.maxDiscount;
    if (updates.competitorIds !== undefined) dbUpdates.competitor_ids = updates.competitorIds;
    if (updates.productFilter !== undefined) dbUpdates.product_filter = updates.productFilter;
    if (updates.schedule !== undefined) dbUpdates.schedule = updates.schedule;

    const { data, error } = await supabase
      .from('repricing_rules')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapRule(data);
  },

  async deleteRepricingRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('repricing_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleRepricingRule(id: string): Promise<RepricingRule> {
    const { data: current, error: fetchError } = await supabase
      .from('repricing_rules')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    return this.updateRepricingRule(id, { isActive: !current.is_active });
  },

  async executeRepricingRule(id: string): Promise<{ success: boolean; priceChanges: number; errors: number }> {
    const { data, error } = await supabase.functions.invoke('repricing-engine', {
      body: { action: 'apply_rule', rule_id: id }
    });

    if (error) throw error;

    // Update last_executed_at
    await supabase
      .from('repricing_rules')
      .update({ last_executed_at: new Date().toISOString() })
      .eq('id', id);

    return {
      success: data?.success ?? true,
      priceChanges: data?.products_updated ?? 0,
      errors: data?.products_failed ?? 0,
    };
  },

  async getStats(): Promise<RepricingStats> {
    const [competitorsRes, rulesRes, pricesRes, changesRes] = await Promise.all([
      supabase.from('competitor_profiles').select('id, is_active'),
      supabase.from('repricing_rules').select('id, is_active'),
      supabase.from('competitor_prices').select('id, price_diff_percent'),
      supabase.from('price_change_history').select('id').gte('changed_at', new Date(Date.now() - 86400000).toISOString()),
    ]);

    const activeCompetitors = (competitorsRes.data || []).filter((c: any) => c.is_active).length;
    const activeRules = (rulesRes.data || []).filter((r: any) => r.is_active).length;
    const prices = pricesRes.data || [];
    const todayChanges = changesRes.data?.length || 0;

    const avgDiff = prices.length > 0
      ? prices.reduce((sum: number, p: any) => sum + Math.abs(Number(p.price_diff_percent || 0)), 0) / prices.length
      : 0;

    let position: 'leader' | 'competitive' | 'behind' = 'competitive';
    if (avgDiff < 3) position = 'leader';
    else if (avgDiff > 10) position = 'behind';

    return {
      totalCompetitors: activeCompetitors,
      activeRules,
      productsMonitored: prices.length,
      priceChangesToday: todayChanges,
      avgSavings: parseFloat(avgDiff.toFixed(1)),
      competitivePosition: position,
    };
  },

  async simulatePriceChange(productId: string, newPrice: number) {
    const { data: prices } = await supabase
      .from('competitor_prices')
      .select('*, competitor_profiles(name)')
      .eq('product_id', productId);

    const { data: product } = await supabase
      .from('products')
      .select('cost_price, price')
      .eq('id', productId)
      .single();

    const costPrice = product?.cost_price || 0;
    const currentPrice = product?.price || 0;

    return {
      currentMargin: costPrice > 0 ? ((currentPrice - costPrice) / currentPrice * 100) : 0,
      newMargin: costPrice > 0 ? ((newPrice - costPrice) / newPrice * 100) : 0,
      competitorComparison: (prices || []).map((p: any) => ({
        name: p.competitor_profiles?.name || 'Inconnu',
        theirPrice: Number(p.competitor_price),
        difference: newPrice - Number(p.competitor_price),
      })),
    };
  },
};
