import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/secure-cors.ts'

/**
 * Automated Sync - CRON-triggered function
 * 
 * Security: This function is designed for CRON triggers.
 * It requires x-cron-secret header for authentication.
 */

interface SyncJob {
  id: string;
  user_id: string;
  supplier_id: string;
  job_type: 'full_sync' | 'incremental' | 'inventory_only' | 'price_only';
  status: string;
  scheduled_at: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req, corsHeaders)
  if (preflightResponse) return preflightResponse

  try {
    // CRON authentication - only accept requests with valid cron secret
    const cronSecret = req.headers.get('x-cron-secret')
    const expectedSecret = Deno.env.get('CRON_SECRET')
    
    if (!expectedSecret) {
      console.error('CRON_SECRET not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'CRON not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (cronSecret !== expectedSecret) {
      console.warn('Invalid CRON secret attempt')
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Starting automated sync process (CRON authenticated)...')

    // Get pending sync jobs - each job is scoped to its user_id
    const { data: jobs, error: jobsError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10)

    if (jobsError) {
      console.error('❌ Error fetching sync jobs:', jobsError)
      throw jobsError
    }

    console.log(`📋 Found ${jobs?.length || 0} pending sync jobs`)

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending sync jobs',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    // Process each job - IMPORTANT: each job has its own user_id scope
    for (const job of jobs) {
      console.log(`🚀 Processing sync job: ${job.id} for user: ${job.user_id}`)
      
      try {
        // Update job status to running
        await supabase
          .from('import_jobs')
          .update({ 
            status: 'running',
            started_at: new Date().toISOString()
          })
          .eq('id', job.id)
          .eq('user_id', job.user_id) // Scope to user

        // Process different job types
        const result = await processSyncJob(job, supabase)
        
        // Update job status to completed
        await supabase
          .from('import_jobs')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            result_data: result
          })
          .eq('id', job.id)
          .eq('user_id', job.user_id) // Scope to user

        results.push({ jobId: job.id, success: true, result })
        console.log(`✅ Completed sync job: ${job.id}`)

      } catch (error) {
        console.error(`❌ Error processing job ${job.id}:`, error)
        
        // Update job status to failed
        await supabase
          .from('import_jobs')
          .update({ 
            status: 'failed',
            completed_at: new Date().toISOString(),
            errors: [(error as Error).message]
          })
          .eq('id', job.id)
          .eq('user_id', job.user_id) // Scope to user

        results.push({ jobId: job.id, success: false, error: (error as Error).message })
      }
    }

    // Run maintenance tasks
    await runMaintenanceTasks(supabase)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${jobs.length} sync jobs`,
        results,
        processed: jobs.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Automated sync error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function processSyncJob(job: any, supabase: any) {
  const { source_type, user_id } = job
  
  console.log(`📦 Processing ${source_type} sync for user ${user_id}`)

  switch (source_type) {
    case 'supplier_api':
      return await processSupplierSync(job, supabase)
    
    case 'inventory_update':
      return await processInventorySync(job, supabase)
    
    case 'price_update':
      return await processPriceSync(job, supabase)
    
    case 'order_sync':
      return await processOrderSync(job, supabase)
    
    default:
      throw new Error(`Unknown sync type: ${source_type}`)
  }
}

async function processSupplierSync(job: any, supabase: any) {
  const userId = job.user_id
  console.log(`🔗 Syncing supplier products for job ${job.id}`)
  
  // Get user's suppliers with their integrations - SCOPED TO USER
  const { data: suppliers, error: suppliersError } = await supabase
    .from('suppliers')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (suppliersError) throw suppliersError

  let totalProcessed = 0
  let totalErrors = 0

  for (const supplier of suppliers || []) {
    try {
      console.log(`🔄 Fetching products from ${supplier.name} (${supplier.supplier_type})`)
      
      let products = []
      
      switch (supplier.supplier_type) {
        case 'bigbuy':
          const bigbuyResult = await supabase.functions.invoke('bigbuy-integration', {
            body: {
              action: 'fetch_products',
              supplier_id: supplier.id,
              limit: job.batch_size || 100
            }
          })
          products = bigbuyResult.data?.products || []
          break
          
        case 'aliexpress':
          const aliexpressResult = await supabase.functions.invoke('aliexpress-integration', {
            body: {
              action: 'search_products',
              keywords: supplier.search_keywords || 'trending',
              limit: job.batch_size || 50
            }
          })
          products = aliexpressResult.data?.products || []
          break
          
        default:
          console.warn(`⚠️ Unknown supplier type: ${supplier.supplier_type}. Skipping.`)
          continue
      }
      
      // Insert/update products - SCOPED TO USER
      for (const product of products) {
        try {
          await supabase.from('imported_products').upsert({
            user_id: userId, // Always use job's user_id
            supplier_name: supplier.name,
            supplier_id: supplier.id,
            external_id: product.external_id || product.sku,
            name: product.name || product.title,
            description: product.description,
            price: product.price,
            cost_price: product.cost_price || product.costPrice,
            currency: product.currency || 'EUR',
            sku: product.sku,
            category: product.category,
            brand: product.brand,
            stock_quantity: product.stock || product.stock_quantity || 0,
            image_urls: product.images || product.image_urls || [],
            status: 'draft',
            updated_at: new Date().toISOString()
          }, { onConflict: 'external_id,user_id' })
          totalProcessed++
        } catch (error) {
          console.error(`Error upserting product ${product.sku}: ${(error as Error).message}`)
          totalErrors++
        }
      }

      console.log(`✅ Processed ${products.length} products from ${supplier.name}`)

    } catch (error) {
      console.error(`❌ Error syncing supplier ${supplier.name}:`, error)
      totalErrors++
    }
  }

  return {
    type: 'supplier_sync',
    suppliers_processed: suppliers?.length || 0,
    products_processed: totalProcessed,
    errors: totalErrors
  }
}

async function processInventorySync(job: any, supabase: any) {
  const userId = job.user_id
  console.log(`📦 Updating inventory for job ${job.id}`)
  
  // Get products that need inventory updates - SCOPED TO USER
  const { data: products, error: productsError } = await supabase
    .from('imported_products')
    .select('*, suppliers!inner(*)')
    .eq('user_id', userId)
    .not('supplier_id', 'is', null)
    .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(100)

  if (productsError) throw productsError

  let updated = 0
  let errors = 0
  
  const productsBySupplier = (products || []).reduce((acc: Record<string, any[]>, product: any) => {
    const supplierId = product.supplier_id
    if (!acc[supplierId]) acc[supplierId] = []
    acc[supplierId].push(product)
    return acc
  }, {} as Record<string, any[]>)
  
  for (const [supplierId, supplierProducts] of Object.entries(productsBySupplier)) {
    const supplier = (supplierProducts as any[])[0].suppliers
    
    try {
      let inventoryData: any[] = []
      
      switch (supplier.supplier_type) {
        case 'bigbuy':
          const bigbuyResult = await supabase.functions.invoke('bigbuy-integration', {
            body: {
              action: 'fetch_inventory',
              product_ids: (supplierProducts as any[]).map(p => p.external_id)
            }
          })
          inventoryData = bigbuyResult.data?.inventory || []
          break
          
        case 'aliexpress':
          console.log(`⚠️ Inventory sync not supported for AliExpress`)
          continue
          
        default:
          console.warn(`⚠️ Unknown supplier type: ${supplier.supplier_type}`)
          continue
      }
      
      for (const inventoryItem of inventoryData) {
        const product = (supplierProducts as any[]).find(p => p.external_id === inventoryItem.product_id)
        if (!product) continue
        
        // Update with user scope
        await supabase
          .from('imported_products')
          .update({ 
            stock_quantity: inventoryItem.stock || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
          .eq('user_id', userId)
        
        updated++
      }
      
    } catch (error) {
      console.error(`❌ Error updating inventory for supplier ${supplier.name}:`, error)
      errors += (supplierProducts as any[]).length
    }
  }

  return {
    type: 'inventory_sync',
    products_updated: updated,
    errors
  }
}

async function processPriceSync(job: any, supabase: any) {
  const userId = job.user_id
  console.log(`💰 Updating prices for job ${job.id}`)
  
  // Get products for price updates - SCOPED TO USER
  const { data: products, error: productsError } = await supabase
    .from('imported_products')
    .select('*, suppliers!inner(*)')
    .eq('user_id', userId)
    .not('supplier_id', 'is', null)
    .limit(50)

  if (productsError) throw productsError

  let updated = 0
  let errors = 0
  
  const productsBySupplier = (products || []).reduce((acc: Record<string, any[]>, product: any) => {
    const supplierId = product.supplier_id
    if (!acc[supplierId]) acc[supplierId] = []
    acc[supplierId].push(product)
    return acc
  }, {} as Record<string, any[]>)
  
  for (const [supplierId, supplierProducts] of Object.entries(productsBySupplier)) {
    const supplier = (supplierProducts as any[])[0].suppliers
    
    try {
      let pricingData: any[] = []
      
      switch (supplier.supplier_type) {
        case 'bigbuy':
          const bigbuyResult = await supabase.functions.invoke('bigbuy-integration', {
            body: {
              action: 'fetch_pricing',
              product_ids: (supplierProducts as any[]).map(p => p.external_id)
            }
          })
          pricingData = bigbuyResult.data?.pricing || []
          break
          
        case 'aliexpress':
          const aliexpressResult = await supabase.functions.invoke('aliexpress-integration', {
            body: {
              action: 'get_product_details',
              product_ids: (supplierProducts as any[]).map(p => p.external_id)
            }
          })
          pricingData = aliexpressResult.data?.products || []
          break
          
        default:
          console.warn(`⚠️ Unknown supplier type: ${supplier.supplier_type}`)
          continue
      }
      
      for (const priceItem of pricingData) {
        const product = (supplierProducts as any[]).find(
          p => p.external_id === priceItem.product_id || p.external_id === priceItem.id
        )
        if (!product) continue
        
        // Update with user scope
        await supabase
          .from('imported_products')
          .update({ 
            price: priceItem.price || priceItem.retail_price,
            cost_price: priceItem.cost_price || priceItem.wholesale_price,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
          .eq('user_id', userId)
        
        updated++
      }
      
    } catch (error) {
      console.error(`❌ Error updating prices for supplier ${supplier.name}:`, error)
      errors += (supplierProducts as any[]).length
    }
  }

  return {
    type: 'price_sync',
    products_updated: updated,
    errors
  }
}

async function processOrderSync(job: any, supabase: any) {
  const userId = job.user_id
  console.log(`📋 Syncing orders for job ${job.id}`)
  
  // Get recent orders for tracking updates - SCOPED TO USER
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .not('platform_order_id', 'is', null)
    .in('status', ['pending', 'processing', 'shipped'])
    .limit(20)

  if (ordersError) throw ordersError

  let updated = 0
  let errors = 0
  
  for (const order of orders || []) {
    try {
      // Order status sync would go here - currently placeholder
      console.log(`⚠️ Order sync for ${order.id} - implementation pending`)
      
    } catch (error) {
      console.error(`❌ Error syncing order ${order.id}:`, error)
      errors++
    }
  }

  return {
    type: 'order_sync',
    orders_checked: orders?.length || 0,
    orders_updated: updated,
    errors
  }
}

async function runMaintenanceTasks(supabase: any) {
  console.log('🔧 Running maintenance tasks...')
  
  // Clean up old completed jobs (older than 30 days)
  const { error: cleanupError } = await supabase
    .from('import_jobs')
    .delete()
    .in('status', ['completed', 'failed'])
    .lt('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  if (cleanupError) {
    console.error('Cleanup error:', cleanupError)
  } else {
    console.log('✅ Maintenance tasks completed')
  }
}
