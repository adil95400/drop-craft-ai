import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type PricingRule = Database['public']['Tables']['pricing_rules']['Row'];

export function usePricingRules() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Récupérer les règles de pricing
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['pricing-rules', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('user_id', user!.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as PricingRule[];
    },
    enabled: !!user?.id
  });

  // Récupérer l'historique des prix
  const { data: priceHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['price-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Récupérer les jobs de repricing
  const { data: repricingJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['repricing-queue', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repricing_queue')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Créer une règle
  const createRule = useMutation({
    mutationFn: async (rule: Omit<PricingRule, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'products_affected' | 'last_applied_at' | 'total_applications'>) => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .insert({
          ...rule,
          user_id: user!.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast({
        title: 'Règle créée',
        description: 'La règle de pricing a été créée avec succès'
      });
    }
  });

  // Mettre à jour une règle
  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast({
        title: 'Règle mise à jour',
        description: 'Les modifications ont été enregistrées'
      });
    }
  });

  // Supprimer une règle
  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('pricing_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast({
        title: 'Règle supprimée',
        description: 'La règle a été supprimée'
      });
    }
  });

  // Appliquer une règle
  const applyRule = useMutation({
    mutationFn: async ({ rule_id, product_ids, apply_to_all }: { rule_id: string; product_ids?: string[]; apply_to_all?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('repricing-engine', {
        body: { action: 'apply_rule', rule_id, product_ids, apply_to_all }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      queryClient.invalidateQueries({ queryKey: ['repricing-queue'] });
      toast({
        title: 'Repricing appliqué',
        description: `${data.products_updated} produits mis à jour`
      });
    }
  });

  // Prévisualiser une règle
  const previewRule = useMutation({
    mutationFn: async ({ rule_id, product_ids, apply_to_all }: { rule_id: string; product_ids?: string[]; apply_to_all?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('repricing-engine', {
        body: { action: 'calculate_preview', rule_id, product_ids, apply_to_all }
      });

      if (error) throw error;
      return data;
    }
  });

  // Appliquer toutes les règles actives
  const applyAllRules = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('repricing-engine', {
        body: { action: 'apply_all_rules' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      toast({
        title: 'Repricing global terminé',
        description: `${data.products_updated} produits mis à jour`
      });
    }
  });

  const stats = {
    totalRules: rules.length,
    activeRules: rules.filter(r => r.is_active).length,
    recentChanges: priceHistory.length,
    activeJobs: repricingJobs.filter(j => j.job_status === 'processing').length
  };

  return {
    rules,
    priceHistory,
    repricingJobs,
    stats,
    isLoading: rulesLoading || historyLoading || jobsLoading,
    createRule: createRule.mutate,
    updateRule: updateRule.mutate,
    deleteRule: deleteRule.mutate,
    applyRule: applyRule.mutate,
    previewRule: previewRule.mutate,
    applyAllRules: applyAllRules.mutate,
    isApplying: applyRule.isPending,
    isPreviewing: previewRule.isPending
  };
}
