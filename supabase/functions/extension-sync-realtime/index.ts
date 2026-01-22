import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ============================================================================
// HELPER FUNCTIONS - Enhanced for robust multi-platform extraction
// ============================================================================

// Parse price from various formats (European, US, Asian, etc.)
const parsePrice = (priceInput: unknown): number => {
  if (typeof priceInput === 'number') return priceInput;
  if (!priceInput || typeof priceInput !== 'string') return 0;
  
  let cleanPrice = priceInput
    .replace(/[€$£¥₹₽CHF₿฿₫₭₦₲₵₡₢₠₩₮₰₪]/gi, '')
    .replace(/\s+/g, '')
    .replace(/EUR|USD|GBP|JPY|CNY|CAD|AUD/gi, '')
    .replace(/à partir de|from|ab|desde/gi, '')
    .trim();
  
  // Handle European format with space as thousand separator (1 234,56)
  if (/^\d{1,3}(\s\d{3})*,\d{2}$/.test(cleanPrice.replace(/\s/g, ' '))) {
    cleanPrice = cleanPrice.replace(/\s/g, '').replace(',', '.');
  }
  // Handle European format (1.234,56 or 1234,56)
  else if (cleanPrice.includes(',') && !cleanPrice.includes('.')) {
    cleanPrice = cleanPrice.replace(',', '.');
  } else if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
    cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.');
  }
  
  // Extract first valid number
  const match = cleanPrice.match(/[\d]+[.,]?[\d]*/);
  if (match) {
    const parsed = parseFloat(match[0].replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

// Clean product title from UI artifacts
const cleanTitle = (title: unknown): string => {
  if (!title || typeof title !== 'string') return 'Produit importé';
  
  let cleaned = title
    .replace(/Raccourci clavier[\s\S]*$/i, '')
    .replace(/shift\s*\+[\s\S]*$/i, '')
    .replace(/alt\s*\+[\s\S]*$/i, '')
    .replace(/ctrl\s*\+[\s\S]*$/i, '')
    .replace(/Ajouter au panier[\s\S]*/i, '')
    .replace(/Add to cart[\s\S]*/i, '')
    .replace(/Livraison gratuite[\s\S]*/i, '')
    .replace(/Free shipping[\s\S]*/i, '')
    .replace(/En stock[\s\S]*/i, '')
    .replace(/In stock[\s\S]*/i, '')
    .replace(/\b(Promo|Soldes|Nouveau|New|Sale|Hot|Best Seller)\b/gi, '')
    .replace(/\|.*$/, '') // Remove everything after pipe
    .replace(/-\s*\d+%\s*$/i, '') // Remove discount suffix
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleaned.length < 3) return 'Produit importé';
  return cleaned.substring(0, 500);
}

// Validate and clean image URL
const validateImageUrl = (url: unknown): string => {
  if (!url || typeof url !== 'string') return '';
  
  const invalidPatterns = [
    'sprite', 'pixel', 'grey', 'transparent', 'placeholder', 
    'loader', 'loading', 'spacer', '1x1', 'blank', 'empty',
    'data:image', 'svg+xml', 'base64,R0lGO' // Tiny base64 images
  ];
  
  if (invalidPatterns.some(p => url.toLowerCase().includes(p)) || url.length < 20) {
    return '';
  }
  
  // Clean up URL - remove size transforms for higher quality
  let cleanUrl = url
    // AliExpress size transforms
    .replace(/_\d+x\d+\./, '.')
    .replace(/_\d+x\d+_/, '_')
    // Amazon size transforms
    .replace(/\._AC_.*?\./, '.')
    .replace(/\._S[LRXYM]\d+_\./, '.')
    .replace(/\._U[SXY]\d+_\./, '.')
    // Cdiscount/Fnac size
    .replace(/\/[a-z]_\d+_\d+\//, '/')
    // General query param sizes
    .replace(/[?&](w|h|width|height|size|resize)=\d+/gi, '')
    .replace(/[?&]quality=\d+/gi, '');
  
  try {
    new URL(cleanUrl);
    return cleanUrl;
  } catch {
    try {
      new URL(url);
      return url;
    } catch {
      return '';
    }
  }
}

// Extract all images from various product fields
const extractAllImages = (product: any): string[] => {
  const allImages: string[] = [];
  const seenUrls = new Set<string>();
  
  const addImage = (img: unknown) => {
    const validImg = validateImageUrl(img);
    if (validImg && !seenUrls.has(validImg)) {
      seenUrls.add(validImg);
      allImages.push(validImg);
    }
  };
  
  // 1. Primary image fields
  addImage(product.image);
  addImage(product.imageUrl);
  addImage(product.mainImage);
  addImage(product.primaryImage);
  addImage(product.thumbnail);
  addImage(product.featuredImage);
  
  // 2. Array fields
  const arrayFields = [
    'images', 'imageUrls', 'additionalImages', 'gallery', 
    'galleryImages', 'productImages', 'allImages', 'photos',
    'mediaGallery', 'imageGallery'
  ];
  
  for (const field of arrayFields) {
    if (Array.isArray(product[field])) {
      for (const img of product[field]) {
        if (typeof img === 'string') {
          addImage(img);
        } else if (img && typeof img === 'object') {
          addImage(img.url || img.src || img.href || img.image || img.original);
        }
      }
    }
  }
  
  // 3. Variant images
  if (Array.isArray(product.variants)) {
    for (const variant of product.variants) {
      addImage(variant.image);
      addImage(variant.imageUrl);
      if (Array.isArray(variant.images)) {
        for (const img of variant.images) {
          addImage(typeof img === 'string' ? img : img?.url || img?.src);
        }
      }
    }
  }
  
  // 4. SKU images (AliExpress style)
  if (product.skuImages && typeof product.skuImages === 'object') {
    for (const key of Object.keys(product.skuImages)) {
      addImage(product.skuImages[key]);
    }
  }
  
  return allImages;
}

// Extract all videos
const extractAllVideos = (product: any): string[] => {
  const videos: string[] = [];
  const seenUrls = new Set<string>();
  
  const addVideo = (vid: unknown) => {
    if (vid && typeof vid === 'string' && vid.includes('http') && !seenUrls.has(vid)) {
      seenUrls.add(vid);
      videos.push(vid);
    }
  };
  
  addVideo(product.video);
  addVideo(product.videoUrl);
  addVideo(product.mainVideo);
  
  const arrayFields = ['videos', 'videoUrls', 'mediaVideos'];
  for (const field of arrayFields) {
    if (Array.isArray(product[field])) {
      for (const vid of product[field]) {
        if (typeof vid === 'string') {
          addVideo(vid);
        } else if (vid && typeof vid === 'object') {
          addVideo(vid.url || vid.src || vid.href);
        }
      }
    }
  }
  
  return videos;
}

// Process reviews with validation
const processReviews = (reviews: any[]): any[] => {
  if (!Array.isArray(reviews)) return [];
  
  return reviews.slice(0, 100).filter(r => r && (r.text || r.comment || r.content)).map(r => ({
    rating: Math.min(5, Math.max(0, parseInt(r.rating) || 5)),
    text: String(r.text || r.comment || r.content || '').substring(0, 2000),
    author: String(r.author || r.reviewer || r.name || 'Anonymous').substring(0, 100),
    date: r.date || r.reviewDate || null,
    images: Array.isArray(r.images) ? r.images.slice(0, 5) : [],
    verified: Boolean(r.verified || r.isVerified)
  }));
}

// ============================================================================
// MAIN SERVER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const rawHeaderToken = req.headers.get('x-extension-token')
    const requestId = crypto.randomUUID().substring(0, 8)
    
    console.log(`[${requestId}] ========== NEW REQUEST ==========`)
    console.log(`[${requestId}] Method: ${req.method}, Token: ${rawHeaderToken ? 'present' : 'missing'}`)

    let payload: any = null
    try {
      payload = await req.json()
    } catch (e) {
      console.error(`[${requestId}] JSON parse error:`, e)
      payload = null
    }

    const sanitizeToken = (value: unknown): string | null => {
      if (!value || typeof value !== 'string') return null
      const sanitized = value.replace(/[^a-zA-Z0-9-_]/g, '')
      if (sanitized.length < 10 || sanitized.length > 150) return null
      return sanitized
    }

    const token = sanitizeToken(rawHeaderToken || payload?.token)

    if (!token) {
      console.error(`[${requestId}] No valid token provided`)
      return new Response(
        JSON.stringify({ error: 'Extension token required', requestId }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate token
    const { data: authData, error: tokenError } = await supabase
      .from('extension_auth_tokens')
      .select('id, user_id, expires_at, usage_count')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (tokenError) {
      console.error(`[${requestId}] Token lookup error:`, tokenError)
    }

    if (!authData) {
      console.error(`[${requestId}] Invalid or inactive token`)
      return new Response(
        JSON.stringify({ error: 'Invalid token', requestId }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check expiration
    if (authData.expires_at && new Date(authData.expires_at) < new Date()) {
      await supabase
        .from('extension_auth_tokens')
        .update({ is_active: false })
        .eq('id', authData.id)

      return new Response(
        JSON.stringify({ error: 'Token expired', requestId }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update usage
    await supabase
      .from('extension_auth_tokens')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: (authData.usage_count || 0) + 1,
      })
      .eq('id', authData.id)

    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action } = payload
    console.log(`[${requestId}] Action: ${action}, User: ${authData.user_id}`)

    // ========================================================================
    // ACTION: import_products
    // ========================================================================
    if (action === 'import_products') {
      const products = payload.products || []
      const debugMode = payload.debug === true
      
      console.log(`[${requestId}] Importing ${products.length} products (debug: ${debugMode})`)
      
      const importResults: any[] = []
      const errors: any[] = []
      const debugLogs: string[] = []
      
      const log = (msg: string) => {
        console.log(`[${requestId}] ${msg}`)
        if (debugMode) debugLogs.push(`${new Date().toISOString()} - ${msg}`)
      }

      for (let i = 0; i < products.length; i++) {
        const product = products[i]
        const productIndex = i + 1
        
        try {
          log(`--- Product ${productIndex}/${products.length} ---`)
          log(`Raw title: ${String(product.title || product.name || '').substring(0, 50)}`)
          log(`Raw price: ${product.price}`)
          log(`URL: ${product.url || 'none'}`)
          
          // Extract all data
          const productTitle = cleanTitle(product.title || product.name)
          const productPrice = parsePrice(product.price)
          const allImages = extractAllImages(product)
          const allVideos = extractAllVideos(product)
          const reviews = processReviews(product.reviews)
          
          log(`Cleaned title: ${productTitle.substring(0, 50)}`)
          log(`Parsed price: ${productPrice}`)
          log(`Images found: ${allImages.length}`)
          log(`Videos found: ${allVideos.length}`)
          log(`Reviews found: ${reviews.length}`)
          
          if (allImages.length > 0) {
            log(`First image: ${allImages[0].substring(0, 80)}...`)
          }
          
          // Validate minimum data
          if (!productTitle || productTitle === 'Produit importé' && allImages.length === 0) {
            throw new Error('Insufficient product data: no title and no images')
          }
          
          // Log to extension_data first
          const { data: extData, error: extError } = await supabase
            .from('extension_data')
            .insert({
              user_id: authData.user_id,
              data_type: 'product_import',
              data: {
                raw: product,
                processed: {
                  title: productTitle,
                  price: productPrice,
                  images: allImages.length,
                  videos: allVideos.length,
                  reviews: reviews.length
                }
              },
              source_url: product.url || '',
              status: 'processing'
            })
            .select('id')
            .single()
          
          if (extError) {
            log(`extension_data insert error: ${extError.message}`)
          }
          
          // Insert into imported_products
          const { data: newProduct, error: productError } = await supabase
            .from('imported_products')
            .insert({
              user_id: authData.user_id,
              name: productTitle,
              price: productPrice,
              cost_price: productPrice,
              description: String(product.description || '').substring(0, 10000),
              image_urls: allImages,
              video_urls: allVideos,
              source_url: product.url || '',
              source_platform: product.platform || 'extension',
              stock_quantity: product.stockQuantity || product.stock || 100,
              status: 'imported',
              category: product.category || null,
              currency: product.currency || 'EUR',
              sync_status: 'synced',
              brand: product.brand || null,
              sku: product.sku || product.mpn || null,
              variants: Array.isArray(product.variants) ? product.variants : null,
              specifications: product.specifications || null,
              shipping_info: product.shippingInfo || null,
              metadata: {
                rating: product.rating,
                orders: product.orders || product.sold,
                original_price: product.originalPrice || product.comparePrice,
                brand: product.brand || null,
                gtin: product.gtin || null,
                mpn: product.mpn || null,
                stock_status: product.stockStatus || 'in_stock',
                in_stock: product.inStock !== false,
                shipping_cost: product.shippingCost,
                free_shipping: product.freeShipping || false,
                delivery_time: product.deliveryTime,
                specifications: product.specifications || {},
                imported_at: new Date().toISOString(),
                source: 'chrome_extension_v4',
                request_id: requestId,
                reviews_count: reviews.length,
                images_count: allImages.length,
                videos_count: allVideos.length,
                variants_count: Array.isArray(product.variants) ? product.variants.length : 0
              }
            })
            .select()
            .single()

          if (productError) {
            log(`❌ imported_products insert FAILED: ${productError.code} - ${productError.message}`)
            if (productError.hint) log(`Hint: ${productError.hint}`)
            if (productError.details) log(`Details: ${productError.details}`)
            
            errors.push({
              product: productTitle.substring(0, 50),
              error: `${productError.code || 'DB_ERROR'}: ${productError.message}`,
              hint: productError.hint || null
            })
            
            // Update extension_data status
            if (extData?.id) {
              await supabase
                .from('extension_data')
                .update({ status: 'failed', error_message: productError.message })
                .eq('id', extData.id)
            }
          } else {
            log(`✅ Product imported: ${newProduct.id}`)
            
            // Import reviews if any
            if (reviews.length > 0) {
              try {
                const reviewInserts = reviews.map(r => ({
                  user_id: authData.user_id,
                  product_id: newProduct.id,
                  reviewer_name: r.author,
                  rating: r.rating,
                  comment: r.text,
                  review_date: r.date || new Date().toISOString(),
                  images: r.images,
                  source_platform: product.platform || 'extension',
                  is_verified: r.verified
                }))
                
                await supabase.from('product_reviews').insert(reviewInserts)
                log(`Imported ${reviews.length} reviews`)
              } catch (reviewError: any) {
                log(`Reviews import warning: ${reviewError.message}`)
              }
            }
            
            importResults.push({
              id: newProduct.id,
              name: newProduct.name,
              price: newProduct.price,
              images: allImages.length,
              videos: allVideos.length,
              reviews: reviews.length
            })
            
            // Update extension_data
            if (extData?.id) {
              await supabase
                .from('extension_data')
                .update({ status: 'imported', imported_product_id: newProduct.id })
                .eq('id', extData.id)
            }
          }
        } catch (error: any) {
          log(`❌ Exception: ${error.message}`)
          errors.push({
            product: String(product.title || product.name || 'Unknown').substring(0, 50),
            error: error.message
          })
        }
      }

      // Log analytics
      try {
        await supabase.from('extension_analytics').insert({
          user_id: authData.user_id,
          event_type: 'import_products',
          event_data: {
            total: products.length,
            successful: importResults.length,
            failed: errors.length,
            request_id: requestId
          },
          source_url: products[0]?.url || ''
        })
      } catch (e) {
        console.warn(`[${requestId}] Analytics insert warning:`, e)
      }

      console.log(`[${requestId}] ========== IMPORT COMPLETE ==========`)
      console.log(`[${requestId}] Success: ${importResults.length}, Failed: ${errors.length}`)

      return new Response(
        JSON.stringify({
          success: true,
          imported: importResults.length,
          failed: errors.length,
          results: importResults,
          errors: errors,
          requestId,
          debug: debugMode ? debugLogs : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========================================================================
    // ACTION: sync_status
    // ========================================================================
    if (action === 'sync_status') {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: todayImports } = await supabase
        .from('imported_products')
        .select('id', { count: 'exact' })
        .eq('user_id', authData.user_id)
        .gte('created_at', today)
      
      const { data: totalProducts } = await supabase
        .from('imported_products')
        .select('id', { count: 'exact' })
        .eq('user_id', authData.user_id)
      
      const { data: recentErrors } = await supabase
        .from('extension_data')
        .select('error_message, created_at')
        .eq('user_id', authData.user_id)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(5)

      return new Response(
        JSON.stringify({
          success: true,
          todayStats: {
            imports: todayImports?.length || 0,
            total: totalProducts?.length || 0
          },
          recentErrors: recentErrors || [],
          serverTime: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========================================================================
    // ACTION: debug_test
    // ========================================================================
    if (action === 'debug_test') {
      const testProduct = payload.product || {}
      
      const result = {
        raw: {
          title: testProduct.title,
          name: testProduct.name,
          price: testProduct.price,
          hasImages: Boolean(testProduct.images || testProduct.imageUrls),
          imagesCount: (testProduct.images?.length || 0) + (testProduct.imageUrls?.length || 0)
        },
        processed: {
          title: cleanTitle(testProduct.title || testProduct.name),
          price: parsePrice(testProduct.price),
          images: extractAllImages(testProduct),
          videos: extractAllVideos(testProduct),
          reviews: processReviews(testProduct.reviews).length
        },
        validation: {
          titleValid: cleanTitle(testProduct.title || testProduct.name).length > 3,
          priceValid: parsePrice(testProduct.price) > 0,
          hasImages: extractAllImages(testProduct).length > 0
        }
      }
      
      return new Response(
        JSON.stringify({ success: true, result, requestId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Unknown action
    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}`, requestId }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[extension-sync-realtime] Critical error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack?.split('\n').slice(0, 3)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
