import { supabase } from "@/integrations/supabase/client";

export class InternationalizationService {
  // Product Translations
  static async getProductTranslations(productId: string, locale?: string) {
    let query = supabase
      .from('product_translations')
      .select('*')
      .eq('product_id', productId);

    if (locale) {
      query = query.eq('locale', locale);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async createProductTranslation(translation: any) {
    const { data, error } = await supabase
      .from('product_translations')
      .insert(translation)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProductTranslation(id: string, updates: any) {
    const { data, error } = await supabase
      .from('product_translations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProductTranslation(id: string) {
    const { error } = await supabase
      .from('product_translations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Auto Translation
  static async translateProducts(productIds: string[], targetLocales: string[], sourceLocale = 'fr') {
    const { data, error } = await supabase.functions.invoke('i18n-manager', {
      body: {
        action: 'translate_products',
        data: {
          productIds,
          targetLocales,
          sourceLocale
        }
      }
    });

    if (error) throw error;
    return data;
  }

  // Currencies
  static async getCurrencies() {
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createCurrency(currency: any) {
    const { data, error } = await supabase
      .from('currencies')
      .insert(currency)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateCurrency(id: string, updates: any) {
    const { data, error } = await supabase
      .from('currencies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async setDefaultCurrency(id: string) {
    // First, unset all defaults
    await supabase
      .from('currencies')
      .update({ is_default: false })
      .neq('id', id);

    // Then set the new default
    const { data, error } = await supabase
      .from('currencies')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Currency Rates
  static async getCurrencyRates(fromCurrency?: string) {
    let query = supabase
      .from('currency_rates')
      .select('*')
      .order('last_updated', { ascending: false });

    if (fromCurrency) {
      query = query.eq('from_currency', fromCurrency);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async updateCurrencyRates(baseCurrency = 'EUR') {
    const { data, error } = await supabase.functions.invoke('i18n-manager', {
      body: {
        action: 'update_rates',
        data: { baseCurrency }
      }
    });

    if (error) throw error;
    return data;
  }

  static async convertPrice(amount: number, fromCurrency: string, toCurrency: string) {
    if (fromCurrency === toCurrency) return amount;

    const { data: rate } = await supabase
      .from('currency_rates')
      .select('rate')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .single();

    if (!rate) {
      console.warn(`No rate found for ${fromCurrency} to ${toCurrency}`);
      return amount;
    }

    return amount * rate.rate;
  }

  // Geo Targeting
  static async getGeoTargetingRules() {
    const { data, error } = await supabase
      .from('geo_targeting_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createGeoTargetingRule(rule: any) {
    const { data, error } = await supabase
      .from('geo_targeting_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateGeoTargetingRule(id: string, updates: any) {
    const { data, error } = await supabase
      .from('geo_targeting_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteGeoTargetingRule(id: string) {
    const { error } = await supabase
      .from('geo_targeting_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async detectGeoLocation() {
    const { data, error } = await supabase.functions.invoke('i18n-manager', {
      body: {
        action: 'detect_geo',
        data: {}
      }
    });

    if (error) throw error;
    return data;
  }

  // Locale Settings
  static async getLocaleSettings() {
    const { data, error } = await supabase
      .from('locale_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateLocaleSettings(settings: any) {
    const { data, error } = await supabase
      .from('locale_settings')
      .upsert(settings)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Translation Jobs
  static async getTranslationJobs() {
    const { data, error } = await supabase
      .from('translation_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createTranslationJob(job: any) {
    const { data, error } = await supabase
      .from('translation_jobs')
      .insert(job)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async startBulkTranslation(jobId: string) {
    const { data, error } = await supabase.functions.invoke('i18n-manager', {
      body: {
        action: 'bulk_translate',
        data: { jobId }
      }
    });

    if (error) throw error;
    return data;
  }
}