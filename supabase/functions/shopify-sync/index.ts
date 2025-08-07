import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  template_suffix: string;
  status: string;
  published_scope: string;
  tags: string;
  variants: Array<{
    id: number;
    product_id: number;
    title: string;
    price: string;
    sku: string;
    position: number;
    inventory_policy: string;
    compare_at_price: string;
    fulfillment_service: string;
    inventory_management: string;
    option1: string;
    option2: string;
    option3: string;
    created_at: string;
    updated_at: string;
    taxable: boolean;
    barcode: string;
    grams: number;
    image_id: number;
    weight: number;
    weight_unit: string;
    inventory_item_id: number;
    inventory_quantity: number;
    old_inventory_quantity: number;
    requires_shipping: boolean;
    admin_graphql_api_id: string;
  }>;
  images: Array<{
    id: number;
    product_id: number;
    position: number;
    created_at: string;
    updated_at: string;
    alt: string;
    width: number;
    height: number;
    src: string;
    variant_ids: number[];
    admin_graphql_api_id: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shop_domain, access_token, sync_type } = await req.json();

    if (!shop_domain || !access_token) {
      throw new Error("Shop domain and access token are required");
    }

    console.log(`Starting Shopify sync for ${shop_domain}, type: ${sync_type}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let syncResult;

    switch (sync_type) {
      case "products":
        syncResult = await syncProducts(shop_domain, access_token, supabase);
        break;
      case "orders":
        syncResult = await syncOrders(shop_domain, access_token, supabase);
        break;
      case "customers":
        syncResult = await syncCustomers(shop_domain, access_token, supabase);
        break;
      default:
        throw new Error(`Unsupported sync type: ${sync_type}`);
    }

    return new Response(JSON.stringify(syncResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Shopify sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function syncProducts(shopDomain: string, accessToken: string, supabase: any) {
  const url = `https://${shopDomain}/admin/api/2023-10/products.json`;
  
  const response = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const products: ShopifyProduct[] = data.products;

  console.log(`Fetched ${products.length} products from Shopify`);

  let imported = 0;
  let failed = 0;

  for (const shopifyProduct of products) {
    try {
      const productData = {
        name: shopifyProduct.title,
        description: shopifyProduct.body_html,
        price: parseFloat(shopifyProduct.variants[0]?.price || "0"),
        cost_price: parseFloat(shopifyProduct.variants[0]?.compare_at_price || "0"),
        sku: shopifyProduct.variants[0]?.sku || "",
        image_url: shopifyProduct.images[0]?.src || "",
        category: shopifyProduct.product_type || "General",
        status: shopifyProduct.status === "active" ? "active" : "inactive",
        supplier: shopifyProduct.vendor || "Shopify",
        tags: shopifyProduct.tags.split(",").map(t => t.trim()),
        shopify_id: shopifyProduct.id.toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("products")
        .upsert(productData, { 
          onConflict: "shopify_id",
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Failed to import product ${shopifyProduct.title}:`, error);
        failed++;
      } else {
        imported++;
      }
    } catch (error) {
      console.error(`Error processing product ${shopifyProduct.title}:`, error);
      failed++;
    }
  }

  return {
    success: true,
    imported,
    failed,
    total: products.length,
    message: `Successfully imported ${imported} products, ${failed} failed`,
  };
}

async function syncOrders(shopDomain: string, accessToken: string, supabase: any) {
  const url = `https://${shopDomain}/admin/api/2023-10/orders.json?status=any&limit=250`;
  
  const response = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const orders = data.orders;

  console.log(`Fetched ${orders.length} orders from Shopify`);

  let imported = 0;
  let failed = 0;

  for (const shopifyOrder of orders) {
    try {
      const orderData = {
        order_number: shopifyOrder.order_number?.toString() || shopifyOrder.id.toString(),
        customer_email: shopifyOrder.email || "",
        customer_name: `${shopifyOrder.billing_address?.first_name || ""} ${shopifyOrder.billing_address?.last_name || ""}`.trim(),
        total_amount: parseFloat(shopifyOrder.total_price || "0"),
        status: mapShopifyOrderStatus(shopifyOrder.fulfillment_status, shopifyOrder.financial_status),
        tracking_number: shopifyOrder.fulfillments?.[0]?.tracking_number || null,
        shopify_id: shopifyOrder.id.toString(),
        created_at: new Date(shopifyOrder.created_at).toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("orders")
        .upsert(orderData, { 
          onConflict: "shopify_id",
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Failed to import order ${shopifyOrder.order_number}:`, error);
        failed++;
      } else {
        imported++;
      }
    } catch (error) {
      console.error(`Error processing order ${shopifyOrder.order_number}:`, error);
      failed++;
    }
  }

  return {
    success: true,
    imported,
    failed,
    total: orders.length,
    message: `Successfully imported ${imported} orders, ${failed} failed`,
  };
}

async function syncCustomers(shopDomain: string, accessToken: string, supabase: any) {
  const url = `https://${shopDomain}/admin/api/2023-10/customers.json?limit=250`;
  
  const response = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const customers = data.customers;

  console.log(`Fetched ${customers.length} customers from Shopify`);

  let imported = 0;
  let failed = 0;

  for (const shopifyCustomer of customers) {
    try {
      const customerData = {
        email: shopifyCustomer.email,
        name: `${shopifyCustomer.first_name || ""} ${shopifyCustomer.last_name || ""}`.trim(),
        phone: shopifyCustomer.phone || null,
        total_orders: shopifyCustomer.orders_count || 0,
        total_spent: parseFloat(shopifyCustomer.total_spent || "0"),
        status: shopifyCustomer.state === "enabled" ? "active" : "inactive",
        shopify_id: shopifyCustomer.id.toString(),
        created_at: new Date(shopifyCustomer.created_at).toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("customers")
        .upsert(customerData, { 
          onConflict: "shopify_id",
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Failed to import customer ${shopifyCustomer.email}:`, error);
        failed++;
      } else {
        imported++;
      }
    } catch (error) {
      console.error(`Error processing customer ${shopifyCustomer.email}:`, error);
      failed++;
    }
  }

  return {
    success: true,
    imported,
    failed,
    total: customers.length,
    message: `Successfully imported ${imported} customers, ${failed} failed`,
  };
}

function mapShopifyOrderStatus(fulfillmentStatus: string | null, financialStatus: string) {
  if (financialStatus === "pending") return "pending";
  if (financialStatus === "paid" && !fulfillmentStatus) return "processing";
  if (fulfillmentStatus === "fulfilled") return "shipped";
  if (fulfillmentStatus === "shipped") return "delivered";
  return "pending";
}