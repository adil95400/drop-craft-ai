import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PricingAutomationService } from '@/services/PricingAutomationService';
import { useToast } from '@/hooks/use-toast';

export function usePricingAutomation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pricing rules
  const {
    data: pricingRules = [],
    isLoading: isLoadingRules
  } = useQuery({
    queryKey: ['pricing-rules'],
    queryFn: () => PricingAutomationService.getPricingRules(),
  });

  // Fetch pricing analytics
  const {
    data: analytics,
    isLoading: isLoadingAnalytics
  } = useQuery({
    queryKey: ['pricing-analytics'],
    queryFn: () => PricingAutomationService.getPricingAnalytics(),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch profit calculations
  const {
    data: profitCalculations = [],
    isLoading: isLoadingProfits
  } = useQuery({
    queryKey: ['profit-calculations'],
    queryFn: () => PricingAutomationService.getProfitCalculations(),
  });

  // Fetch competitor prices
  const {
    data: competitorPrices = [],
    isLoading: isLoadingCompetitors
  } = useQuery({
    queryKey: ['competitor-prices'],
    queryFn: () => PricingAutomationService.getCompetitorPrices(),
  });

  // Fetch supplier costs
  const {
    data: supplierCosts = [],
    isLoading: isLoadingSupplierCosts
  } = useQuery({
    queryKey: ['supplier-costs'],
    queryFn: () => PricingAutomationService.getSupplierCosts(),
  });

  // Create pricing rule
  const createRuleMutation = useMutation({
    mutationFn: PricingAutomationService.createPricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-analytics'] });
      toast({
        title: "Règle créée",
        description: "La règle de tarification a été créée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update pricing rule
  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, updates }: { ruleId: string; updates: any }) =>
      PricingAutomationService.updatePricingRule(ruleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast({
        title: "Règle mise à jour",
        description: "La règle de tarification a été modifiée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete pricing rule
  const deleteRuleMutation = useMutation({
    mutationFn: PricingAutomationService.deletePricingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-analytics'] });
      toast({
        title: "Règle supprimée",
        description: "La règle de tarification a été supprimée.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Evaluate pricing rules
  const evaluateRulesMutation = useMutation({
    mutationFn: ({ productId, currentPrice, costPrice, applyRules }: any) =>
      PricingAutomationService.evaluatePricingRules(productId, currentPrice, costPrice, applyRules),
    onSuccess: (data) => {
      if (data.applied) {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
      toast({
        title: "Règles évaluées",
        description: `${data.rules_applied} règle(s) appliquée(s). Prix suggéré: ${data.suggested_price}€`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate profit
  const calculateProfitMutation = useMutation({
    mutationFn: ({ productId, sellingPrice, costPrice, additionalCosts }: any) =>
      PricingAutomationService.calculateProfit(productId, sellingPrice, costPrice, additionalCosts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profit-calculations'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-analytics'] });
      toast({
        title: "Profit calculé",
        description: "Les calculs de rentabilité ont été effectués avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Track competitors
  const trackCompetitorsMutation = useMutation({
    mutationFn: ({ productId, myPrice, competitors }: any) =>
      PricingAutomationService.trackCompetitors(productId, myPrice, competitors),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitor-prices'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-analytics'] });
      toast({
        title: "Concurrents suivis",
        description: "Les prix concurrents ont été enregistrés et analysés.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add supplier cost
  const addSupplierCostMutation = useMutation({
    mutationFn: PricingAutomationService.addSupplierCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-costs'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-analytics'] });
      toast({
        title: "Coût ajouté",
        description: "Le coût fournisseur a été enregistré.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    pricingRules,
    analytics,
    profitCalculations,
    competitorPrices,
    supplierCosts,

    // Loading states
    isLoading: isLoadingRules || isLoadingAnalytics || isLoadingProfits || isLoadingCompetitors || isLoadingSupplierCosts,
    isLoadingRules,
    isLoadingAnalytics,
    isLoadingProfits,
    isLoadingCompetitors,
    isLoadingSupplierCosts,

    // Mutations
    createRule: createRuleMutation.mutate,
    updateRule: updateRuleMutation.mutate,
    deleteRule: deleteRuleMutation.mutate,
    evaluateRules: evaluateRulesMutation.mutate,
    calculateProfit: calculateProfitMutation.mutate,
    trackCompetitors: trackCompetitorsMutation.mutate,
    addSupplierCost: addSupplierCostMutation.mutate,

    // Mutation states
    isCreatingRule: createRuleMutation.isPending,
    isUpdatingRule: updateRuleMutation.isPending,
    isDeletingRule: deleteRuleMutation.isPending,
    isEvaluatingRules: evaluateRulesMutation.isPending,
    isCalculatingProfit: calculateProfitMutation.isPending,
    isTrackingCompetitors: trackCompetitorsMutation.isPending,
    isAddingSupplierCost: addSupplierCostMutation.isPending,
  };
}