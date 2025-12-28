import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
])

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action') // 'open' or 'click'
  const campaignId = url.searchParams.get('campaign_id')
  const recipientId = url.searchParams.get('recipient_id')
  const email = url.searchParams.get('email')
  const redirectUrl = url.searchParams.get('url')

  console.log(`[track-email] Action: ${action}, Campaign: ${campaignId}, Recipient: ${recipientId}, Email: ${email}`)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const userAgent = req.headers.get('user-agent') || ''
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown'

    if (action === 'open' && (campaignId || recipientId)) {
      console.log(`[track-email] Recording open event`)
      
      // Update recipient record if we have recipient_id
      if (recipientId) {
        const { error: recipientError } = await supabase
          .from('campaign_recipients')
          .update({ 
            opened_at: new Date().toISOString(),
            status: 'opened'
          })
          .eq('id', recipientId)
          .is('opened_at', null) // Only update if not already opened

        if (recipientError) {
          console.error('[track-email] Error updating recipient:', recipientError)
        }
      }

      // Log the event
      if (campaignId && email) {
        // Get user_id from campaign
        const { data: campaign } = await supabase
          .from('email_campaigns')
          .select('user_id')
          .eq('id', campaignId)
          .single()

        if (campaign) {
          await supabase.from('email_sending_logs').insert({
            campaign_id: campaignId,
            recipient_email: decodeURIComponent(email),
            status: 'opened',
            user_agent: userAgent,
            ip_address: ipAddress,
            user_id: campaign.user_id,
            event_data: { action: 'open', timestamp: new Date().toISOString() }
          })
        }
      }

      // Update campaign stats
      if (campaignId) {
        await supabase.rpc('increment_campaign_opens', { p_campaign_id: campaignId }).catch(() => {
          // Fallback if RPC doesn't exist
          console.log('[track-email] RPC not available, updating stats directly')
        })
      }

      // Return tracking pixel
      return new Response(TRACKING_PIXEL, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    if (action === 'click' && redirectUrl) {
      console.log(`[track-email] Recording click event, redirecting to: ${redirectUrl}`)

      // Update recipient record if we have recipient_id
      if (recipientId) {
        const { error: recipientError } = await supabase
          .from('campaign_recipients')
          .update({ 
            clicked_at: new Date().toISOString(),
            status: 'clicked'
          })
          .eq('id', recipientId)

        if (recipientError) {
          console.error('[track-email] Error updating recipient click:', recipientError)
        }
      }

      // Log the click event
      if (campaignId && email) {
        const { data: campaign } = await supabase
          .from('email_campaigns')
          .select('user_id')
          .eq('id', campaignId)
          .single()

        if (campaign) {
          await supabase.from('email_sending_logs').insert({
            campaign_id: campaignId,
            recipient_email: decodeURIComponent(email),
            status: 'clicked',
            user_agent: userAgent,
            ip_address: ipAddress,
            user_id: campaign.user_id,
            event_data: { 
              action: 'click', 
              url: decodeURIComponent(redirectUrl),
              timestamp: new Date().toISOString() 
            }
          })
        }
      }

      // Redirect to the target URL
      const decodedUrl = decodeURIComponent(redirectUrl)
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': decodedUrl,
          'Cache-Control': 'no-store'
        }
      })
    }

    // Default: return transparent pixel
    return new Response(TRACKING_PIXEL, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store'
      }
    })

  } catch (error) {
    console.error('[track-email] Error:', error)
    
    // Still return the pixel even on error to not break email rendering
    return new Response(TRACKING_PIXEL, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store'
      }
    })
  }
})
