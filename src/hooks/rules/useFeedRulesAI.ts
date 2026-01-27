/**
 * Feed Rules AI Hook
 * AI-powered suggestions and analytics for feed rules
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { useFeedRules, useFeedRulesStats, useFeedRuleExecutions } from '@/hooks/useFeedRules';
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts';

export interface FeedRuleRecommendation {
  id: string;
  type: 'optimization' | 'new_rule' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: {
    productsAffected: number;
    estimatedImprovement: string;
  };
  suggestedConditions?: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  suggestedActions?: Array<{
    type: string;
    field?: string;
    value?: string;
  }>;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

export interface FeedRulesAIStats {
  coverageScore: number;
  optimizationScore: number;
  productsWithoutRules: number;
  estimatedQualityGain: number;
  categoryBreakdown: Array<{
    category: string;
    rulesCount: number;
    productsCount: number;
    coverage: number;
  }>;
}

export function useFeedRulesAIStats(): { 
  stats: FeedRulesAIStats; 
  isLoading: boolean 
} {
  const { data: rules = [] } = useFeedRules();
  const { data: executions = [] } = useFeedRuleExecutions(undefined, 100);
  const { products = [] } = useUnifiedProducts();
  const { data: feedStats } = useFeedRulesStats();

  const stats = useMemo((): FeedRulesAIStats => {
    const totalProducts = products.length;
    const activeRules = rules.filter(r => r.is_active);
    
    // Calculate products affected by rules (estimate based on execution history)
    const productsWithRules = new Set<string>();
    executions.forEach(exec => {
      if (exec.products_modified > 0) {
        // Estimate - in real world would track actual product IDs
        for (let i = 0; i < Math.min(exec.products_modified, totalProducts); i++) {
          if (products[i]) productsWithRules.add(products[i].id);
        }
      }
    });

    const productsWithoutRules = Math.max(0, totalProducts - productsWithRules.size);
    const coverageScore = totalProducts > 0 
      ? Math.round((productsWithRules.size / totalProducts) * 100) 
      : 0;

    // Calculate optimization score based on rule diversity and success rate
    const hasTransformRules = rules.some(r => 
      r.actions.some((a: any) => a.type === 'transform' || a.type === 'replace')
    );
    const hasExcludeRules = rules.some(r => 
      r.actions.some((a: any) => a.type === 'exclude')
    );
    const hasEnrichRules = rules.some(r => 
      r.actions.some((a: any) => a.type === 'set' || a.type === 'append')
    );

    const diversityScore = [hasTransformRules, hasExcludeRules, hasEnrichRules]
      .filter(Boolean).length / 3 * 100;

    const executionSuccessRate = executions.length > 0
      ? executions.filter(e => e.status === 'success').length / executions.length * 100
      : 100;

    const optimizationScore = Math.round((diversityScore * 0.4 + executionSuccessRate * 0.6));

    // Estimate quality gain (15-30% per active rule type)
    const estimatedQualityGain = Math.min(
      100,
      activeRules.length * 12 + (hasTransformRules ? 15 : 0) + (hasEnrichRules ? 10 : 0)
    );

    // Category breakdown
    const categoryMap = new Map<string, { rulesCount: number; productsCount: number }>();
    products.forEach(p => {
      const cat = p.category || 'Non catégorisé';
      const existing = categoryMap.get(cat) || { rulesCount: 0, productsCount: 0 };
      existing.productsCount++;
      categoryMap.set(cat, existing);
    });

    // Associate rules with categories (heuristic based on conditions)
    rules.forEach(rule => {
      rule.conditions.forEach((cond: any) => {
        if (cond.field === 'category' && cond.value) {
          const existing = categoryMap.get(cond.value) || { rulesCount: 0, productsCount: 0 };
          existing.rulesCount++;
          categoryMap.set(cond.value, existing);
        }
      });
      // Global rules count for all categories
      if (!rule.conditions.some((c: any) => c.field === 'category')) {
        categoryMap.forEach((data, cat) => {
          data.rulesCount++;
        });
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        rulesCount: data.rulesCount,
        productsCount: data.productsCount,
        coverage: data.rulesCount > 0 ? Math.min(100, data.rulesCount * 25) : 0,
      }))
      .sort((a, b) => b.productsCount - a.productsCount)
      .slice(0, 6);

    return {
      coverageScore,
      optimizationScore,
      productsWithoutRules,
      estimatedQualityGain,
      categoryBreakdown,
    };
  }, [rules, executions, products]);

  return { stats, isLoading: false };
}

export function useFeedRuleRecommendations(): {
  recommendations: FeedRuleRecommendation[];
  isLoading: boolean;
} {
  const { data: rules = [] } = useFeedRules();
  const { products = [] } = useUnifiedProducts();

  const recommendations = useMemo((): FeedRuleRecommendation[] => {
    const recs: FeedRuleRecommendation[] = [];

    // 1. Missing title optimization
    const productsWithLongTitles = products.filter(p => 
      p.name && p.name.length > 100
    );
    if (productsWithLongTitles.length > 0) {
      recs.push({
        id: 'optimize-titles',
        type: 'optimization',
        title: 'Optimiser les titres longs',
        description: `${productsWithLongTitles.length} produits ont des titres > 100 caractères, ce qui peut affecter le référencement.`,
        impact: {
          productsAffected: productsWithLongTitles.length,
          estimatedImprovement: '+12% visibilité SEO',
        },
        suggestedConditions: [
          { field: 'title', operator: 'length_greater_than', value: '100' },
        ],
        suggestedActions: [
          { type: 'truncate', field: 'title', value: '80' },
        ],
        confidence: 85,
        priority: 'high',
      });
    }

    // 2. Missing brand in titles
    const productsWithoutBrandInTitle = products.filter(p => 
      p.brand && p.name && !p.name.toLowerCase().includes(p.brand.toLowerCase())
    );
    if (productsWithoutBrandInTitle.length > 5) {
      recs.push({
        id: 'add-brand-title',
        type: 'opportunity',
        title: 'Ajouter la marque aux titres',
        description: `${productsWithoutBrandInTitle.length} produits n'ont pas leur marque dans le titre.`,
        impact: {
          productsAffected: productsWithoutBrandInTitle.length,
          estimatedImprovement: '+8% taux de clics',
        },
        suggestedConditions: [
          { field: 'brand', operator: 'is_not_empty', value: '' },
          { field: 'title', operator: 'not_contains', value: '{brand}' },
        ],
        suggestedActions: [
          { type: 'prepend', field: 'title', value: '{brand} - ' },
        ],
        confidence: 78,
        priority: 'medium',
      });
    }

    // 3. Products without SKU (similar to GTIN for tracking)
    const productsWithoutSKU = products.filter(p => !p.sku);
    if (productsWithoutSKU.length > 0) {
      recs.push({
        id: 'sku-warning',
        type: 'warning',
        title: 'Produits sans SKU',
        description: `${productsWithoutSKU.length} produits n'ont pas de SKU, réduisant leur traçabilité.`,
        impact: {
          productsAffected: productsWithoutSKU.length,
          estimatedImprovement: 'Éligibilité marketplace',
        },
        suggestedConditions: [
          { field: 'sku', operator: 'is_empty', value: '' },
        ],
        suggestedActions: [
          { type: 'set', field: 'identifier_exists', value: 'false' },
        ],
        confidence: 95,
        priority: 'high',
      });
    }

    // 4. Low stock exclusion
    const lowStockProducts = products.filter(p => 
      typeof p.stock_quantity === 'number' && p.stock_quantity < 3 && p.stock_quantity > 0
    );
    const hasExcludeRule = rules.some(r => 
      r.conditions.some((c: any) => c.field === 'stock' || c.field === 'stock_quantity') &&
      r.actions.some((a: any) => a.type === 'exclude')
    );
    if (lowStockProducts.length > 0 && !hasExcludeRule) {
      recs.push({
        id: 'exclude-low-stock',
        type: 'new_rule',
        title: 'Exclure les stocks faibles',
        description: `${lowStockProducts.length} produits avec stock < 3 pourraient générer des ruptures.`,
        impact: {
          productsAffected: lowStockProducts.length,
          estimatedImprovement: '-90% déceptions clients',
        },
        suggestedConditions: [
          { field: 'stock_quantity', operator: 'less_than', value: '3' },
        ],
        suggestedActions: [
          { type: 'exclude', value: 'true' },
        ],
        confidence: 90,
        priority: 'high',
      });
    }

    // 5. Price formatting
    const productsWithDecimalPrices = products.filter(p => {
      const price = p.price || 0;
      return price > 0 && price % 1 !== 0 && !String(price).endsWith('.99');
    });
    if (productsWithDecimalPrices.length > 10) {
      recs.push({
        id: 'round-prices',
        type: 'optimization',
        title: 'Tarification psychologique',
        description: `${productsWithDecimalPrices.length} produits pourraient bénéficier de prix en .99€`,
        impact: {
          productsAffected: productsWithDecimalPrices.length,
          estimatedImprovement: '+3% conversions',
        },
        suggestedConditions: [
          { field: 'price', operator: 'greater_than', value: '1' },
        ],
        suggestedActions: [
          { type: 'round', field: 'price', value: '.99' },
        ],
        confidence: 72,
        priority: 'low',
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [rules, products]);

  return { recommendations, isLoading: false };
}

export function useApplyFeedRecommendation() {
  const queryClient = useQueryClient();
  const { user } = useAuthOptimized();

  return useMutation({
    mutationFn: async (recommendation: FeedRuleRecommendation) => {
      if (!user?.id) throw new Error('Non authentifié');

      // Create a new feed rule from the recommendation
      const newRule = {
        user_id: user.id,
        name: recommendation.title,
        description: recommendation.description,
        conditions: recommendation.suggestedConditions || [],
        actions: recommendation.suggestedActions || [],
        is_active: true,
        priority: recommendation.priority === 'high' ? 1 : recommendation.priority === 'medium' ? 5 : 10,
      };

      const { data, error } = await supabase
        .from('feed_rules')
        .insert(newRule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-rules'] });
      queryClient.invalidateQueries({ queryKey: ['feed-rules-stats'] });
      toast.success('Règle créée depuis la recommandation IA');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
