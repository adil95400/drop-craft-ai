import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Devises supportées
const SUPPORTED_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'CNY', 'JPY', 'CAD', 'AUD', 'CHF', 'HKD', 'SGD',
  'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'TRY', 'RUB',
  'INR', 'BRL', 'MXN', 'ZAR', 'KRW', 'THB', 'MYR', 'PHP', 'IDR', 'VND'
];

// Symboles des devises
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', CNY: '¥', JPY: '¥', CAD: 'C$', AUD: 'A$',
  CHF: 'CHF', HKD: 'HK$', SGD: 'S$', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RON: 'lei', BGN: 'лв', TRY: '₺',
  RUB: '₽', INR: '₹', BRL: 'R$', MXN: '$', ZAR: 'R', KRW: '₩', THB: '฿',
  MYR: 'RM', PHP: '₱', IDR: 'Rp', VND: '₫'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...params } = await req.json();
    console.log(`[Currency Converter] Action: ${action}`, params);

    let result;

    switch (action) {
      case 'get_rates':
        result = await getRates(supabase, params);
        break;
      case 'refresh_rates':
        result = await refreshRates(supabase, params);
        break;
      case 'convert':
        result = await convertPrice(supabase, params);
        break;
      case 'bulk_convert':
        result = await bulkConvert(supabase, params);
        break;
      case 'get_settings':
        result = await getSettings(supabase, params);
        break;
      case 'update_settings':
        result = await updateSettings(supabase, params);
        break;
      case 'get_supported_currencies':
        result = await getSupportedCurrencies();
        break;
      case 'convert_supplier_prices':
        result = await convertSupplierPrices(supabase, params);
        break;
      case 'get_rate_history':
        result = await getRateHistory(supabase, params);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Currency Converter] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Récupérer les taux de change actuels
async function getRates(supabase: any, params: { baseCurrency?: string }) {
  const { baseCurrency = 'EUR' } = params;

  const { data: rates, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency', baseCurrency)
    .gt('expires_at', new Date().toISOString());

  if (error) throw error;

  // Si pas de taux valides, rafraîchir
  if (!rates || rates.length === 0) {
    return await refreshRates(supabase, { baseCurrency });
  }

  return {
    baseCurrency,
    rates: rates.reduce((acc: any, r: any) => {
      acc[r.target_currency] = {
        rate: parseFloat(r.rate),
        inverseRate: parseFloat(r.inverse_rate),
        fetchedAt: r.fetched_at,
        expiresAt: r.expires_at
      };
      return acc;
    }, {}),
    fetchedAt: rates[0]?.fetched_at,
    expiresAt: rates[0]?.expires_at
  };
}

// Rafraîchir les taux de change depuis l'API
async function refreshRates(supabase: any, params: { baseCurrency?: string }) {
  const { baseCurrency = 'EUR' } = params;
  
  // Utiliser une API gratuite de taux de change
  // En production, utiliser une API payante comme Open Exchange Rates
  const apiKey = Deno.env.get('EXCHANGE_RATE_API_KEY');
  
  let rates: Record<string, number> = {};
  
  try {
    if (apiKey) {
      // API avec clé
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
      );
      const data = await response.json();
      
      if (data.result === 'success') {
        rates = data.conversion_rates;
      }
    } else {
      // Fallback: utiliser des taux approximatifs basés sur EUR
      rates = getDefaultRates(baseCurrency);
    }
  } catch (err) {
    console.error('[Currency] API error, using defaults:', err);
    rates = getDefaultRates(baseCurrency);
  }

  // Enregistrer les taux en base
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
  const now = new Date().toISOString();

  for (const [currency, rate] of Object.entries(rates)) {
    if (currency === baseCurrency || !SUPPORTED_CURRENCIES.includes(currency)) continue;
    
    const inverseRate = 1 / rate;
    
    // Upsert le taux
    await supabase
      .from('exchange_rates')
      .upsert({
        base_currency: baseCurrency,
        target_currency: currency,
        rate: rate,
        inverse_rate: inverseRate,
        fetched_at: now,
        expires_at: expiresAt.toISOString(),
        source: apiKey ? 'exchangerate-api' : 'default'
      }, {
        onConflict: 'base_currency,target_currency'
      });

    // Enregistrer dans l'historique
    await supabase
      .from('exchange_rate_history')
      .insert({
        base_currency: baseCurrency,
        target_currency: currency,
        rate: rate,
        recorded_at: now
      });
  }

  return await getRates(supabase, { baseCurrency });
}

// Taux par défaut (approximatifs)
function getDefaultRates(baseCurrency: string): Record<string, number> {
  const eurRates: Record<string, number> = {
    EUR: 1, USD: 1.085, GBP: 0.842, CNY: 7.85, JPY: 162.5, CAD: 1.475,
    AUD: 1.658, CHF: 0.938, HKD: 8.48, SGD: 1.46, SEK: 11.2, NOK: 11.5,
    DKK: 7.46, PLN: 4.32, CZK: 25.2, HUF: 390, RON: 4.97, BGN: 1.96,
    TRY: 32.5, RUB: 98, INR: 90.5, BRL: 5.35, MXN: 18.5, ZAR: 19.8,
    KRW: 1420, THB: 37.5, MYR: 4.85, PHP: 60.5, IDR: 16800, VND: 26500
  };

  if (baseCurrency === 'EUR') {
    return eurRates;
  }

  // Convertir vers la devise de base
  const baseRate = eurRates[baseCurrency] || 1;
  const result: Record<string, number> = {};
  
  for (const [currency, rate] of Object.entries(eurRates)) {
    result[currency] = rate / baseRate;
  }
  
  return result;
}

// Convertir un prix
async function convertPrice(supabase: any, params: {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  roundingMethod?: 'nearest' | 'up' | 'down';
  decimalPlaces?: number;
}) {
  const { amount, fromCurrency, toCurrency, roundingMethod = 'nearest', decimalPlaces = 2 } = params;

  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount,
      convertedCurrency: toCurrency,
      rate: 1,
      formattedOriginal: formatPrice(amount, fromCurrency),
      formattedConverted: formatPrice(amount, toCurrency)
    };
  }

  // Récupérer le taux
  const { data: rateData } = await supabase
    .from('exchange_rates')
    .select('rate, inverse_rate')
    .eq('base_currency', fromCurrency)
    .eq('target_currency', toCurrency)
    .gt('expires_at', new Date().toISOString())
    .single();

  let rate: number;

  if (rateData) {
    rate = parseFloat(rateData.rate);
  } else {
    // Essayer l'inverse
    const { data: inverseData } = await supabase
      .from('exchange_rates')
      .select('rate, inverse_rate')
      .eq('base_currency', toCurrency)
      .eq('target_currency', fromCurrency)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inverseData) {
      rate = parseFloat(inverseData.inverse_rate);
    } else {
      // Passer par EUR
      const fromEur = await getRate(supabase, 'EUR', fromCurrency);
      const toEur = await getRate(supabase, 'EUR', toCurrency);
      rate = toEur / fromEur;
    }
  }

  let convertedAmount = amount * rate;

  // Appliquer l'arrondi
  const factor = Math.pow(10, decimalPlaces);
  switch (roundingMethod) {
    case 'up':
      convertedAmount = Math.ceil(convertedAmount * factor) / factor;
      break;
    case 'down':
      convertedAmount = Math.floor(convertedAmount * factor) / factor;
      break;
    default:
      convertedAmount = Math.round(convertedAmount * factor) / factor;
  }

  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount,
    convertedCurrency: toCurrency,
    rate,
    formattedOriginal: formatPrice(amount, fromCurrency),
    formattedConverted: formatPrice(convertedAmount, toCurrency)
  };
}

// Helper pour obtenir un taux
async function getRate(supabase: any, baseCurrency: string, targetCurrency: string): Promise<number> {
  if (baseCurrency === targetCurrency) return 1;

  const { data } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('base_currency', baseCurrency)
    .eq('target_currency', targetCurrency)
    .gt('expires_at', new Date().toISOString())
    .single();

  return data?.rate || 1;
}

// Conversion en masse
async function bulkConvert(supabase: any, params: {
  amounts: { id: string; amount: number; fromCurrency: string }[];
  toCurrency: string;
}) {
  const { amounts, toCurrency } = params;
  const results = [];

  for (const item of amounts) {
    const conversion = await convertPrice(supabase, {
      amount: item.amount,
      fromCurrency: item.fromCurrency,
      toCurrency
    });
    results.push({
      id: item.id,
      ...conversion
    });
  }

  return { conversions: results };
}

// Récupérer les paramètres utilisateur
async function getSettings(supabase: any, params: { userId: string }) {
  const { userId } = params;

  const { data, error } = await supabase
    .from('currency_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  // Retourner les paramètres par défaut si non trouvés
  return data || {
    user_id: userId,
    default_currency: 'EUR',
    display_currency: 'EUR',
    supplier_currency: 'USD',
    auto_convert_prices: true,
    show_original_prices: true,
    round_prices: true,
    rounding_method: 'nearest',
    decimal_places: 2
  };
}

// Mettre à jour les paramètres utilisateur
async function updateSettings(supabase: any, params: {
  userId: string;
  settings: Record<string, any>;
}) {
  const { userId, settings } = params;

  const { data, error } = await supabase
    .from('currency_settings')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Récupérer les devises supportées
async function getSupportedCurrencies() {
  return {
    currencies: SUPPORTED_CURRENCIES.map(code => ({
      code,
      symbol: CURRENCY_SYMBOLS[code] || code,
      name: getCurrencyName(code)
    }))
  };
}

// Nom des devises
function getCurrencyName(code: string): string {
  const names: Record<string, string> = {
    EUR: 'Euro', USD: 'Dollar américain', GBP: 'Livre sterling',
    CNY: 'Yuan chinois', JPY: 'Yen japonais', CAD: 'Dollar canadien',
    AUD: 'Dollar australien', CHF: 'Franc suisse', HKD: 'Dollar de Hong Kong',
    SGD: 'Dollar de Singapour', SEK: 'Couronne suédoise', NOK: 'Couronne norvégienne',
    DKK: 'Couronne danoise', PLN: 'Zloty polonais', CZK: 'Couronne tchèque',
    HUF: 'Forint hongrois', RON: 'Leu roumain', BGN: 'Lev bulgare',
    TRY: 'Livre turque', RUB: 'Rouble russe', INR: 'Roupie indienne',
    BRL: 'Réal brésilien', MXN: 'Peso mexicain', ZAR: 'Rand sud-africain',
    KRW: 'Won sud-coréen', THB: 'Baht thaïlandais', MYR: 'Ringgit malaisien',
    PHP: 'Peso philippin', IDR: 'Roupie indonésienne', VND: 'Dong vietnamien'
  };
  return names[code] || code;
}

// Formater un prix avec symbole
function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formatted = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  // Position du symbole selon la devise
  const symbolAfter = ['EUR', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'RUB'];
  
  if (symbolAfter.includes(currency)) {
    return `${formatted} ${symbol}`;
  }
  return `${symbol}${formatted}`;
}

// Convertir automatiquement les prix fournisseurs
async function convertSupplierPrices(supabase: any, params: {
  userId: string;
  productIds?: string[];
}) {
  const { userId, productIds } = params;

  // Récupérer les paramètres utilisateur
  const settings = await getSettings(supabase, { userId });
  const { default_currency, supplier_currency, auto_convert_prices } = settings;

  if (!auto_convert_prices) {
    return { message: 'Conversion automatique désactivée', converted: 0 };
  }

  // Récupérer les produits à convertir
  let query = supabase
    .from('products')
    .select('id, cost_price, supplier_price, currency')
    .eq('user_id', userId);

  if (productIds && productIds.length > 0) {
    query = query.in('id', productIds);
  }

  const { data: products, error } = await query;
  if (error) throw error;

  let converted = 0;
  const conversions = [];

  for (const product of products || []) {
    const originalPrice = product.supplier_price || product.cost_price;
    const originalCurrency = product.currency || supplier_currency;

    if (!originalPrice) continue;

    const conversion = await convertPrice(supabase, {
      amount: parseFloat(originalPrice),
      fromCurrency: originalCurrency,
      toCurrency: default_currency
    });

    // Enregistrer la conversion
    await supabase.from('product_price_conversions').insert({
      product_id: product.id,
      user_id: userId,
      original_price: originalPrice,
      original_currency: originalCurrency,
      converted_price: conversion.convertedAmount,
      converted_currency: default_currency,
      exchange_rate_used: conversion.rate,
      conversion_type: 'supplier_to_selling'
    });

    conversions.push({
      productId: product.id,
      ...conversion
    });
    converted++;
  }

  return { converted, conversions };
}

// Historique des taux
async function getRateHistory(supabase: any, params: {
  baseCurrency: string;
  targetCurrency: string;
  days?: number;
}) {
  const { baseCurrency, targetCurrency, days = 30 } = params;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('exchange_rate_history')
    .select('rate, recorded_at')
    .eq('base_currency', baseCurrency)
    .eq('target_currency', targetCurrency)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) throw error;

  return {
    baseCurrency,
    targetCurrency,
    history: data || [],
    period: `${days} jours`
  };
}
