import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse } from 'https://deno.land/std@0.218.0/csv/parse.ts'

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

    const { supplier_id, csv_url, import_job_id, column_mapping } = await req.json()
    
    console.log(`[CSV-IMPORT] Starting CSV import for user ${user.id}`)

    // Mettre à jour le statut du job
    if (import_job_id) {
      await supabaseClient
        .from('supplier_import_jobs')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', import_job_id)
    }

    // Télécharger le fichier CSV
    console.log(`[CSV-IMPORT] Downloading CSV from ${csv_url}`)
    const csvResponse = await fetch(csv_url)
    
    if (!csvResponse.ok) {
      throw new Error(`Failed to download CSV: ${csvResponse.statusText}`)
    }

    const csvText = await csvResponse.text()
    const records = parse(csvText, {
      skipFirstRow: true,
      columns: column_mapping || undefined
    })

    console.log(`[CSV-IMPORT] Parsed ${records.length} records`)

    let imported = 0
    let updated = 0
    let failed = 0
    const errors: any[] = []

    // Traiter chaque ligne du CSV
    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i]
        
        // Valider les champs obligatoires
        if (!record.title && !record.name) {
          throw new Error('Missing product title/name')
        }

        // Mapper les champs CSV vers la structure du produit
        const product = {
          user_id: user.id,
          supplier_id,
          supplier_product_id: record.sku || record.id || `csv-${i}`,
          title: record.title || record.name,
          description: record.description || '',
          sku: record.sku,
          cost_price: parseFloat(record.cost_price || record.price || '0'),
          retail_price: parseFloat(record.retail_price || record.price || '0'),
          stock_quantity: parseInt(record.stock || record.quantity || '0'),
          stock_status: parseInt(record.stock || '0') > 0 ? 'in_stock' : 'out_of_stock',
          images: record.images ? JSON.parse(record.images) : [],
          main_image_url: record.image_url || record.image,
          category: record.category,
          tags: record.tags ? record.tags.split(',').map((t: string) => t.trim()) : [],
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
          is_active: true
        }

        // Calculer la marge
        if (product.retail_price && product.cost_price) {
          product.profit_margin = ((product.retail_price - product.cost_price) / product.retail_price * 100).toFixed(2)
        }

        // Insérer dans le catalogue unifié
        const { error: insertError } = await supabaseClient
          .from('supplier_products_unified')
          .upsert(product, {
            onConflict: 'supplier_id,supplier_product_id',
            ignoreDuplicates: false
          })

        if (insertError) {
          throw insertError
        }

        imported++

        // Mettre à jour la progression
        if (import_job_id && i % 10 === 0) {
          const progress = Math.floor((i / records.length) * 100)
          await supabaseClient
            .from('supplier_import_jobs')
            .update({
              progress,
              imported_products: imported,
              failed_products: failed
            })
            .eq('id', import_job_id)
        }
      } catch (error) {
        failed++
        errors.push({
          line: i + 2, // +2 car on skip la première ligne et commence à 0
          error: error.message,
          record: records[i]
        })
        console.error(`[CSV-IMPORT] Error on line ${i + 2}:`, error.message)
      }
    }

    // Finaliser le job
    if (import_job_id) {
      await supabaseClient
        .from('supplier_import_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_products: records.length,
          imported_products: imported,
          failed_products: failed,
          error_log: errors,
          progress: 100
        })
        .eq('id', import_job_id)
    }

    // Créer notification
    await supabaseClient.rpc('create_supplier_notification', {
      p_user_id: user.id,
      p_type: 'import_completed',
      p_title: 'Import CSV terminé',
      p_message: `${imported} produits importés, ${failed} erreurs`,
      p_priority: failed > 0 ? 'medium' : 'low',
      p_supplier_id: supplier_id,
      p_data: { imported, failed, total: records.length }
    })

    console.log(`[CSV-IMPORT] Import completed: ${imported} imported, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total: records.length,
          imported,
          failed,
          errors: errors.slice(0, 10) // Limiter les erreurs retournées
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[CSV-IMPORT] Error:', error)
    
    // Marquer le job comme échoué
    const { import_job_id } = await req.json().catch(() => ({}))
    if (import_job_id) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      )
      
      await supabaseClient
        .from('supplier_import_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_log: [{ error: error.message }]
        })
        .eq('id', import_job_id)
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})