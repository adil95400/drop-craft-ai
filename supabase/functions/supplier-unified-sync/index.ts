import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const { supplier_id, force_full_sync } = await req.json()
    
    console.log(`[UNIFIED-SYNC] Starting sync for user ${user.id}, supplier: ${supplier_id || 'ALL'}`)

    // Obtenir les produits depuis supplier_products
    let query = supabaseClient
      .from('supplier_products')
      .select('*')
      .eq('user_id', user.id)

    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id)
    }

    const { data: sourceProducts, error: sourceError } = await query

    if (sourceError) {
      throw sourceError
    }

    console.log(`[UNIFIED-SYNC] Found ${sourceProducts?.length || 0} products to sync`)

    let imported = 0
    let updated = 0
    let errors = 0

    // Synchroniser chaque produit dans le catalogue unifié
    for (const product of sourceProducts || []) {
      try {
        // Calculer la marge bénéficiaire
        const profitMargin = product.retail_price && product.cost_price
          ? ((product.retail_price - product.cost_price) / product.retail_price * 100).toFixed(2)
          : null

        // Déterminer le statut du stock
        let stockStatus = 'in_stock'
        if (!product.stock_quantity || product.stock_quantity === 0) {
          stockStatus = 'out_of_stock'
        } else if (product.stock_quantity < 10) {
          stockStatus = 'low_stock'
        }

        // Préparer les données unifiées
        const unifiedProduct = {
          user_id: user.id,
          supplier_id: product.supplier_id,
          supplier_name: product.supplier_name || 'Unknown',
          supplier_product_id: product.external_product_id || product.id,
          title: product.title || product.name,
          description: product.description,
          sku: product.sku,
          cost_price: product.cost_price,
          retail_price: product.retail_price,
          suggested_price: product.retail_price ? product.retail_price * 1.3 : null, // Suggestion IA: +30%
          stock_quantity: product.stock_quantity || 0,
          stock_status: stockStatus,
          images: product.images || [],
          main_image_url: product.images?.[0] || null,
          category: product.category,
          tags: product.tags || [],
          profit_margin: profitMargin,
          last_synced_at: new Date().toISOString(),
          sync_status: 'synced',
          is_active: true
        }

        // Tenter l'upsert
        const { error: upsertError } = await supabaseClient
          .from('supplier_products_unified')
          .upsert(unifiedProduct, {
            onConflict: 'supplier_id,supplier_product_id',
            ignoreDuplicates: false
          })

        if (upsertError) {
          console.error(`[UNIFIED-SYNC] Error syncing product ${product.id}:`, upsertError)
          errors++
          
          // Créer notification d'erreur
          await supabaseClient.rpc('create_supplier_notification', {
            p_user_id: user.id,
            p_type: 'sync_error',
            p_title: 'Erreur de synchronisation',
            p_message: `Impossible de synchroniser le produit ${product.title}`,
            p_priority: 'medium',
            p_supplier_id: product.supplier_id,
            p_data: { error: upsertError.message, product_id: product.id }
          })
        } else {
          const existingProduct = await supabaseClient
            .from('supplier_products_unified')
            .select('id')
            .eq('supplier_id', product.supplier_id)
            .eq('supplier_product_id', product.external_product_id || product.id)
            .single()

          if (existingProduct.data) {
            updated++
          } else {
            imported++
          }
        }
      } catch (productError) {
        console.error(`[UNIFIED-SYNC] Error processing product:`, productError)
        errors++
      }
    }

    // Calculer les scores AI pour les produits synchronisés
    const { data: unifiedProducts } = await supabaseClient
      .from('supplier_products_unified')
      .select('id')
      .eq('user_id', user.id)
      .is('ai_score', null)
      .limit(50) // Limiter pour éviter les timeouts

    if (unifiedProducts && unifiedProducts.length > 0) {
      console.log(`[UNIFIED-SYNC] Calculating AI scores for ${unifiedProducts.length} products`)
      
      for (const product of unifiedProducts) {
        await supabaseClient.rpc('calculate_product_ai_score', {
          p_product_id: product.id
        })
      }
    }

    // Créer notification de succès
    if (imported + updated > 0) {
      await supabaseClient.rpc('create_supplier_notification', {
        p_user_id: user.id,
        p_type: 'sync_completed',
        p_title: 'Synchronisation terminée',
        p_message: `${imported} nouveaux produits importés, ${updated} produits mis à jour`,
        p_priority: 'low',
        p_data: { imported, updated, errors }
      })
    }

    console.log(`[UNIFIED-SYNC] Sync completed: ${imported} imported, ${updated} updated, ${errors} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total: (sourceProducts?.length || 0),
          imported,
          updated,
          errors
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[UNIFIED-SYNC] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})