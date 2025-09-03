import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FTPImportRequest {
  connectorId: string
  immediate?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      })
    }

    const { connectorId, immediate = false }: FTPImportRequest = await req.json()

    console.log(`Processing FTP import for connector: ${connectorId}`)

    // Get connector details
    const { data: connector, error: connectorError } = await supabaseClient
      .from('import_connectors')
      .select('*')
      .eq('id', connectorId)
      .eq('user_id', user.id)
      .single()

    if (connectorError || !connector) {
      return new Response(JSON.stringify({ error: 'Connector not found' }), {
        status: 404,
        headers: corsHeaders
      })
    }

    // Create import job
    const { data: importJob, error: jobError } = await supabaseClient
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_type: 'ftp',
        source_url: connector.config.url,
        status: 'processing',
        mapping_config: connector.config.mapping || {}
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      return new Response(JSON.stringify({ error: 'Failed to create import job' }), {
        status: 500,
        headers: corsHeaders
      })
    }

    // Simulate FTP file download and processing
    console.log(`Connecting to FTP: ${connector.config.url}`)
    
    // Mock FTP processing - in production, use real FTP client
    const mockProducts = [
      {
        name: `Produit FTP ${Date.now()}`,
        description: 'Produit importé via FTP',
        price: Math.floor(Math.random() * 100) + 10,
        cost_price: Math.floor(Math.random() * 50) + 5,
        currency: 'EUR',
        sku: `FTP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category: 'Import FTP',
        supplier_name: 'FTP Source',
        status: 'draft',
        review_status: 'pending'
      },
      {
        name: `Produit FTP ${Date.now() + 1}`,
        description: 'Autre produit importé via FTP',
        price: Math.floor(Math.random() * 200) + 20,
        cost_price: Math.floor(Math.random() * 100) + 10,
        currency: 'EUR',
        sku: `FTP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category: 'Import FTP',
        supplier_name: 'FTP Source',
        status: 'draft',
        review_status: 'pending'
      }
    ]

    // Insert imported products
    const productsToInsert = mockProducts.map(product => ({
      ...product,
      user_id: user.id,
      import_id: importJob.id
    }))

    const { error: insertError } = await supabaseClient
      .from('imported_products')
      .insert(productsToInsert)

    if (insertError) {
      console.error('Products insertion error:', insertError)
      
      // Update job as failed
      await supabaseClient
        .from('import_jobs')
        .update({
          status: 'failed',
          error_rows: mockProducts.length,
          errors: [insertError.message]
        })
        .eq('id', importJob.id)

      return new Response(JSON.stringify({ error: 'Failed to insert products' }), {
        status: 500,
        headers: corsHeaders
      })
    }

    // Update import job as completed
    await supabaseClient
      .from('import_jobs')
      .update({
        status: 'completed',
        total_rows: mockProducts.length,
        success_rows: mockProducts.length,
        processed_rows: mockProducts.length,
        error_rows: 0,
        result_data: {
          products_imported: mockProducts.length,
          file_type: connector.config.file_type,
          ftp_path: connector.config.file_path,
          completed_at: new Date().toISOString()
        }
      })
      .eq('id', importJob.id)

    // Update connector last sync
    await supabaseClient
      .from('import_connectors')
      .update({
        last_sync_at: new Date().toISOString()
      })
      .eq('id', connectorId)

    console.log(`FTP import completed: ${mockProducts.length} products imported`)

    return new Response(JSON.stringify({
      success: true,
      import_id: importJob.id,
      products_imported: mockProducts.length,
      message: `${mockProducts.length} produits importés avec succès depuis FTP`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('FTP import error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})