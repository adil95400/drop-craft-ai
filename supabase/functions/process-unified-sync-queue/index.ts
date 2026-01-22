import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('🔄 Processing unified sync queue...')

    // Get pending items ordered by priority and scheduled time
    const { data: queueItems, error: queueError } = await supabase
      .from('unified_sync_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: true })
      .order('scheduled_at', { ascending: true })
      .limit(50)

    if (queueError) throw queueError

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending items in queue', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${queueItems.length} items to process`)

    const results: any[] = []
    const syncFunctionMap: Record<string, string> = {
      'products': 'sync-products-to-channels',
      'prices': 'sync-prices-to-channels',
      'stock': 'sync-stock-to-channels',
      'orders': 'sync-orders-to-channels',
      'customers': 'sync-customers-to-channels',
      'tracking': 'sync-tracking-to-channels',
      'fulfillment': 'sync-tracking-to-channels'
    }

    // Group items by sync type for batch processing
    const groupedItems = queueItems.reduce((acc: Record<string, any[]>, item) => {
      const type = item.sync_type
      if (!acc[type]) acc[type] = []
      acc[type].push(item)
      return acc
    }, {})

    for (const [syncType, items] of Object.entries(groupedItems)) {
      const functionName = syncFunctionMap[syncType]
      if (!functionName) {
        console.log(`No sync function for type: ${syncType}`)
        continue
      }

      console.log(`Processing ${items.length} ${syncType} items`)

      for (const item of items) {
        try {
          // Mark as processing
          await supabase
            .from('unified_sync_queue')
            .update({ 
              status: 'processing', 
              started_at: new Date().toISOString() 
            })
            .eq('id', item.id)

          // Call the appropriate sync function
          const { data, error } = await supabase.functions.invoke(functionName, {
            body: {
              user_id: item.user_id,
              queue_id: item.id,
              entity_id: item.entity_id,
              entity_type: item.entity_type,
              action: item.action,
              channels: item.channels,
              payload: item.payload
            }
          })

          if (error) throw error

          // Mark as completed
          await supabase
            .from('unified_sync_queue')
            .update({ 
              status: 'completed', 
              completed_at: new Date().toISOString() 
            })
            .eq('id', item.id)

          results.push({
            id: item.id,
            sync_type: syncType,
            success: true,
            data
          })

        } catch (error) {
          console.error(`Error processing item ${item.id}:`, error)

          const newRetryCount = (item.retry_count || 0) + 1
          const shouldRetry = newRetryCount < (item.max_retries || 3)

          await supabase
            .from('unified_sync_queue')
            .update({
              status: shouldRetry ? 'pending' : 'failed',
              retry_count: newRetryCount,
              error_message: error.message,
              scheduled_at: shouldRetry 
                ? new Date(Date.now() + Math.pow(2, newRetryCount) * 60000).toISOString() // Exponential backoff
                : undefined
            })
            .eq('id', item.id)

          results.push({
            id: item.id,
            sync_type: syncType,
            success: false,
            error: error.message,
            will_retry: shouldRetry
          })
        }
      }
    }

    // Clean up old completed/failed items (older than 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    await supabase
      .from('unified_sync_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('updated_at', sevenDaysAgo.toISOString())

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        succeeded: successCount,
        failed: failCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Process queue error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
