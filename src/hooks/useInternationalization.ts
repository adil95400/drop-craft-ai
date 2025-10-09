import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InternationalizationService } from '@/services/InternationalizationService';
import { useToast } from '@/hooks/use-toast';

export const useInternationalization = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Product Translations
  const useProductTranslations = (productId: string, locale?: string) => {
    return useQuery({
      queryKey: ['product-translations', productId, locale],
      queryFn: () => InternationalizationService.getProductTranslations(productId, locale),
      enabled: !!productId,
    });
  };

  const createProductTranslation = useMutation({
    mutationFn: InternationalizationService.createProductTranslation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-translations'] });
      toast({
        title: "Translation créée",
        description: "La traduction du produit a été créée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductTranslation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      InternationalizationService.updateProductTranslation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-translations'] });
      toast({
        title: "Translation mise à jour",
        description: "La traduction a été mise à jour avec succès.",
      });
    },
  });

  const translateProducts = useMutation({
    mutationFn: ({ productIds, targetLocales, sourceLocale }: any) =>
      InternationalizationService.translateProducts(productIds, targetLocales, sourceLocale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-translations'] });
      toast({
        title: "Traduction en cours",
        description: "Les produits sont en cours de traduction par l'IA.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de traduction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Currencies
  const useCurrencies = () => {
    return useQuery({
      queryKey: ['currencies'],
      queryFn: InternationalizationService.getCurrencies,
    });
  };

  const createCurrency = useMutation({
    mutationFn: InternationalizationService.createCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast({
        title: "Devise ajoutée",
        description: "La devise a été ajoutée avec succès.",
      });
    },
  });

  const updateCurrency = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      InternationalizationService.updateCurrency(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast({
        title: "Devise mise à jour",
        description: "La devise a été mise à jour avec succès.",
      });
    },
  });

  const setDefaultCurrency = useMutation({
    mutationFn: InternationalizationService.setDefaultCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast({
        title: "Devise par défaut",
        description: "La devise par défaut a été modifiée.",
      });
    },
  });

  // Currency Rates
  const useCurrencyRates = (fromCurrency?: string) => {
    return useQuery({
      queryKey: ['currency-rates', fromCurrency],
      queryFn: () => InternationalizationService.getCurrencyRates(fromCurrency),
    });
  };

  const updateCurrencyRates = useMutation({
    mutationFn: (baseCurrency?: string) =>
      InternationalizationService.updateCurrencyRates(baseCurrency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-rates'] });
      toast({
        title: "Taux de change mis à jour",
        description: "Les taux de change ont été actualisés avec succès.",
      });
    },
  });

  // Geo Targeting
  const useGeoTargetingRules = () => {
    return useQuery({
      queryKey: ['geo-targeting-rules'],
      queryFn: InternationalizationService.getGeoTargetingRules,
    });
  };

  const createGeoTargetingRule = useMutation({
    mutationFn: InternationalizationService.createGeoTargetingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geo-targeting-rules'] });
      toast({
        title: "Règle créée",
        description: "La règle de ciblage géographique a été créée.",
      });
    },
  });

  const updateGeoTargetingRule = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      InternationalizationService.updateGeoTargetingRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geo-targeting-rules'] });
      toast({
        title: "Règle mise à jour",
        description: "La règle de ciblage a été mise à jour.",
      });
    },
  });

  // Locale Settings
  const useLocaleSettings = () => {
    return useQuery({
      queryKey: ['locale-settings'],
      queryFn: InternationalizationService.getLocaleSettings,
    });
  };

  const updateLocaleSettings = useMutation({
    mutationFn: InternationalizationService.updateLocaleSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locale-settings'] });
      toast({
        title: "Paramètres mis à jour",
        description: "Les paramètres de localisation ont été mis à jour.",
      });
    },
  });

  // Translation Jobs
  const useTranslationJobs = () => {
    return useQuery({
      queryKey: ['translation-jobs'],
      queryFn: InternationalizationService.getTranslationJobs,
    });
  };

  const createTranslationJob = useMutation({
    mutationFn: InternationalizationService.createTranslationJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translation-jobs'] });
      toast({
        title: "Job créé",
        description: "Le job de traduction a été créé.",
      });
    },
  });

  const startBulkTranslation = useMutation({
    mutationFn: InternationalizationService.startBulkTranslation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translation-jobs'] });
      toast({
        title: "Traduction en masse lancée",
        description: "La traduction en masse a été lancée.",
      });
    },
  });

  return {
    useProductTranslations,
    createProductTranslation,
    updateProductTranslation,
    translateProducts,
    useCurrencies,
    createCurrency,
    updateCurrency,
    setDefaultCurrency,
    useCurrencyRates,
    updateCurrencyRates,
    useGeoTargetingRules,
    createGeoTargetingRule,
    updateGeoTargetingRule,
    useLocaleSettings,
    updateLocaleSettings,
    useTranslationJobs,
    createTranslationJob,
    startBulkTranslation,
  };
};