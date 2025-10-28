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

  // Fetch user configuration
  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['profit-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profit_configurations')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as any;
    },
  });

  // Fetch calculation history
  const { data: calculations, isLoading: isLoadingCalculations } = useQuery({
    queryKey: ['profit-calculations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profit_calculations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as any;
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
      if (config?.id) {
        const { data, error } = await supabase
          .from('profit_configurations')
          .update({
            default_shipping_cost: params.defaultShippingCost,
            default_packaging_cost: params.defaultPackagingCost,
            default_transaction_fee_percent: params.defaultTransactionFeePercent,
            default_ad_cost_percent: params.defaultAdCostPercent,
            default_vat_percent: params.defaultVatPercent,
            currency: params.currency
          } as any)
          .eq('id', config.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('profit_configurations')
          .insert({
            default_shipping_cost: params.defaultShippingCost,
            default_packaging_cost: params.defaultPackagingCost,
            default_transaction_fee_percent: params.defaultTransactionFeePercent,
            default_ad_cost_percent: params.defaultAdCostPercent,
            default_vat_percent: params.defaultVatPercent,
            currency: params.currency
          } as any)
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
      const { data, error } = await supabase
        .from('profit_calculations')
        .insert({
          product_name: params.productName,
          selling_price: params.sellingPrice,
          product_cost: params.productCost,
          shipping_cost: params.shippingCost,
          packaging_cost: params.packagingCost,
          transaction_fee: params.transactionFee,
          ad_cost: params.adCost,
          vat: params.vat,
          other_costs: params.otherCosts,
          net_profit: params.netProfit,
          profit_margin_percent: params.profitMarginPercent,
          roi_percent: params.roiPercent,
          breakeven_units: params.breakevenUnits,
          ai_suggestions: params.aiSuggestions || []
        } as any)
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
      const { error } = await supabase
        .from('profit_calculations')
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
