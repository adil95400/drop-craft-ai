import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Token can come from header (preferred) or JSON body fallback
    const rawHeaderToken = req.headers.get('x-extension-token')

    console.log('[extension-sync-realtime] Incoming request', {
      method: req.method,
      hasToken: Boolean(rawHeaderToken),
      tokenPrefix: rawHeaderToken ? rawHeaderToken.slice(0, 12) : null,
    })

    // Parse body early so we can also read token from body if header missing
    let payload: any = null
    try {
      payload = await req.json()
    } catch {
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
      return new Response(
        JSON.stringify({ error: 'Extension token required' }),
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
      console.warn('[extension-sync-realtime] Token lookup error', tokenError)
    }

    if (!authData) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check expiration (if present)
    if (authData.expires_at && new Date(authData.expires_at) < new Date()) {
      await supabase
        .from('extension_auth_tokens')
        .update({ is_active: false })
        .eq('id', authData.id)

      return new Response(
        JSON.stringify({ error: 'Token expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update last-used counters (best-effort)
    await supabase
      .from('extension_auth_tokens')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: (authData.usage_count || 0) + 1,
      })
      .eq('id', authData.id)

    // If body JSON failed earlier, now we must fail for actions needing a body
    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, products } = payload

    console.log('[extension-sync-realtime] Action', { action, userId: authData.user_id })

    if (action === 'import_products') {
      // Process products from extension
      const importResults = []
      const errors = []

      const productList = products || []
      console.log('[extension-sync-realtime] Processing', productList.length, 'products')

      // Helper to parse price from various formats (European, US, Asian)
      const parsePrice = (priceInput: unknown): number => {
        if (typeof priceInput === 'number') return priceInput;
        if (!priceInput || typeof priceInput !== 'string') return 0;
        
        // Remove currency symbols, spaces, and handle various formats
        let cleanPrice = priceInput
          .replace(/[€$£¥₹₽CHF]/gi, '')
          .replace(/\s+/g, '')
          .replace(/EUR|USD|GBP/gi, '')
          .trim();
        
        // Handle European format with space as thousand separator (1 234,56)
        if (/^\d{1,3}(\s\d{3})*,\d{2}$/.test(cleanPrice.replace(/\s/g, ' '))) {
          cleanPrice = cleanPrice.replace(/\s/g, '').replace(',', '.');
        }
        // Handle European format (1.234,56 or 1234,56)
        else if (cleanPrice.includes(',') && !cleanPrice.includes('.')) {
          // Simple comma as decimal separator: 598,99 -> 598.99
          cleanPrice = cleanPrice.replace(',', '.');
        } else if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
          // European thousand separator: 1.234,56 -> 1234.56
          cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.');
        }
        
        const parsed = parseFloat(cleanPrice);
        return isNaN(parsed) ? 0 : parsed;
      }

      // Helper to clean product title (Cdiscount, Fnac, etc.)
      const cleanTitle = (title: unknown): string => {
        if (!title || typeof title !== 'string') return 'Produit importé';
        
        // Remove unwanted patterns (keyboard shortcuts, promo badges, etc.)
        let cleaned = title
          .replace(/Raccourci clavier[\s\S]*$/i, '')
          .replace(/shift\s*\+[\s\S]*$/i, '')
          .replace(/alt\s*\+[\s\S]*$/i, '')
          .replace(/Ajouter au panier[\s\S]*/i, '')
          .replace(/Livraison gratuite[\s\S]*/i, '')
          .replace(/En stock[\s\S]*/i, '')
          .replace(/\b(Promo|Soldes|Nouveau|New)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        // If title is too short or empty after cleaning, use fallback
        if (cleaned.length < 5) {
          return 'Produit importé';
        }
        
        // Limit title length
        return cleaned.substring(0, 500);
      }

      // Helper to validate image URL (enhanced for French marketplaces)
      const validateImageUrl = (url: unknown): string => {
        if (!url || typeof url !== 'string') return '';
        
        // Skip invalid patterns
        const invalidPatterns = ['sprite', 'pixel', 'grey', 'transparent', 'placeholder', 'loader', 'loading', 'spacer', '1x1'];
        if (invalidPatterns.some(p => url.toLowerCase().includes(p)) || url.length < 20) {
          return '';
        }
        
        // Clean up URL - remove size transforms for higher quality
        let cleanUrl = url
          .replace(/_\d+x\d+\./, '.')        // AliExpress/Cdiscount size
          .replace(/\/[a-z]_\d+_\d+\//, '/')  // Cdiscount CDN size
          .replace(/&w=\d+&h=\d+/, '')        // Query param sizes
          .replace(/\?.*$/, '');              // Remove query params for cleaner URL
        
        // Basic URL validation
        try {
          new URL(cleanUrl);
          return cleanUrl;
        } catch {
          // If cleaned URL is invalid, try original
          try {
            new URL(url);
            return url;
          } catch {
            return '';
          }
        }
      }

      for (const product of productList) {
        try {
          const productTitle = cleanTitle(product.title || product.name);
          const productPrice = parsePrice(product.price);
          const productImage = validateImageUrl(product.image || product.imageUrl);
          
          // Process all images
          const allImages: string[] = [];
          if (productImage) allImages.push(productImage);
          
          // Add additional images from array
          if (Array.isArray(product.images)) {
            for (const img of product.images) {
              const validImg = validateImageUrl(img);
              if (validImg && !allImages.includes(validImg)) {
                allImages.push(validImg);
              }
            }
          }
          
          // Process videos
          const videos: string[] = [];
          if (Array.isArray(product.videos)) {
            for (const vid of product.videos) {
              if (vid && typeof vid === 'string' && vid.includes('http')) {
                videos.push(vid);
              }
            }
          }
          
          // Process reviews
          const reviews: any[] = [];
          if (Array.isArray(product.reviews)) {
            for (const review of product.reviews.slice(0, 50)) {
              if (review && review.text) {
                reviews.push({
                  rating: review.rating || null,
                  text: (review.text || '').substring(0, 2000),
                  author: (review.author || '').substring(0, 100),
                  date: review.date || null,
                  images: Array.isArray(review.images) ? review.images.slice(0, 5) : []
                });
              }
            }
          }
          
          console.log('[extension-sync-realtime] Processing product:', {
            originalTitle: (product.title || product.name || '').substring(0, 50),
            cleanedTitle: productTitle.substring(0, 50),
            originalPrice: product.price,
            cleanedPrice: productPrice,
            imagesCount: allImages.length,
            videosCount: videos.length,
            descriptionLength: (product.description || '').length,
            reviewsCount: reviews.length
          });

          // Create import job
          const { data: importJob, error: jobError } = await supabase
            .from('extension_data')
            .insert({
              user_id: authData.user_id,
              data_type: 'product_scrape',
              data: product,
              source_url: product.url || '',
              status: 'pending'
            })
            .select()
            .single()

          if (jobError) {
            console.error('[extension-sync-realtime] extension_data insert error:', jobError)
            throw jobError
          }

          // Insert into imported_products table with ALL data
          const { data: newProduct, error: productError } = await supabase
            .from('imported_products')
            .insert({
              user_id: authData.user_id,
              name: productTitle,
              price: productPrice,
              cost_price: productPrice,
              description: (product.description || '').substring(0, 10000),
              image_url: allImages[0] || null,
              image_urls: allImages,
              images: allImages.map((url, idx) => ({ url, position: idx, alt: productTitle })),
              videos: videos.map(url => ({ url, type: 'video' })),
              source_url: product.url || '',
              source_platform: product.platform || 'extension',
              stock_quantity: 100,
              status: 'imported',
              category: product.category || null,
              currency: 'EUR',
              sync_status: 'synced',
              sku: product.sku || null,
              metadata: {
                rating: product.rating,
                orders: product.orders,
                original_price: product.originalPrice,
                brand: product.brand,
                imported_at: new Date().toISOString(),
                source: product.source || 'chrome_extension',
                reviews_count: reviews.length,
                images_count: allImages.length,
                videos_count: videos.length
              }
            })
            .select()
            .single()

          if (productError) {
            console.error('[extension-sync-realtime] imported_products insert error:', productError)
            errors.push({ product: productTitle, error: productError.message })
          } else {
            // Store reviews if any
            if (reviews.length > 0) {
              try {
                const reviewInserts = reviews.map(r => ({
                  user_id: authData.user_id,
                  product_id: newProduct.id,
                  reviewer_name: r.author || 'Anonymous',
                  rating: r.rating || 5,
                  comment: r.text,
                  review_date: r.date || new Date().toISOString(),
                  images: r.images,
                  source_platform: product.platform || 'extension',
                  is_verified: true
                }));
                
                await supabase
                  .from('product_reviews')
                  .insert(reviewInserts);
                  
                console.log('[extension-sync-realtime] Imported', reviews.length, 'reviews for product:', newProduct.id);
              } catch (reviewError) {
                console.warn('[extension-sync-realtime] Reviews import warning:', reviewError);
              }
            }
            
            importResults.push(newProduct)
            console.log('[extension-sync-realtime] Product imported:', newProduct.id, productTitle.substring(0, 50), {
              images: allImages.length,
              videos: videos.length,
              reviews: reviews.length
            })
            
            // Update extension_data status
            await supabase
              .from('extension_data')
              .update({ status: 'imported', imported_product_id: newProduct.id })
              .eq('id', importJob.id)
          }
        } catch (error) {
          console.error('[extension-sync-realtime] Product import error:', error)
          errors.push({ product: product.title || product.name || 'Unknown', error: error.message })
        }
      }

      // Log analytics
      await supabase.from('extension_analytics').insert({
        user_id: authData.user_id,
        event_type: 'bulk_import',
        event_data: {
          total: productList.length,
          successful: importResults.length,
          failed: errors.length
        },
        source_url: productList[0]?.url || ''
      })

      console.log('[extension-sync-realtime] Import complete:', { imported: importResults.length, failed: errors.length })

      return new Response(
        JSON.stringify({ 
          success: true, 
          imported: importResults.length,
          failed: errors.length,
          results: importResults,
          errors: errors
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'bulk_import') {
      // Handle bulk import from pending items
      const { items } = payload
      const importResults = []
      const errors = []

      const itemList = items || []
      console.log('[extension-sync-realtime] Bulk import:', itemList.length, 'items')

      // Reuse helpers from import_products
      const parsePrice = (priceInput: unknown): number => {
        if (typeof priceInput === 'number') return priceInput;
        if (!priceInput || typeof priceInput !== 'string') return 0;
        const cleanPrice = priceInput.replace(/[€$£¥₹₽]/g, '').replace(/\s+/g, '').trim();
        if (cleanPrice.includes(',') && !cleanPrice.includes('.')) {
          return parseFloat(cleanPrice.replace(',', '.')) || 0;
        } else if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
          return parseFloat(cleanPrice.replace(/\./g, '').replace(',', '.')) || 0;
        }
        return parseFloat(cleanPrice) || 0;
      };

      const cleanTitle = (title: unknown): string => {
        if (!title || typeof title !== 'string') return 'Produit importé';
        let cleaned = title
          .replace(/Raccourci clavier[\s\S]*$/i, '')
          .replace(/shift\s*\+[\s\S]*$/i, '')
          .replace(/alt\s*\+[\s\S]*$/i, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleaned.length < 5) return 'Produit importé';
        return cleaned.substring(0, 500);
      };

      const validateImageUrl = (url: unknown): string => {
        if (!url || typeof url !== 'string') return '';
        if (url.includes('sprite') || url.includes('pixel') || url.includes('grey') || url.includes('transparent') || url.length < 20) return '';
        try { new URL(url); return url; } catch { return ''; }
      };

      for (const item of itemList) {
        try {
          const productTitle = cleanTitle(item.title || item.name);
          const productPrice = parsePrice(item.price);
          const productImage = validateImageUrl(item.image || item.imageUrl);

          const { data: importJob, error: jobError } = await supabase
            .from('extension_data')
            .insert({
              user_id: authData.user_id,
              data_type: item.type || 'product_scrape',
              data: item,
              source_url: item.url || '',
              status: 'pending'
            })
            .select()
            .single()

          if (jobError) throw jobError

          if (item.type === 'product' || !item.type) {
            const { data: newProduct, error: productError } = await supabase
              .from('supplier_products')
              .insert({
                user_id: authData.user_id,
                title: productTitle,
                price: productPrice,
                description: (item.description || '').substring(0, 5000),
                image_url: productImage,
                source_url: item.url || '',
                stock_quantity: 100,
                is_active: true,
                category: item.category || null
              })
              .select()
              .single()

            if (productError) {
              console.error('[extension-sync-realtime] bulk_import product error:', productError)
              errors.push({ item: productTitle, error: productError.message })
            } else {
              importResults.push(newProduct)
              await supabase
                .from('extension_data')
                .update({ status: 'imported', imported_product_id: newProduct.id })
                .eq('id', importJob.id)
            }
          }
        } catch (error) {
          console.error('[extension-sync-realtime] bulk_import item error:', error)
          errors.push({ item: item.title || item.name || 'Unknown', error: error.message })
        }
      }

      await supabase.from('extension_analytics').insert({
        user_id: authData.user_id,
        event_type: 'bulk_import',
        event_data: {
          total: itemList.length,
          successful: importResults.length,
          failed: errors.length
        }
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          imported: importResults.length,
          failed: errors.length,
          results: importResults,
          errors: errors
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'sync_status') {
      // Get user's import status
      const { data: recentImports } = await supabase
        .from('extension_data')
        .select('*')
        .eq('user_id', authData.user_id)
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: analytics } = await supabase
        .from('extension_analytics')
        .select('*')
        .eq('user_id', authData.user_id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      // Get user plan - use correct column name
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', authData.user_id)
        .single()

      return new Response(
        JSON.stringify({ 
          success: true,
          recentImports,
          userPlan: profile?.subscription_plan || 'standard',
          todayStats: {
            imports: analytics?.length || 0,
            successful: analytics?.filter(a => a.event_type === 'bulk_import').reduce((sum, a) => sum + (a.event_data?.successful || 0), 0) || 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Extension sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
