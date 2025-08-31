import { supabase } from '@/integrations/supabase/client';

export interface DynamicPricing {
  id: string;
  user_id: string;
  product_id?: string;
  current_price: number;
  suggested_price: number;
  original_price: number;
  price_change_reason: string;
  ai_confidence: number;
  market_factors: any;
  competitor_analysis: any;
  demand_forecast: any;
  profit_impact: number;
  expected_sales_impact: number;
  status: 'pending' | 'approved' | 'applied' | 'rejected';
  applied_at?: string;
  expires_at?: string;
  performance_data: any;
  created_at: string;
  updated_at: string;
}

export interface PricingOptimization {
  success: boolean;
  currentPrice: number;
  suggestedPrice: number;
  priceChange: string;
  confidence: number;
  reasoning: string;
  marketAnalysis: any;
  impactAnalysis: any;
  recommendationId: string;
}

export class DynamicPricingService {
  
  static async getAllPricingRecommendations(): Promise<DynamicPricing[]> {
    const { data, error } = await supabase
      .from('dynamic_pricing')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

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

  static async approvePricingRecommendation(recommendationId: string): Promise<DynamicPricing> {
    const { data, error } = await supabase
      .from('dynamic_pricing')
      .update({ 
        status: 'approved',
        applied_at: new Date().toISOString()
      })
      .eq('id', recommendationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async rejectPricingRecommendation(recommendationId: string): Promise<DynamicPricing> {
    const { data, error } = await supabase
      .from('dynamic_pricing')
      .update({ status: 'rejected' })
      .eq('id', recommendationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async applyPricingRecommendation(recommendationId: string): Promise<boolean> {
    // Récupérer la recommandation
    const { data: recommendation, error: fetchError } = await supabase
      .from('dynamic_pricing')
      .select('*')
      .eq('id', recommendationId)
      .single();

    if (fetchError || !recommendation) throw new Error('Recommendation not found');

    // Mettre à jour le prix du produit
    const { error: updateError } = await supabase
      .from('imported_products')
      .update({ 
        price: recommendation.suggested_price,
        updated_at: new Date().toISOString()
      })
      .eq('id', recommendation.product_id);

    if (updateError) throw updateError;

    // Marquer comme appliqué
    await this.updateRecommendationStatus(recommendationId, 'applied');

    return true;
  }

  static async updateRecommendationStatus(
    recommendationId: string, 
    status: DynamicPricing['status']
  ): Promise<DynamicPricing> {
    const { data, error } = await supabase
      .from('dynamic_pricing')
      .update({ 
        status,
        ...(status === 'applied' ? { applied_at: new Date().toISOString() } : {})
      })
      .eq('id', recommendationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPendingRecommendations(): Promise<DynamicPricing[]> {
    const { data, error } = await supabase
      .from('dynamic_pricing')
      .select('*')
      .eq('status', 'pending')
      .order('ai_confidence', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getPerformanceMetrics(): Promise<any> {
    const { data: recommendations, error } = await supabase
      .from('dynamic_pricing')
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

    const appliedRecommendations = recommendations.filter(r => r.status === 'applied');
    const averageConfidence = recommendations.reduce((sum, r) => sum + r.ai_confidence, 0) / recommendations.length;
    const totalProfitImpact = appliedRecommendations.reduce((sum, r) => sum + (r.profit_impact || 0), 0);
    const averagePriceChange = appliedRecommendations.reduce((sum, r) => {
      const change = ((r.suggested_price - r.current_price) / r.current_price) * 100;
      return sum + Math.abs(change);
    }, 0) / (appliedRecommendations.length || 1);

    return {
      totalRecommendations: recommendations.length,
      appliedRecommendations: appliedRecommendations.length,
      averageConfidence: Math.round(averageConfidence),
      totalProfitImpact: Math.round(totalProfitImpact * 100) / 100,
      averagePriceChange: Math.round(averagePriceChange * 100) / 100
    };
  }

  static async bulkOptimizePricing(productIds: string[], marketData: any = {}): Promise<PricingOptimization[]> {
    const results = [];
    
    // Traiter par lots pour éviter la surcharge
    for (const productId of productIds) {
      try {
        const result = await this.optimizeProductPrice(productId, marketData);
        results.push(result);
        
        // Pause courte entre les requêtes
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
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

  static async getMarketTrends(): Promise<any> {
    // Simuler l'analyse des tendances de marché
    // En production, ceci ferait appel à des APIs de données de marché
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