import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      
      if (token.startsWith("ext_")) {
        const { data: sessionData } = await supabase
          .from("extension_sessions")
          .select("user_id")
          .eq("session_token", token)
          .eq("is_active", true)
          .single();
        
        if (sessionData) {
          userId = sessionData.user_id;
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { storeId, storePlatform, products } = await req.json();

    if (!storeId || !products || products.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing storeId or products" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get store/integration details
    const { data: integration, error: intError } = await supabase
      .from("integrations")
      .select("*")
      .eq("id", storeId)
      .eq("user_id", userId)
      .single();

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ success: false, error: "Store not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const platform = storePlatform || integration.platform;
    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each product based on platform
    for (const product of products) {
      try {
        const importResult = await importToStore(supabase, {
          userId,
          integration,
          platform,
          product
        });
        
        if (importResult.success) {
          results.imported++;
        } else {
          results.failed++;
          results.errors.push(importResult.error || "Unknown error");
        }
      } catch (error) {
        results.failed++;
        results.errors.push(error.message);
      }
    }

    // Log the import activity
    await supabase.from("activity_logs").insert({
      user_id: userId,
      action: "multi_store_import",
      entity_type: "product",
      entity_id: storeId,
      description: `Imported ${results.imported} products to ${platform}`,
      details: {
        storeId,
        platform,
        total: products.length,
        imported: results.imported,
        failed: results.failed
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        ...results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[import-to-store] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function importToStore(
  supabase: any,
  options: {
    userId: string;
    integration: any;
    platform: string;
    product: any;
  }
): Promise<{ success: boolean; error?: string; externalId?: string }> {
  const { userId, integration, platform, product } = options;
  
  // First, save product to imported_products with store reference
  const productData = {
    user_id: userId,
    title: product.title,
    description: product.description,
    price: product.price,
    original_price: product.originalPrice,
    currency: product.currency || "EUR",
    source_url: product.url,
    source_platform: product.platform,
    image_urls: product.images || [],
    video_urls: product.videos || [],
    variants: product.variants || [],
    metadata: {
      sku: product.sku,
      brand: product.brand,
      seller: product.seller,
      rating: product.rating,
      reviews: product.reviews,
      targetStore: integration.id,
      targetPlatform: platform
    },
    status: "pending_export",
    import_source: "extension_multi_store"
  };

  const { data: savedProduct, error: saveError } = await supabase
    .from("imported_products")
    .insert(productData)
    .select()
    .single();

  if (saveError) {
    console.error("[import-to-store] Save error:", saveError);
    return { success: false, error: saveError.message };
  }

  // Queue for actual platform export
  await supabase.from("export_queue").insert({
    user_id: userId,
    product_id: savedProduct.id,
    integration_id: integration.id,
    platform,
    status: "queued",
    created_at: new Date().toISOString()
  });

  // For immediate API calls (Shopify, WooCommerce), try to push now
  if (["shopify", "woocommerce"].includes(platform)) {
    try {
      const pushResult = await pushToExternalPlatform(supabase, {
        integration,
        platform,
        product: savedProduct
      });
      
      if (pushResult.success) {
        // Update status
        await supabase
          .from("imported_products")
          .update({ 
            status: "exported",
            external_id: pushResult.externalId,
            metadata: {
              ...savedProduct.metadata,
              exportedAt: new Date().toISOString(),
              externalId: pushResult.externalId
            }
          })
          .eq("id", savedProduct.id);
          
        return { success: true, externalId: pushResult.externalId };
      }
    } catch (error) {
      console.error("[import-to-store] Push error:", error);
      // Continue - product is saved, will be exported later
    }
  }

  return { success: true };
}

async function pushToExternalPlatform(
  supabase: any,
  options: {
    integration: any;
    platform: string;
    product: any;
  }
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  const { integration, platform, product } = options;
  const config = integration.config || {};
  const credentials = config.credentials || {};

  if (platform === "shopify") {
    const shopDomain = integration.store_url?.replace(/https?:\/\//, "").replace(/\/$/, "");
    const accessToken = credentials.access_token;
    
    if (!shopDomain || !accessToken) {
      return { success: false, error: "Missing Shopify credentials" };
    }

    const shopifyProduct = {
      product: {
        title: product.title,
        body_html: product.description || "",
        vendor: product.metadata?.brand || "Imported",
        product_type: product.metadata?.category || "",
        tags: product.metadata?.tags?.join(", ") || "",
        images: (product.image_urls || []).map((src: string) => ({ src })),
        variants: [{
          price: String(product.price || 0),
          compare_at_price: product.original_price ? String(product.original_price) : null,
          sku: product.metadata?.sku || "",
          inventory_management: "shopify"
        }]
      }
    };

    // Add variants if available
    if (product.variants && product.variants.length > 0) {
      const options: any[] = [];
      const variantsList: any[] = [];
      
      // Group variants by type
      const variantGroups: Record<string, Set<string>> = {};
      product.variants.forEach((v: any) => {
        const type = v.type || "Option";
        if (!variantGroups[type]) variantGroups[type] = new Set();
        variantGroups[type].add(v.value || v.title);
      });
      
      Object.entries(variantGroups).forEach(([name, values], idx) => {
        if (idx < 3) { // Shopify max 3 options
          options.push({ name, values: Array.from(values) });
        }
      });
      
      if (options.length > 0) {
        shopifyProduct.product.options = options;
      }
    }

    try {
      const response = await fetch(
        `https://${shopDomain}/admin/api/2024-01/products.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken
          },
          body: JSON.stringify(shopifyProduct)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Shopify API error: ${errorText}` };
      }

      const result = await response.json();
      return { success: true, externalId: String(result.product?.id) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  if (platform === "woocommerce") {
    const storeUrl = integration.store_url;
    const consumerKey = credentials.consumer_key;
    const consumerSecret = credentials.consumer_secret;
    
    if (!storeUrl || !consumerKey || !consumerSecret) {
      return { success: false, error: "Missing WooCommerce credentials" };
    }

    const wooProduct = {
      name: product.title,
      description: product.description || "",
      regular_price: String(product.price || 0),
      sale_price: product.original_price ? String(product.price) : undefined,
      sku: product.metadata?.sku || "",
      images: (product.image_urls || []).map((src: string) => ({ src }))
    };

    try {
      const auth = btoa(`${consumerKey}:${consumerSecret}`);
      const response = await fetch(
        `${storeUrl}/wp-json/wc/v3/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`
          },
          body: JSON.stringify(wooProduct)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `WooCommerce API error: ${errorText}` };
      }

      const result = await response.json();
      return { success: true, externalId: String(result.id) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // For other platforms, just mark as queued for later processing
  return { success: true };
}
