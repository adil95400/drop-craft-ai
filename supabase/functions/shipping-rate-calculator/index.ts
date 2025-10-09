import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { 
      destination_country, 
      destination_postal_code,
      weight, 
      order_value,
      warehouse_id 
    } = await req.json();

    console.log('📦 Calculating shipping rates for:', {
      destination_country,
      destination_postal_code,
      weight,
      order_value,
      warehouse_id
    });

    // Find matching shipping zone
    const { data: zones, error: zonesError } = await supabaseClient
      .from('shipping_zones')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (zonesError) throw zonesError;

    let matchedZone = null;
    for (const zone of zones || []) {
      if (zone.countries?.includes(destination_country)) {
        matchedZone = zone;
        break;
      }
    }

    if (!matchedZone) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No shipping zone found for destination',
          available_rates: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get shipping rates for this zone
    let query = supabaseClient
      .from('shipping_rates')
      .select('*')
      .eq('user_id', user.id)
      .eq('zone_id', matchedZone.id)
      .eq('is_active', true);

    if (warehouse_id) {
      query = query.or(`warehouse_id.eq.${warehouse_id},warehouse_id.is.null`);
    }

    const { data: rates, error: ratesError } = await query;
    if (ratesError) throw ratesError;

    // Calculate rates
    const calculatedRates = (rates || []).map(rate => {
      let calculatedCost = rate.base_rate;

      // Apply weight-based pricing
      if (rate.rate_type === 'weight_based' && weight && rate.weight_ranges) {
        const weightRange = rate.weight_ranges.find((r: any) => 
          weight >= r.min && weight < r.max
        );
        if (weightRange) {
          calculatedCost = weightRange.rate;
        }
      }

      // Apply price-based pricing
      if (rate.rate_type === 'price_based' && order_value && rate.price_ranges) {
        const priceRange = rate.price_ranges.find((r: any) => 
          order_value >= r.min && order_value < r.max
        );
        if (priceRange) {
          calculatedCost = priceRange.rate;
        }
      }

      // Check free shipping threshold
      if (rate.free_shipping_threshold && order_value >= rate.free_shipping_threshold) {
        calculatedCost = 0;
      }

      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + rate.max_delivery_days);

      return {
        rate_id: rate.id,
        carrier: rate.carrier,
        service_name: rate.service_name,
        cost: calculatedCost,
        currency: 'EUR',
        delivery_estimate: {
          min_days: rate.min_delivery_days,
          max_days: rate.max_delivery_days,
          estimated_date: estimatedDelivery.toISOString()
        },
        is_free: calculatedCost === 0,
        zone_name: matchedZone.zone_name
      };
    });

    // Sort by cost (cheapest first)
    calculatedRates.sort((a, b) => a.cost - b.cost);

    console.log('✅ Calculated rates:', calculatedRates);

    return new Response(
      JSON.stringify({
        success: true,
        matched_zone: matchedZone.zone_name,
        available_rates: calculatedRates,
        handling_time_days: matchedZone.handling_time_days
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Shipping calculation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
