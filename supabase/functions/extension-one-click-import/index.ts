import { createClient } from "npm:@supabase/supabase-js@2";
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts';
import { handleError, ValidationError } from '../_shared/error-handler.ts';

interface OneClickImportRequest {
  urls: string[];
  importType: 'products' | 'reviews';
  autoPublish?: boolean;
  priceMultiplier?: number;
  categoryMapping?: Record<string, string>;
  pricingRules?: {
    type: 'fixed_multiplier' | 'fixed_margin' | 'tiered';
    value: number;
    roundPrice?: boolean;
  };
  stockSettings?: {
    importActualStock: boolean;
    fixedStock?: number;
  };
}

type Platform = 'aliexpress' | 'amazon' | 'ebay' | 'shopify' | 'generic';

// Détection automatique de la plateforme
function detectPlatform(url: string): Platform {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('aliexpress.com') || urlLower.includes('alibaba.com')) {
    return 'aliexpress';
  }
  if (urlLower.includes('amazon.')) {
    return 'amazon';
  }
  if (urlLower.includes('ebay.')) {
    return 'ebay';
  }
  if (urlLower.includes('myshopify.com') || urlLower.includes('/products/')) {
    return 'shopify';
  }
  
  return 'generic';
}

// Extracteur AliExpress (API Affiliate)
async function extractFromAliExpress(url: string): Promise<any> {
  const apiKey = Deno.env.get('ALIEXPRESS_API_KEY');
  
  if (!apiKey) {
    throw new Error('AliExpress API key not configured. Please add ALIEXPRESS_API_KEY in your environment secrets.');
  }

  try {
    // Extraire l'ID du produit de l'URL
    const productIdMatch = url.match(/\/(\d+)\.html/);
    if (!productIdMatch) {
      throw new Error('Invalid AliExpress URL format');
    }
    
    const productId = productIdMatch[1];
    
    // Appel à l'API AliExpress Affiliate
    const apiUrl = `https://api-sg.aliexpress.com/sync`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_key: apiKey,
        method: 'aliexpress.affiliate.productdetail.get',
        product_ids: productId,
      }),
    });

    if (!response.ok) {
      throw new Error(`AliExpress API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      name: data.title || 'Produit AliExpress',
      description: data.description || '',
      price: parseFloat(data.target_sale_price || data.sale_price || '0'),
      cost_price: parseFloat(data.target_original_price || data.original_price || '0'),
      sku: `ALI-${productId}`,
      category: data.first_level_category_name || 'Import AliExpress',
      image_url: data.product_main_image_url || '',
      image_urls: data.product_small_image_urls || [],
      supplier_url: url,
      supplier_name: data.shop_title || 'AliExpress',
      stock_quantity: parseInt(data.lastest_volume || '100'),
      rating: parseFloat(data.evaluate_rate || '0'),
      reviews_count: parseInt(data.volume || '0'),
      attributes: {
        shipping_time: data.ship_to_days || 'N/A',
        warranty: data.promotion_link || '',
      },
    };
  } catch (error) {
    console.error('AliExpress extraction error:', error);
    throw new Error(`AliExpress extraction failed: ${error.message}`);
  }
}

// Extracteur Amazon (Product Advertising API)
async function extractFromAmazon(url: string): Promise<any> {
  const accessKey = Deno.env.get('AMAZON_ACCESS_KEY');
  const secretKey = Deno.env.get('AMAZON_SECRET_KEY');
  const associateTag = Deno.env.get('AMAZON_ASSOCIATE_TAG');
  
  if (!accessKey || !secretKey || !associateTag) {
    throw new Error('Amazon API credentials not configured. Please add AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY and AMAZON_ASSOCIATE_TAG.');
  }

  try {
    // Extraire l'ASIN de l'URL
    const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
    if (!asinMatch) {
      throw new Error('Invalid Amazon URL format');
    }
    
    const asin = asinMatch[1] || asinMatch[2];
    
    // Amazon PA-API v5 call
    console.log('Amazon ASIN detected:', asin);
    
    const paApiHost = 'webservices.amazon.com';
    const paApiPath = '/paapi5/getitems';
    const payload = JSON.stringify({
      ItemIds: [asin],
      Resources: ['Images.Primary.Large', 'ItemInfo.Title', 'ItemInfo.Features', 'Offers.Listings.Price', 'ItemInfo.ByLineInfo'],
      PartnerTag: associateTag,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.com',
    });

    // Note: Full HMAC-SHA256 signing required for production PA-API calls
    throw new Error(`Amazon PA-API signing not yet implemented for ASIN ${asin}. Configure a scraping fallback or implement AWS Signature V4.`);
  } catch (error) {
    console.error('Amazon extraction error:', error);
    throw new Error(`Amazon extraction failed: ${error.message}`);
  }
}

// Extracteur eBay
async function extractFromEBay(url: string): Promise<any> {
  const apiKey = Deno.env.get('EBAY_API_KEY');
  
  if (!apiKey) {
    throw new Error('eBay API key not configured. Please add EBAY_API_KEY in your environment secrets.');
  }

  try {
    // Extraire l'ID de l'item
    const itemIdMatch = url.match(/\/itm\/(\d+)/);
    if (!itemIdMatch) {
      throw new Error('Invalid eBay URL format');
    }
    
    const itemId = itemIdMatch[1];
    
    // Appel à l'API eBay Shopping
    const apiUrl = `https://open.api.ebay.com/shopping?callname=GetSingleItem&responseencoding=JSON&appid=${apiKey}&siteid=0&version=967&ItemID=${itemId}&IncludeSelector=Details,Description,ItemSpecifics`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`eBay API error: ${response.status}`);
    }

    const data = await response.json();
    const item = data.Item;
    
    return {
      name: item.Title || 'Produit eBay',
      description: item.Description || '',
      price: parseFloat(item.CurrentPrice?.Value || '0'),
      cost_price: parseFloat(item.CurrentPrice?.Value || '0') * 0.7, // Estimation
      sku: `EBAY-${itemId}`,
      category: item.PrimaryCategory?.CategoryName || 'Import eBay',
      image_url: item.PictureURL?.[0] || '',
      image_urls: item.PictureURL || [],
      supplier_url: url,
      supplier_name: item.Storefront?.StoreName || 'eBay',
      stock_quantity: parseInt(item.Quantity || '1'),
      rating: 0,
      reviews_count: 0,
      attributes: item.ItemSpecifics || {},
    };
  } catch (error) {
    console.error('eBay extraction error:', error);
    throw new Error(`eBay extraction failed: ${error.message}`);
  }
}

// Extracteur Shopify
async function extractFromShopify(url: string): Promise<any> {
  try {
    // Construire l'URL JSON du produit
    let jsonUrl = url;
    if (url.includes('/products/')) {
      jsonUrl = url.split('?')[0] + '.json';
    }
    
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error(`Shopify fetch error: ${response.status}`);
    }

    const data = await response.json();
    const product = data.product;
    const variant = product.variants?.[0];
    
    return {
      name: product.title || 'Produit Shopify',
      description: product.body_html || '',
      price: parseFloat(variant?.price || '0'),
      cost_price: parseFloat(variant?.compare_at_price || variant?.price || '0'),
      sku: variant?.sku || `SHOP-${product.id}`,
      category: product.product_type || 'Import Shopify',
      image_url: product.images?.[0]?.src || '',
      image_urls: product.images?.map((img: any) => img.src) || [],
      supplier_url: url,
      supplier_name: new URL(url).hostname.replace('.myshopify.com', ''),
      stock_quantity: variant?.inventory_quantity || 0,
      tags: product.tags?.split(',').map((t: string) => t.trim()) || [],
      attributes: {
        vendor: product.vendor,
        variants: product.variants?.length || 1,
      },
    };
  } catch (error) {
    console.error('Shopify extraction error:', error);
    throw new Error(`Shopify extraction failed: ${error.message}`);
  }
}

// NOTE: simulateProductData has been removed. All extractors now throw errors
// when API keys are missing, forcing proper configuration before use.

// Extraction des reviews - returns empty array when no API is available
async function extractReviewsFromUrl(url: string, platform: Platform): Promise<any[]> {
  // Reviews require platform-specific APIs. Return empty when not configured.
  console.log(`[one-click-import] Review extraction for ${platform} requires dedicated API integration.`);
  return [];
}

// Normalisation des données produit
function normalizeProductData(rawData: any, options: OneClickImportRequest): any {
  const { priceMultiplier = 1.5, pricingRules, categoryMapping, stockSettings } = options;
  
  // Calcul du prix de vente selon les règles
  let sellingPrice = rawData.price;
  
  if (pricingRules) {
    switch (pricingRules.type) {
      case 'fixed_multiplier':
        sellingPrice = rawData.cost_price * pricingRules.value;
        break;
      case 'fixed_margin':
        sellingPrice = rawData.cost_price + pricingRules.value;
        break;
      case 'tiered':
        // Pricing par paliers selon le prix d'achat
        if (rawData.cost_price < 10) {
          sellingPrice = rawData.cost_price * 2.5;
        } else if (rawData.cost_price < 50) {
          sellingPrice = rawData.cost_price * 2.0;
        } else {
          sellingPrice = rawData.cost_price * 1.5;
        }
        break;
    }
    
    // Arrondir le prix si demandé (ex: 19.99€)
    if (pricingRules.roundPrice) {
      sellingPrice = Math.ceil(sellingPrice) - 0.01;
    }
  } else {
    sellingPrice = Math.ceil(rawData.cost_price * priceMultiplier);
  }
  
  // Mapping de catégorie
  let category = rawData.category;
  if (categoryMapping && categoryMapping[rawData.category]) {
    category = categoryMapping[rawData.category];
  }
  
  // Gestion du stock
  let stockQuantity = rawData.stock_quantity;
  if (stockSettings) {
    if (!stockSettings.importActualStock && stockSettings.fixedStock) {
      stockQuantity = stockSettings.fixedStock;
    }
  }
  
  // Calcul de la marge
  const profitMargin = ((sellingPrice - rawData.cost_price) / sellingPrice * 100).toFixed(2);
  
  return {
    name: rawData.name,
    description: rawData.description,
    price: sellingPrice,
    cost_price: rawData.cost_price,
    profit_margin: parseFloat(profitMargin),
    sku: rawData.sku,
    category: category,
    stock_quantity: stockQuantity,
    image_url: rawData.image_url,
    supplier_url: rawData.supplier_url,
    supplier_name: rawData.supplier_name,
    tags: rawData.tags || [],
    status: options.autoPublish ? 'active' : 'draft',
    seo_title: rawData.name.substring(0, 60),
    seo_description: rawData.description?.substring(0, 160),
  };
}

Deno.serve(async (req) => {
  const preflightResponse = handleCorsPreflightSecure(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getSecureCorsHeaders(req);

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
      throw new ValidationError('Non authentifié');
    }

    const rawBody = await req.json();
    
    // Input validation
    if (!rawBody || typeof rawBody !== 'object') {
      throw new ValidationError('Request body must be a JSON object');
    }

    const urls = rawBody.urls;
    const importType = rawBody.importType;
    const autoPublish = rawBody.autoPublish ?? true;
    const priceMultiplier = rawBody.priceMultiplier ?? 1.5;

    if (!Array.isArray(urls) || urls.length === 0) {
      throw new ValidationError('urls must be a non-empty array');
    }
    if (urls.length > 50) {
      throw new ValidationError('Maximum 50 URLs per import');
    }
    // Validate each URL
    for (const url of urls) {
      if (typeof url !== 'string' || url.length > 2000) {
        throw new ValidationError('Each URL must be a string of max 2000 characters');
      }
      try { new URL(url); } catch { throw new ValidationError(`Invalid URL: ${url.substring(0, 50)}`); }
    }

    if (!['products', 'reviews'].includes(importType)) {
      throw new ValidationError('importType must be "products" or "reviews"');
    }

    if (typeof priceMultiplier !== 'number' || priceMultiplier < 0.1 || priceMultiplier > 100) {
      throw new ValidationError('priceMultiplier must be between 0.1 and 100');
    }

    const requestData = { ...rawBody, urls, importType, autoPublish, priceMultiplier } as OneClickImportRequest;

    if (!urls || urls.length === 0) {
      throw new Error('Aucune URL fournie');
    }

    console.log(`🚀 Démarrage import ${importType} pour ${urls.length} URL(s)`);
    
    let importedCount = 0;
    let failedCount = 0;
    const results = [];

    if (importType === 'products') {
      // Import des produits
      for (const url of urls) {
        let importStatus = 'success';
        let errorMessage = null;
        
        try {
          console.log(`📦 Traitement: ${url}`);
          
          // Détection de la plateforme
          const platform = detectPlatform(url);
          console.log(`🔍 Plateforme détectée: ${platform}`);
          
          // Extraction des données selon la plateforme
          let rawData;
          switch (platform) {
            case 'aliexpress':
              rawData = await extractFromAliExpress(url);
              break;
            case 'amazon':
              rawData = await extractFromAmazon(url);
              break;
            case 'ebay':
              rawData = await extractFromEBay(url);
              break;
            case 'shopify':
              rawData = await extractFromShopify(url);
              break;
            default:
              rawData = simulateProductData(url, platform);
          }
          
          // Normalisation des données
          const productData = normalizeProductData(rawData, requestData);
          productData.user_id = user.id;
          
          console.log(`💾 Insertion du produit: ${productData.name}`);

          // Insertion dans la base de données
          const { data: insertedProduct, error } = await supabaseClient
            .from('products')
            .insert(productData)
            .select()
            .single();

          if (error) throw error;

          results.push({ 
            url, 
            success: true, 
            product: insertedProduct,
            platform,
          });
          importedCount++;
          
          console.log(`✅ Produit importé avec succès: ${productData.sku}`);
          
          // Sauvegarder dans l'historique
          await supabaseClient.from('import_history').insert({
            user_id: user.id,
            source_url: url,
            platform,
            status: 'success',
            products_imported: 1,
            products_failed: 0,
            settings: requestData,
          });
        } catch (error) {
          console.error(`❌ Erreur import produit ${url}:`, error);
          failedCount++;
          const platform = detectPlatform(url);
          
          results.push({ 
            url, 
            success: false, 
            error: error.message,
            platform,
          });
          
          // Sauvegarder l'échec dans l'historique
          await supabaseClient.from('import_history').insert({
            user_id: user.id,
            source_url: url,
            platform,
            status: 'failed',
            products_imported: 0,
            products_failed: 1,
            error_message: error.message,
            settings: requestData,
          });
        }
      }
    } else if (importType === 'reviews') {
      // Import des avis
      for (const url of urls) {
        try {
          console.log(`⭐ Extraction des avis: ${url}`);
          
          const platform = detectPlatform(url);
          const reviewsData = await extractReviewsFromUrl(url, platform);
          
          reviewsData.forEach(review => {
            review.user_id = user.id;
          });

          const { data: insertedReviews, error } = await supabaseClient
            .from('imported_reviews')
            .insert(reviewsData)
            .select();

          if (error) throw error;

          results.push({ 
            url, 
            success: true, 
            reviews: insertedReviews,
            platform,
          });
          importedCount += insertedReviews?.length || 0;
          
          console.log(`✅ ${insertedReviews?.length} avis importés`);
        } catch (error) {
          console.error(`❌ Erreur import avis ${url}:`, error);
          results.push({ 
            url, 
            success: false, 
            error: error.message,
            platform: detectPlatform(url),
          });
        }
      }
    }

    // Log de l'activité avec détails
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'one_click_import',
        description: `Import ${importType} en un clic: ${importedCount} éléments importés`,
        metadata: {
          import_type: importType,
          urls_count: urls.length,
          imported_count: importedCount,
          failed_count: urls.length - importedCount,
          platforms: [...new Set(results.map(r => r.platform))],
          timestamp: new Date().toISOString(),
        },
      });

    console.log(`🎉 Import terminé: ${importedCount}/${urls.length} réussis`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: importedCount,
        total_urls: urls.length,
        failed: urls.length - importedCount,
        results,
        message: `${importedCount} ${importType} importé(s) avec succès sur ${urls.length} URL(s)`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return handleError(error, corsHeaders);
  }
});
