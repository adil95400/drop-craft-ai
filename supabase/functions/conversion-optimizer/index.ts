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

    const { action, ...params } = await req.json();
    console.log('🎯 Conversion optimizer action:', action);

    switch (action) {
      case 'generate_upsells': {
        const { product_id, cart_items } = params;
        
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        
        const prompt = `Generate 3 upsell/cross-sell product suggestions for:
Product ID: ${product_id}
Cart Items: ${JSON.stringify(cart_items)}

Return suggestions with:
- Product IDs to suggest
- Reasoning for each suggestion
- Discount recommendation (if any)
- Display message`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-5-mini',
            messages: [
              { role: 'system', content: 'You are an e-commerce conversion optimization expert.' },
              { role: 'user', content: prompt }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'suggest_upsells',
                description: 'Suggest upsell/cross-sell products',
                parameters: {
                  type: 'object',
                  properties: {
                    suggestions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          product_id: { type: 'string' },
                          reason: { type: 'string' },
                          discount: { type: 'number' },
                          message: { type: 'string' }
                        },
                        required: ['product_id', 'reason', 'message']
                      }
                    }
                  },
                  required: ['suggestions']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'suggest_upsells' } }
          })
        });

        const aiData = await aiResponse.json();
        const suggestions = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;

        return new Response(
          JSON.stringify({
            success: true,
            suggestions: suggestions ? JSON.parse(suggestions).suggestions : [],
            message: 'AI upsell suggestions generated'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_bundle': {
        const { bundle_name, product_ids, discount_type, discount_value } = params;

        const { data: products } = await supabaseClient
          .from('products')
          .select('price')
          .in('id', product_ids);

        const originalPrice = products?.reduce((sum: number, p: any) => sum + (p.price || 0), 0) || 0;
        let bundlePrice = originalPrice;

        if (discount_type === 'percentage') {
          bundlePrice = originalPrice * (1 - discount_value / 100);
        } else if (discount_type === 'fixed') {
          bundlePrice = originalPrice - discount_value;
        }

        const savings = originalPrice - bundlePrice;

        const { data: bundle, error } = await supabaseClient
          .from('product_bundles')
          .insert({
            user_id: user.id,
            bundle_name,
            product_ids,
            discount_type,
            discount_value,
            bundle_price: bundlePrice,
            original_price: originalPrice,
            savings
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            bundle,
            message: 'Bundle created successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'calculate_discount': {
        const { cart_value, customer_data } = params;

        let discount = 0;
        const { data: discounts } = await supabaseClient
          .from('dynamic_discounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('priority', { ascending: true });

        for (const rule of discounts || []) {
          const cond = rule.conditions || {};
          
          if (cond.min_cart_value && cart_value < cond.min_cart_value) continue;
          if (cond.customer_type && customer_data?.type !== cond.customer_type) continue;

          if (rule.discount_type === 'percentage') {
            discount = Math.max(discount, (cart_value * rule.discount_value) / 100);
          } else if (rule.discount_type === 'fixed') {
            discount = Math.max(discount, rule.discount_value);
          }

          break;
        }

        return new Response(
          JSON.stringify({
            success: true,
            discount,
            final_price: cart_value - discount,
            message: 'Discount calculated'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'track_conversion': {
        const { event_type, entity_type, entity_id, conversion_value, metadata, session_id } = params;

        await supabaseClient
          .from('conversion_events')
          .insert({
            user_id: user.id,
            session_id,
            event_type,
            entity_type,
            entity_id,
            conversion_value,
            metadata
          });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Conversion event tracked'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_social_proof_data': {
        const { widget_type } = params;

        let data: any = {};

        if (widget_type === 'recent_purchases') {
          const { data: purchases } = await supabaseClient
            .from('orders')
            .select('*, customers(name), order_items(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          data.recent_purchases = purchases;
        }

        if (widget_type === 'live_visitors') {
          // Query real analytics data from conversion_events in last 5 minutes
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          
          const { count, error } = await supabaseClient
            .from('conversion_events')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('event_type', 'page_view')
            .gte('created_at', fiveMinutesAgo);

          if (error) {
            console.error('Error fetching live visitors:', error);
            data.visitors_count = 0;
          } else {
            data.visitors_count = count || 0;
          }
          
          // Also get unique sessions in last hour for context
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          const { data: sessions } = await supabaseClient
            .from('conversion_events')
            .select('session_id')
            .eq('user_id', user.id)
            .gte('created_at', oneHourAgo);
          
          const uniqueSessions = new Set(sessions?.map(s => s.session_id).filter(Boolean));
          data.hourly_unique_visitors = uniqueSessions.size;
        }

        return new Response(
          JSON.stringify({
            success: true,
            data,
            message: 'Social proof data retrieved'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('❌ Conversion optimizer error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
