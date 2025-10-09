import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConversionService } from '@/services/ConversionService';
import { useToast } from '@/hooks/use-toast';

export const useConversionOptimization = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Product Bundles
  const { data: bundles, isLoading: bundlesLoading } = useQuery({
    queryKey: ['product-bundles'],
    queryFn: ConversionService.getProductBundles
  });

  const createBundle = useMutation({
    mutationFn: ConversionService.createProductBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast({ title: 'Bundle créé avec succès' });
    }
  });

  // Upsell Rules
  const { data: upsellRules, isLoading: upsellLoading } = useQuery({
    queryKey: ['upsell-rules'],
    queryFn: ConversionService.getUpsellRules
  });

  const generateAIUpsells = useMutation({
    mutationFn: ConversionService.generateAIUpsells,
    onSuccess: () => {
      toast({ title: 'Suggestions IA générées' });
    }
  });

  const createUpsellRule = useMutation({
    mutationFn: ConversionService.createUpsellRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell-rules'] });
      toast({ title: 'Règle d\'upsell créée' });
    }
  });

  // Dynamic Discounts
  const { data: discounts, isLoading: discountsLoading } = useQuery({
    queryKey: ['dynamic-discounts'],
    queryFn: ConversionService.getDynamicDiscounts
  });

  const calculateDiscount = useMutation({
    mutationFn: ConversionService.calculateDiscount
  });

  const createDiscount = useMutation({
    mutationFn: ConversionService.createDynamicDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-discounts'] });
      toast({ title: 'Remise créée' });
    }
  });

  // Scarcity Timers
  const { data: timers, isLoading: timersLoading } = useQuery({
    queryKey: ['scarcity-timers'],
    queryFn: ConversionService.getScarcityTimers
  });

  const createTimer = useMutation({
    mutationFn: ConversionService.createScarcityTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scarcity-timers'] });
      toast({ title: 'Minuteur créé' });
    }
  });

  // Social Proof
  const { data: widgets, isLoading: widgetsLoading } = useQuery({
    queryKey: ['social-proof-widgets'],
    queryFn: ConversionService.getSocialProofWidgets
  });

  const createWidget = useMutation({
    mutationFn: ConversionService.createSocialProofWidget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-proof-widgets'] });
      toast({ title: 'Widget créé' });
    }
  });

  const getSocialProofData = useMutation({
    mutationFn: ConversionService.getSocialProofData
  });

  // Tracking
  const trackConversion = useMutation({
    mutationFn: ConversionService.trackConversion
  });

  // Analytics
  const { data: analytics } = useQuery({
    queryKey: ['conversion-analytics'],
    queryFn: ConversionService.getConversionAnalytics
  });

  return {
    // Bundles
    bundles,
    bundlesLoading,
    createBundle,
    // Upsells
    upsellRules,
    upsellLoading,
    generateAIUpsells,
    createUpsellRule,
    isGeneratingUpsells: generateAIUpsells.isPending,
    // Discounts
    discounts,
    discountsLoading,
    calculateDiscount,
    createDiscount,
    isCalculatingDiscount: calculateDiscount.isPending,
    // Timers
    timers,
    timersLoading,
    createTimer,
    // Social Proof
    widgets,
    widgetsLoading,
    createWidget,
    getSocialProofData,
    // Tracking
    trackConversion,
    // Analytics
    analytics
  };
};
