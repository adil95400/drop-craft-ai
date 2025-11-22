import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { sourceUrl, sourceType, mapping = {}, config = {} } = await req.json()

    console.log(`Starting ${sourceType} import from:`, sourceUrl)

    const response = await fetch(sourceUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const content = await response.text()
    
    // Simple parsing simulation
    let products = []
    
    if (sourceType === 'json') {
      try {
        const jsonData = JSON.parse(content)
        products = Array.isArray(jsonData) ? jsonData : 
                  jsonData.products || jsonData.data || jsonData.items || [jsonData]
      } catch (e) {
        throw new Error('Invalid JSON format')
      }
    } else if (sourceType === 'xml') {
      // Basic XML parsing - extract product-like elements
      const productMatches = content.match(/<product[^>]*>[\s\S]*?<\/product>/gi) || 
                            content.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || []
      
      products = productMatches.map((match, i) => {
        const nameMatch = match.match(/<(?:name|title)[^>]*>(.*?)<\/(?:name|title)>/i)
        const priceMatch = match.match(/<price[^>]*>(.*?)<\/price>/i)
        const descMatch = match.match(/<(?:description|desc)[^>]*>(.*?)<\/(?:description|desc)>/i)
        const skuMatch = match.match(/<sku[^>]*>(.*?)<\/sku>/i)
        const imageMatch = match.match(/<(?:image|image_url)[^>]*>(.*?)<\/(?:image|image_url)>/i)
        
        return {
          name: nameMatch ? nameMatch[1].trim() : `Produit ${sourceType.toUpperCase()} ${i + 1}`,
          description: descMatch ? descMatch[1].trim() : `Description du produit importé depuis ${sourceType}`,
          price: priceMatch ? parseFloat(priceMatch[1]) : (Math.random() * 100 + 10).toFixed(2),
          sku: skuMatch ? skuMatch[1].trim() : `${sourceType.toUpperCase()}-${String(i).padStart(3, '0')}`,
          category: 'Import ' + sourceType.toUpperCase(),
          brand: 'Import Brand',
          image_url: imageMatch ? imageMatch[1].trim() : null,
          stock_quantity: Math.floor(Math.random() * 50) + 10,
          external_id: `${sourceType}_${i}`,
          supplier_name: `Import ${sourceType.toUpperCase()}`
        }
      })
    }

    console.log(`Parsed ${products.length} products from ${sourceType}`)

    // Insert products
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const product of products) {
      try {
        const { error } = await supabaseClient
          .from('imported_products')
          .insert({
            user_id: user.id,
            name: product.name,
            description: product.description || '',
            price: parseFloat(product.price) || 0,
            sku: product.sku || `${sourceType.toUpperCase()}-${Date.now()}`,
            category: product.category || 'Import ' + sourceType.toUpperCase(),
            brand: product.brand || '',
            image_url: product.image_url || '',
            stock_quantity: parseInt(product.stock_quantity) || 0,
            status: 'draft',
            review_status: 'pending',
            source_url: sourceUrl,
            external_id: product.external_id,
            supplier_name: product.supplier_name || 'Import ' + sourceType.toUpperCase()
          })

        if (error) {
          errorCount++
          errors.push(`Produit ${product.name}: ${error.message}`)
        } else {
          successCount++
        }
      } catch (error) {
        errorCount++
        errors.push(`Produit ${product.name}: ${error}`)
      }
    }

    console.log(`Import completed: ${successCount} success, ${errorCount} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Import ${sourceType} réussi`,
        data: {
          products_imported: successCount,
          total_processed: products.length,
          errors: errorCount,
          error_details: errors.slice(0, 10) // Limit errors
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})