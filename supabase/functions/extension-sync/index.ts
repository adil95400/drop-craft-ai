import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtensionProduct {
  id: string
  name: string
  price: string
  originalPrice?: string
  discount?: string
  image: string
  images?: string[]
  description?: string
  specifications?: Record<string, any>
  reviews?: any[]
  rating?: number
  orders?: string
  shipping?: string
  variations?: Record<string, any>
  seller?: Record<string, any>
  category?: string
  url: string
  domain: string
  platform: string
  scrapedAt: string
  source: string
}

interface SyncRequest {
  products: ExtensionProduct[]
  source: string
  extensionVersion: string
  timestamp: string
  userToken?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { products, source, extensionVersion, timestamp, userToken }: SyncRequest = await req.json()

    console.log('Received extension sync request:', {
      productsCount: products?.length,
      source,
      extensionVersion,
      timestamp
    })

    if (!products || !Array.isArray(products)) {
      return new Response(
        JSON.stringify({ error: 'Invalid products data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If userToken is provided, verify the user
    let userId: string | null = null
    if (userToken) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(userToken)
      if (user && !authError) {
        userId = user.id
      }
    }

    // Process each product
    const processedProducts = []
    const errors = []

    for (const product of products) {
      try {
        // Clean and validate product data
        const cleanedProduct = {
          external_id: product.id,
          name: product.name?.substring(0, 500) || 'Unknown Product',
          price: this.parsePrice(product.price),
          currency: this.detectCurrency(product.price) || 'EUR',
          original_price: product.originalPrice ? this.parsePrice(product.originalPrice) : null,
          discount_percentage: product.discount ? this.parseDiscount(product.discount) : null,
          image_url: product.image || null,
          image_urls: product.images || [],
          description: product.description?.substring(0, 2000) || null,
          category: product.category || 'Unknown',
          subcategory: null,
          brand: product.seller?.name || null,
          sku: product.id,
          rating: product.rating || null,
          reviews_count: this.parseReviewCount(product.reviews),
          availability_status: 'in_stock',
          delivery_time: product.shipping || null,
          tags: this.generateTags(product),
          is_trending: false,
          is_bestseller: false,
          supplier_name: product.domain,
          supplier_url: product.url,
          cost_price: product.price ? this.parsePrice(product.price) * 0.7 : null, // Estimate 30% margin
          profit_margin: 30.0,
          competition_score: Math.random() * 100,
          sales_count: this.parseOrderCount(product.orders),
          platform: product.platform,
          metadata: {
            source: product.source,
            scrapedAt: product.scrapedAt,
            extensionVersion,
            specifications: product.specifications,
            variations: product.variations,
            seller: product.seller,
            reviews: product.reviews?.slice(0, 5) // Limit reviews
          }
        }

        // Insert into catalog_products
        const { data: insertedProduct, error: insertError } = await supabase
          .from('catalog_products')
          .insert(cleanedProduct)
          .select()
          .single()

        if (insertError) {
          console.error('Error inserting product:', insertError)
          errors.push(`Failed to insert ${product.name}: ${insertError.message}`)
          continue
        }

        // If user is identified, also create an imported_product record
        if (userId && insertedProduct) {
          const { error: importError } = await supabase
            .from('imported_products')
            .insert({
              user_id: userId,
              import_job_id: null,
              external_id: product.id,
              name: cleanedProduct.name,
              price: cleanedProduct.price,
              currency: cleanedProduct.currency,
              image_url: cleanedProduct.image_url,
              source_url: product.url,
              source_platform: product.platform,
              status: 'pending',
              ai_optimized: false,
              raw_data: product
            })

          if (importError) {
            console.warn('Failed to create imported_product record:', importError)
          }
        }

        processedProducts.push({
          id: insertedProduct.id,
          external_id: product.id,
          name: cleanedProduct.name,
          price: cleanedProduct.price
        })

      } catch (error) {
        console.error('Error processing product:', error)
        errors.push(`Failed to process ${product.name}: ${error.message}`)
      }
    }

    // Log the sync event
    try {
      await supabase
        .from('extension_sync_logs')
        .insert({
          user_id: userId,
          source,
          extension_version: extensionVersion,
          products_count: products.length,
          success_count: processedProducts.length,
          error_count: errors.length,
          errors: errors,
          metadata: {
            timestamp,
            platforms: [...new Set(products.map(p => p.platform))]
          }
        })
    } catch (logError) {
      console.warn('Failed to log sync event:', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${processedProducts.length} products`,
        processed_count: processedProducts.length,
        error_count: errors.length,
        products: processedProducts,
        errors: errors
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Extension sync error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Utility functions
function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null
  const cleaned = priceStr.replace(/[^\d.,]/g, '')
  const price = parseFloat(cleaned.replace(',', '.'))
  return isNaN(price) ? null : price
}

function detectCurrency(priceStr: string): string | null {
  if (!priceStr) return null
  
  const currencyMap: Record<string, string> = {
    '€': 'EUR',
    '$': 'USD',
    '£': 'GBP',
    '¥': 'JPY',
    '₹': 'INR',
    'kr': 'SEK',
    'zł': 'PLN',
    'CHF': 'CHF'
  }
  
  for (const [symbol, code] of Object.entries(currencyMap)) {
    if (priceStr.includes(symbol)) return code
  }
  
  return 'USD' // Default fallback
}

function parseDiscount(discountStr: string): number | null {
  if (!discountStr) return null
  const match = discountStr.match(/(\d+)%/)
  return match ? parseInt(match[1]) : null
}

function parseReviewCount(reviews: any): number | null {
  if (Array.isArray(reviews)) return reviews.length
  if (typeof reviews === 'string') {
    const match = reviews.match(/(\d+)/)
    return match ? parseInt(match[1]) : null
  }
  return null
}

function parseOrderCount(orders: string): number | null {
  if (!orders) return null
  const match = orders.match(/(\d+)/)
  return match ? parseInt(match[1]) : null
}

function generateTags(product: ExtensionProduct): string[] {
  const tags = []
  
  if (product.platform) tags.push(product.platform)
  if (product.category) tags.push(product.category.toLowerCase())
  if (product.discount) tags.push('discount')
  if (product.rating && product.rating > 4) tags.push('highly-rated')
  if (product.seller?.name) tags.push(product.seller.name.toLowerCase())
  
  return [...new Set(tags)].slice(0, 10) // Limit to 10 unique tags
}