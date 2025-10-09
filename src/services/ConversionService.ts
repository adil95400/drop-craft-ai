import { supabase } from '@/integrations/supabase/client';

export class ConversionService {
  // Product Bundles
  static async getProductBundles() {
    const { data, error } = await supabase
      .from('product_bundles' as any)
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  static async createProductBundle(bundle: any) {
    const { data, error } = await supabase.functions.invoke('conversion-optimizer', {
      body: {
        action: 'create_bundle',
        ...bundle
      }
    });
    
    if (error) throw error;
    return data;
  }

  // Upsell Rules
  static async getUpsellRules() {
    const { data, error } = await supabase
      .from('upsell_rules' as any)
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  static async generateAIUpsells(params: { product_id: string; cart_items: any[] }) {
    const { data, error } = await supabase.functions.invoke('conversion-optimizer', {
      body: {
        action: 'generate_upsells',
        ...params
      }
    });
    
    if (error) throw error;
    return data;
  }

  static async createUpsellRule(rule: any) {
    const { data, error } = await supabase
      .from('upsell_rules' as any)
      .insert(rule)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Dynamic Discounts
  static async getDynamicDiscounts() {
    const { data, error } = await supabase
      .from('dynamic_discounts' as any)
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  static async calculateDiscount(params: any) {
    const { data, error } = await supabase.functions.invoke('conversion-optimizer', {
      body: {
        action: 'calculate_discount',
        ...params
      }
    });
    
    if (error) throw error;
    return data;
  }

  static async createDynamicDiscount(discount: any) {
    const { data, error } = await supabase
      .from('dynamic_discounts' as any)
      .insert(discount)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Scarcity Timers
  static async getScarcityTimers() {
    const { data, error } = await supabase
      .from('scarcity_timers' as any)
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  }

  static async createScarcityTimer(timer: any) {
    const { data, error } = await supabase
      .from('scarcity_timers' as any)
      .insert(timer)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Social Proof Widgets
  static async getSocialProofWidgets() {
    const { data, error } = await supabase
      .from('social_proof_widgets' as any)
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  }

  static async getSocialProofData(widget_type: string) {
    const { data, error } = await supabase.functions.invoke('conversion-optimizer', {
      body: {
        action: 'get_social_proof_data',
        widget_type
      }
    });
    
    if (error) throw error;
    return data;
  }

  static async createSocialProofWidget(widget: any) {
    const { data, error } = await supabase
      .from('social_proof_widgets' as any)
      .insert(widget)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Conversion Tracking
  static async trackConversion(event: any) {
    const { data, error } = await supabase.functions.invoke('conversion-optimizer', {
      body: {
        action: 'track_conversion',
        ...event
      }
    });
    
    if (error) throw error;
    return data;
  }

  // Analytics
  static async getConversionAnalytics() {
    const { data: events } = await supabase
      .from('conversion_events' as any)
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const totalEvents = events?.length || 0;
    const totalValue = events?.reduce((sum: number, e: any) => sum + (e.conversion_value || 0), 0) || 0;
    
    const byType = events?.reduce((acc: any, e: any) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    }, {});

    return {
      total_events: totalEvents,
      total_conversion_value: totalValue,
      average_value: totalEvents > 0 ? totalValue / totalEvents : 0,
      events_by_type: byType || {}
    };
  }
}
