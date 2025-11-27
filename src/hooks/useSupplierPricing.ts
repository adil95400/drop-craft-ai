import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PricingRule {
  id: string;
  user_id: string;
  supplier_id: string;
  pricing_strategy: string;
  fixed_markup_percentage?: number;
  target_margin_percentage?: number;
  minimum_price?: number;
  maximum_price?: number;
  applies_to_categories?: string[];
  priority: number;
  is_active: boolean;
}

export function useSupplierPricing(supplierId: string) {
  const queryClient = useQueryClient();

  const { data: pricingRules = [], isLoading } = useQuery({
    queryKey: ['supplier-pricing-rules', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_pricing_rules')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const createRule = useMutation({
    mutationFn: async (rule: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('supplier_pricing_rules')
        .insert([{ 
          ...rule, 
          user_id: user.id, 
          supplier_id: supplierId,
          pricing_type: rule.pricing_strategy || 'fixed_markup'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-pricing-rules', supplierId] });
      toast.success('Règle de prix créée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PricingRule> }) => {
      const { data, error } = await supabase
        .from('supplier_pricing_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-pricing-rules', supplierId] });
      toast.success('Règle de prix mise à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supplier_pricing_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-pricing-rules', supplierId] });
      toast.success('Règle de prix supprimée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const applyPricing = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('supplier-price-update', {
        body: { supplierId, mode: 'auto' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
      toast.success(`Prix mis à jour: ${data.updatedCount} produits`);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    pricingRules,
    isLoading,
    createRule: createRule.mutate,
    updateRule: updateRule.mutate,
    deleteRule: deleteRule.mutate,
    applyPricing: applyPricing.mutate,
    isCreating: createRule.isPending,
    isUpdating: updateRule.isPending,
    isDeleting: deleteRule.isPending,
    isApplying: applyPricing.isPending,
  };
}
