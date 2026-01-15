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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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
    const createdProducts: any[] = []

    // Determine import mode: single product with multiple images or multiple products
    const singleProductMode = productInfo.name && imageUrls.length > 1

    if (singleProductMode) {
      // Create ONE product with all images
      console.log('[Image Import] Single product mode with multiple images')
      
      const validImages: string[] = []
      
      for (const imageUrl of imageUrls) {
        try {
          // Validate image URL (skip data URLs)
          if (imageUrl.startsWith('data:')) {
            validImages.push(imageUrl)
            continue
          }
          
          const imgResponse = await fetch(imageUrl, { method: 'HEAD' })
          if (!imgResponse.ok) {
            console.log(`[Image Import] Image inaccessible: ${imageUrl}`)
            continue
          }

          const contentType = imgResponse.headers.get('content-type')
          if (!contentType?.startsWith('image/')) {
            console.log(`[Image Import] Not an image: ${imageUrl}`)
            continue
          }
          
          validImages.push(imageUrl)
        } catch (error) {
          console.error(`[Image Import] Error validating image:`, error)
        }
      }

      if (validImages.length === 0) {
        throw new Error('Aucune image valide trouvée')
      }

      const productData = {
        user_id: user.id,
        name: productInfo.name,
        description: productInfo.description || 'Produit importé depuis images',
        price: productInfo.price || 0,
        cost_price: productInfo.cost_price || null,
        sku: productInfo.sku || `IMG-${Date.now()}`,
        category: productInfo.category || 'Import Image',
        brand: productInfo.brand || null,
        stock_quantity: productInfo.stock_quantity || 999,
        status: 'active',
        image_url: validImages[0], // Primary image
        image_urls: validImages, // All images
        original_images: validImages,
        supplier_name: 'Import Image',
        review_status: 'pending',
        tags: ['image-import'],
        metadata: {
          import_type: 'image',
          images_count: validImages.length,
          imported_at: new Date().toISOString()
        }
      }

      const { data: createdProduct, error } = await supabaseClient
        .from('imported_products')
        .insert(productData)
        .select()
        .single()

      if (error) {
        throw error
      }

      imported = 1
      createdProducts.push(createdProduct)
      console.log('[Image Import] Created single product with', validImages.length, 'images')
      
    } else {
      // Create separate product for each image
      console.log('[Image Import] Multiple products mode (one per image)')
      
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i]
        
        try {
          // Validate image URL (skip data URLs)
          if (!imageUrl.startsWith('data:')) {
            const imgResponse = await fetch(imageUrl, { method: 'HEAD' })
            if (!imgResponse.ok) {
              throw new Error('Image inaccessible')
            }

            const contentType = imgResponse.headers.get('content-type')
            if (!contentType?.startsWith('image/')) {
              throw new Error('URL ne pointe pas vers une image')
            }
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
            stock_quantity: productInfo.stock_quantity || 999,
            status: 'active',
            image_url: imageUrl,
            image_urls: [imageUrl],
            original_images: [imageUrl],
            supplier_name: 'Import Image',
            review_status: 'pending',
            tags: ['image-import'],
            metadata: {
              import_type: 'image',
              image_index: i,
              imported_at: new Date().toISOString()
            }
          }

          const { data: createdProduct, error } = await supabaseClient
            .from('imported_products')
            .insert(productData)
            .select()
            .single()

          if (error) {
            throw error
          }

          imported++
          createdProducts.push(createdProduct)
        } catch (error) {
          console.error(`[Image Import] Error on image ${i + 1}:`, error)
          errors.push(`Image ${i + 1}: ${(error as Error).message}`)
        }
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
          mode: singleProductMode ? 'single_product' : 'multiple_products',
          timestamp: new Date().toISOString()
        }
      })

    console.log('[Image Import] Completed:', { imported, total: imageUrls.length })

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        total: imageUrls.length,
        products: createdProducts,
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
        error: (error as Error).message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
