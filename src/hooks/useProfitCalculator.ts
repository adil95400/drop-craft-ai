import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProfitConfig {
  id: string;
  user_id: string;
  default_shipping_cost: number;
  default_packaging_cost: number;
  default_transaction_fee_percent: number;
  default_ad_cost_percent: number;
  default_vat_percent: number;
  currency: string;
}

export interface ProfitCalculation {
  productName: string;
  sellingPrice: number;
  productCost: number;
  shippingCost: number;
  packagingCost: number;
  transactionFee: number;
  adCost: number;
  vat: number;
  otherCosts: number;
  netProfit: number;
  profitMarginPercent: number;
  roiPercent: number;
  breakevenUnits: number;
  aiSuggestions?: any[];
}

export function useProfitCalculator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user configuration - using analytics_insights with metric_type = 'profit_config'
  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['profit-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await (supabase as any)
        .from('analytics_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_type', 'profit_config')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.metadata) {
        return {
          id: data.id,
          user_id: data.user_id,
          ...data.metadata
        } as ProfitConfig;
      }
      return null;
    },
  });

  // Fetch calculation history - using analytics_insights with metric_type = 'profit_calculation'
  const { data: calculations, isLoading: isLoadingCalculations } = useQuery({
    queryKey: ['profit-calculations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('analytics_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_type', 'profit_calculation')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map((item: any) => item.metadata);
    },
  });

  // Save configuration
  const saveConfig = useMutation({
    mutationFn: async (params: {
      defaultShippingCost: number;
      defaultPackagingCost: number;
      defaultTransactionFeePercent: number;
      defaultAdCostPercent: number;
      defaultVatPercent: number;
      currency: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const metadata = {
        default_shipping_cost: params.defaultShippingCost,
        default_packaging_cost: params.defaultPackagingCost,
        default_transaction_fee_percent: params.defaultTransactionFeePercent,
        default_ad_cost_percent: params.defaultAdCostPercent,
        default_vat_percent: params.defaultVatPercent,
        currency: params.currency
      };

      if (config?.id) {
        const { data, error } = await (supabase as any)
          .from('analytics_insights')
          .update({ metadata })
          .eq('id', config.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await (supabase as any)
          .from('analytics_insights')
          .insert({
            user_id: user.id,
            metric_name: 'profit_config',
            metric_type: 'profit_config',
            metadata
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({ title: 'Configuration enregistrée!' });
      queryClient.invalidateQueries({ queryKey: ['profit-config'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur lors de l\'enregistrement',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Save calculation
  const saveCalculation = useMutation({
    mutationFn: async (params: ProfitCalculation) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('analytics_insights')
        .insert({
          user_id: user.id,
          metric_name: params.productName,
          metric_type: 'profit_calculation',
          metric_value: params.netProfit,
          metadata: params
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Calcul enregistré!' });
      queryClient.invalidateQueries({ queryKey: ['profit-calculations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur lors de l\'enregistrement',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Delete calculation
  const deleteCalculation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('analytics_insights')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Calcul supprimé' });
      queryClient.invalidateQueries({ queryKey: ['profit-calculations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur lors de la suppression',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Get AI suggestions
  const getAISuggestions = useMutation({
    mutationFn: async (params: {
      productName: string;
      sellingPrice: number;
      productCost: number;
      netProfit: number;
      profitMargin: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('profit-optimizer', {
        body: params
      });

      if (error) throw error;
      return data.suggestions || [];
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur lors de l\'analyse IA',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  return {
    // Config
    config,
    isLoadingConfig,
    saveConfig: saveConfig.mutate,
    isSavingConfig: saveConfig.isPending,

    // Calculations
    calculations,
    isLoadingCalculations,
    saveCalculation: saveCalculation.mutate,
    isSaving: saveCalculation.isPending,
    deleteCalculation: deleteCalculation.mutate,

    // AI
    getAISuggestions: getAISuggestions.mutateAsync,
    isLoadingAI: getAISuggestions.isPending,
  };
}
