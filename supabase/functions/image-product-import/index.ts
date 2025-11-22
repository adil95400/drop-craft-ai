import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Non authentifié')
    }

    const { imageUrls, productInfo = {} } = await req.json()

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new Error('URLs d\'images manquantes')
    }

    console.log('[Image Import] Importing products from images:', imageUrls.length)

    let imported = 0
    const errors: string[] = []

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i]
      
      try {
        // Validate image URL
        const imgResponse = await fetch(imageUrl, { method: 'HEAD' })
        if (!imgResponse.ok) {
          throw new Error('Image inaccessible')
        }

        const contentType = imgResponse.headers.get('content-type')
        if (!contentType?.startsWith('image/')) {
          throw new Error('URL ne pointe pas vers une image')
        }

        // Create product from image
        const productData = {
          user_id: user.id,
          name: productInfo.name || `Produit Image ${i + 1}`,
          description: productInfo.description || 'Produit importé depuis une image',
          price: productInfo.price || 0,
          cost_price: productInfo.cost_price || null,
          sku: `IMG-${Date.now()}-${i}`,
          category: productInfo.category || 'Import Image',
          brand: productInfo.brand || null,
          stock_quantity: productInfo.stock_quantity || 0,
          status: 'active',
          image_url: imageUrl,
          supplier_name: 'Import Image',
          review_status: 'pending',
          tags: ['image-import']
        }

        const { error } = await supabaseClient
          .from('imported_products')
          .insert(productData)

        if (error) {
          throw error
        }

        imported++
      } catch (error) {
        console.error(`[Image Import] Error on image ${i + 1}:`, error)
        errors.push(`Image ${i + 1}: ${error.message}`)
      }
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'image_import',
        description: `Import images: ${imported} produits créés depuis ${imageUrls.length} images`,
        metadata: {
          imported,
          total: imageUrls.length,
          timestamp: new Date().toISOString()
        }
      })

    console.log('[Image Import] Completed:', { imported, total: imageUrls.length })

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        total: imageUrls.length,
        errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[Image Import] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
