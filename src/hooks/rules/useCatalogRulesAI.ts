/**
 * Hook IA pour les règles de catalogue
 * Analyse et recommandations basées sur données réelles
 */
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared';
import { useProductsUnified } from '@/hooks/unified';
import { toast } from 'sonner';

export interface CatalogRulesAIStats {
  optimizationScore: number;
  productsWithoutRules: number;
  automationCoverage: number;
  potentialTimesSaved: number; // heures/mois
  recommendations: CatalogAIRecommendation[];
}

export interface CatalogAIRecommendation {
  id: string;
  type: 'title_optimization' | 'description_missing' | 'category_mapping' | 'stock_alert' | 'seo_improvement';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  affectedProducts: number;
  suggestedRule: {
    name: string;
    channel: string;
    conditionField: string;
    conditionOperator: string;
    conditionValue: any;
    actionType: string;
    actionValue?: string;
  };
}

export function useCatalogRulesAIStats() {
  const { user } = useAuthOptimized();
  const { products, isLoading: productsLoading } = useProductsUnified();

  // Récupérer les règles de catalogue existantes
  const { data: existingRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['catalog-rules-ai', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_rules')
        .select('*')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const stats = useMemo((): CatalogRulesAIStats => {
    if (!products.length) {
      return {
        optimizationScore: 0,
        productsWithoutRules: 0,
        automationCoverage: 0,
        potentialTimesSaved: 0,
        recommendations: []
      };
    }

    // Analyse des produits pour générer des recommandations
    const recommendations: CatalogAIRecommendation[] = [];

    // 1. Titres trop courts ou génériques
    const shortTitles = products.filter(p => 
      !p.title || p.title.length < 30
    );
    if (shortTitles.length > 0) {
      recommendations.push({
        id: 'short-titles',
        type: 'title_optimization',
        title: 'Optimiser les titres courts',
        description: `${shortTitles.length} produits ont des titres de moins de 30 caractères`,
        impact: 'high',
        affectedProducts: shortTitles.length,
        suggestedRule: {
          name: 'Enrichir titres courts avec IA',
          channel: 'global',
          conditionField: 'title',
          conditionOperator: 'length_lt',
          conditionValue: 30,
          actionType: 'generate_ai',
          actionValue: 'Enrichir ce titre produit pour le rendre plus descriptif et SEO-friendly'
        }
      });
    }

    // 2. Descriptions manquantes
    const missingDescriptions = products.filter(p => 
      !p.description || p.description.length < 50
    );
    if (missingDescriptions.length > 0) {
      recommendations.push({
        id: 'missing-descriptions',
        type: 'description_missing',
        title: 'Générer les descriptions manquantes',
        description: `${missingDescriptions.length} produits sans description complète`,
        impact: 'high',
        affectedProducts: missingDescriptions.length,
        suggestedRule: {
          name: 'Auto-générer descriptions',
          channel: 'global',
          conditionField: 'description',
          conditionOperator: 'empty',
          conditionValue: null,
          actionType: 'generate_ai',
          actionValue: 'Génère une description produit riche et optimisée SEO'
        }
      });
    }

    // 3. Produits sans catégorie
    const noCategory = products.filter(p => !p.category);
    if (noCategory.length > 0) {
      recommendations.push({
        id: 'no-category',
        type: 'category_mapping',
        title: 'Mapper les catégories manquantes',
        description: `${noCategory.length} produits sans catégorie définie`,
        impact: 'medium',
        affectedProducts: noCategory.length,
        suggestedRule: {
          name: 'Attribution catégorie IA',
          channel: 'global',
          conditionField: 'category',
          conditionOperator: 'empty',
          conditionValue: null,
          actionType: 'generate_ai',
          actionValue: 'Suggère une catégorie Google Shopping appropriée pour ce produit'
        }
      });
    }

    // 4. Stock faible sans tag
    const lowStock = products.filter(p => 
      p.stock_quantity !== undefined && 
      p.stock_quantity > 0 && 
      p.stock_quantity < 10 &&
      (!p.tags || !p.tags.includes('low_stock'))
    );
    if (lowStock.length > 0) {
      recommendations.push({
        id: 'low-stock-tag',
        type: 'stock_alert',
        title: 'Taguer les stocks faibles',
        description: `${lowStock.length} produits en stock faible sans tag d'alerte`,
        impact: 'medium',
        affectedProducts: lowStock.length,
        suggestedRule: {
          name: 'Tag automatique stock faible',
          channel: 'global',
          conditionField: 'stock_quantity',
          conditionOperator: 'lt',
          conditionValue: 10,
          actionType: 'add_tag',
          actionValue: 'low_stock'
        }
      });
    }

    // 5. Titres trop longs pour Google
    const longTitles = products.filter(p => 
      p.title && p.title.length > 140
    );
    if (longTitles.length > 0) {
      recommendations.push({
        id: 'long-titles',
        type: 'seo_improvement',
        title: 'Raccourcir les titres > 140 car.',
        description: `${longTitles.length} produits avec titres trop longs pour Google Shopping`,
        impact: 'high',
        affectedProducts: longTitles.length,
        suggestedRule: {
          name: 'Raccourcir titres (Google)',
          channel: 'google',
          conditionField: 'title',
          conditionOperator: 'length_gt',
          conditionValue: 140,
          actionType: 'generate_ai',
          actionValue: 'Raccourcis ce titre à max 140 caractères en gardant les mots-clés essentiels'
        }
      });
    }

    // Calcul du score d'optimisation
    const totalIssues = recommendations.reduce((sum, r) => sum + r.affectedProducts, 0);
    const optimizationScore = products.length > 0 
      ? Math.max(0, Math.round(100 - (totalIssues / products.length) * 100))
      : 100;

    // Couverture automatisation (% de produits avec au moins une règle appliquée)
    const automationCoverage = existingRules.length > 0 
      ? Math.min(100, Math.round((existingRules.reduce((sum, r) => sum + (r.execution_count || 0), 0) / products.length) * 100))
      : 0;

    // Temps potentiellement économisé (estimation: 2 min par modification manuelle)
    const potentialTimesSaved = Math.round((totalIssues * 2) / 60); // heures

    return {
      optimizationScore,
      productsWithoutRules: totalIssues,
      automationCoverage,
      potentialTimesSaved,
      recommendations: recommendations.slice(0, 5) // Top 5 recommendations
    };
  }, [products, existingRules]);

  return {
    stats,
    isLoading: productsLoading || rulesLoading
  };
}

export function useApplyCatalogRecommendation() {
  const queryClient = useQueryClient();
  const { user } = useAuthOptimized();

  return useMutation({
    mutationFn: async (recommendation: CatalogAIRecommendation) => {
      const { suggestedRule } = recommendation;
      
      const newRule = {
        user_id: user!.id,
        name: suggestedRule.name,
        description: recommendation.description,
        is_active: true,
        priority: recommendation.impact === 'high' ? 1 : recommendation.impact === 'medium' ? 2 : 3,
        channel: suggestedRule.channel,
        condition_logic: 'AND',
        conditions: [{
          field: suggestedRule.conditionField,
          operator: suggestedRule.conditionOperator,
          value: suggestedRule.conditionValue
        }],
        actions: [{
          type: suggestedRule.actionType,
          value: suggestedRule.actionValue
        }]
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
      queryClient.invalidateQueries({ queryKey: ['catalog-rules-ai'] });
      queryClient.invalidateQueries({ queryKey: ['feed-rules'] });
      toast.success('Règle IA créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });
}
