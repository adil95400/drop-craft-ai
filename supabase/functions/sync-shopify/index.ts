import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, productIds, shopId, range } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth header to identify user
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Get shop credentials
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .eq('user_id', userData.user.id)
      .single();

    if (shopError || !shop) {
      throw new Error('Shop not found or access denied');
    }

    if (action === 'push_products') {
      // Push selected products to Shopify from imported_products
      // Récupérer les données depuis imported_products au lieu de products
      const { data: importedProducts } = await supabase
        .from('imported_products')
        .select('*')
        .in('id', productIds);

      const shopifyProducts = [];
      
      for (const product of importedProducts || []) {
        const shopifyProduct = {
          title: product.name,
          body_html: product.description || '',
          vendor: product.brand || 'Default',
          product_type: product.category || 'General',
          tags: product.tags?.join(', ') || '',
          variants: [{
            price: product.price.toString(),
            sku: product.sku,
            inventory_quantity: product.stock_quantity || 0,
            inventory_management: 'shopify'
          }],
          images: product.image_urls?.map((url: string) => ({ src: url })) || []
        };

        // Create product in Shopify
        const response = await fetch(`https://${shop.shop_domain}/admin/api/2023-10/products.json`, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': shop.access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ product: shopifyProduct }),
        });

        if (response.ok) {
          const shopifyResponse = await response.json();
          shopifyProducts.push({
            local_id: product.id,
            shopify_id: shopifyResponse.product.id,
            title: product.title
          });
        }
      }

      // Log the sync
      await supabase.from('events_logs').insert({
        topic: 'products_pushed_to_shopify',
        payload: {
          shop_domain: shop.shop_domain,
          user_id: userData.user.id,
          products_count: shopifyProducts.length,
          products: shopifyProducts,
          timestamp: new Date().toISOString()
        }
      });

      return new Response(JSON.stringify({
        success: true,
        message: `Successfully pushed ${shopifyProducts.length} products to Shopify`,
        products: shopifyProducts
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'pull_orders') {
      // Pull recent orders from Shopify
      const dateFilter = range === '7d' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() : undefined;
      const ordersUrl = `https://${shop.shop_domain}/admin/api/2023-10/orders.json${dateFilter ? `?created_at_min=${dateFilter}` : ''}`;

      const ordersResponse = await fetch(ordersUrl, {
        headers: {
          'X-Shopify-Access-Token': shop.access_token,
        },
      });

      if (!ordersResponse.ok) {
        throw new Error('Failed to fetch orders from Shopify');
      }

      const ordersData = await ordersResponse.json();
      const syncedOrders = [];

      for (const shopifyOrder of ordersData.orders || []) {
        // Check if customer exists or create new one
        let customer = null;
        if (shopifyOrder.customer) {
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('email', shopifyOrder.customer.email)
            .single();

          if (existingCustomer) {
            customer = existingCustomer;
          } else {
            const { data: newCustomer } = await supabase
              .from('customers')
              .insert({
                email: shopifyOrder.customer.email,
                name: `${shopifyOrder.customer.first_name || ''} ${shopifyOrder.customer.last_name || ''}`.trim(),
                country: shopifyOrder.shipping_address?.country || 'Unknown'
              })
              .select()
              .single();
            customer = newCustomer;
          }
        }

        // Create order
        const { data: newOrder } = await supabase
          .from('orders')
          .insert({
            shopify_order_id: shopifyOrder.id.toString(),
            customer_id: customer?.id,
            total: parseFloat(shopifyOrder.total_price),
            currency: shopifyOrder.currency,
            status: shopifyOrder.financial_status === 'paid' ? 'processing' : 'pending',
            created_at: shopifyOrder.created_at
          })
          .select()
          .single();

        if (newOrder) {
          syncedOrders.push(newOrder);
        }
      }

      // Log the sync
      await supabase.from('events_logs').insert({
        topic: 'orders_pulled_from_shopify',
        payload: {
          shop_domain: shop.shop_domain,
          user_id: userData.user.id,
          orders_count: syncedOrders.length,
          range: range,
          timestamp: new Date().toISOString()
        }
      });

      return new Response(JSON.stringify({
        success: true,
        message: `Successfully pulled ${syncedOrders.length} orders from Shopify`,
        orders: syncedOrders
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action specified');

  } catch (error) {
    console.error('Shopify sync error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});