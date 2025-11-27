import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, productId, channel } = await req.json()

    if (!userId || !productId || !channel) {
      throw new Error('Missing required parameters')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Récupérer le produit
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .single()

    if (productError && productError.code !== 'PGRST116') {
      // Essayer imported_products
      const { data: imported } = await supabaseClient
        .from('imported_products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', userId)
        .single()

      if (!imported) throw new Error('Product not found')
    }

    const sourceTable = product ? 'products' : 'imported_products'

    // Définir les champs requis par canal
    const requiredFields: Record<string, string[]> = {
      google_shopping: ['gtin', 'google_product_category', 'age_group', 'gender', 'condition', 'availability'],
      meta: ['fb_product_category', 'condition', 'availability'],
      amazon: ['bullet_point_1', 'bullet_point_2', 'bullet_point_3', 'search_terms'],
      tiktok: ['tiktok_category', 'video_url'],
      chatgpt: ['name', 'description', 'category', 'image_url']
    }

    const fields = requiredFields[channel] || []
    const currentProduct = product || await getImportedProduct(supabaseClient, productId, userId)

    // Analyser les champs manquants
    const missingFields: string[] = []
    fields.forEach(field => {
      if (!currentProduct[field]) {
        missingFields.push(field)
      }
    })

    const readinessScore = Math.round(((fields.length - missingFields.length) / fields.length) * 100)

    // Mettre à jour ou créer les données de canal
    const { error: upsertError } = await supabaseClient
      .from('product_channel_data')
      .upsert({
        user_id: userId,
        product_id: productId,
        source_table: sourceTable,
        channel,
        readiness_score: { [channel]: readinessScore },
        missing_fields: { [channel]: missingFields }
      }, {
        onConflict: 'user_id,product_id,source_table,channel'
      })

    if (upsertError) throw upsertError

    return new Response(
      JSON.stringify({
        success: true,
        channel,
        readiness_score: readinessScore,
        missing_fields: missingFields,
        is_ready: readinessScore >= 80,
        message: missingFields.length === 0 
          ? `✅ Produit prêt pour ${channel}`
          : `⚠️ ${missingFields.length} champ(s) manquant(s) pour ${channel}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Channel readiness analysis error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function getImportedProduct(client: any, productId: string, userId: string) {
  const { data } = await client
    .from('imported_products')
    .select('*')
    .eq('id', productId)
    .eq('user_id', userId)
    .single()
  return data
}
