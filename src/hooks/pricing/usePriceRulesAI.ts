/**
 * Price Rules AI Hook
 * Recommandations IA et analyse d'impact pour les règles de tarification
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared';
import { toast } from 'sonner';

// Types
export interface AIRuleRecommendation {
  id: string;
  type: 'markup' | 'margin' | 'competitive' | 'rounding';
  name: string;
  description: string;
  reason: string;
  estimatedImpact: {
    productsAffected: number;
    revenueChange: number;
    marginChange: number;
  };
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  suggestedConfig: {
    value: number;
    applyTo?: string;
    category?: string;
  };
}

export interface RuleImpactPreview {
  productsAffected: number;
  currentRevenue: number;
  projectedRevenue: number;
  revenueChange: number;
  revenueChangePercent: number;
  currentMargin: number;
  projectedMargin: number;
  marginChange: number;
  topAffectedProducts: {
    id: string;
    name: string;
    currentPrice: number;
    newPrice: number;
    change: number;
  }[];
}

export interface PriceRulesAIStats {
  // Global metrics
  totalRules: number;
  activeRules: number;
  totalProductsManaged: number;
  productsWithoutRules: number;
  
  // Financial metrics
  totalManagedRevenue: number;
  avgMarginPercent: number;
  potentialRevenueGain: number;
  
  // AI insights
  optimizationScore: number;
  recommendations: AIRuleRecommendation[];
  
  // Activity
  rulesAppliedToday: number;
  priceChangesToday: number;
  lastRuleApplication?: string;
}

/**
 * Hook pour récupérer les stats enrichies avec IA
 */
export function usePriceRulesAIStats() {
  const { user } = useAuthOptimized();
  const userId = user?.id;

  return useQuery({
    queryKey: ['price-rules-ai-stats', userId],
    queryFn: async (): Promise<PriceRulesAIStats> => {
      if (!userId) throw new Error('Not authenticated');

      // Fetch rules
      const { data: rules = [] } = await supabase
        .from('price_rules')
        .select('*')
        .eq('user_id', userId);

      // Fetch products with prices
      const { data: products = [] } = await supabase
        .from('products')
        .select('id, price, cost_price, category, name')
        .eq('user_id', userId)
        .not('price', 'is', null);

      // Fetch today's price history
      const today = new Date().toISOString().split('T')[0];
      const { data: priceChanges = [] } = await supabase
        .from('price_history')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', today);

      // Calculate metrics
      const activeRules = rules.filter(r => r.is_active);
      const productsWithRules = rules.reduce((sum, r) => sum + (r.products_affected || 0), 0);
      const productsWithoutRules = Math.max(0, products.length - productsWithRules);

      const totalRevenue = products.reduce((sum, p) => sum + (p.price || 0), 0);
      const totalCost = products.reduce((sum, p) => sum + (p.cost_price || p.price * 0.6), 0);
      const avgMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

      // Generate AI recommendations
      const recommendations = generateAIRecommendations(products, rules);

      // Calculate optimization score (0-100)
      const hasActiveRules = activeRules.length > 0 ? 20 : 0;
      const coverageScore = products.length > 0 ? Math.min(30, (productsWithRules / products.length) * 30) : 0;
      const marginScore = avgMargin >= 25 ? 30 : (avgMargin / 25) * 30;
      const recentActivity = priceChanges.length > 0 ? 20 : 0;
      const optimizationScore = Math.round(hasActiveRules + coverageScore + marginScore + recentActivity);

      // Potential revenue gain from recommendations
      const potentialGain = recommendations.reduce((sum, r) => sum + r.estimatedImpact.revenueChange, 0);

      return {
        totalRules: rules.length,
        activeRules: activeRules.length,
        totalProductsManaged: productsWithRules,
        productsWithoutRules,
        totalManagedRevenue: totalRevenue,
        avgMarginPercent: Math.round(avgMargin * 10) / 10,
        potentialRevenueGain: potentialGain,
        optimizationScore,
        recommendations,
        rulesAppliedToday: rules.filter(r => r.last_applied_at?.startsWith(today)).length,
        priceChangesToday: priceChanges.length,
        lastRuleApplication: rules.sort((a, b) => 
          (b.last_applied_at || '').localeCompare(a.last_applied_at || '')
        )[0]?.last_applied_at,
      };
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook pour prévisualiser l'impact d'une règle
 */
export function useRuleImpactPreview() {
  const { user } = useAuthOptimized();

  return useMutation({
    mutationFn: async (ruleConfig: {
      ruleType: string;
      value: number;
      applyTo: string;
      category?: string;
    }): Promise<RuleImpactPreview> => {
      if (!user?.id) throw new Error('Not authenticated');

      // Fetch products
      let query = supabase
        .from('products')
        .select('id, name, price, cost_price, category')
        .eq('user_id', user.id)
        .not('price', 'is', null);

      if (ruleConfig.applyTo === 'category' && ruleConfig.category) {
        query = query.eq('category', ruleConfig.category);
      }

      const { data: products = [] } = await query.limit(500);

      // Calculate impact
      let currentRevenue = 0;
      let projectedRevenue = 0;
      let currentMargin = 0;
      let projectedMargin = 0;

      const topAffected: RuleImpactPreview['topAffectedProducts'] = [];

      for (const product of products) {
        const price = product.price || 0;
        const cost = product.cost_price || price * 0.6;
        
        let newPrice = price;

        switch (ruleConfig.ruleType) {
          case 'markup':
            newPrice = cost * (1 + ruleConfig.value / 100);
            break;
          case 'margin':
            newPrice = cost / (1 - ruleConfig.value / 100);
            break;
          case 'competitive':
            newPrice = price * (1 - ruleConfig.value / 100);
            break;
          case 'rounding':
            newPrice = Math.floor(price) + 0.99;
            break;
          case 'fixed':
            newPrice = price + ruleConfig.value;
            break;
        }

        newPrice = Math.round(newPrice * 100) / 100;

        currentRevenue += price;
        projectedRevenue += newPrice;
        currentMargin += price - cost;
        projectedMargin += newPrice - cost;

        if (topAffected.length < 5 && Math.abs(newPrice - price) > 0.01) {
          topAffected.push({
            id: product.id,
            name: product.name || 'Produit',
            currentPrice: price,
            newPrice,
            change: newPrice - price,
          });
        }
      }

      return {
        productsAffected: products.length,
        currentRevenue,
        projectedRevenue,
        revenueChange: projectedRevenue - currentRevenue,
        revenueChangePercent: currentRevenue > 0 
          ? ((projectedRevenue - currentRevenue) / currentRevenue) * 100 
          : 0,
        currentMargin,
        projectedMargin,
        marginChange: projectedMargin - currentMargin,
        topAffectedProducts: topAffected.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)),
      };
    },
  });
}

/**
 * Hook pour appliquer une recommandation IA
 */
export function useApplyAIRecommendation() {
  const queryClient = useQueryClient();
  const { user } = useAuthOptimized();

  return useMutation({
    mutationFn: async (recommendation: AIRuleRecommendation) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Create the rule from recommendation
      const { data, error } = await supabase
        .from('price_rules')
        .insert({
          user_id: user.id,
          name: recommendation.name,
          description: recommendation.description,
          rule_type: recommendation.type,
          priority: recommendation.priority === 'high' ? 10 : recommendation.priority === 'medium' ? 5 : 1,
          calculation: { 
            type: 'percentage', 
            value: recommendation.suggestedConfig.value 
          },
          apply_to: recommendation.suggestedConfig.applyTo || 'all',
          apply_filter: recommendation.suggestedConfig.category 
            ? { category: recommendation.suggestedConfig.category } 
            : null,
          is_active: true,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-rules'] });
      queryClient.invalidateQueries({ queryKey: ['price-rules-ai-stats'] });
      toast.success('Règle créée à partir de la recommandation IA');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// ========== Helper Functions ==========

function generateAIRecommendations(
  products: Array<{ id: string; price: number | null; cost_price: number | null; category: string | null; name: string | null }>,
  rules: Array<{ rule_type: string; is_active: boolean; apply_to: string }>
): AIRuleRecommendation[] {
  const recommendations: AIRuleRecommendation[] = [];

  if (products.length === 0) return recommendations;

  // Analyze products
  const productsWithCost = products.filter(p => p.cost_price && p.price);
  const avgMargin = productsWithCost.length > 0
    ? productsWithCost.reduce((sum, p) => {
        const margin = ((p.price! - p.cost_price!) / p.price!) * 100;
        return sum + margin;
      }, 0) / productsWithCost.length
    : 0;

  // 1. Low margin products recommendation
  const lowMarginProducts = productsWithCost.filter(p => {
    const margin = ((p.price! - p.cost_price!) / p.price!) * 100;
    return margin < 15;
  });

  if (lowMarginProducts.length > 5) {
    recommendations.push({
      id: 'rec-low-margin',
      type: 'margin',
      name: 'Optimiser les marges faibles',
      description: `${lowMarginProducts.length} produits ont une marge inférieure à 15%`,
      reason: 'Ces produits génèrent peu de profit et pourraient bénéficier d\'une augmentation de prix',
      estimatedImpact: {
        productsAffected: lowMarginProducts.length,
        revenueChange: lowMarginProducts.length * 5,
        marginChange: lowMarginProducts.length * 3,
      },
      confidence: 0.85,
      priority: 'high',
      suggestedConfig: {
        value: 25,
        applyTo: 'all',
      },
    });
  }

  // 2. Psychological pricing recommendation
  const nonRoundedProducts = products.filter(p => {
    const price = p.price || 0;
    const cents = Math.round((price % 1) * 100);
    return cents !== 99 && cents !== 95 && cents !== 0;
  });

  if (nonRoundedProducts.length > 10 && !rules.some(r => r.rule_type === 'rounding' && r.is_active)) {
    recommendations.push({
      id: 'rec-rounding',
      type: 'rounding',
      name: 'Prix psychologiques',
      description: `${nonRoundedProducts.length} produits n'utilisent pas de prix psychologiques`,
      reason: 'Les prix en .99€ convertissent mieux selon les études comportementales',
      estimatedImpact: {
        productsAffected: nonRoundedProducts.length,
        revenueChange: Math.round(nonRoundedProducts.length * 0.5),
        marginChange: Math.round(nonRoundedProducts.length * 0.3),
      },
      confidence: 0.78,
      priority: 'medium',
      suggestedConfig: {
        value: 99,
        applyTo: 'all',
      },
    });
  }

  // 3. Category-specific markup
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  
  for (const category of categories.slice(0, 2)) {
    const categoryProducts = productsWithCost.filter(p => p.category === category);
    if (categoryProducts.length >= 10) {
      const categoryMargin = categoryProducts.reduce((sum, p) => {
        return sum + ((p.price! - p.cost_price!) / p.price!) * 100;
      }, 0) / categoryProducts.length;

      if (categoryMargin < 20) {
        recommendations.push({
          id: `rec-category-${category}`,
          type: 'markup',
          name: `Markup ${category}`,
          description: `La catégorie "${category}" a une marge moyenne de ${Math.round(categoryMargin)}%`,
          reason: 'Un markup de 35% permettrait d\'atteindre une marge saine',
          estimatedImpact: {
            productsAffected: categoryProducts.length,
            revenueChange: Math.round(categoryProducts.length * 8),
            marginChange: Math.round(categoryProducts.length * 5),
          },
          confidence: 0.72,
          priority: 'medium',
          suggestedConfig: {
            value: 35,
            applyTo: 'category',
            category: category!,
          },
        });
      }
    }
  }

  // 4. Competitive pricing for high-margin products
  const highMarginProducts = productsWithCost.filter(p => {
    const margin = ((p.price! - p.cost_price!) / p.price!) * 100;
    return margin > 50;
  });

  if (highMarginProducts.length > 5) {
    recommendations.push({
      id: 'rec-competitive',
      type: 'competitive',
      name: 'Prix compétitifs',
      description: `${highMarginProducts.length} produits ont une marge > 50%`,
      reason: 'Une légère réduction pourrait augmenter le volume de ventes',
      estimatedImpact: {
        productsAffected: highMarginProducts.length,
        revenueChange: Math.round(highMarginProducts.length * 2),
        marginChange: -Math.round(highMarginProducts.length * 1),
      },
      confidence: 0.65,
      priority: 'low',
      suggestedConfig: {
        value: 5,
        applyTo: 'all',
      },
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
