import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tracking_number, carrier, provider = '17track' } = await req.json();

    if (!tracking_number) {
      throw new Error("Tracking number is required");
    }

    console.log(`Tracking package: ${tracking_number} with ${provider}`);

    let trackingInfo;

    switch (provider) {
      case '17track':
        trackingInfo = await track17Track(tracking_number, carrier);
        break;
      case 'aftership':
        trackingInfo = await trackAfterShip(tracking_number, carrier);
        break;
      case 'trackingmore':
        trackingInfo = await trackTrackingMore(tracking_number, carrier);
        break;
      default:
        // Try database lookup for historical data
        trackingInfo = await lookupDatabaseTracking(tracking_number);
    }

    return new Response(JSON.stringify(trackingInfo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Package tracking error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      tracking_number: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function lookupDatabaseTracking(trackingNumber: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Check orders table for tracking info
  const { data: order } = await supabase
    .from('orders')
    .select('id, tracking_number, shipping_carrier, shipping_status, updated_at')
    .eq('tracking_number', trackingNumber)
    .single();

  if (order) {
    return {
      success: true,
      tracking_number: trackingNumber,
      status: order.shipping_status || 'pending',
      carrier: order.shipping_carrier || 'Unknown',
      location: null,
      estimated_delivery: null,
      events: [],
      provider: 'database',
      last_updated: order.updated_at,
      source: 'internal'
    };
  }

  return {
    success: false,
    tracking_number: trackingNumber,
    error: 'No tracking information found. Please configure tracking API keys (SEVENTEENTRACK_API_KEY or AFTERSHIP_API_KEY) for live tracking.',
    provider: 'none'
  };
}

async function track17Track(trackingNumber: string, carrier?: string) {
  const apiKey = Deno.env.get('SEVENTEENTRACK_API_KEY');
  
  if (!apiKey) {
    console.log('17TRACK API key not configured');
    return {
      success: false,
      tracking_number: trackingNumber,
      error: 'SEVENTEENTRACK_API_KEY not configured. Please add this secret to enable live tracking.',
      provider: '17TRACK'
    };
  }

  try {
    const response = await fetch('https://api.17track.net/track/v2.2/gettrackinfo', {
      method: 'POST',
      headers: {
        '17token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        number: trackingNumber,
        carrier: carrier || 0, // 0 for auto-detect
      }]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`17Track API error: ${response.status}`, errorText);
      return {
        success: false,
        tracking_number: trackingNumber,
        error: `17Track API error: ${response.status}`,
        provider: '17TRACK'
      };
    }

    const data = await response.json();
    
    if (data.dat && data.dat.length > 0) {
      const track = data.dat[0];
      return {
        success: true,
        tracking_number: trackingNumber,
        status: mapTrackingStatus(track.track?.e || '0'),
        carrier: track.track?.c || carrier || 'Unknown',
        location: track.track?.z || '',
        estimated_delivery: null,
        events: (track.track?.z1 || []).map((e: any) => ({
          status: e.d || e.z,
          location: e.l || '',
          date: e.a || new Date().toISOString()
        })),
        provider: '17TRACK',
        last_updated: new Date().toISOString(),
      };
    }

    return {
      success: false,
      tracking_number: trackingNumber,
      error: 'No tracking data returned from 17Track',
      provider: '17TRACK'
    };
  } catch (error) {
    console.error('17Track API error:', error);
    return {
      success: false,
      tracking_number: trackingNumber,
      error: error.message,
      provider: '17TRACK'
    };
  }
}

async function trackAfterShip(trackingNumber: string, carrier?: string) {
  const apiKey = Deno.env.get('AFTERSHIP_API_KEY');
  
  if (!apiKey) {
    console.log('AfterShip API key not configured');
    return {
      success: false,
      tracking_number: trackingNumber,
      error: 'AFTERSHIP_API_KEY not configured. Please add this secret to enable live tracking.',
      provider: 'AfterShip'
    };
  }

  try {
    // First, try to get existing tracking
    let trackingData = null;
    
    const getResponse = await fetch(
      `https://api.aftership.com/v4/trackings/${carrier || 'auto-detect'}/${trackingNumber}`,
      {
        headers: {
          'aftership-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (getResponse.ok) {
      const getData = await getResponse.json();
      trackingData = getData.data?.tracking;
    } else if (getResponse.status === 404) {
      // Create tracking if it doesn't exist
      const createResponse = await fetch('https://api.aftership.com/v4/trackings', {
        method: 'POST',
        headers: {
          'aftership-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracking: {
            tracking_number: trackingNumber,
            slug: carrier || 'auto-detect',
          }
        }),
      });

      if (createResponse.ok) {
        const createData = await createResponse.json();
        trackingData = createData.data?.tracking;
      }
    }

    if (trackingData) {
      return {
        success: true,
        tracking_number: trackingNumber,
        status: trackingData.tag || 'Pending',
        carrier: trackingData.slug || carrier,
        location: trackingData.origin_country_iso3 || '',
        estimated_delivery: trackingData.expected_delivery,
        events: (trackingData.checkpoints || []).map((c: any) => ({
          status: c.message,
          location: c.location || c.city || '',
          date: c.checkpoint_time
        })),
        provider: 'AfterShip',
        last_updated: trackingData.updated_at,
      };
    }

    return {
      success: false,
      tracking_number: trackingNumber,
      error: 'Unable to track package with AfterShip',
      provider: 'AfterShip'
    };
  } catch (error) {
    console.error('AfterShip API error:', error);
    return {
      success: false,
      tracking_number: trackingNumber,
      error: error.message,
      provider: 'AfterShip'
    };
  }
}

async function trackTrackingMore(trackingNumber: string, carrier?: string) {
  const apiKey = Deno.env.get('TRACKINGMORE_API_KEY');
  
  if (!apiKey) {
    console.log('TrackingMore API key not configured');
    return {
      success: false,
      tracking_number: trackingNumber,
      error: 'TRACKINGMORE_API_KEY not configured. Please add this secret to enable live tracking.',
      provider: 'TrackingMore'
    };
  }

  try {
    const response = await fetch(
      `https://api.trackingmore.com/v3/trackings/${carrier || 'auto-detect'}/${trackingNumber}`,
      {
        headers: {
          'Tracking-Api-Key': apiKey,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      return {
        success: true,
        tracking_number: trackingNumber,
        status: data.data?.delivery_status || 'pending',
        carrier: data.data?.carrier_code || carrier,
        location: data.data?.origin_info?.country || '',
        estimated_delivery: data.data?.estimated_delivery_date,
        events: (data.data?.origin_info?.trackinfo || []).map((t: any) => ({
          status: t.StatusDescription,
          location: t.Details || '',
          date: t.Date
        })),
        provider: 'TrackingMore',
        last_updated: data.data?.updated_at || new Date().toISOString(),
      };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      tracking_number: trackingNumber,
      error: errorData.meta?.message || `TrackingMore API error: ${response.status}`,
      provider: 'TrackingMore'
    };
  } catch (error) {
    console.error('TrackingMore API error:', error);
    return {
      success: false,
      tracking_number: trackingNumber,
      error: error.message,
      provider: 'TrackingMore'
    };
  }
}

function mapTrackingStatus(status: string): string {
  const statusMap: Record<string, string> = {
    '0': 'pending',
    '10': 'in_transit',
    '20': 'in_transit',
    '30': 'in_transit',
    '35': 'out_for_delivery',
    '40': 'delivered',
    '50': 'exception',
  };
  
  return statusMap[status] || 'unknown';
}
