/**
 * Hook for Dynamic Pricing Rules (competitor, demand, inventory, time-based)
 * Connects to price_rules table with rule_type filtering
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DynamicRuleType = 'competitor' | 'demand' | 'inventory' | 'time';

export interface DynamicPricingRule {
  id: string;
  name: string;
  type: DynamicRuleType;
  description: string;
  is_active: boolean;
  products_count: number;
  avg_impact: number;
  config: Record<string, unknown>;
  last_executed_at?: string;
  created_at: string;
}

export interface DynamicPricingStats {
  revenueChange: number;
  productsOptimized: number;
  activeRules: number;
  adjustmentsToday: number;
}

export interface PriceAdjustmentLog {
  id: string;
  product_name: string;
  old_price: number;
  new_price: number;
  reason: string;
  rule_name: string;
  created_at: string;
}

export interface DynamicPricingConfig {
  min_margin_percent: number;
  max_margin_percent: number;
  adjustment_frequency_hours: number;
  notifications_enabled: boolean;
}

// Fetch dynamic pricing rules from price_rules table
export function useDynamicPricingRules() {
  return useQuery({
    queryKey: ['dynamic-pricing-rules'],
    queryFn: async (): Promise<DynamicPricingRule[]> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      // Dynamic rules are stored with specific rule_types
      const { data, error } = await supabase
        .from('price_rules')
        .select('*')
        .eq('user_id', userData.user.id)
        .in('rule_type', ['competitive', 'tiered'])
        .order('priority', { ascending: false });

      if (error) throw error;

      // Map to our interface - derive type from conditions/calculation
      return (data || []).map(rule => {
        const conditions = (rule.conditions || []) as Array<{ field?: string; value?: string }>;
        const calculation = rule.calculation as Record<string, unknown> | null;
        
        // Determine dynamic rule type from conditions/metadata
        let type: DynamicRuleType = 'competitor';
        if (conditions.some(c => c.field === 'demand_level')) type = 'demand';
        else if (conditions.some(c => c.field === 'stock_level')) type = 'inventory';
        else if (conditions.some(c => c.field === 'time_of_day')) type = 'time';

        return {
          id: rule.id,
          name: rule.name,
          type,
          description: rule.description || '',
          is_active: rule.is_active,
          products_count: rule.products_affected || 0,
          avg_impact: (calculation?.value as number) || 0,
          config: calculation || {},
          last_executed_at: rule.last_applied_at as string | undefined,
          created_at: rule.created_at,
        };
      });
    },
    staleTime: 30 * 1000,
  });
}

// Get stats for dynamic pricing dashboard
export function useDynamicPricingStats() {
  return useQuery({
    queryKey: ['dynamic-pricing-stats'],
    queryFn: async (): Promise<DynamicPricingStats> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return { revenueChange: 0, productsOptimized: 0, activeRules: 0, adjustmentsToday: 0 };
      }

      // Get active rules count
      const { data: rules } = await supabase
        .from('price_rules')
        .select('id, is_active, products_affected')
        .eq('user_id', userData.user.id)
        .in('rule_type', ['competitive', 'tiered']);

      const activeRules = (rules || []).filter(r => r.is_active).length;
      const productsOptimized = (rules || []).reduce((sum, r) => sum + (r.products_affected || 0), 0);

      // Get today's price changes
      const today = new Date().toISOString().split('T')[0];
      const { data: historyData } = await supabase
        .from('price_history')
        .select('id, old_price, new_price')
        .eq('user_id', userData.user.id)
        .gte('created_at', today);

      const adjustmentsToday = (historyData || []).length;
      
      // Calculate revenue change percentage from price history
      let revenueChange = 0;
      if (historyData && historyData.length > 0) {
        const totalOld = historyData.reduce((s, h) => s + (h.old_price || 0), 0);
        const totalNew = historyData.reduce((s, h) => s + (h.new_price || 0), 0);
        if (totalOld > 0) {
          revenueChange = ((totalNew - totalOld) / totalOld) * 100;
        }
      }

      return {
        revenueChange: Math.round(revenueChange * 10) / 10,
        productsOptimized,
        activeRules,
        adjustmentsToday,
      };
    },
    staleTime: 60 * 1000,
  });
}

// Toggle rule active status
export function useToggleDynamicRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('price_rules')
        .update({ is_active: isActive, updated_at: new Date().toISOString() } as any)
        .eq('id', ruleId);

      if (error) throw error;
      return { ruleId, isActive };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['dynamic-pricing-stats'] });
      toast.success('Règle mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Get price adjustment history
export function usePriceAdjustmentHistory(limit: number = 20) {
  return useQuery({
    queryKey: ['price-adjustment-history', limit],
    queryFn: async (): Promise<PriceAdjustmentLog[]> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from('price_history')
        .select('id, old_price, new_price, change_reason, product_id, rule_id, created_at')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get product names
      const productIds = [...new Set((data || []).map(d => d.product_id).filter(Boolean))] as string[];
      let productMap: Record<string, string> = {};
      
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);
        
        productMap = (products || []).reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {});
      }

      return (data || []).map(h => ({
        id: h.id,
        product_name: h.product_id ? productMap[h.product_id] || 'Produit inconnu' : 'Produit inconnu',
        old_price: h.old_price || 0,
        new_price: h.new_price || 0,
        reason: h.change_reason || 'Ajustement automatique',
        rule_name: h.rule_id || 'Règle dynamique',
        created_at: h.created_at,
      }));
    },
    staleTime: 30 * 1000,
  });
}

// Get/update dynamic pricing configuration
export function useDynamicPricingConfig() {
  return useQuery({
    queryKey: ['dynamic-pricing-config'],
    queryFn: async (): Promise<DynamicPricingConfig> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return {
          min_margin_percent: 25,
          max_margin_percent: 80,
          adjustment_frequency_hours: 6,
          notifications_enabled: true,
        };
      }

      // Try to get from analytics_insights as config storage
      const { data } = await supabase
        .from('analytics_insights')
        .select('metadata')
        .eq('user_id', userData.user.id)
        .eq('metric_type', 'dynamic_pricing_config')
        .single();

      if (data?.metadata) {
        const m = data.metadata as Record<string, unknown>;
        return {
          min_margin_percent: (m.min_margin_percent as number) || 25,
          max_margin_percent: (m.max_margin_percent as number) || 80,
          adjustment_frequency_hours: (m.adjustment_frequency_hours as number) || 6,
          notifications_enabled: (m.notifications_enabled as boolean) ?? true,
        };
      }

      return {
        min_margin_percent: 25,
        max_margin_percent: 80,
        adjustment_frequency_hours: 6,
        notifications_enabled: true,
      };
    },
  });
}

export function useUpdateDynamicPricingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: DynamicPricingConfig) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Check if config exists
      const { data: existing } = await supabase
        .from('analytics_insights')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('metric_type', 'dynamic_pricing_config')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('analytics_insights')
          .update({ metadata: config as never })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('analytics_insights')
          .insert({
            user_id: userData.user.id,
            metric_name: 'dynamic_pricing_config',
            metric_type: 'dynamic_pricing_config',
            metadata: config as never,
          } as never);
        if (error) throw error;
      }

      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-pricing-config'] });
      toast.success('Configuration enregistrée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Create a new dynamic pricing rule
export function useCreateDynamicRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: {
      name: string;
      type: DynamicRuleType;
      description: string;
      impact: number;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Map type to conditions
      const conditions: Array<{ field: string; operator: string; value: string }> = [];
      if (rule.type === 'demand') {
        conditions.push({ field: 'demand_level', operator: 'gte', value: 'high' });
      } else if (rule.type === 'inventory') {
        conditions.push({ field: 'stock_level', operator: 'gte', value: '100' });
      } else if (rule.type === 'time') {
        conditions.push({ field: 'time_of_day', operator: 'in', value: 'off_peak' });
      }

      const { data, error } = await supabase
        .from('price_rules')
        .insert({
          user_id: userData.user.id,
          name: rule.name,
          description: rule.description,
          rule_type: 'competitive', // Base type for dynamic rules
          priority: 50,
          conditions,
          calculation: {
            type: 'percentage',
            value: rule.impact,
          },
          apply_to: 'all',
          is_active: true,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['dynamic-pricing-stats'] });
      toast.success('Règle créée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Simulate a pricing rule
export function useSimulateDynamicRule() {
  return useMutation({
    mutationFn: async (ruleId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      // Get the rule
      const { data: rule, error: ruleError } = await supabase
        .from('price_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (ruleError || !rule) throw new Error('Règle non trouvée');

      // Get sample products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, cost_price')
        .eq('user_id', userData.user.id)
        .not('price', 'is', null)
        .limit(10);

      const calculation = rule.calculation as { value?: number } | null;
      const impactPercent = calculation?.value || 5;

      const simulations = (products || []).map(p => {
        const change = p.price * (impactPercent / 100);
        return {
          product: p.name,
          currentPrice: p.price,
          simulatedPrice: Math.round((p.price + change) * 100) / 100,
          impact: `${impactPercent > 0 ? '+' : ''}${impactPercent}%`,
        };
      });

      return {
        ruleId,
        productsAffected: products?.length || 0,
        avgImpact: impactPercent,
        samples: simulations,
      };
    },
    onSuccess: (data) => {
      toast.success(`Simulation: ${data.productsAffected} produits, impact moyen ${data.avgImpact}%`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur de simulation: ${error.message}`);
    },
  });
}
