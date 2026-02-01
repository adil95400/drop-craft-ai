import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/secure-cors.ts'
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '../_shared/rate-limit.ts'

/**
 * Order Tracking - Enterprise-Safe
 * 
 * Security:
 * - JWT authentication required for user-initiated actions
 * - CRON secret for batch updates
 * - Rate limiting per user
 * - User data scoping
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  const preflightResponse = handleCorsPreflightRequest(req, corsHeaders)
  if (preflightResponse) return preflightResponse

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { action, tracking_number, carrier, order_id } = body

    console.log(`📦 Order tracking request: ${action}`)

    // For update_all action, allow CRON authentication
    if (action === 'update_all') {
      const cronSecret = req.headers.get('x-cron-secret')
      const expectedSecret = Deno.env.get('CRON_SECRET')
      
      if (cronSecret === expectedSecret) {
        return await updateAllTrackingNumbers(supabase, corsHeaders)
      }
    }

    // All other actions require user authentication
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id

    // Rate limit
    const rateLimitResult = await checkRateLimit(
      supabase,
      userId,
      `order_tracking:${action}`,
      RATE_LIMITS.API_GENERAL
    )
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders)
    }

    switch (action) {
      case 'track':
        return await trackPackage(tracking_number, carrier, supabase, userId, corsHeaders)
      
      case 'update_all':
        // User-initiated update_all is scoped to their orders
        return await updateUserTrackingNumbers(supabase, userId, corsHeaders)
      
      case 'setup_tracking':
        return await setupOrderTracking(order_id, tracking_number, carrier, supabase, userId, corsHeaders)
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('❌ Order tracking error:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { 
        status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function trackPackage(
  trackingNumber: string, 
  carrier: string, 
  supabase: any, 
  userId: string,
  corsHeaders: Record<string, string>
) {
  if (!trackingNumber) {
    return new Response(
      JSON.stringify({ success: false, error: 'Tracking number is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify order belongs to user
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('tracking_number', trackingNumber)
    .eq('user_id', userId)
    .single()

  if (!order) {
    return new Response(
      JSON.stringify({ success: false, error: 'Order not found or not authorized' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log(`🔍 Tracking package: ${trackingNumber} via ${carrier || 'auto-detect'} for user: ${userId}`)

  const track17Key = Deno.env.get('TRACK17_API_KEY') || Deno.env.get('SEVENTEENTRACK_API_KEY')
  const aftershipKey = Deno.env.get('AFTERSHIP_API_KEY')

  if (!track17Key && !aftershipKey) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'No tracking API configured. Please add TRACK17_API_KEY or AFTERSHIP_API_KEY in Secrets.'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let trackingInfo: any = null
  let provider = 'unknown'

  if (track17Key) {
    try {
      trackingInfo = await fetch17TrackAPI(trackingNumber, carrier, track17Key)
      provider = '17track'
    } catch (error) {
      console.warn(`17Track failed for ${trackingNumber}:`, (error as Error).message)
    }
  }

  if (!trackingInfo && aftershipKey) {
    try {
      trackingInfo = await fetchAfterShipAPI(trackingNumber, carrier, aftershipKey)
      provider = 'aftership'
    } catch (error) {
      console.warn(`AfterShip failed for ${trackingNumber}:`, (error as Error).message)
    }
  }

  if (!trackingInfo) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unable to fetch tracking information from any provider' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update order with tracking info - SCOPED TO USER
  await updateOrderTracking(trackingNumber, trackingInfo, supabase, userId)

  return new Response(
    JSON.stringify({ 
      success: true,
      tracking_number: trackingNumber,
      carrier: carrier || trackingInfo.carrier_info?.name,
      tracking_info: trackingInfo,
      provider
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function fetch17TrackAPI(trackingNumber: string, carrier: string, apiKey: string) {
  const endpoint = 'https://api.17track.net/track/v2.2/gettrackinfo'
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      '17token': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{
      number: trackingNumber,
      carrier: get17TrackCarrierCode(carrier)
    }])
  })

  if (!response.ok) {
    throw new Error(`17Track API error: ${response.status}`)
  }

  const data = await response.json()
  
  if (data.code !== 0) {
    throw new Error(`17Track API error: ${data.message || 'Unknown error'}`)
  }

  if (!data.data?.accepted?.[0]) {
    throw new Error('No tracking data returned from 17Track')
  }

  const trackInfo = data.data.accepted[0]
  
  return {
    status: mapTrackingStatus(trackInfo.track_info?.latest_status?.status),
    latest_event: trackInfo.track_info?.latest_status?.status_description,
    location: trackInfo.track_info?.latest_status?.location,
    timestamp: trackInfo.track_info?.latest_status?.time_iso,
    events: (trackInfo.track_info?.tracking || []).map((event: any) => ({
      status: event.status_description,
      location: event.location,
      timestamp: event.time_iso,
      description: event.status_description
    })),
    estimated_delivery: trackInfo.track_info?.latest_status?.substatus_description,
    carrier_info: {
      name: trackInfo.carrier_code || carrier,
      website: trackInfo.carrier_url
    }
  }
}

async function fetchAfterShipAPI(trackingNumber: string, carrier: string, apiKey: string) {
  const createResponse = await fetch('https://api.aftership.com/v4/trackings', {
    method: 'POST',
    headers: {
      'aftership-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tracking: {
        tracking_number: trackingNumber,
        slug: carrier?.toLowerCase()
      }
    })
  })

  if (!createResponse.ok) {
    const errorData = await createResponse.json()
    if (errorData.meta?.code !== 4001) {
      console.warn('AfterShip create tracking warning:', errorData)
    }
  }

  const slug = carrier?.toLowerCase() || 'auto-detect'
  const response = await fetch(`https://api.aftership.com/v4/trackings/${slug}/${trackingNumber}`, {
    headers: {
      'aftership-api-key': apiKey,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`AfterShip API error: ${response.status}`)
  }

  const data = await response.json()
  const tracking = data.data?.tracking

  if (!tracking) {
    throw new Error('No tracking data returned from AfterShip')
  }

  return {
    status: tracking.tag?.toLowerCase() || 'unknown',
    latest_event: tracking.subtag_message,
    location: tracking.checkpoints?.[0]?.location || tracking.destination_country_iso3,
    timestamp: tracking.checkpoints?.[0]?.checkpoint_time,
    events: (tracking.checkpoints || []).map((cp: any) => ({
      status: cp.message,
      location: cp.location || `${cp.city || ''}, ${cp.country_name || ''}`.trim(),
      timestamp: cp.checkpoint_time,
      description: cp.message
    })),
    estimated_delivery: tracking.expected_delivery,
    carrier_info: {
      name: tracking.slug?.toUpperCase() || carrier,
      website: `https://track.aftership.com/${tracking.slug}/${trackingNumber}`
    }
  }
}

function get17TrackCarrierCode(carrier: string): number {
  if (!carrier) return 0
  
  const carrierMap: Record<string, number> = {
    'dhl': 2002,
    'fedex': 2000,
    'ups': 2003,
    'usps': 2001,
    'dpd': 2030,
    'gls': 2031,
    'colissimo': 2032,
    'chronopost': 2033,
    'postnl': 2029,
    'royal mail': 2028,
    'china post': 190,
    'yanwen': 1019,
    'cainiao': 1007
  }

  return carrierMap[carrier.toLowerCase()] || 0
}

function mapTrackingStatus(status: string): string {
  if (!status) return 'unknown'
  
  const statusMap: Record<string, string> = {
    'InfoReceived': 'info_received',
    'InTransit': 'in_transit', 
    'OutForDelivery': 'out_for_delivery',
    'Delivered': 'delivered',
    'Exception': 'exception',
    'Expired': 'expired',
    'FailedAttempt': 'failed_attempt',
    'AvailableForPickup': 'available_for_pickup'
  }

  return statusMap[status] || status.toLowerCase().replace(/\s+/g, '_')
}

async function updateOrderTracking(
  trackingNumber: string, 
  trackingInfo: any, 
  supabase: any, 
  userId: string
) {
  // Update with user scope
  const { error } = await supabase
    .from('orders')
    .update({
      tracking_status: trackingInfo.status,
      tracking_info: trackingInfo,
      tracking_updated_at: new Date().toISOString()
    })
    .eq('tracking_number', trackingNumber)
    .eq('user_id', userId) // CRITICAL: Scope to user

  if (error) {
    console.error('❌ Error updating order tracking:', error)
  } else {
    console.log(`✅ Updated tracking for order ${trackingNumber}`)
  }

  // Log tracking update - SCOPED TO USER
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'tracking_updated',
    entity_type: 'order',
    entity_id: trackingNumber,
    description: `Tracking status updated: ${trackingInfo.status}`,
    details: {
      tracking_number: trackingNumber,
      new_status: trackingInfo.status,
      carrier: trackingInfo.carrier_info?.name,
      latest_event: trackingInfo.latest_event
    }
  })
}

async function updateAllTrackingNumbers(supabase: any, corsHeaders: Record<string, string>) {
  console.log('🔄 CRON: Updating all active tracking numbers...')

  const track17Key = Deno.env.get('TRACK17_API_KEY') || Deno.env.get('SEVENTEENTRACK_API_KEY')
  const aftershipKey = Deno.env.get('AFTERSHIP_API_KEY')

  if (!track17Key && !aftershipKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'No tracking API configured', updated: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get all orders needing updates (no user filter for CRON)
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, user_id, tracking_number, carrier, tracking_updated_at')
    .not('tracking_number', 'is', null)
    .in('status', ['processing', 'shipped'])
    .or(`tracking_updated_at.is.null,tracking_updated_at.lt.${new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()}`)
    .limit(50)

  if (ordersError) throw ordersError

  console.log(`📦 Found ${orders?.length || 0} orders to update`)

  let updated = 0
  let errors = 0

  for (const order of orders || []) {
    try {
      let trackingInfo: any = null

      if (track17Key) {
        try {
          trackingInfo = await fetch17TrackAPI(order.tracking_number, order.carrier || 'DHL', track17Key)
        } catch (e) {
          console.warn(`17Track failed for ${order.tracking_number}`)
        }
      }

      if (!trackingInfo && aftershipKey) {
        try {
          trackingInfo = await fetchAfterShipAPI(order.tracking_number, order.carrier || 'DHL', aftershipKey)
        } catch (e) {
          console.warn(`AfterShip failed for ${order.tracking_number}`)
        }
      }

      if (trackingInfo) {
        // Update with user scope from order
        await updateOrderTracking(order.tracking_number, trackingInfo, supabase, order.user_id)
        updated++
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      console.error(`❌ Error updating tracking ${order.tracking_number}:`, error)
      errors++
    }
  }

  return new Response(
    JSON.stringify({ success: true, updated, errors, total: orders?.length || 0 }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateUserTrackingNumbers(
  supabase: any, 
  userId: string, 
  corsHeaders: Record<string, string>
) {
  console.log(`🔄 Updating tracking for user: ${userId}`)

  // Get user's orders needing updates - SCOPED TO USER
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, tracking_number, carrier, tracking_updated_at')
    .eq('user_id', userId)
    .not('tracking_number', 'is', null)
    .in('status', ['processing', 'shipped'])
    .limit(20)

  if (ordersError) throw ordersError

  const track17Key = Deno.env.get('TRACK17_API_KEY') || Deno.env.get('SEVENTEENTRACK_API_KEY')
  const aftershipKey = Deno.env.get('AFTERSHIP_API_KEY')

  let updated = 0
  let errors = 0

  for (const order of orders || []) {
    try {
      let trackingInfo: any = null

      if (track17Key) {
        try {
          trackingInfo = await fetch17TrackAPI(order.tracking_number, order.carrier || 'DHL', track17Key)
        } catch (e) {
          console.warn(`17Track failed for ${order.tracking_number}`)
        }
      }

      if (!trackingInfo && aftershipKey) {
        try {
          trackingInfo = await fetchAfterShipAPI(order.tracking_number, order.carrier || 'DHL', aftershipKey)
        } catch (e) {
          console.warn(`AfterShip failed for ${order.tracking_number}`)
        }
      }

      if (trackingInfo) {
        await updateOrderTracking(order.tracking_number, trackingInfo, supabase, userId)
        updated++
      }
      
      await new Promise(resolve => setTimeout(resolve, 300))

    } catch (error) {
      console.error(`❌ Error updating tracking ${order.tracking_number}:`, error)
      errors++
    }
  }

  return new Response(
    JSON.stringify({ success: true, updated, errors, total: orders?.length || 0 }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function setupOrderTracking(
  orderId: string, 
  trackingNumber: string, 
  carrier: string, 
  supabase: any,
  userId: string,
  corsHeaders: Record<string, string>
) {
  if (!orderId || !trackingNumber) {
    return new Response(
      JSON.stringify({ success: false, error: 'Order ID and tracking number are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log(`🔗 Setting up tracking for order ${orderId}: ${trackingNumber} (user: ${userId})`)

  // Verify order ownership and update - SCOPED TO USER
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single()

  if (orderError || !order) {
    return new Response(
      JSON.stringify({ success: false, error: 'Order not found or not authorized' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { error } = await supabase
    .from('orders')
    .update({
      tracking_number: trackingNumber,
      carrier: carrier,
      status: 'shipped',
      tracking_status: 'info_received',
      tracking_updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('user_id', userId) // CRITICAL: Scope to user

  if (error) throw error

  // Log setup - SCOPED TO USER
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'tracking_setup',
    entity_type: 'order',
    entity_id: orderId,
    description: `Tracking setup: ${trackingNumber} via ${carrier}`,
    details: { tracking_number: trackingNumber, carrier }
  })

  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Tracking setup completed',
      order_id: orderId,
      tracking_number: trackingNumber,
      carrier: carrier
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
