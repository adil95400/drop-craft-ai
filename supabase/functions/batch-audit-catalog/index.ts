import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BatchAuditRequest {
  productSource: 'products' | 'imported_products' | 'supplier_products'
  userId: string
  auditType?: 'full' | 'quick' | 'seo_only'
  limit?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
    )

    const { productSource, userId, auditType = 'quick', limit = 50 }: BatchAuditRequest = await req.json()

    if (!productSource || !userId) {
      throw new Error('Missing required fields')
    }

    console.log(`Starting batch audit for ${productSource} (type: ${auditType}, limit: ${limit})`)

    // Récupérer les produits
    const { data: products, error: productsError } = await supabaseClient
      .from(productSource)
      .select('id')
      .eq('user_id', userId)
      .limit(limit)

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No products to audit',
          processed: 0,
          failed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${products.length} products to audit`)

    let processed = 0
    let failed = 0

    // Auditer chaque produit
    for (const product of products) {
      try {
        // Appeler la fonction d'audit individuel
        const { error: auditError } = await supabaseClient.functions.invoke('audit-product', {
          body: {
            productId: product.id,
            productSource,
            auditType,
            userId
          }
        })

        if (auditError) {
          console.error(`Audit failed for product ${product.id}:`, auditError)
          failed++
        } else {
          processed++
          console.log(`Product ${product.id} audited successfully (${processed}/${products.length})`)
        }

        // Petit délai pour éviter rate limiting
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error(`Error auditing product ${product.id}:`, error)
        failed++
      }
    }

    // Mettre à jour les analytics
    const today = new Date().toISOString().split('T')[0]
    
    // Calculer les scores moyens
    const { data: audits } = await supabaseClient
      .from('product_audits')
      .select('overall_score, title_score, description_score, seo_score, image_score')
      .eq('user_id', userId)
      .gte('created_at', today)

    if (audits && audits.length > 0) {
      const avgOverall = audits.reduce((sum, a) => sum + a.overall_score, 0) / audits.length
      const avgTitle = audits.reduce((sum, a) => sum + a.title_score, 0) / audits.length
      const avgDescription = audits.reduce((sum, a) => sum + a.description_score, 0) / audits.length
      const avgSeo = audits.reduce((sum, a) => sum + a.seo_score, 0) / audits.length
      const avgImage = audits.reduce((sum, a) => sum + a.image_score, 0) / audits.length

      await supabaseClient
        .from('audit_analytics')
        .upsert({
          user_id: userId,
          date: today,
          total_audits: processed,
          avg_overall_score: avgOverall,
          avg_title_score: avgTitle,
          avg_description_score: avgDescription,
          avg_seo_score: avgSeo,
          avg_image_score: avgImage,
          products_with_errors: audits.filter(a => a.overall_score < 60).length,
          products_optimized: audits.filter(a => a.overall_score >= 80).length,
        }, {
          onConflict: 'user_id,date'
        })
    }

    console.log(`Batch audit complete: ${processed} succeeded, ${failed} failed`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Batch audit completed`,
        processed,
        failed,
        total: products.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in batch-audit-catalog:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})