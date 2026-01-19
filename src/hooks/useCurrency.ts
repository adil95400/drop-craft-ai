import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized';
import { toast } from 'sonner';

// Types
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export interface ExchangeRate {
  rate: number;
  inverseRate: number;
  fetchedAt: string;
  expiresAt: string;
}

export interface CurrencySettings {
  id?: string;
  user_id: string;
  default_currency: string;
  display_currency: string;
  supplier_currency: string;
  auto_convert_prices: boolean;
  show_original_prices: boolean;
  round_prices: boolean;
  rounding_method: 'nearest' | 'up' | 'down';
  decimal_places: number;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  rate: number;
  formattedOriginal: string;
  formattedConverted: string;
}

// Symboles des devises
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', CNY: '¥', JPY: '¥', CAD: 'C$', AUD: 'A$',
  CHF: 'CHF', HKD: 'HK$', SGD: 'S$', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RON: 'lei', BGN: 'лв', TRY: '₺',
  RUB: '₽', INR: '₹', BRL: 'R$', MXN: '$', ZAR: 'R', KRW: '₩', THB: '฿',
  MYR: 'RM', PHP: '₱', IDR: 'Rp', VND: '₫'
};

// Hook pour les devises supportées
export function useSupportedCurrencies() {
  return useQuery({
    queryKey: ['supported-currencies'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('currency-converter', {
        body: { action: 'get_supported_currencies' }
      });
      
      if (error) throw error;
      return data.currencies as CurrencyInfo[];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 heures
  });
}

// Hook pour les taux de change
export function useExchangeRates(baseCurrency: string = 'EUR') {
  return useQuery({
    queryKey: ['exchange-rates', baseCurrency],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('currency-converter', {
        body: { action: 'get_rates', baseCurrency }
      });
      
      if (error) throw error;
      return data as {
        baseCurrency: string;
        rates: Record<string, ExchangeRate>;
        fetchedAt: string;
        expiresAt: string;
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 60 * 1000, // Rafraîchir toutes les heures
  });
}

// Hook pour les paramètres de devise utilisateur
export function useCurrencySettings() {
  const { user } = useAuthOptimized();
  
  return useQuery({
    queryKey: ['currency-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.functions.invoke('currency-converter', {
        body: { action: 'get_settings', userId: user.id }
      });
      
      if (error) throw error;
      return data as CurrencySettings;
    },
    enabled: !!user?.id,
  });
}

// Hook pour mettre à jour les paramètres
export function useUpdateCurrencySettings() {
  const queryClient = useQueryClient();
  const { user } = useAuthOptimized();
  
  return useMutation({
    mutationFn: async (settings: Partial<CurrencySettings>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.functions.invoke('currency-converter', {
        body: { 
          action: 'update_settings', 
          userId: user.id,
          settings 
        }
      });
      
      if (error) throw error;
      return data as CurrencySettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-settings'] });
      toast.success('Paramètres de devise mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Hook pour rafraîchir les taux
export function useRefreshRates() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (baseCurrency: string = 'EUR') => {
      const { data, error } = await supabase.functions.invoke('currency-converter', {
        body: { action: 'refresh_rates', baseCurrency }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success('Taux de change mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Hook pour convertir un prix
export function useConvertPrice() {
  return useMutation({
    mutationFn: async (params: {
      amount: number;
      fromCurrency: string;
      toCurrency: string;
      roundingMethod?: 'nearest' | 'up' | 'down';
      decimalPlaces?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('currency-converter', {
        body: { action: 'convert', ...params }
      });
      
      if (error) throw error;
      return data as ConversionResult;
    },
  });
}

// Hook pour conversion en masse
export function useBulkConvert() {
  return useMutation({
    mutationFn: async (params: {
      amounts: { id: string; amount: number; fromCurrency: string }[];
      toCurrency: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('currency-converter', {
        body: { action: 'bulk_convert', ...params }
      });
      
      if (error) throw error;
      return data as { conversions: (ConversionResult & { id: string })[] };
    },
  });
}

// Hook pour convertir les prix fournisseurs
export function useConvertSupplierPrices() {
  const { user } = useAuthOptimized();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productIds?: string[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.functions.invoke('currency-converter', {
        body: { 
          action: 'convert_supplier_prices',
          userId: user.id,
          productIds
        }
      });
      
      if (error) throw error;
      return data as { converted: number; conversions: ConversionResult[] };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${data.converted} prix convertis`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Hook pour l'historique des taux
export function useRateHistory(baseCurrency: string, targetCurrency: string, days: number = 30) {
  return useQuery({
    queryKey: ['rate-history', baseCurrency, targetCurrency, days],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('currency-converter', {
        body: { 
          action: 'get_rate_history',
          baseCurrency,
          targetCurrency,
          days
        }
      });
      
      if (error) throw error;
      return data as {
        baseCurrency: string;
        targetCurrency: string;
        history: { rate: number; recorded_at: string }[];
        period: string;
      };
    },
    enabled: !!baseCurrency && !!targetCurrency,
  });
}

// Utilitaires
export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const symbolAfter = ['EUR', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'RUB'];
  
  if (symbolAfter.includes(currency)) {
    return `${formatted} ${symbol}`;
  }
  return `${symbol}${formatted}`;
}

// Hook principal de conversion avec cache local
export function useCurrencyConverter() {
  const { data: settings } = useCurrencySettings();
  const { data: ratesData } = useExchangeRates(settings?.default_currency || 'EUR');
  
  const convert = (
    amount: number,
    fromCurrency: string,
    toCurrency?: string
  ): ConversionResult => {
    const targetCurrency = toCurrency || settings?.display_currency || 'EUR';
    
    if (fromCurrency === targetCurrency) {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        convertedCurrency: targetCurrency,
        rate: 1,
        formattedOriginal: formatCurrency(amount, fromCurrency),
        formattedConverted: formatCurrency(amount, targetCurrency)
      };
    }

    // Chercher le taux
    let rate = 1;
    
    if (ratesData?.rates) {
      const directRate = ratesData.rates[targetCurrency];
      const fromRate = ratesData.rates[fromCurrency];
      
      if (ratesData.baseCurrency === fromCurrency && directRate) {
        rate = directRate.rate;
      } else if (ratesData.baseCurrency === targetCurrency && fromRate) {
        rate = fromRate.inverseRate;
      } else if (directRate && fromRate) {
        // Conversion via la devise de base
        rate = directRate.rate / fromRate.rate;
      }
    }

    const convertedAmount = amount * rate;
    const roundedAmount = settings?.round_prices 
      ? roundPrice(convertedAmount, settings.rounding_method, settings.decimal_places)
      : parseFloat(convertedAmount.toFixed(2));

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: roundedAmount,
      convertedCurrency: targetCurrency,
      rate,
      formattedOriginal: formatCurrency(amount, fromCurrency),
      formattedConverted: formatCurrency(roundedAmount, targetCurrency)
    };
  };

  return {
    convert,
    settings,
    rates: ratesData?.rates,
    baseCurrency: ratesData?.baseCurrency || 'EUR',
    isReady: !!ratesData && !!settings
  };
}

// Helper pour arrondir
function roundPrice(
  amount: number, 
  method: 'nearest' | 'up' | 'down' = 'nearest', 
  decimals: number = 2
): number {
  const factor = Math.pow(10, decimals);
  
  switch (method) {
    case 'up':
      return Math.ceil(amount * factor) / factor;
    case 'down':
      return Math.floor(amount * factor) / factor;
    default:
      return Math.round(amount * factor) / factor;
  }
}
