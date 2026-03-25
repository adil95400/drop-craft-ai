import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2
import { generateJSON } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShippingRequest {
  action: 'calculate_rates' | 'generate_label' | 'evaluate_rules' | 'carrier_recommend';
  order_id?: string;
  package_info?: {
    weight_kg: number;
    dimensions_cm?: { length: number; width: number; height: number };
    value: number;
    currency?: string;
  };
  origin?: { country: string; postal_code: string; city?: string };
  destination?: { country: string; postal_code: string; city?: string };
  carrier_preferences?: string[];
  shipping_rules?: Array<{
    rule_type: 'weight_based' | 'destination_based' | 'value_based' | 'product_based';
    conditions: Record<string, unknown>;
    rate: number;
  }>;
}

async function requireAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing authorization header');
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return { user, supabase };
}

async function callAI(systemPrompt: string, userPrompt: string) {
  return generateJSON(systemPrompt, userPrompt, { module: 'automation', temperature: 0.4, enableCache: true });
}

const CARRIER_PROFILES: Record<string, { name: string; base_rate: number; per_kg: number; delivery_days_min: number; delivery_days_max: number; tracking: boolean }> = {
  colissimo: { name: 'Colissimo', base_rate: 4.95, per_kg: 1.20, delivery_days_min: 2, delivery_days_max: 5, tracking: true },
  chronopost: { name: 'Chronopost', base_rate: 7.50, per_kg: 1.80, delivery_days_min: 1, delivery_days_max: 2, tracking: true },
  mondial_relay: { name: 'Mondial Relay', base_rate: 3.50, per_kg: 0.90, delivery_days_min: 3, delivery_days_max: 7, tracking: true },
  ups_standard: { name: 'UPS Standard', base_rate: 8.00, per_kg: 2.00, delivery_days_min: 2, delivery_days_max: 5, tracking: true },
  ups_express: { name: 'UPS Express', base_rate: 15.00, per_kg: 3.50, delivery_days_min: 1, delivery_days_max: 2, tracking: true },
  dhl_standard: { name: 'DHL Standard', base_rate: 7.50, per_kg: 1.90, delivery_days_min: 3, delivery_days_max: 7, tracking: true },
  dhl_express: { name: 'DHL Express', base_rate: 18.00, per_kg: 4.00, delivery_days_min: 1, delivery_days_max: 3, tracking: true },
  fedex_economy: { name: 'FedEx Economy', base_rate: 9.00, per_kg: 2.20, delivery_days_min: 3, delivery_days_max: 7, tracking: true },
  fedex_priority: { name: 'FedEx Priority', base_rate: 20.00, per_kg: 4.50, delivery_days_min: 1, delivery_days_max: 2, tracking: true },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, supabase } = await requireAuth(req);
    const body: ShippingRequest = await req.json();

    let result: Record<string, unknown>;

    switch (body.action) {
      case 'calculate_rates': {
        const pkg = body.package_info!;
        const dest = body.destination!;
        const isInternational = body.origin?.country !== dest.country;
        const internationalMultiplier = isInternational ? 2.5 : 1;

        // Calculate volumetric weight if dimensions provided
        let billableWeight = pkg.weight_kg;
        if (pkg.dimensions_cm) {
          const volWeight = (pkg.dimensions_cm.length * pkg.dimensions_cm.width * pkg.dimensions_cm.height) / 5000;
          billableWeight = Math.max(pkg.weight_kg, volWeight);
        }

        const rates = Object.entries(CARRIER_PROFILES).map(([key, carrier]) => {
          const rate = (carrier.base_rate + carrier.per_kg * billableWeight) * internationalMultiplier;
          return {
            carrier_code: key,
            carrier_name: carrier.name,
            rate: Math.round(rate * 100) / 100,
            currency: pkg.currency || 'EUR',
            delivery_days_min: carrier.delivery_days_min * (isInternational ? 2 : 1),
            delivery_days_max: carrier.delivery_days_max * (isInternational ? 2 : 1),
            tracking: carrier.tracking,
            is_international: isInternational,
            billable_weight_kg: Math.round(billableWeight * 100) / 100,
          };
        });

        rates.sort((a, b) => a.rate - b.rate);

        result = {
          action: 'calculate_rates',
          rates,
          cheapest: rates[0],
          fastest: rates.reduce((a, b) => a.delivery_days_min < b.delivery_days_min ? a : b),
          best_value: rates[Math.floor(rates.length / 3)], // balance price/speed
        };
        break;
      }

      case 'generate_label': {
        // Fetch order data
        const { data: order } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', body.order_id!)
          .eq('user_id', user.id)
          .single();

        if (!order) throw new Error('Order not found');

        // Generate label data (in production, this would call carrier API)
        const labelData = {
          label_id: crypto.randomUUID(),
          order_id: order.id,
          order_number: order.order_number,
          carrier: order.shipping_carrier || 'colissimo',
          tracking_number: `TR${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          label_format: 'PDF',
          label_url: null, // Would be generated by carrier API
          created_at: new Date().toISOString(),
          sender: body.origin || { country: 'FR', postal_code: '75001' },
          recipient: body.destination || {
            country: order.shipping_country || 'FR',
            postal_code: order.shipping_zip || '',
            city: order.shipping_city || '',
          },
          status: 'generated',
        };

        // Update order with tracking
        await supabase
          .from('orders')
          .update({ tracking_number: labelData.tracking_number, status: 'shipped' })
          .eq('id', order.id)
          .eq('user_id', user.id);

        result = { action: 'generate_label', label: labelData };
        break;
      }

      case 'evaluate_rules': {
        const rules = body.shipping_rules || [];
        const pkg = body.package_info!;

        const aiResult = await callAI(
          `You are a shipping logistics expert. Evaluate shipping rules and suggest optimizations.
           Return JSON: { "evaluated_rules": [{ "rule_index": number, "matches": boolean, "calculated_rate": number, "explanation": string }], "applied_rate": number, "optimization_suggestions": string[], "free_shipping_threshold": number, "estimated_savings_percent": number }`,
          `Rules: ${JSON.stringify(rules)}. Package: ${JSON.stringify(pkg)}. Destination: ${JSON.stringify(body.destination)}.`
        );

        result = { action: 'evaluate_rules', ...aiResult };
        break;
      }

      case 'carrier_recommend': {
        const pkg = body.package_info!;

        const aiResult = await callAI(
          `You are a shipping optimization AI. Recommend the best carrier based on package and destination.
           Return JSON: { "recommended_carrier": string, "reason": string, "alternatives": [{ "carrier", "pros": string[], "cons": string[] }], "tips": string[], "insurance_recommended": boolean, "customs_info": { "required": boolean, "documents": string[] } }`,
          `Package: ${JSON.stringify(pkg)}. Origin: ${JSON.stringify(body.origin)}. Destination: ${JSON.stringify(body.destination)}. Preferences: ${JSON.stringify(body.carrier_preferences || [])}.`
        );

        result = { action: 'carrier_recommend', ...aiResult };
        break;
      }

      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
