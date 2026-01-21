import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
}

interface ProductData {
  url: string
  title?: string
  price?: number
  image?: string
  images?: string[]
  platform?: string
  variants?: any[]
  variant_options?: Record<string, string[]>
  videos?: string[]
  video_urls?: string[]
  reviews?: any[]
  sku?: string
  description?: string
  has_videos?: boolean
  has_variants?: boolean
}

interface ImportResult {
  url: string
  success: boolean
  productId?: string
  error?: string
  title?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Auth check - support both JWT and extension token
    let userId: string | null = null
    
    const authHeader = req.headers.get('Authorization')
    const extensionToken = req.headers.get('x-extension-token')
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      userId = user.id
    } else if (extensionToken) {
      // Validate extension token
      const { data: tokenData, error: tokenError } = await supabase
        .from('extension_tokens')
        .select('user_id, is_active')
        .eq('token', extensionToken)
        .single()
      
      if (tokenError || !tokenData?.is_active) {
        return new Response(JSON.stringify({ error: 'Invalid extension token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      userId = tokenData.user_id
    } else {
      return new Response(JSON.stringify({ error: 'No authentication provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { products, options = {} } = await req.json()
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify({ error: 'No products provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const maxProducts = options.maxProducts || 50
    const productsToImport = products.slice(0, maxProducts) as ProductData[]
    
    console.log(`📦 Bulk import: ${productsToImport.length} products for user ${userId}`)
    
    const results: ImportResult[] = []
    const batchSize = 5 // Process 5 products at a time
    
    for (let i = 0; i < productsToImport.length; i += batchSize) {
      const batch = productsToImport.slice(i, i + batchSize)
      
      const batchResults = await Promise.all(
        batch.map(async (product) => {
          try {
            // If we only have a URL, call quick-import-url
            if (product.url && !product.title) {
              const importResponse = await fetch(`${supabaseUrl}/functions/v1/quick-import-url`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({
                  url: product.url,
                  user_id: userId,
                  source: 'bulk_import'
                })
              })
              
              if (!importResponse.ok) {
                const errorData = await importResponse.json().catch(() => ({}))
                return {
                  url: product.url,
                  success: false,
                  error: errorData.error || 'Import failed'
                }
              }
              
              const importData = await importResponse.json()
              return {
                url: product.url,
                success: true,
                productId: importData.product?.id,
                title: importData.product?.title || importData.product?.name
              }
            }
            
            // Direct product data insert with videos and variants
            const allVideos = [...(product.videos || []), ...(product.video_urls || [])]
            const uniqueVideos = [...new Set(allVideos)].filter(v => v && v.length > 0)
            
            const productData = {
              user_id: userId,
              title: product.title || 'Produit importé',
              name: product.title || 'Produit importé',
              description: product.description,
              price: product.price || 0,
              image_url: product.image || (product.images?.[0]),
              images: product.images || (product.image ? [product.image] : []),
              videos: uniqueVideos,
              source_url: product.url,
              source_platform: product.platform || 'unknown',
              sku: product.sku,
              variants: product.variants || [],
              variant_options: product.variant_options || {},
              status: 'imported',
              created_at: new Date().toISOString()
            }
            
            const { data: insertedProduct, error: insertError } = await supabase
              .from('imported_products')
              .insert(productData)
              .select('id, title')
              .single()
            
            if (insertError) {
              console.error(`Insert error for ${product.url}:`, insertError)
              return {
                url: product.url,
                success: false,
                error: insertError.message
              }
            }
            
            return {
              url: product.url,
              success: true,
              productId: insertedProduct.id,
              title: insertedProduct.title
            }
          } catch (err) {
            console.error(`Error importing ${product.url}:`, err)
            return {
              url: product.url,
              success: false,
              error: err instanceof Error ? err.message : 'Unknown error'
            }
          }
        })
      )
      
      results.push(...batchResults)
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < productsToImport.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length
    
    // Log the bulk import activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'bulk_import',
      description: `Import en masse: ${successCount} réussis, ${failedCount} échecs`,
      entity_type: 'product',
      source: 'extension',
      details: {
        total: results.length,
        successful: successCount,
        failed: failedCount,
        products: results.map(r => ({ url: r.url, success: r.success, title: r.title }))
      }
    })
    
    console.log(`✅ Bulk import complete: ${successCount} success, ${failedCount} failed`)
    
    return new Response(JSON.stringify({
      success: true,
      total: results.length,
      successful: successCount,
      failed: failedCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Bulk import error:', error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
