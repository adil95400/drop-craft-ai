import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { action, product_data, order_data } = await req.json()

    switch (action) {
      case 'create_product': {
        // Create POD product with variants
        const variants = []
        const sizes = product_data.sizes || ['S', 'M', 'L', 'XL']
        const colors = product_data.colors || ['Black', 'White', 'Navy']

        for (const size of sizes) {
          for (const color of colors) {
            variants.push({
              size,
              color,
              sku: `${product_data.product_type}-${size}-${color}`.toUpperCase(),
              price: product_data.base_cost + 10,
              stock: 999
            })
          }
        }

        const { data: product, error } = await supabaseClient
          .from('pod_products')
          .insert({
            user_id: user.id,
            product_name: product_data.product_name,
            product_type: product_data.product_type,
            supplier: product_data.supplier || 'Printful',
            base_cost: product_data.base_cost,
            selling_price: product_data.base_cost + 15,
            design_url: product_data.design_url,
            variants: variants,
            status: 'active'
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ 
            success: true, 
            product: {
              ...product,
              variants_count: variants.length
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'generate_mockups': {
        const { product_id, views } = await req.json()

        const mockups = []
        const viewAngles = views || ['front', 'back', 'side']

        for (const angle of viewAngles) {
          const { data } = await supabaseClient
            .from('pod_mockups')
            .insert({
              user_id: user.id,
              pod_product_id: product_id,
              mockup_url: `/mockups/${product_id}/${angle}.jpg`,
              view_angle: angle,
              ai_generated: true
            })
            .select()
            .single()

          if (data) mockups.push(data)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            mockups_created: mockups.length,
            mockups 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'place_order': {
        // Create POD order
        const { data: order, error } = await supabaseClient
          .from('pod_orders')
          .insert({
            user_id: user.id,
            pod_product_id: order_data.product_id,
            order_number: `POD-${Date.now()}`,
            customer_name: order_data.customer_name,
            variant_selected: order_data.variant,
            quantity: order_data.quantity || 1,
            production_status: 'pending'
          })
          .select()
          .single()

        if (error) throw error

        // Simulate supplier order placement
        const supplierOrderId = `PRINT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        
        await supabaseClient
          .from('pod_orders')
          .update({
            supplier_order_id: supplierOrderId,
            production_status: 'processing'
          })
          .eq('id', order.id)

        return new Response(
          JSON.stringify({ 
            success: true, 
            order: {
              ...order,
              supplier_order_id: supplierOrderId
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_catalog': {
        const catalog = [
          {
            id: 'tshirt-basic',
            name: 'Basic T-Shirt',
            type: 't-shirt',
            base_cost: 8.50,
            variants: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
            colors: ['Black', 'White', 'Navy', 'Red', 'Gray'],
            supplier: 'Printful'
          },
          {
            id: 'hoodie-premium',
            name: 'Premium Hoodie',
            type: 'hoodie',
            base_cost: 22.00,
            variants: ['S', 'M', 'L', 'XL', '2XL'],
            colors: ['Black', 'White', 'Navy', 'Gray'],
            supplier: 'Printful'
          },
          {
            id: 'mug-ceramic',
            name: 'Ceramic Mug',
            type: 'mug',
            base_cost: 6.50,
            variants: ['11oz', '15oz'],
            colors: ['White'],
            supplier: 'Printify'
          }
        ]

        return new Response(
          JSON.stringify({ success: true, catalog }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error in pod-manager:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})