import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Order Tracking - Real API Integration
 * 
 * This function tracks packages using:
 * - 17Track API (primary)
 * - AfterShip API (fallback)
 * 
 * Required secrets:
 * - TRACK17_API_KEY: For 17Track API
 * - AFTERSHIP_API_KEY: For AfterShip API (optional fallback)
 */

interface TrackingProvider {
  name: string;
  api_key: string;
  endpoint: string;
  supported_carriers: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, tracking_number, carrier, order_id } = await req.json();

    console.log(`📦 Order tracking request: ${action} for ${tracking_number || order_id}`);

    switch (action) {
      case 'track':
        return await trackPackage(tracking_number, carrier, supabase);
      
      case 'update_all':
        return await updateAllTrackingNumbers(supabase);
      
      case 'setup_tracking':
        return await setupOrderTracking(order_id, tracking_number, carrier, supabase);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('❌ Order tracking error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function trackPackage(trackingNumber: string, carrier: string, supabase: any) {
  if (!trackingNumber) {
    throw new Error('Tracking number is required')
  }

  console.log(`🔍 Tracking package: ${trackingNumber} via ${carrier || 'auto-detect'}`);

  // Check for API keys
  const track17Key = Deno.env.get('TRACK17_API_KEY')
  const aftershipKey = Deno.env.get('AFTERSHIP_API_KEY')

  if (!track17Key && !aftershipKey) {
    throw new Error(
      'No tracking API configured. Please add TRACK17_API_KEY or AFTERSHIP_API_KEY in Secrets. ' +
      'Get your API key from https://www.17track.net/en/api or https://www.aftership.com/api'
    )
  }

  let trackingInfo: any = null
  let provider = 'unknown'

  // Try 17Track first
  if (track17Key) {
    try {
      trackingInfo = await fetch17TrackAPI(trackingNumber, carrier, track17Key)
      provider = '17track'
      console.log(`✅ 17Track returned tracking info`)
    } catch (error) {
      console.error('17Track failed:', error.message)
    }
  }

  // Fallback to AfterShip
  if (!trackingInfo && aftershipKey) {
    try {
      trackingInfo = await fetchAfterShipAPI(trackingNumber, carrier, aftershipKey)
      provider = 'aftership'
      console.log(`✅ AfterShip returned tracking info`)
    } catch (error) {
      console.error('AfterShip failed:', error.message)
    }
  }

  if (!trackingInfo) {
    throw new Error('Unable to fetch tracking information from any provider. Check API keys and tracking number.')
  }

  // Update order with tracking information
  await updateOrderTracking(trackingNumber, trackingInfo, supabase)

  return new Response(
    JSON.stringify({ 
      success: true,
      tracking_number: trackingNumber,
      carrier: carrier || trackingInfo.carrier_info?.name,
      tracking_info: trackingInfo,
      provider
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
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
  });

  if (!response.ok) {
    throw new Error(`17Track API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.code !== 0) {
    throw new Error(`17Track API error: ${data.message || 'Unknown error'}`);
  }

  if (!data.data?.accepted?.[0]) {
    throw new Error('No tracking data returned from 17Track');
  }

  const trackInfo = data.data.accepted[0];
  
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
  };
}

async function fetchAfterShipAPI(trackingNumber: string, carrier: string, apiKey: string) {
  // First, create tracking if not exists
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

  // Ignore 4001 error (already exists)
  if (!createResponse.ok) {
    const errorData = await createResponse.json()
    if (errorData.meta?.code !== 4001) {
      console.warn('AfterShip create tracking warning:', errorData)
    }
  }

  // Fetch tracking info
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
  if (!carrier) return 0 // Auto-detect
  
  const carrierMap: { [key: string]: number } = {
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
  };

  return carrierMap[carrier.toLowerCase()] || 0;
}

function mapTrackingStatus(status: string): string {
  if (!status) return 'unknown'
  
  const statusMap: { [key: string]: string } = {
    'InfoReceived': 'info_received',
    'InTransit': 'in_transit', 
    'OutForDelivery': 'out_for_delivery',
    'Delivered': 'delivered',
    'Exception': 'exception',
    'Expired': 'expired',
    'FailedAttempt': 'failed_attempt',
    'AvailableForPickup': 'available_for_pickup'
  };

  return statusMap[status] || status.toLowerCase().replace(/\s+/g, '_');
}

async function updateOrderTracking(trackingNumber: string, trackingInfo: any, supabase: any) {
  const { error } = await supabase
    .from('orders')
    .update({
      tracking_status: trackingInfo.status,
      tracking_info: trackingInfo,
      tracking_updated_at: new Date().toISOString()
    })
    .eq('tracking_number', trackingNumber);

  if (error) {
    console.error('❌ Error updating order tracking:', error);
  } else {
    console.log(`✅ Updated tracking for order ${trackingNumber}`);
  }

  // Log tracking update
  await supabase.from('activity_logs').insert({
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
  });
}

async function updateAllTrackingNumbers(supabase: any) {
  console.log('🔄 Updating all active tracking numbers...');

  // Check for API keys
  const track17Key = Deno.env.get('TRACK17_API_KEY')
  const aftershipKey = Deno.env.get('AFTERSHIP_API_KEY')

  if (!track17Key && !aftershipKey) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'No tracking API configured. Add TRACK17_API_KEY or AFTERSHIP_API_KEY in Secrets.',
        updated: 0,
        errors: 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get orders with tracking numbers that need updates
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, tracking_number, carrier, tracking_updated_at')
    .not('tracking_number', 'is', null)
    .in('status', ['processing', 'shipped'])
    .or(`tracking_updated_at.is.null,tracking_updated_at.lt.${new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()}`)
    .limit(50);

  if (ordersError) throw ordersError;

  console.log(`📦 Found ${orders?.length || 0} orders to update`);

  let updated = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  for (const order of orders || []) {
    try {
      console.log(`🔍 Updating tracking for ${order.tracking_number}`);
      
      let trackingInfo: any = null

      if (track17Key) {
        try {
          trackingInfo = await fetch17TrackAPI(order.tracking_number, order.carrier || 'DHL', track17Key)
        } catch (e) {
          console.warn(`17Track failed for ${order.tracking_number}:`, e.message)
        }
      }

      if (!trackingInfo && aftershipKey) {
        try {
          trackingInfo = await fetchAfterShipAPI(order.tracking_number, order.carrier || 'DHL', aftershipKey)
        } catch (e) {
          console.warn(`AfterShip failed for ${order.tracking_number}:`, e.message)
        }
      }

      if (trackingInfo) {
        await updateOrderTracking(order.tracking_number, trackingInfo, supabase)
        updated++;
      } else {
        throw new Error('No tracking provider returned data')
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Error updating tracking ${order.tracking_number}:`, error);
      errors++;
      errorMessages.push(`${order.tracking_number}: ${error.message}`)
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: `Updated ${updated} tracking numbers`,
      updated,
      errors,
      total: orders?.length || 0,
      error_details: errorMessages.slice(0, 5)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function setupOrderTracking(orderId: string, trackingNumber: string, carrier: string, supabase: any) {
  if (!orderId || !trackingNumber) {
    throw new Error('Order ID and tracking number are required')
  }

  console.log(`🔗 Setting up tracking for order ${orderId}: ${trackingNumber}`);

  // Update order with tracking information
  const { error } = await supabase
    .from('orders')
    .update({
      tracking_number: trackingNumber,
      carrier: carrier,
      status: 'shipped',
      tracking_status: 'info_received',
      tracking_updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) throw error;

  // Try to fetch initial tracking info
  let trackingInfo: any = { status: 'info_received', events: [] }
  
  const track17Key = Deno.env.get('TRACK17_API_KEY')
  const aftershipKey = Deno.env.get('AFTERSHIP_API_KEY')

  if (track17Key) {
    try {
      trackingInfo = await fetch17TrackAPI(trackingNumber, carrier, track17Key)
    } catch (e) {
      console.warn('Initial tracking fetch failed:', e.message)
    }
  } else if (aftershipKey) {
    try {
      trackingInfo = await fetchAfterShipAPI(trackingNumber, carrier, aftershipKey)
    } catch (e) {
      console.warn('Initial tracking fetch failed:', e.message)
    }
  }

  // Log the setup
  await supabase.from('activity_logs').insert({
    action: 'tracking_setup',
    entity_type: 'order',
    entity_id: orderId,
    description: `Tracking setup: ${trackingNumber} via ${carrier}`,
    details: {
      tracking_number: trackingNumber,
      carrier,
      initial_status: trackingInfo.status
    }
  });

  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Tracking setup completed',
      order_id: orderId,
      tracking_number: trackingNumber,
      carrier: carrier,
      tracking_info: trackingInfo
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
