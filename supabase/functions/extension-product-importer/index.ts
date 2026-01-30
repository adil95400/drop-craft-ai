import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
};

interface ProductImportRequest {
  action?: 'import_validated' | 'bulk_import';
  source?: 'csv' | 'json' | 'api' | 'extension';
  data?: any[];
  apiUrl?: string;
  apiKey?: string;
  mapping?: Record<string, string>;
  // Phase 1: Atomic import with validation
  product?: {
    title?: string;
    name?: string;
    description?: string;
    price?: number;
    cost_price?: number;
    images?: string[];
    image_url?: string;
    sku?: string;
    category?: string;
    brand?: string;
    stock_quantity?: number;
    variants?: any[];
    videos?: any[];
    url?: string;
    platform?: string;
    status?: 'draft' | 'active' | 'archived';
    import_notes?: string;
    needs_review?: boolean;
  };
  validation?: {
    score?: number;
    missingFields?: string[];
    decision?: {
      action: 'import' | 'draft' | 'block';
      reason: string;
      details: string[];
    };
    backlogReasons?: string[];
  };
  options?: {
    enrichWithAI?: boolean;
    targetStores?: string[];
    autoOptimize?: boolean;
    isDraft?: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    const requestBody: ProductImportRequest = await req.json();
    const { action, source, data, apiUrl, apiKey, mapping, product, validation, options } = requestBody;

    console.log('[ExtensionImporter] Request:', { action, source, hasProduct: !!product, userId: user.id });

    // PHASE 1: Handle validated import from extension
    if (action === 'import_validated' && product) {
      return await handleValidatedImport(supabaseClient, user.id, product, validation, options);
    }

    // Legacy: Bulk import from various sources
    let products: any[] = [];

    if (source === 'csv' || source === 'json') {
      products = data || [];
    } else if (source === 'api' && apiUrl) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(apiUrl, { headers });
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.statusText}`);
      }
      products = await response.json();
    }

    // Mapping des champs si nécessaire
    if (mapping) {
      products = products.map(p => {
        const mapped: any = {};
        Object.entries(mapping).forEach(([target, src]) => {
          mapped[target] = p[src];
        });
        return mapped;
      });
    }

    // Normalisation et insertion avec validation Phase 1
    const normalizedProducts = products.map(p => {
      const images = p.images || (p.image_url ? [p.image_url] : []);
      const hasValidImages = Array.isArray(images) && images.length > 0;
      
      return {
        name: p.name || p.title || '',
        description: p.description || '',
        price: parseFloat(p.price || 0),
        cost_price: parseFloat(p.cost_price || p.costPrice || 0),
        sku: p.sku || '',
        category: p.category || 'Non catégorisé',
        stock_quantity: parseInt(p.stock_quantity || p.stock || 0),
        image_url: images[0] || '',
        // PHASE 1: Status based on data completeness
        status: (!p.name || !p.price || !hasValidImages) ? 'draft' : 'active',
        user_id: user.id,
        // Track import quality
        import_notes: !hasValidImages ? 'Images manquantes - À compléter' : null,
        needs_review: !hasValidImages || !p.description,
      };
    });

    const { data: insertedProducts, error } = await supabaseClient
      .from('products')
      .insert(normalizedProducts)
      .select();

    if (error) throw error;

    // Count drafts vs active
    const draftCount = insertedProducts?.filter(p => p.status === 'draft').length || 0;
    const activeCount = insertedProducts?.filter(p => p.status === 'active').length || 0;

    // Log de l'activité
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'extension_product_import',
        description: `Import de ${insertedProducts?.length || 0} produits via extension (${activeCount} actifs, ${draftCount} brouillons)`,
        metadata: {
          source,
          count: insertedProducts?.length || 0,
          activeCount,
          draftCount,
          timestamp: new Date().toISOString(),
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        imported: insertedProducts?.length || 0,
        activeCount,
        draftCount,
        products: insertedProducts,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur import produits:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

/**
 * PHASE 1: Handle validated import from Chrome extension
 * Enforces atomic import rules - products with missing critical data are drafted
 */
async function handleValidatedImport(
  supabase: any,
  userId: string,
  product: ProductImportRequest['product'],
  validation?: ProductImportRequest['validation'],
  options?: ProductImportRequest['options']
) {
  console.log('[ExtensionImporter] Validated import:', {
    title: product?.title || product?.name,
    score: validation?.score,
    decision: validation?.decision?.action,
    isDraft: options?.isDraft
  });

  // Normalize images - ensure we have an array
  const images = product?.images || (product?.image_url ? [product.image_url] : []);
  const primaryImage = images[0] || '';

  // Determine final status based on validation and options
  let finalStatus = 'active';
  let importNotes = '';

  if (options?.isDraft || validation?.decision?.action === 'draft') {
    finalStatus = 'draft';
    importNotes = validation?.decision?.reason || 'Données incomplètes';
  } else if (!product?.title && !product?.name) {
    finalStatus = 'draft';
    importNotes = 'Titre manquant';
  } else if (!primaryImage) {
    finalStatus = 'draft';
    importNotes = 'Image manquante';
  }

  // Prepare product for database
  const productData = {
    user_id: userId,
    name: (product?.title || product?.name || 'Produit sans nom').substring(0, 500),
    description: (product?.description || '').substring(0, 10000),
    price: Math.min(parseFloat(String(product?.price || 0)), 999999.99),
    cost_price: Math.min(parseFloat(String(product?.cost_price || 0)), 999999.99),
    sku: (product?.sku || `EXT-${Date.now()}`).substring(0, 100),
    category: (product?.category || 'Importé').substring(0, 100),
    brand: product?.brand || null,
    stock_quantity: parseInt(String(product?.stock_quantity || 0)),
    image_url: primaryImage,
    status: finalStatus,
    // Phase 1: Track import metadata
    import_notes: importNotes || null,
    needs_review: finalStatus === 'draft' || (validation?.score || 100) < 70,
  };

  // Insert product
  const { data: insertedProduct, error: insertError } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (insertError) {
    console.error('[ExtensionImporter] Insert error:', insertError);
    throw new Error(`Erreur d'insertion: ${insertError.message}`);
  }

  // If we have additional images, store them (if products has images column)
  if (images.length > 1 && insertedProduct?.id) {
    // Try to update with full images array if column exists
    try {
      await supabase
        .from('products')
        .update({ images: images })
        .eq('id', insertedProduct.id);
    } catch (e) {
      // Column might not exist, ignore
      console.warn('[ExtensionImporter] Could not store additional images:', e);
    }
  }

  // Log activity with detailed metadata
  await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      action: 'extension_single_import',
      description: `Import produit: "${productData.name.substring(0, 50)}" (${finalStatus})`,
      entity_type: 'product',
      entity_id: insertedProduct?.id,
      metadata: {
        status: finalStatus,
        score: validation?.score,
        decision: validation?.decision?.action,
        missingFields: validation?.missingFields,
        platform: product?.platform,
        sourceUrl: product?.url,
        timestamp: new Date().toISOString(),
      },
    });

  return new Response(
    JSON.stringify({
      success: true,
      product_id: insertedProduct?.id,
      status: finalStatus,
      message: finalStatus === 'draft' 
        ? `Produit créé en brouillon: ${importNotes}`
        : 'Produit importé avec succès',
      product: insertedProduct,
      validation: {
        score: validation?.score,
        decision: validation?.decision?.action,
      }
    }),
    {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200,
    }
  );
}
