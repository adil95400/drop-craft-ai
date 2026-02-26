import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/slack/api'

const SEVERITY_CONFIG: Record<string, { emoji: string; color: string }> = {
  critical: { emoji: '🔴', color: '#dc2626' },
  high: { emoji: '🟠', color: '#ea580c' },
  warning: { emoji: '⚠️', color: '#eab308' },
  info: { emoji: 'ℹ️', color: '#3b82f6' },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const SLACK_API_KEY = Deno.env.get('SLACK_API_KEY')
    if (!SLACK_API_KEY) {
      throw new Error('SLACK_API_KEY is not configured')
    }

    const { channel, alert_type, title, message, severity, metadata } = await req.json()

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const targetChannel = channel || '#alerts'
    const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.info

    // Build Slack Block Kit message
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${config.emoji} ${title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Type:*\n\`${alert_type || 'system'}\`` },
          { type: 'mrkdwn', text: `*Sévérité:*\n\`${severity || 'info'}\`` },
        ],
      },
    ]

    if (message) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: message },
      } as any)
    }

    if (metadata && Object.keys(metadata).length > 0) {
      const metaFields = Object.entries(metadata)
        .slice(0, 10)
        .map(([k, v]) => `• *${k}:* ${v}`)
        .join('\n')
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `*Détails:*\n${metaFields}` },
      } as any)
    }

    blocks.push({
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `ShopOpti+ • ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}` },
      ],
    } as any)

    // Send to Slack via connector gateway
    const slackResponse = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': SLACK_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: targetChannel,
        text: `${config.emoji} ${title}: ${message || ''}`,
        blocks,
        unfurl_links: false,
      }),
    })

    const slackData = await slackResponse.json()

    if (!slackResponse.ok || !slackData.ok) {
      console.error('Slack API error:', JSON.stringify(slackData))
      throw new Error(`Slack API call failed [${slackResponse.status}]: ${JSON.stringify(slackData)}`)
    }

    console.log('Slack alert sent successfully:', title)
    return new Response(
      JSON.stringify({ success: true, channel: targetChannel, ts: slackData.ts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Error sending Slack alert:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
