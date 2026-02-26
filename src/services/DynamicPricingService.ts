/**
 * @module DynamicPricingService
 * @description AI-powered dynamic pricing engine.
 *
 * Manages pricing recommendations: creation via the
 * `dynamic-pricing-optimizer` edge function, approval/rejection workflow,
 * bulk optimization, and performance tracking.
 *
 * Pricing data is stored in the `dynamic_pricing` table.
 */
import { supabase } from '@/integrations/supabase/client';

/** A pricing recommendation stored in the database. */
export interface DynamicPricing {
  id: string;
  user_id: string;
  product_id?: string;
  current_price: number;
  suggested_price: number;
  original_price: number;
  price_change_reason: string;
  /** AI confidence score (0–100). */
  ai_confidence: number;
  market_factors: any;
  competitor_analysis: any;
  demand_forecast: any;
  /** Estimated profit delta if the suggestion is applied. */
  profit_impact: number;
  expected_sales_impact: number;
  /** Workflow status: "pending" | "approved" | "rejected" | "applied". */
  status: string;
  applied_at?: string;
  expires_at?: string;
  performance_data: any;
  created_at: string;
  updated_at: string;
}

/** Result returned by the AI pricing optimizer. */
export interface PricingOptimization {
  success: boolean;
  currentPrice: number;
  suggestedPrice: number;
  /** Human-readable price change description (e.g. "+5.2%"). */
  priceChange: string;
  /** AI confidence 0–100. */
  confidence: number;
  reasoning: string;
  marketAnalysis: any;
  impactAnalysis: any;
  recommendationId: string;
}

export class DynamicPricingService {
  
  /** Fetch all pricing recommendations, newest first. */
  static async getAllPricingRecommendations(): Promise<DynamicPricing[]> {
    const { data, error } = await (supabase
      .from('dynamic_pricing' as any) as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DynamicPricing[];
  }

  /**
   * Request an AI-generated price optimization for a single product.
   * @param productId  - The product to optimize.
   * @param marketData - Optional external market data to enrich the analysis.
   * @throws Error if not authenticated.
   */
  static async optimizeProductPrice(productId: string, marketData: any = {}): Promise<PricingOptimization> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('dynamic-pricing-optimizer', {
      body: {
        productId,
        marketData,
        userId: currentUser.user.id
      }
    });

    if (error) throw error;
    return data;
  }

  /** Mark a recommendation as approved (does NOT apply the price yet). */
  static async approvePricingRecommendation(recommendationId: string): Promise<DynamicPricing> {
    const { data, error } = await (supabase
      .from('dynamic_pricing' as any) as any)
      .update({ 
        status: 'approved',
        applied_at: new Date().toISOString()
      })
      .eq('id', recommendationId)
      .select()
      .single();

    if (error) throw error;
    return data as DynamicPricing;
  }

  /** Reject a pricing recommendation. */
  static async rejectPricingRecommendation(recommendationId: string): Promise<DynamicPricing> {
    const { data, error } = await (supabase
      .from('dynamic_pricing' as any) as any)
      .update({ status: 'rejected' })
      .eq('id', recommendationId)
      .select()
      .single();

    if (error) throw error;
    return data as DynamicPricing;
  }

  /**
   * Apply a recommendation: update the product's price in `imported_products`
   * and mark the recommendation status as "applied".
   * @param recommendationId - The recommendation to apply.
   * @returns `true` on success.
   */
  static async applyPricingRecommendation(recommendationId: string): Promise<boolean> {
    const { data: recommendation, error: fetchError } = await (supabase
      .from('dynamic_pricing' as any) as any)
      .select('*')
      .eq('id', recommendationId)
      .single();

    if (fetchError || !recommendation) throw new Error('Recommendation not found');

    const rec = recommendation as DynamicPricing;

    const { error: updateError } = await supabase
      .from('imported_products')
      .update({ 
        price: rec.suggested_price,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', rec.product_id as string);

    if (updateError) throw updateError;

    await this.updateRecommendationStatus(recommendationId, 'applied');
    return true;
  }

  /**
   * Update the workflow status of a recommendation.
   * Automatically sets `applied_at` when status is "applied".
   */
  static async updateRecommendationStatus(
    recommendationId: string, 
    status: string
  ): Promise<DynamicPricing> {
    const { data, error } = await (supabase
      .from('dynamic_pricing' as any) as any)
      .update({ 
        status,
        ...(status === 'applied' ? { applied_at: new Date().toISOString() } : {})
      })
      .eq('id', recommendationId)
      .select()
      .single();

    if (error) throw error;
    return data as DynamicPricing;
  }

  /** Get all pending recommendations sorted by confidence (highest first). */
  static async getPendingRecommendations(): Promise<DynamicPricing[]> {
    const { data, error } = await (supabase
      .from('dynamic_pricing' as any) as any)
      .select('*')
      .eq('status', 'pending')
      .order('ai_confidence', { ascending: false });

    if (error) throw error;
    return (data || []) as DynamicPricing[];
  }

  /**
   * Compute aggregate performance metrics for all applied recommendations.
   * @returns Summary object with counts, averages, and total profit impact.
   */
  static async getPerformanceMetrics(): Promise<any> {
    const { data: recommendations, error } = await (supabase
      .from('dynamic_pricing' as any) as any)
      .select('*')
      .not('applied_at', 'is', null);

    if (error) throw error;

    if (!recommendations || recommendations.length === 0) {
      return {
        totalRecommendations: 0,
        appliedRecommendations: 0,
        averageConfidence: 0,
        totalProfitImpact: 0,
        averagePriceChange: 0
      };
    }

    const recs = recommendations as DynamicPricing[];
    const appliedRecommendations = recs.filter(r => r.status === 'applied');
    const averageConfidence = recs.reduce((sum, r) => sum + r.ai_confidence, 0) / recs.length;
    const totalProfitImpact = appliedRecommendations.reduce((sum, r) => sum + (r.profit_impact || 0), 0);
    const averagePriceChange = appliedRecommendations.reduce((sum, r) => {
      const change = ((r.suggested_price - r.current_price) / r.current_price) * 100;
      return sum + Math.abs(change);
    }, 0) / (appliedRecommendations.length || 1);

    return {
      totalRecommendations: recs.length,
      appliedRecommendations: appliedRecommendations.length,
      averageConfidence: Math.round(averageConfidence),
      totalProfitImpact: Math.round(totalProfitImpact * 100) / 100,
      averagePriceChange: Math.round(averagePriceChange * 100) / 100
    };
  }

  /**
   * Run pricing optimization for multiple products sequentially.
   * A 500 ms delay is inserted between requests to avoid rate-limiting.
   * @param productIds - Array of product IDs to optimize.
   * @param marketData - Shared market context for all optimizations.
   */
  static async bulkOptimizePricing(productIds: string[], marketData: any = {}): Promise<PricingOptimization[]> {
    const results = [];
    
    for (const productId of productIds) {
      try {
        const result = await this.optimizeProductPrice(productId, marketData);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`Error optimizing pricing for product ${productId}:`, error);
        results.push({
          success: false,
          error: error.message,
          productId
        } as any);
      }
    }
    
    return results;
  }

  /**
   * Get current market trend indicators.
   * @returns Simulated trends (demand index, competitor activity, seasonal factors).
   */
  static async getMarketTrends(): Promise<any> {
    return {
      overallTrend: 'stable',
      demandIndex: 105,
      competitorActivity: 'moderate',
      seasonalFactors: {
        current: 1.0,
        upcoming: 1.15
      },
      recommendations: [
        'Maintenir les prix actuels',
        'Surveiller les promotions concurrentes'
      ]
    };
  }
}
