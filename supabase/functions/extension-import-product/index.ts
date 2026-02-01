/**
 * Extension Import Product - Secured Implementation
 * P0.1: Token authentication with proper validation
 * P0.4: Secure CORS with allowlist
 * P0.5: Input validation and sanitization
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getSecureCorsHeaders, isAllowedOrigin } from '../_shared/secure-cors.ts'
import { z } from 'https://esm.sh/zod@3.22.4'

// Comprehensive input validation schema
const VariantSchema = z.object({
  id: z.string().max(100).optional(),
  sku: z.string().max(100).optional(),
  title: z.string().max(200).optional(),
  price: z.number().min(0).max(1000000).optional(),
  compareAtPrice: z.number().min(0).max(1000000).optional(),
  available: z.boolean().optional(),
  option1: z.string().max(100).optional(),
  option2: z.string().max(100).optional(),
  option3: z.string().max(100).optional(),
  image: z.string().url().max(2000).optional(),
  inventory_quantity: z.number().int().min(0).max(1000000).optional()
});

const ProductSchema = z.object({
  external_id: z.string().max(200).optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  descriptionHtml: z.string().max(20000).optional(),
  price: z.number().min(0).max(1000000),
  salePrice: z.number().min(0).max(1000000).optional(),
  costPrice: z.number().min(0).max(1000000).optional(),
  compareAtPrice: z.number().min(0).max(1000000).optional(),
  currency: z.string().length(3).optional(),
  sku: z.string().max(100).optional(),
  vendor: z.string().max(200).optional(),
  brand: z.string().max(200).optional(),
  productType: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  images: z.array(z.string().url().max(2000)).max(20).optional(),
  videos: z.array(z.object({
    url: z.string().url().max(2000),
    type: z.string().max(50).optional()
  })).max(5).optional(),
  variants: z.array(VariantSchema).max(100).optional(),
  options: z.array(z.object({
    name: z.string().max(50),
    values: z.array(z.string().max(100)).max(100)
  })).max(3).optional(),
  available: z.boolean().optional(),
  url: z.string().url().max(2000),
  platform: z.string().max(50),
  source: z.string().max(50).optional(),
  metadata: z.record(z.unknown()).optional(),
  stockStatus: z.string().max(50).optional(),
  stockQuantity: z.number().int().min(0).max(1000000).optional(),
  inStock: z.boolean().optional(),
  shippingInfo: z.record(z.unknown()).optional(),
  specifications: z.record(z.unknown()).optional()
});

const InputSchema = z.object({
  product: ProductSchema,
  options: z.object({
    targetStore: z.string().max(100).optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
    applyRules: z.boolean().optional()
  }).optional()
});

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin');
    if (!origin || !isAllowedOrigin(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Validate extension token
    const rawToken = req.headers.get('x-extension-token');
    const token = rawToken?.replace(/[^a-zA-Z0-9\-_]/g, '');

    if (!token || token.length < 10 || token.length > 150) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token d\'extension requis' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token - use RPC for secure validation
    const { data: validationResult, error: tokenError } = await supabase
      .rpc('validate_extension_token', { p_token: token });

    if (tokenError || !validationResult?.success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token invalide ou expiré' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = validationResult.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID not found in token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const parseResult = InputSchema.safeParse(body);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Données produit invalides',
          details: parseResult.error.issues.slice(0, 5).map(i => `${i.path.join('.')}: ${i.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { product, options } = parseResult.data;

    console.log('[extension-import-product] Importing:', {
      title: product.title.substring(0, 50),
      platform: product.platform,
      price: product.price,
      variants: product.variants?.length || 0,
      userId: userId.slice(0, 8)
    });

    // Get user's import rules if applyRules is true
    let importRules = null;
    if (options?.applyRules) {
      const { data: rules } = await supabase
        .from('user_settings')
        .select('import_rules')
        .eq('user_id', userId)
        .single();

      importRules = rules?.import_rules;
    }

    // Apply pricing rules
    let finalPrice = product.salePrice || product.price;
    let costPrice = product.costPrice || product.price;

    if (importRules?.pricing?.enabled) {
      const markup = importRules.pricing.markupValue || 30;
      if (importRules.pricing.markupType === 'percentage') {
        finalPrice = costPrice * (1 + markup / 100);
      } else {
        finalPrice = costPrice + markup;
      }

      if (importRules.pricing.roundToNearest) {
        const nearest = importRules.pricing.roundToNearest;
        finalPrice = Math.ceil(finalPrice) - (1 - nearest);
      }
    }

    // Clean and validate images
    const cleanImages = (product.images || [])
      .filter(img => img && typeof img === 'string' && img.length > 20)
      .map(img => img.replace(/_\d+x\d*\./, '.').replace(/\?.*$/, ''))
      .slice(0, 20);

    // Process variants
    const variants = (product.variants || []).map(v => ({
      id: v.id,
      sku: v.sku || '',
      title: v.title || 'Default',
      price: v.price || finalPrice,
      compare_at_price: v.compareAtPrice,
      available: v.available !== false,
      option1: v.option1,
      option2: v.option2,
      option3: v.option3,
      image: v.image,
      inventory_quantity: v.inventory_quantity
    }));

    // Create product source record for sync tracking
    const { data: sourceRecord, error: sourceError } = await supabase
      .from('product_sources')
      .insert({
        user_id: userId,
        source_platform: product.platform,
        external_product_id: product.external_id || `ext_${Date.now()}`,
        source_url: product.url,
        source_data: {
          vendor: product.vendor,
          brand: product.brand,
          original_price: product.price,
          specifications: product.specifications,
          shipping_info: product.shippingInfo
        },
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced'
      })
      .select()
      .single();

    if (sourceError) {
      console.error('[extension-import-product] Source record error:', sourceError);
    }

    // Insert into imported_products - scoped to user
    const { data: importedProduct, error: productError } = await supabase
      .from('imported_products')
      .insert({
        user_id: userId,
        name: product.title.substring(0, 500),
        description: (product.description || '').substring(0, 10000),
        price: finalPrice,
        cost_price: costPrice,
        currency: product.currency || importRules?.currency || 'EUR',
        sku: product.sku || product.variants?.[0]?.sku || '',
        category: product.category || importRules?.defaultCategory || null,
        image_urls: cleanImages,
        video_urls: (product.videos || []).map(v => v.url).filter(Boolean),
        source_url: product.url,
        source_platform: product.platform,
        status: options?.status || importRules?.defaultStatus || 'draft',
        sync_status: 'synced',
        stock_quantity: product.stockQuantity || 100,
        brand: product.brand || product.vendor || null,
        variants: variants.length > 0 ? variants : null,
        specifications: product.specifications || null,
        shipping_info: product.shippingInfo || null,
        metadata: {
          external_id: product.external_id,
          source_id: sourceRecord?.id,
          original_price: product.price,
          compare_at_price: product.compareAtPrice,
          product_type: product.productType,
          tags: [...(product.tags || []), ...(importRules?.defaultTags || [])],
          options: product.options,
          vendor: product.vendor,
          stock_status: product.stockStatus,
          in_stock: product.inStock,
          imported_at: new Date().toISOString(),
          target_store: options?.targetStore,
          rules_applied: !!importRules
        }
      })
      .select()
      .single();

    if (productError) {
      console.error('[extension-import-product] Product insert error:', productError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erreur base de données: ${productError.message}`,
          code: productError.code
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update product source with product ID
    if (sourceRecord?.id) {
      await supabase
        .from('product_sources')
        .update({ product_id: importedProduct.id })
        .eq('id', sourceRecord.id);
    }

    // Log activity
    await supabase.from('extension_analytics').insert({
      user_id: userId,
      event_type: 'product_import',
      event_data: {
        product_id: importedProduct.id,
        title: product.title.substring(0, 100),
        platform: product.platform,
        price: finalPrice,
        variants_count: variants.length,
        images_count: cleanImages.length,
        rules_applied: !!importRules
      },
      source_url: product.url
    });

    console.log('[extension-import-product] Success:', importedProduct.id);

    return new Response(
      JSON.stringify({
        success: true,
        product: {
          id: importedProduct.id,
          name: importedProduct.name,
          price: importedProduct.price,
          status: importedProduct.status
        },
        source_id: sourceRecord?.id,
        rules_applied: !!importRules
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[extension-import-product] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
