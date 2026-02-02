/**
 * Extension Realtime Import - 1-Click Import from Chrome Extension
 * 
 * Features:
 * - Direct product import from extension
 * - Real-time sync with SaaS
 * - Bulk import support
 * - Price rule application
 * - AI enrichment trigger
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token, x-extension-version',
};

interface ExtensionProduct {
  source_url: string;
  source_platform: 'aliexpress' | 'amazon' | 'ebay' | 'temu' | 'shein' | 'shopify' | 'etsy' | 'walmart';
  source_product_id?: string;
  
  // Product data
  title: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  currency?: string;
  
  // Media
  images: string[];
  videos?: string[];
  
  // Variants
  variants?: Array<{
    title: string;
    sku?: string;
    price: number;
    option1?: string;
    option2?: string;
    option3?: string;
    inventory_quantity?: number;
  }>;
  
  // Supplier info
  supplier_name?: string;
  supplier_rating?: number;
  supplier_orders?: number;
  shipping_time?: string;
  
  // Metadata
  category?: string;
  tags?: string[];
  rating?: number;
  review_count?: number;
  
  // Quality score from extension
  quality_score?: number;
}

interface ImportOptions {
  auto_publish?: boolean;
  apply_pricing_rules?: boolean;
  pricing_multiplier?: number;
  fixed_margin?: number;
  round_prices?: boolean;
  import_as_draft?: boolean;
  trigger_ai_enrichment?: boolean;
  category_mapping?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Auth: Support both JWT and Extension token
    const authHeader = req.headers.get('Authorization');
    const extensionToken = req.headers.get('x-extension-token');
    const extensionVersion = req.headers.get('x-extension-version');

    let userId: string;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) throw new Error('Invalid authorization');
      userId = user.id;
    } else if (extensionToken) {
      // Validate extension token
      const { data: tokenData } = await supabase
        .from('extension_tokens')
        .select('user_id, expires_at')
        .eq('token', extensionToken)
        .eq('is_active', true)
        .single();

      if (!tokenData || new Date(tokenData.expires_at) < new Date()) {
        throw new Error('Invalid or expired extension token');
      }
      userId = tokenData.user_id;
    } else {
      throw new Error('Authorization required');
    }

    const { action, ...params } = await req.json();
    console.log(`🔌 Extension Import - Action: ${action}, Version: ${extensionVersion}`);

    // ======================================
    // ACTION: Single product import (1-click)
    // ======================================
    if (action === 'import_single') {
      const { product, options } = params as { product: ExtensionProduct; options?: ImportOptions };

      if (!product?.title || !product?.source_url) {
        throw new Error('Product title and source_url required');
      }

      const processedProduct = await processProduct(product, options || {}, userId);

      // Insert product
      const { data: savedProduct, error: saveError } = await supabase
        .from('products')
        .insert(processedProduct)
        .select()
        .single();

      if (saveError) throw saveError;

      // Also save to imported_products for history
      await supabase.from('imported_products').insert({
        user_id: userId,
        source_platform: product.source_platform,
        source_url: product.source_url,
        source_product_id: product.source_product_id,
        name: product.title,
        description: product.description,
        price: processedProduct.price,
        compare_at_price: processedProduct.compare_at_price,
        image_urls: product.images,
        sku: processedProduct.sku,
        supplier_name: product.supplier_name,
        rating: product.rating,
        review_count: product.review_count,
        quality_score: product.quality_score,
        status: 'imported',
        imported_at: new Date().toISOString(),
      });

      // Trigger AI enrichment if requested
      if (options?.trigger_ai_enrichment) {
        await supabase.functions.invoke('catalog-ai-hub', {
          body: {
            action: 'enrich_product',
            productId: savedProduct.id,
          },
        }).catch(err => console.error('AI enrichment error:', err));
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'extension_product_import',
        entity_type: 'product',
        entity_id: savedProduct.id,
        description: `Imported from ${product.source_platform}: ${product.title}`,
        details: {
          source: product.source_platform,
          url: product.source_url,
          quality_score: product.quality_score,
          extension_version: extensionVersion,
        },
      });

      // Send real-time update to SaaS
      await supabase.channel(`user-${userId}`).send({
        type: 'broadcast',
        event: 'product_imported',
        payload: {
          product_id: savedProduct.id,
          title: product.title,
          source: product.source_platform,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          product_id: savedProduct.id,
          message: 'Product imported successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ======================================
    // ACTION: Bulk import
    // ======================================
    if (action === 'import_bulk') {
      const { products, options } = params as { products: ExtensionProduct[]; options?: ImportOptions };

      if (!products?.length) {
        throw new Error('Products array required');
      }

      const maxBatch = 50;
      const toProcess = products.slice(0, maxBatch);

      const results = {
        imported: 0,
        failed: 0,
        errors: [] as string[],
        product_ids: [] as string[],
      };

      for (const product of toProcess) {
        try {
          const processedProduct = await processProduct(product, options || {}, userId);

          const { data: saved, error } = await supabase
            .from('products')
            .insert(processedProduct)
            .select('id')
            .single();

          if (error) throw error;

          results.imported++;
          results.product_ids.push(saved.id);

          // Save to history
          await supabase.from('imported_products').insert({
            user_id: userId,
            source_platform: product.source_platform,
            source_url: product.source_url,
            name: product.title,
            price: processedProduct.price,
            image_urls: product.images,
            status: 'imported',
          });

        } catch (error) {
          results.failed++;
          results.errors.push(`${product.title}: ${(error as Error).message}`);
        }
      }

      // Log bulk import
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'extension_bulk_import',
        entity_type: 'products',
        description: `Bulk imported ${results.imported} products from extension`,
        details: {
          total: toProcess.length,
          imported: results.imported,
          failed: results.failed,
          extension_version: extensionVersion,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          ...results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ======================================
    // ACTION: Get user settings for extension
    // ======================================
    if (action === 'get_settings') {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('extension_settings, pricing_rules, import_settings')
        .eq('user_id', userId)
        .single();

      const { data: pricingRules } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      return new Response(
        JSON.stringify({
          success: true,
          settings: settings?.extension_settings || {},
          import_settings: settings?.import_settings || {},
          pricing_rules: pricingRules || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ======================================
    // ACTION: Save extension settings
    // ======================================
    if (action === 'save_settings') {
      const { settings } = params;

      await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          extension_settings: settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ======================================
    // ACTION: Heartbeat / Status check
    // ======================================
    if (action === 'heartbeat') {
      // Update extension last seen
      await supabase
        .from('extension_tokens')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', userId);

      // Get pending notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id, title, message, type')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      return new Response(
        JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          notifications: notifications || [],
          pending_syncs: 0, // Could track pending sync operations
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Extension Import Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Process product with pricing rules
async function processProduct(
  product: ExtensionProduct,
  options: ImportOptions,
  userId: string
): Promise<any> {
  let sellPrice = product.price;
  const costPrice = product.price;

  // Apply pricing rules
  if (options.apply_pricing_rules) {
    if (options.pricing_multiplier) {
      sellPrice = costPrice * options.pricing_multiplier;
    } else if (options.fixed_margin) {
      sellPrice = costPrice + options.fixed_margin;
    } else {
      // Default 2x markup for products under €10, 1.5x for others
      sellPrice = costPrice < 10 ? costPrice * 2.5 : costPrice * 1.8;
    }

    // Round prices (e.g., 19.99)
    if (options.round_prices) {
      sellPrice = Math.ceil(sellPrice) - 0.01;
    }
  }

  // Generate SKU
  const skuPrefix = product.source_platform.substring(0, 3).toUpperCase();
  const skuId = product.source_product_id || Date.now().toString(36);
  const sku = `${skuPrefix}-${skuId}`.toUpperCase();

  // Map category if provided
  let category = product.category || 'Import';
  if (options.category_mapping && product.category) {
    category = options.category_mapping[product.category] || product.category;
  }

  // Calculate profit margin
  const profitMargin = sellPrice > costPrice
    ? ((sellPrice - costPrice) / sellPrice * 100).toFixed(2)
    : '0';

  return {
    user_id: userId,
    name: product.title.substring(0, 500),
    description: product.description || '',
    price: sellPrice,
    cost_price: costPrice,
    compare_at_price: product.compare_at_price || null,
    profit_margin: parseFloat(profitMargin),
    sku,
    category,
    stock_quantity: 100, // Default stock
    image_url: product.images?.[0] || '',
    supplier_url: product.source_url,
    supplier_name: product.supplier_name || product.source_platform,
    tags: product.tags || [],
    status: options.import_as_draft ? 'draft' : (options.auto_publish ? 'active' : 'draft'),
    seo_title: product.title.substring(0, 60),
    seo_description: (product.description || '').substring(0, 160),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
