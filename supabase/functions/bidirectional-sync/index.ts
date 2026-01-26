import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface SyncRule {
  id: string
  user_id: string
  name: string
  source_type: string
  target_type: string
  sync_type: 'stock' | 'price' | 'both'
  frequency_minutes: number
  is_active: boolean
  conflict_resolution: 'source_wins' | 'target_wins' | 'highest_wins' | 'manual'
  integration_id?: string
  last_sync_at?: string
  success_rate: number
  configuration: any
}

interface SyncJob {
  id: string
  rule_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  sync_type: 'stock' | 'price' | 'both'
  direction: 'source_to_target' | 'target_to_source' | 'bidirectional'
  processed_items: number
  failed_items: number
  conflicts: number
  started_at: string
  completed_at?: string
  error_details?: any
  sync_details: any
}

// Fetch real external stock from integration
async function getExternalStock(rule: SyncRule, sku: string): Promise<number | null> {
  if (!rule.integration_id) {
    return null
  }

  // Get integration credentials
  const { data: integration } = await supabase
    .from('integrations')
    .select('platform, config, store_url')
    .eq('id', rule.integration_id)
    .single()

  if (!integration) {
    console.log(`No integration found for rule ${rule.id}`)
    return null
  }

  // Get stock from supplier_products or product_channel_mappings
  const { data: mapping } = await supabase
    .from('product_channel_mappings')
    .select('external_product_id, last_synced_stock')
    .eq('integration_id', rule.integration_id)
    .eq('local_sku', sku)
    .single()

  if (mapping?.last_synced_stock !== undefined) {
    return mapping.last_synced_stock
  }

  // Fall back to supplier_products
  const { data: supplierProduct } = await supabase
    .from('supplier_products')
    .select('stock_quantity')
    .eq('sku', sku)
    .single()

  return supplierProduct?.stock_quantity ?? null
}

// Fetch real external price from integration
async function getExternalPrice(rule: SyncRule, sku: string): Promise<number | null> {
  if (!rule.integration_id) {
    return null
  }

  // Get last synced price from mappings
  const { data: mapping } = await supabase
    .from('product_channel_mappings')
    .select('external_product_id, last_synced_price')
    .eq('integration_id', rule.integration_id)
    .eq('local_sku', sku)
    .single()

  if (mapping?.last_synced_price !== undefined) {
    return mapping.last_synced_price
  }

  // Fall back to supplier_products
  const { data: supplierProduct } = await supabase
    .from('supplier_products')
    .select('selling_price')
    .eq('sku', sku)
    .single()

  return supplierProduct?.selling_price ?? null
}

// Update external stock via integration
async function updateExternalStock(rule: SyncRule, sku: string, stock: number): Promise<boolean> {
  console.log(`Updating external stock for ${sku}: ${stock}`)
  
  // Queue sync to channel
  await supabase
    .from('unified_sync_queue')
    .insert({
      user_id: rule.user_id,
      sync_type: 'stock',
      entity_type: 'product',
      action: 'update',
      priority: 2,
      payload: { sku, stock_quantity: stock, integration_id: rule.integration_id }
    })

  return true
}

// Update external price via integration
async function updateExternalPrice(rule: SyncRule, sku: string, price: number): Promise<boolean> {
  console.log(`Updating external price for ${sku}: ${price}`)
  
  // Queue sync to channel
  await supabase
    .from('unified_sync_queue')
    .insert({
      user_id: rule.user_id,
      sync_type: 'price',
      entity_type: 'product',
      action: 'update',
      priority: 3,
      payload: { sku, price, integration_id: rule.integration_id }
    })

  return true
}

async function processStockSync(rule: SyncRule, direction: 'source_to_target' | 'target_to_source') {
  console.log(`Processing stock sync for rule ${rule.id}, direction: ${direction}`)
  
  const results = {
    processed: 0,
    failed: 0,
    conflicts: 0,
    details: [] as any[]
  }

  try {
    // Get products that need stock sync
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, sku, stock_quantity, updated_at')
      .eq('user_id', rule.user_id)
      .not('stock_quantity', 'is', null)
      .limit(100)

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }

    if (!products || products.length === 0) {
      console.log('No products found for sync')
      return results
    }

    for (const product of products) {
      try {
        const externalStock = await getExternalStock(rule, product.sku)
        const currentStock = product.stock_quantity || 0

        if (externalStock === null) {
          results.details.push({
            product_id: product.id,
            sku: product.sku,
            skipped: true,
            reason: 'No external stock data available'
          })
          continue
        }

        let newStock = currentStock
        let hasConflict = false

        if (direction === 'source_to_target') {
          if (externalStock !== currentStock) {
            if (rule.conflict_resolution === 'source_wins') {
              newStock = externalStock
            } else if (rule.conflict_resolution === 'highest_wins') {
              newStock = Math.max(externalStock, currentStock)
            } else if (rule.conflict_resolution === 'manual') {
              hasConflict = true
              results.conflicts++
            }
          }
        } else {
          await updateExternalStock(rule, product.sku, currentStock)
        }

        if (!hasConflict && newStock !== currentStock) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ 
              stock_quantity: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', product.id)

          if (updateError) {
            console.error(`Failed to update product ${product.id}:`, updateError)
            results.failed++
          } else {
            results.processed++
            results.details.push({
              product_id: product.id,
              sku: product.sku,
              old_stock: currentStock,
              new_stock: newStock,
              external_stock: externalStock
            })
          }
        } else if (!hasConflict) {
          results.processed++
        }

      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error)
        results.failed++
        results.details.push({
          product_id: product.id,
          sku: product.sku,
          error: error.message
        })
      }
    }

  } catch (error) {
    console.error('Error in processStockSync:', error)
    throw error
  }

  return results
}

async function processPriceSync(rule: SyncRule, direction: 'source_to_target' | 'target_to_source') {
  console.log(`Processing price sync for rule ${rule.id}, direction: ${direction}`)
  
  const results = {
    processed: 0,
    failed: 0,
    conflicts: 0,
    details: [] as any[]
  }

  try {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, sku, price, updated_at')
      .eq('user_id', rule.user_id)
      .not('price', 'is', null)
      .limit(100)

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }

    if (!products || products.length === 0) {
      console.log('No products found for price sync')
      return results
    }

    for (const product of products) {
      try {
        const externalPrice = await getExternalPrice(rule, product.sku)
        const currentPrice = parseFloat(product.price) || 0

        if (externalPrice === null) {
          results.details.push({
            product_id: product.id,
            sku: product.sku,
            skipped: true,
            reason: 'No external price data available'
          })
          continue
        }

        let newPrice = currentPrice
        let hasConflict = false

        if (direction === 'source_to_target') {
          if (Math.abs(externalPrice - currentPrice) > 0.01) {
            if (rule.conflict_resolution === 'source_wins') {
              newPrice = externalPrice
            } else if (rule.conflict_resolution === 'highest_wins') {
              newPrice = Math.max(externalPrice, currentPrice)
            } else if (rule.conflict_resolution === 'manual') {
              hasConflict = true
              results.conflicts++
            }
          }
        } else {
          await updateExternalPrice(rule, product.sku, currentPrice)
        }

        if (!hasConflict && Math.abs(newPrice - currentPrice) > 0.01) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ 
              price: newPrice,
              updated_at: new Date().toISOString()
            })
            .eq('id', product.id)

          if (updateError) {
            console.error(`Failed to update product ${product.id}:`, updateError)
            results.failed++
          } else {
            results.processed++
            results.details.push({
              product_id: product.id,
              sku: product.sku,
              old_price: currentPrice,
              new_price: newPrice,
              external_price: externalPrice
            })
          }
        } else if (!hasConflict) {
          results.processed++
        }

      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error)
        results.failed++
        results.details.push({
          product_id: product.id,
          sku: product.sku,
          error: error.message
        })
      }
    }

  } catch (error) {
    console.error('Error in processPriceSync:', error)
    throw error
  }

  return results
}

async function executeSyncRule(rule: SyncRule): Promise<SyncJob> {
  const jobId = crypto.randomUUID()
  const startTime = new Date().toISOString()

  console.log(`Starting sync job ${jobId} for rule ${rule.id}`)

  const syncJob: SyncJob = {
    id: jobId,
    rule_id: rule.id,
    status: 'running',
    sync_type: rule.sync_type,
    direction: 'bidirectional',
    processed_items: 0,
    failed_items: 0,
    conflicts: 0,
    started_at: startTime,
    sync_details: {}
  }

  try {
    const results = {
      stock: { processed: 0, failed: 0, conflicts: 0, details: [] },
      price: { processed: 0, failed: 0, conflicts: 0, details: [] }
    }

    if (rule.sync_type === 'stock' || rule.sync_type === 'both') {
      console.log('Processing stock sync...')
      results.stock = await processStockSync(rule, 'source_to_target')
    }

    if (rule.sync_type === 'price' || rule.sync_type === 'both') {
      console.log('Processing price sync...')
      results.price = await processPriceSync(rule, 'source_to_target')
    }

    syncJob.status = 'completed'
    syncJob.completed_at = new Date().toISOString()
    syncJob.processed_items = results.stock.processed + results.price.processed
    syncJob.failed_items = results.stock.failed + results.price.failed
    syncJob.conflicts = results.stock.conflicts + results.price.conflicts
    syncJob.sync_details = results

    await supabase
      .from('activity_logs')
      .insert({
        user_id: rule.user_id,
        action: 'bidirectional_sync',
        description: `Sync completed: ${syncJob.processed_items} items processed, ${syncJob.failed_items} failed, ${syncJob.conflicts} conflicts`,
        details: {
          rule_id: rule.id,
          rule_name: rule.name,
          sync_type: rule.sync_type,
          results: syncJob.sync_details,
          job_id: jobId
        },
        severity: syncJob.failed_items > 0 ? 'warning' : 'info'
      })

    console.log(`Sync job ${jobId} completed successfully`)

  } catch (error) {
    console.error(`Sync job ${jobId} failed:`, error)
    
    syncJob.status = 'failed'
    syncJob.completed_at = new Date().toISOString()
    syncJob.error_details = {
      message: error.message,
      stack: error.stack
    }

    await supabase
      .from('activity_logs')
      .insert({
        user_id: rule.user_id,
        action: 'bidirectional_sync_error',
        description: `Sync failed: ${error.message}`,
        details: {
          rule_id: rule.id,
          rule_name: rule.name,
          error: error.message,
          job_id: jobId
        },
        severity: 'error'
      })
  }

  return syncJob
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, rule_id, user_id } = await req.json()

    if (action === 'execute_rule') {
      if (!rule_id) {
        return new Response(
          JSON.stringify({ error: 'rule_id is required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      // Fetch real rule from database
      const { data: rule, error: ruleError } = await supabase
        .from('sync_configurations')
        .select(`
          id,
          user_id,
          integration_id,
          sync_products,
          sync_stock,
          sync_prices,
          sync_frequency,
          is_active,
          conflict_resolution
        `)
        .eq('id', rule_id)
        .single()

      if (ruleError || !rule) {
        return new Response(
          JSON.stringify({ error: 'Sync rule not found' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        )
      }

      // Map to SyncRule interface
      const syncRule: SyncRule = {
        id: rule.id,
        user_id: rule.user_id,
        name: `Sync ${rule.id}`,
        source_type: 'internal',
        target_type: 'channel',
        sync_type: rule.sync_stock && rule.sync_prices ? 'both' : (rule.sync_stock ? 'stock' : 'price'),
        frequency_minutes: parseInt(rule.sync_frequency) || 15,
        is_active: rule.is_active,
        conflict_resolution: rule.conflict_resolution || 'source_wins',
        integration_id: rule.integration_id,
        success_rate: 100,
        configuration: {}
      }

      const syncJob = await executeSyncRule(syncRule)

      return new Response(
        JSON.stringify({
          success: true,
          job: syncJob
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'get_active_rules') {
      // Fetch real active rules from database
      const { data: rules, error: rulesError } = await supabase
        .from('sync_configurations')
        .select(`
          id,
          user_id,
          integration_id,
          sync_products,
          sync_stock,
          sync_prices,
          sync_frequency,
          is_active,
          last_full_sync_at,
          platform
        `)
        .eq('user_id', user_id)
        .eq('is_active', true)
        .limit(50)

      if (rulesError) {
        throw rulesError
      }

      const formattedRules = (rules || []).map(r => ({
        id: r.id,
        name: `${r.platform || 'Channel'} Sync`,
        sync_type: r.sync_stock && r.sync_prices ? 'both' : (r.sync_stock ? 'stock' : 'price'),
        frequency_minutes: parseInt(r.sync_frequency) || 15,
        is_active: r.is_active,
        last_sync_at: r.last_full_sync_at,
        next_sync_at: r.last_full_sync_at 
          ? new Date(new Date(r.last_full_sync_at).getTime() + (parseInt(r.sync_frequency) || 15) * 60 * 1000).toISOString()
          : null
      }))

      return new Response(
        JSON.stringify({
          success: true,
          rules: formattedRules
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )

  } catch (error) {
    console.error('Bidirectional sync error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
