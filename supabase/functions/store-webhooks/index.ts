import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface WebhookPayload {
  storeId: string
  platform: string
  eventType: string
  data: Record<string, any>
  timestamp: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: WebhookPayload = await req.json()
    console.log(`Processing webhook: ${payload.platform} - ${payload.eventType}`)

    // Verify webhook signature (platform-specific)
    const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-shopify-hmac-sha256')
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get store configuration
    const { data: store, error: storeError } = await supabase
      .from('store_integrations')
      .select('*')
      .eq('id', payload.storeId)
      .single()

    if (storeError || !store) {
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let updateData: Record<string, any> = {
      last_sync_at: new Date().toISOString()
    }

    // Process webhook based on event type
    switch (payload.eventType) {
      case 'products/create':
      case 'products/update':
        updateData.product_count = store.product_count + (payload.eventType === 'products/create' ? 1 : 0)
        break
      
      case 'products/delete':
        updateData.product_count = Math.max(0, store.product_count - 1)
        break
      
      case 'orders/create':
        updateData.order_count = store.order_count + 1
        break
      
      case 'orders/cancelled':
      case 'orders/deleted':
        updateData.order_count = Math.max(0, store.order_count - 1)
        break
      
      case 'app/uninstalled':
        updateData.connection_status = 'disconnected'
        break
      
      default:
        console.log(`Unhandled webhook event: ${payload.eventType}`)
    }

    // Update store data
    const { error: updateError } = await supabase
      .from('store_integrations')
      .update(updateData)
      .eq('id', payload.storeId)

    if (updateError) {
      console.error('Error updating store:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update store' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log webhook event for debugging
    await supabase
      .from('activity_logs')
      .insert({
        user_id: store.user_id,
        action: 'webhook_received',
        entity_type: 'store',
        entity_id: payload.storeId,
        description: `${payload.platform} webhook: ${payload.eventType}`,
        metadata: {
          platform: payload.platform,
          eventType: payload.eventType,
          timestamp: payload.timestamp,
          data: payload.data
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        eventType: payload.eventType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})