import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PricingRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  rule_type?: string;
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
  min_price?: number;
  max_price?: number;
  target_margin?: number;
  is_active?: boolean;
  priority?: number;
  products_affected?: number;
  last_executed_at?: string;
  execution_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface RepricingPreview {
  product_id: string;
  product_name: string;
  current_price: number;
  new_price: number;
  price_change: number;
  price_change_percent: string;
  current_margin: string;
  new_margin: string;
}

export function useRepricingRules() {
  return useQuery({
    queryKey: ['repricing-rules'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as PricingRule[];
    },
  });
}

export function useCreateRepricingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Partial<PricingRule> & { name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('pricing_rules')
        .insert([{ 
          name: rule.name,
          description: rule.description,
          rule_type: rule.rule_type,
          conditions: rule.conditions,
          actions: rule.actions,
          min_price: rule.min_price,
          max_price: rule.max_price,
          target_margin: rule.target_margin,
          is_active: rule.is_active,
          priority: rule.priority,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules'] });
      toast.success('Règle de repricing créée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateRepricingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PricingRule> }) => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules'] });
      toast.success('Règle mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteRepricingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules'] });
      toast.success('Règle supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useApplyRepricingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ruleId, 
      productIds, 
      applyToAll 
    }: { 
      ruleId: string; 
      productIds?: string[]; 
      applyToAll?: boolean 
    }) => {
      const { data, error } = await supabase.functions.invoke('repricing-engine', {
        body: {
          action: 'apply_rule',
          rule_id: ruleId,
          product_ids: productIds,
          apply_to_all: applyToAll
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      toast.success(`${data.products_updated} produits mis à jour`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function usePreviewRepricingRule() {
  return useMutation({
    mutationFn: async ({ 
      ruleId, 
      productIds, 
      applyToAll 
    }: { 
      ruleId: string; 
      productIds?: string[]; 
      applyToAll?: boolean 
    }) => {
      const { data, error } = await supabase.functions.invoke('repricing-engine', {
        body: {
          action: 'calculate_preview',
          rule_id: ruleId,
          product_ids: productIds,
          apply_to_all: applyToAll
        }
      });

      if (error) throw error;
      return data as { 
        success: boolean; 
        total_products: number; 
        preview_count: number; 
        preview: RepricingPreview[] 
      };
    },
  });
}

export function useApplyAllRepricingRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('repricing-engine', {
        body: { action: 'apply_all_rules' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['repricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      toast.success(`${data.rules_applied} règles appliquées, ${data.products_updated} produits mis à jour`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function usePriceHistory(productId?: string) {
  return useQuery({
    queryKey: ['price-history', productId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let query = supabase
        .from('price_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useRepricingStats() {
  return useQuery({
    queryKey: ['repricing-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer les règles
      const { data: rules } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('user_id', user.id);

      // Récupérer l'historique récent
      const { data: history } = await supabase
        .from('price_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const activeRules = rules?.filter(r => r.is_active) || [];
      const totalProductsAffected = rules?.reduce((sum, r) => sum + (r.products_affected || 0), 0) || 0;
      const recentUpdates = history?.length || 0;

      const avgPriceChange = history && history.length > 0
        ? history.reduce((sum, h) => sum + Math.abs(h.price_change || 0), 0) / history.length
        : 0;

      return {
        activeRules: activeRules.length,
        totalRules: rules?.length || 0,
        totalProductsAffected,
        recentUpdates,
        avgPriceChange: avgPriceChange.toFixed(2),
      };
    },
    staleTime: 30 * 1000,
  });
}
