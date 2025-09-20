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
  source_type: 'shopify' | 'woocommerce' | 'bigbuy' | 'aliexpress' | 'internal'
  target_type: 'shopify' | 'woocommerce' | 'bigbuy' | 'aliexpress' | 'internal'
  sync_type: 'stock' | 'price' | 'both'
  frequency_minutes: number
  is_active: boolean
  conflict_resolution: 'source_wins' | 'target_wins' | 'highest_wins' | 'manual'
  last_sync_at?: string
  next_sync_at?: string
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
      .from('imported_products')
      .select('*')
      .eq('user_id', rule.user_id)
      .neq('stock_quantity', null)
      .limit(100)

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }

    if (!products || products.length === 0) {
      console.log('No products found for sync')
      return results
    }

    // Process each product
    for (const product of products) {
      try {
        // Simulate external API call to get/update stock
        const externalStock = await getExternalStock(rule, product.sku)
        const currentStock = product.stock_quantity || 0

        let newStock = currentStock
        let hasConflict = false

        if (direction === 'source_to_target') {
          // Update local stock from external source
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
          // Update external stock from local
          await updateExternalStock(rule, product.sku, currentStock)
        }

        if (!hasConflict && newStock !== currentStock) {
          // Update local stock
          const { error: updateError } = await supabase
            .from('imported_products')
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
    // Get products that need price sync
    const { data: products, error: productsError } = await supabase
      .from('imported_products')
      .select('*')
      .eq('user_id', rule.user_id)
      .neq('price', null)
      .limit(100)

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`)
    }

    if (!products || products.length === 0) {
      console.log('No products found for price sync')
      return results
    }

    // Process each product
    for (const product of products) {
      try {
        // Simulate external API call to get/update price
        const externalPrice = await getExternalPrice(rule, product.sku)
        const currentPrice = parseFloat(product.price) || 0

        let newPrice = currentPrice
        let hasConflict = false

        if (direction === 'source_to_target') {
          // Update local price from external source
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
          // Update external price from local
          await updateExternalPrice(rule, product.sku, currentPrice)
        }

        if (!hasConflict && Math.abs(newPrice - currentPrice) > 0.01) {
          // Update local price
          const { error: updateError } = await supabase
            .from('imported_products')
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

// Simulate external API calls
async function getExternalStock(rule: SyncRule, sku: string): Promise<number> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Return random stock between 0-100 for demo
  return Math.floor(Math.random() * 101)
}

async function getExternalPrice(rule: SyncRule, sku: string): Promise<number> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Return random price between 10-500 for demo
  return Math.round((Math.random() * 490 + 10) * 100) / 100
}

async function updateExternalStock(rule: SyncRule, sku: string, stock: number): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150))
  console.log(`Updated external stock for ${sku}: ${stock}`)
}

async function updateExternalPrice(rule: SyncRule, sku: string, price: number): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150))
  console.log(`Updated external price for ${sku}: ${price}`)
}

async function executeSyncRule(rule: SyncRule): Promise<SyncJob> {
  const jobId = crypto.randomUUID()
  const startTime = new Date().toISOString()

  console.log(`Starting sync job ${jobId} for rule ${rule.id}`)

  // Create sync job record
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

    // Process stock sync if needed
    if (rule.sync_type === 'stock' || rule.sync_type === 'both') {
      console.log('Processing stock sync...')
      results.stock = await processStockSync(rule, 'source_to_target')
    }

    // Process price sync if needed
    if (rule.sync_type === 'price' || rule.sync_type === 'both') {
      console.log('Processing price sync...')
      results.price = await processPriceSync(rule, 'source_to_target')
    }

    // Update sync job with results
    syncJob.status = 'completed'
    syncJob.completed_at = new Date().toISOString()
    syncJob.processed_items = results.stock.processed + results.price.processed
    syncJob.failed_items = results.stock.failed + results.price.failed
    syncJob.conflicts = results.stock.conflicts + results.price.conflicts
    syncJob.sync_details = results

    // Update rule's last sync time and success rate
    const totalItems = syncJob.processed_items + syncJob.failed_items
    const successRate = totalItems > 0 ? (syncJob.processed_items / totalItems) * 100 : 100

    // Log sync activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: rule.user_id,
        action: 'bidirectional_sync',
        description: `Sync completed: ${syncJob.processed_items} items processed, ${syncJob.failed_items} failed, ${syncJob.conflicts} conflicts`,
        metadata: {
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

    // Log error
    await supabase
      .from('activity_logs')
      .insert({
        user_id: rule.user_id,
        action: 'bidirectional_sync_error',
        description: `Sync failed: ${error.message}`,
        metadata: {
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, rule_id, user_id } = await req.json()

    if (action === 'execute_rule') {
      // Execute a specific sync rule
      if (!rule_id) {
        return new Response(
          JSON.stringify({ error: 'rule_id is required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      // Mock rule data for demo
      const mockRule: SyncRule = {
        id: rule_id,
        user_id: user_id || 'demo-user',
        name: 'Demo Sync Rule',
        source_type: 'internal',
        target_type: 'shopify',
        sync_type: 'both',
        frequency_minutes: 15,
        is_active: true,
        conflict_resolution: 'source_wins',
        success_rate: 95,
        configuration: {}
      }

      const syncJob = await executeSyncRule(mockRule)

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
      // Return mock active rules for demo
      const mockRules = [
        {
          id: '1',
          name: 'Shopify ↔ Stock Central',
          sync_type: 'both',
          frequency_minutes: 15,
          is_active: true,
          next_sync_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'BigBuy → Catalogue',
          sync_type: 'price',
          frequency_minutes: 60,
          is_active: true,
          next_sync_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }
      ]

      return new Response(
        JSON.stringify({
          success: true,
          rules: mockRules
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