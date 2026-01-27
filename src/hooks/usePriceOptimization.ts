/**
 * Price Optimization Hooks
 * Connecté au backend Supabase réel
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared';
import { DynamicPricingService } from '@/services/DynamicPricingService';

export interface PriceRecommendation {
  id: string;
  product: string;
  productId: string;
  currentPrice: number;
  suggestedPrice: number;
  impact: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
}

export interface OptimizationStats {
  potentialGain: number;
  opportunities: number;
  avgPrice: number;
  competitiveness: number;
}

export interface CompetitorAnalysis {
  id: string;
  competitor: string;
  productCount: number;
  avgPriceDiff: number;
  lastChecked: string;
}

export interface ElasticityData {
  productId: string;
  productName: string;
  elasticity: number;
  optimalPrice: number;
  currentPrice: number;
  demandImpact: string;
}

export function useOptimizationStats() {
  const { user } = useAuthOptimized();
  const userId = user?.id;

  return useQuery({
    queryKey: ['optimization-stats', userId],
    queryFn: async (): Promise<OptimizationStats> => {
      if (!userId) throw new Error('Not authenticated');

      // Get pending recommendations
      const { data: recommendations } = await (supabase
        .from('dynamic_pricing' as any) as any)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending');

      const recs = recommendations || [];
      
      // Calculate potential gain
      const potentialGain = recs.reduce((sum: number, r: any) => {
        const diff = (r.suggested_price || 0) - (r.current_price || 0);
        return sum + Math.max(0, diff * 10); // Assume 10 units sold
      }, 0);

      // Get average price from products
      const { data: products } = await supabase
        .from('products')
        .select('price')
        .eq('user_id', userId)
        .not('price', 'is', null);

      const avgPrice = products && products.length > 0
        ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length
        : 0;

      // Calculate competitiveness from competitive intelligence
      const { data: intel } = await supabase
        .from('competitive_intelligence')
        .select('price_difference')
        .eq('user_id', userId);

      let competitiveness = 85;
      if (intel && intel.length > 0) {
        const avgDiff = intel.reduce((sum, i) => sum + Math.abs(i.price_difference || 0), 0) / intel.length;
        competitiveness = Math.max(50, Math.min(100, 100 - avgDiff));
      }

      return {
        potentialGain: Math.round(potentialGain),
        opportunities: recs.length,
        avgPrice: Math.round(avgPrice * 100) / 100,
        competitiveness: Math.round(competitiveness),
      };
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function usePriceRecommendations() {
  const { user } = useAuthOptimized();
  const userId = user?.id;

  return useQuery({
    queryKey: ['price-recommendations', userId],
    queryFn: async (): Promise<PriceRecommendation[]> => {
      if (!userId) throw new Error('Not authenticated');

      // Try to get from dynamic_pricing table
      const { data: dynamicPricing } = await (supabase
        .from('dynamic_pricing' as any) as any)
        .select(`
          id,
          product_id,
          current_price,
          suggested_price,
          ai_confidence,
          price_change_reason
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('ai_confidence', { ascending: false })
        .limit(10);

      if (dynamicPricing && dynamicPricing.length > 0) {
        // Get product names
        const productIds = dynamicPricing.map((d: any) => d.product_id).filter(Boolean);
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);

        const productMap = new Map((products || []).map(p => [p.id, p.name]));

        return dynamicPricing.map((dp: any) => {
          const diff = ((dp.suggested_price - dp.current_price) / dp.current_price) * 100;
          return {
            id: dp.id,
            product: productMap.get(dp.product_id) || 'Produit',
            productId: dp.product_id,
            currentPrice: dp.current_price,
            suggestedPrice: dp.suggested_price,
            impact: `${diff > 0 ? '+' : ''}${Math.round(diff)}%`,
            confidence: dp.ai_confidence > 80 ? 'high' : dp.ai_confidence > 60 ? 'medium' : 'low',
            reasoning: dp.price_change_reason,
          };
        });
      }

      // Fallback: generate recommendations from products without recent optimization
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, cost_price')
        .eq('user_id', userId)
        .not('price', 'is', null)
        .not('cost_price', 'is', null)
        .limit(10);

      return (products || []).map(p => {
        const margin = ((p.price - p.cost_price) / p.price) * 100;
        const targetMargin = 30;
        const suggestedPrice = margin < targetMargin
          ? p.cost_price / (1 - targetMargin / 100)
          : p.price * 0.95; // Reduce by 5% if margin is high

        const diff = ((suggestedPrice - p.price) / p.price) * 100;

        return {
          id: p.id,
          product: p.name,
          productId: p.id,
          currentPrice: p.price,
          suggestedPrice: Math.round(suggestedPrice * 100) / 100,
          impact: `${diff > 0 ? '+' : ''}${Math.round(diff)}%`,
          confidence: Math.abs(diff) < 10 ? 'high' : 'medium',
        };
      });
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function useApplyRecommendation() {
  const queryClient = useQueryClient();
  const { user } = useAuthOptimized();

  return useMutation({
    mutationFn: async (recommendation: PriceRecommendation) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Update product price
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          price: recommendation.suggestedPrice,
          updated_at: new Date().toISOString() 
        })
        .eq('id', recommendation.productId);

      if (updateError) throw updateError;

      // Log to price history
      await supabase.from('price_history').insert({
        user_id: user.id,
        product_id: recommendation.productId,
        old_price: recommendation.currentPrice,
        new_price: recommendation.suggestedPrice,
        change_reason: 'Recommandation IA appliquée',
        source: 'ai_optimization',
      } as never);

      // Update recommendation status if exists in dynamic_pricing
      await (supabase
        .from('dynamic_pricing' as any) as any)
        .update({ status: 'applied', applied_at: new Date().toISOString() })
        .eq('id', recommendation.id);

      return recommendation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['optimization-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Recommandation appliquée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useApplyAllRecommendations() {
  const queryClient = useQueryClient();
  const { user } = useAuthOptimized();

  return useMutation({
    mutationFn: async (recommendations: PriceRecommendation[]) => {
      if (!user?.id) throw new Error('Not authenticated');

      let applied = 0;
      for (const rec of recommendations) {
        try {
          await supabase
            .from('products')
            .update({ 
              price: rec.suggestedPrice,
              updated_at: new Date().toISOString() 
            })
            .eq('id', rec.productId);

          await supabase.from('price_history').insert({
            user_id: user.id,
            product_id: rec.productId,
            old_price: rec.currentPrice,
            new_price: rec.suggestedPrice,
            change_reason: 'Recommandation IA (bulk)',
            source: 'ai_optimization',
          } as never);

          applied++;
        } catch (e) {
          console.error('Failed to apply recommendation:', e);
        }
      }

      return { applied, total: recommendations.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['optimization-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${data.applied}/${data.total} recommandations appliquées`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useCompetitorAnalysis() {
  const { user } = useAuthOptimized();
  const userId = user?.id;

  return useQuery({
    queryKey: ['competitor-analysis', userId],
    queryFn: async (): Promise<CompetitorAnalysis[]> => {
      if (!userId) throw new Error('Not authenticated');

      const { data } = await supabase
        .from('competitive_intelligence')
        .select('*')
        .eq('user_id', userId)
        .order('last_checked_at', { ascending: false });

      // Group by competitor
      const competitorMap = new Map<string, any[]>();
      (data || []).forEach(item => {
        const name = item.competitor_name || 'Concurrent';
        if (!competitorMap.has(name)) competitorMap.set(name, []);
        competitorMap.get(name)!.push(item);
      });

      return Array.from(competitorMap.entries()).map(([competitor, items]) => ({
        id: items[0].id,
        competitor,
        productCount: items.length,
        avgPriceDiff: items.reduce((sum, i) => sum + (i.price_difference || 0), 0) / items.length,
        lastChecked: new Date(items[0].last_checked_at || items[0].created_at).toLocaleString(),
      }));
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useElasticityData() {
  const { user } = useAuthOptimized();
  const userId = user?.id;

  return useQuery({
    queryKey: ['elasticity-data', userId],
    queryFn: async (): Promise<ElasticityData[]> => {
      if (!userId) throw new Error('Not authenticated');

      // Get products with sales data
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, cost_price')
        .eq('user_id', userId)
        .not('price', 'is', null)
        .limit(10);

      // Get price history for elasticity calculation
      const productIds = (products || []).map(p => p.id);
      const { data: priceHistory } = await supabase
        .from('price_history')
        .select('product_id, old_price, new_price')
        .in('product_id', productIds);

      const priceMap = new Map<string, { prices: number[] }>();
      (priceHistory || []).forEach(item => {
        if (!item.product_id) return;
        if (!priceMap.has(item.product_id)) {
          priceMap.set(item.product_id, { prices: [] });
        }
        const entry = priceMap.get(item.product_id)!;
        if (item.old_price) entry.prices.push(item.old_price);
        if (item.new_price) entry.prices.push(item.new_price);
      });

      return (products || []).map(p => {
        const history = priceMap.get(p.id);
        
        // Calculate elasticity (simplified model based on price variance)
        let elasticity = -1.5; // Default: elastic demand
        if (history && history.prices.length > 1) {
          const priceRange = Math.max(...history.prices) - Math.min(...history.prices);
          elasticity = priceRange > 0 ? -1 * (history.prices.length / priceRange) : -1.5;
        }

        // Calculate optimal price based on elasticity
        const costPrice = p.cost_price || p.price * 0.6;
        const optimalMarkup = 1 / (1 + 1 / Math.abs(elasticity));
        const optimalPrice = costPrice / (1 - optimalMarkup);

        const priceDiff = ((optimalPrice - p.price) / p.price) * 100;

        return {
          productId: p.id,
          productName: p.name,
          elasticity: Math.round(elasticity * 100) / 100,
          optimalPrice: Math.round(optimalPrice * 100) / 100,
          currentPrice: p.price,
          demandImpact: priceDiff > 5 ? 'Augmentation possible' : priceDiff < -5 ? 'Réduction conseillée' : 'Prix optimal',
        };
      });
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
