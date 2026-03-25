/**
 * Brevo Hub — Email Marketing & Automation Edge Function
 * Handles: campaigns, transactional emails, abandoned cart recovery, welcome flows
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ─── Brevo API Helper ────────────────────────────────────────────
async function brevoRequest(endpoint: string, body: any, method = 'POST') {
  const apiKey = Deno.env.get('BREVO_API_KEY')
  if (!apiKey) throw new Error('BREVO_API_KEY not configured')

  const res = await fetch(`https://api.brevo.com/v3${endpoint}`, {
    method,
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Brevo API error (${res.status}): ${errText}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return await res.json()
  }
  return { success: true }
}

// ─── Main Handler ────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { action, ...params } = await req.json()

    console.log(`[brevo-hub] Action: ${action}`)

    switch (action) {
      // ── Send transactional email ──
      case 'send_transactional': {
        const { to, subject, htmlContent, textContent, sender, tags, params: templateParams } = params

        const emailData: any = {
          to: Array.isArray(to) ? to.map((e: string) => ({ email: e })) : [{ email: to }],
          subject,
          htmlContent: htmlContent || undefined,
          textContent: textContent || undefined,
          sender: sender || { name: 'ShopOpti', email: 'noreply@shopopti.io' },
          tags: tags || ['transactional'],
        }

        if (templateParams) emailData.params = templateParams

        const result = await brevoRequest('/smtp/email', emailData)
        return jsonResponse({ success: true, messageId: result.messageId })
      }

      // ── Send campaign ──
      case 'send_campaign': {
        const { name, subject, htmlContent, listIds, scheduledAt, userId } = params

        // Create campaign
        const campaign = await brevoRequest('/emailCampaigns', {
          name: name || `Campaign ${new Date().toISOString()}`,
          subject,
          htmlContent: wrapEmailTemplate(htmlContent),
          sender: { name: 'ShopOpti', email: 'noreply@shopopti.io' },
          recipients: { listIds: listIds || [] },
          scheduledAt,
        })

        // If no schedule, send immediately
        if (!scheduledAt && campaign.id) {
          await brevoRequest(`/emailCampaigns/${campaign.id}/sendNow`, {})
        }

        // Log in DB
        if (userId) {
          await supabase.from('activity_logs').insert({
            user_id: userId,
            action: 'brevo_campaign_sent',
            entity_type: 'campaign',
            description: `Campagne email "${name}" envoyée via Brevo`,
            details: { campaign_id: campaign.id, subject },
          })
        }

        return jsonResponse({ success: true, campaignId: campaign.id })
      }

      // ── Abandoned cart recovery email ──
      case 'abandoned_cart_email': {
        const { customerEmail, customerName, cartItems, cartValue, currency = 'EUR', recoveryUrl } = params

        const itemsHtml = (cartItems || [])
          .map((item: any) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${item.price} ${currency}</td>
            </tr>
          `)
          .join('')

        const htmlContent = `
          <h2>Vous avez oublié quelque chose ! 🛒</h2>
          <p>Bonjour ${customerName || ''},</p>
          <p>Votre panier vous attend avec ces articles :</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="padding:8px;text-align:left;">Article</th>
                <th style="padding:8px;text-align:center;">Qté</th>
                <th style="padding:8px;text-align:right;">Prix</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:8px;font-weight:bold;">Total</td>
                <td style="padding:8px;text-align:right;font-weight:bold;">${cartValue} ${currency}</td>
              </tr>
            </tfoot>
          </table>
          <div style="text-align:center;margin:24px 0;">
            <a href="${recoveryUrl || '#'}" style="background:#6366f1;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
              Récupérer mon panier →
            </a>
          </div>
          <p style="color:#888;font-size:13px;">Cette offre expire dans 24h.</p>
        `

        const result = await brevoRequest('/smtp/email', {
          to: [{ email: customerEmail, name: customerName }],
          subject: `${customerName ? customerName + ', v' : 'V'}otre panier vous attend ! 🛒`,
          htmlContent: wrapEmailTemplate(htmlContent),
          sender: { name: 'ShopOpti', email: 'noreply@shopopti.io' },
          tags: ['abandoned_cart', 'recovery'],
        })

        return jsonResponse({ success: true, messageId: result.messageId })
      }

      // ── Welcome sequence ──
      case 'welcome_email': {
        const { customerEmail, customerName, storeUrl } = params

        const htmlContent = `
          <h2>Bienvenue chez ShopOpti ! 🎉</h2>
          <p>Bonjour ${customerName || ''},</p>
          <p>Merci de rejoindre notre communauté ! Voici comment démarrer :</p>
          <ol style="line-height:2;">
            <li>📦 <strong>Importez vos premiers produits</strong> depuis nos fournisseurs</li>
            <li>🎨 <strong>Personnalisez votre boutique</strong> avec notre éditeur</li>
            <li>🚀 <strong>Lancez vos premières campagnes</strong> marketing</li>
          </ol>
          <div style="text-align:center;margin:24px 0;">
            <a href="${storeUrl || '#'}" style="background:#6366f1;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
              Commencer maintenant →
            </a>
          </div>
        `

        const result = await brevoRequest('/smtp/email', {
          to: [{ email: customerEmail, name: customerName }],
          subject: 'Bienvenue sur ShopOpti ! 🚀',
          htmlContent: wrapEmailTemplate(htmlContent),
          sender: { name: 'ShopOpti', email: 'noreply@shopopti.io' },
          tags: ['welcome', 'onboarding'],
        })

        return jsonResponse({ success: true, messageId: result.messageId })
      }

      // ── Add/update contact in Brevo ──
      case 'upsert_contact': {
        const { email, attributes, listIds } = params

        const contactData: any = {
          email,
          attributes: attributes || {},
          updateEnabled: true,
        }
        if (listIds) contactData.listIds = listIds

        const result = await brevoRequest('/contacts', contactData)
        return jsonResponse({ success: true, contact: result })
      }

      // ── Get campaign stats ──
      case 'get_campaign_stats': {
        const { campaignId } = params
        const result = await brevoRequest(`/emailCampaigns/${campaignId}`, null, 'GET')
        return jsonResponse({
          success: true,
          stats: {
            delivered: result.statistics?.globalStats?.delivered || 0,
            opened: result.statistics?.globalStats?.uniqueOpens || 0,
            clicked: result.statistics?.globalStats?.uniqueClicks || 0,
            unsubscribed: result.statistics?.globalStats?.unsubscriptions || 0,
            bounced: result.statistics?.globalStats?.hardBounces || 0,
          },
        })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('[brevo-hub] Error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ─── Helpers ─────────────────────────────────────────────────────
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function wrapEmailTemplate(content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;}
  .wrapper{max-width:600px;margin:0 auto;padding:20px;}
  .header{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:30px;border-radius:8px 8px 0 0;text-align:center;}
  .content{background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;}
  .footer{background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;}
</style></head><body>
<div class="wrapper">
  <div class="header"><h1 style="margin:0;font-size:24px;">ShopOpti</h1></div>
  <div class="content">${content}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} ShopOpti — Tous droits réservés</p>
    <p><a href="{{unsubscribe}}" style="color:#6b7280;">Se désabonner</a></p>
  </div>
</div>
</body></html>`
}
