import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  connectorId?: string;
  fullSync?: boolean;
  category?: string;
  limit?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { connectorId, fullSync = false, category, limit = 100 }: SyncRequest = await req.json()

    console.log('Starting supplier sync', { connectorId, fullSync, category, limit })

    // Get all active supplier connectors or a specific one
    let query = supabase
      .from('supplier_connectors')
      .select('*')
      .eq('status', 'connected')

    if (connectorId) {
      query = query.eq('connector_id', connectorId)
    }

    const { data: connectors, error: connectorsError } = await query

    if (connectorsError) {
      throw connectorsError
    }

    if (!connectors || connectors.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active connectors found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const results = []

    for (const connector of connectors) {
      try {
        console.log(`Syncing connector: ${connector.connector_id}`)

        // Simulate API call to supplier (would be real implementation with actual connectors)
        const syncResult = await simulateSupplierSync(connector, {
          fullSync,
          category,
          limit
        })

        // Update last sync time
        await supabase
          .from('supplier_connectors')
          .update({ 
            last_sync_at: new Date().toISOString(),
            error_message: null
          })
          .eq('id', connector.id)

        // Log sync activity
        await supabase
          .from('activity_logs')
          .insert({
            user_id: connector.user_id,
            action: 'supplier_sync',
            description: `Synchronized ${syncResult.imported} products from ${connector.connector_id}`,
            metadata: {
              connector_id: connector.connector_id,
              total_products: syncResult.total,
              imported_products: syncResult.imported,
              duplicates: syncResult.duplicates,
              errors: syncResult.errors
            }
          })

        results.push({
          connector_id: connector.connector_id,
          success: true,
          ...syncResult
        })

      } catch (error) {
        console.error(`Error syncing connector ${connector.connector_id}:`, error)

        // Update connector with error
        await supabase
          .from('supplier_connectors')
          .update({ 
            error_message: error.message,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', connector.id)

        results.push({
          connector_id: connector.connector_id,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        synced_connectors: results.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Sync suppliers error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function simulateSupplierSync(connector: any, options: any) {
  // This would be replaced with actual connector implementations
  const connectorMap: Record<string, () => Promise<any>> = {
    'shopify': () => syncShopifyProducts(connector, options),
    'cdiscount': () => syncCdiscountProducts(connector, options),
    'eprolo': () => syncEproloProducts(connector, options),
    'syncee': () => syncSynceeProducts(connector, options),
    'vidaxl': () => syncVidaXLProducts(connector, options),
    'printful': () => syncPrintfulProducts(connector, options),
  }

  const syncFunction = connectorMap[connector.connector_id]
  if (!syncFunction) {
    throw new Error(`Unsupported connector: ${connector.connector_id}`)
  }

  return await syncFunction()
}

async function syncShopifyProducts(connector: any, options: any) {
  console.log('Syncing Shopify products...')
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Simulate product sync results
  return {
    total: options.limit || 100,
    imported: Math.floor((options.limit || 100) * 0.8),
    duplicates: Math.floor((options.limit || 100) * 0.15),
    errors: []
  }
}

async function syncCdiscountProducts(connector: any, options: any) {
  console.log('Syncing Cdiscount products...')
  
  await new Promise(resolve => setTimeout(resolve, 1500))

  return {
    total: options.limit || 100,
    imported: Math.floor((options.limit || 100) * 0.7),
    duplicates: Math.floor((options.limit || 100) * 0.2),
    errors: ['Some products missing required fields']
  }
}

async function syncEproloProducts(connector: any, options: any) {
  console.log('Syncing Eprolo products...')
  
  await new Promise(resolve => setTimeout(resolve, 800))

  return {
    total: options.limit || 100,
    imported: Math.floor((options.limit || 100) * 0.9),
    duplicates: Math.floor((options.limit || 100) * 0.05),
    errors: []
  }
}

async function syncSynceeProducts(connector: any, options: any) {
  console.log('Syncing Syncee products...')
  
  await new Promise(resolve => setTimeout(resolve, 1200))

  return {
    total: options.limit || 100,
    imported: Math.floor((options.limit || 100) * 0.75),
    duplicates: Math.floor((options.limit || 100) * 0.1),
    errors: []
  }
}

async function syncVidaXLProducts(connector: any, options: any) {
  console.log('Syncing VidaXL products...')
  
  await new Promise(resolve => setTimeout(resolve, 2000))

  return {
    total: options.limit || 100,
    imported: Math.floor((options.limit || 100) * 0.6),
    duplicates: Math.floor((options.limit || 100) * 0.25),
    errors: ['Rate limit exceeded', 'Some categories unavailable']
  }
}

async function syncPrintfulProducts(connector: any, options: any) {
  console.log('Syncing Printful products...')
  
  await new Promise(resolve => setTimeout(resolve, 1000))

  return {
    total: options.limit || 100,
    imported: Math.floor((options.limit || 100) * 0.85),
    duplicates: Math.floor((options.limit || 100) * 0.1),
    errors: []
  }
}