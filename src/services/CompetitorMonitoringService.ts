/**
 * Competitor Monitoring Service
 * Orchestrates competitor price tracking, auto-repricing, and market intelligence
 */
import { supabase } from '@/integrations/supabase/client';

export interface CompetitorProfile {
  id: string;
  name: string;
  website: string;
  is_active: boolean;
  products_tracked: number;
  avg_price_diff: number;
  last_scraped_at: string;
}

export interface CompetitorPriceEntry {
  id: string;
  product_id: string;
  competitor_id: string;
  product_title: string;
  our_price: number;
  competitor_price: number;
  price_diff: number;
  price_diff_percent: number;
  trend: 'up' | 'down' | 'stable';
  in_stock: boolean;
  last_updated: string;
}

export interface AutoPricingConfig {
  confidence_threshold: number;
  max_price_change_pct: number;
  min_margin_floor: number;
  strategy: 'undercut' | 'match' | 'premium';
  undercut_percent: number;
}

export class CompetitorMonitoringService {
  /**
   * Add a new competitor profile to monitor
   */
  static async addCompetitor(name: string, website: string): Promise<CompetitorProfile> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('competitor_profiles')
      .insert({
        user_id: session.user.id,
        name,
        website,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as CompetitorProfile;
  }

  /**
   * Get all competitor profiles
   */
  static async getCompetitors(): Promise<CompetitorProfile[]> {
    const { data, error } = await supabase
      .from('competitor_profiles')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []) as CompetitorProfile[];
  }

  /**
   * Trigger a competitor price refresh (uses Firecrawl for real scraping)
   */
  static async refreshPrices(competitorId?: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('competitor-tracker', {
      body: {
        action: 'refresh',
        competitor_id: competitorId,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get competitor price data for products
   */
  static async getCompetitorPrices(productId?: string): Promise<CompetitorPriceEntry[]> {
    let query = supabase
      .from('competitor_prices')
      .select('*')
      .order('last_updated', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query.limit(500);
    if (error) throw error;
    return (data || []) as CompetitorPriceEntry[];
  }

  /**
   * Get competitive intelligence with confidence scores
   */
  static async getIntelligence(minConfidence = 50) {
    const { data, error } = await supabase
      .from('competitive_intelligence')
      .select('*')
      .gte('confidence_score', minConfidence)
      .order('confidence_score', { ascending: false })
      .limit(200);

    if (error) throw error;
    return data || [];
  }

  /**
   * Run auto-apply check to adjust prices based on competitor data
   */
  static async runAutoApply() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('competitor-tracker', {
      body: { action: 'auto_apply_check' },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get price history for trend analysis
   */
  static async getPriceHistory(productId: string, competitorId: string) {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(90);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get market positioning summary
   */
  static async getMarketPositioning() {
    const { data: prices, error } = await supabase
      .from('competitor_prices')
      .select('our_price, competitor_price, price_diff_percent, trend');

    if (error) throw error;
    if (!prices?.length) return { total: 0, cheaper: 0, pricier: 0, matched: 0, avgDiff: 0 };

    const cheaper = prices.filter(p => (p.price_diff_percent ?? 0) > 2).length;
    const pricier = prices.filter(p => (p.price_diff_percent ?? 0) < -2).length;
    const matched = prices.length - cheaper - pricier;
    const avgDiff = prices.reduce((s, p) => s + (p.price_diff_percent ?? 0), 0) / prices.length;

    return {
      total: prices.length,
      cheaper,
      pricier,
      matched,
      avgDiff: Math.round(avgDiff * 100) / 100,
      trending_up: prices.filter(p => p.trend === 'up').length,
      trending_down: prices.filter(p => p.trend === 'down').length,
    };
  }
}
