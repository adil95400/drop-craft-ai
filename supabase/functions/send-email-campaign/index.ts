/**
 * Send Email Campaign - Secure Implementation
 * P1.1: Auth obligatoire, rate limiting, validation Zod, scoping user_id
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser, logSecurityEvent, checkRateLimit } from '../_shared/secure-auth.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const RequestSchema = z.object({
  campaignId: z.string().uuid().optional(),
  to: z.union([z.string().email(), z.array(z.string().email()).max(500)]).optional(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
  segment: z.enum(['all', 'vip', 'new', 'inactive']).optional(),
  sendNow: z.boolean().optional().default(true)
})

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 1. Auth obligatoire - userId provient du token uniquement
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id
    
    // 2. Rate limiting: max 10 campaigns per hour
    const rateCheck = await checkRateLimit(supabase, userId, 'email_campaign', 10, 60)
    if (!rateCheck) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Max 10 email campaigns per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Parse and validate input
    const body = await req.json()
    const parseResult = RequestSchema.safeParse(body)
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request',
          details: parseResult.error.flatten()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { campaignId, to, subject, body: emailBody, segment, sendNow } = parseResult.data
    
    console.log(`[SECURE] Processing email campaign for user ${userId}`)

    let recipients: string[] = []

    // Get recipients based on segment or direct list
    if (to) {
      recipients = Array.isArray(to) ? to : [to]
    } else if (segment) {
      // Fetch contacts from CRM based on segment - SCOPED to user
      let query = supabase
        .from('crm_contacts')
        .select('email')
        .eq('user_id', userId) // CRITICAL: scope to user
        .eq('status', 'active')
        .not('email', 'is', null)

      if (segment === 'vip') {
        query = query.gte('total_spent', 1000)
      } else if (segment === 'new') {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        query = query.gte('created_at', thirtyDaysAgo.toISOString())
      } else if (segment === 'inactive') {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        query = query.lte('last_activity_at', ninetyDaysAgo.toISOString())
      }

      const { data: contacts, error: contactsError } = await query
      
      if (contactsError) {
        console.error('Error fetching contacts:', contactsError)
        throw new Error('Failed to fetch contacts')
      }

      recipients = contacts?.map((c: any) => c.email).filter(Boolean) || []
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No recipients found'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Sending to ${recipients.length} recipients`)

    // Send emails using Resend API (or fallback to logging)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const results: { email: string; success: boolean; error?: string }[] = []

    for (const email of recipients) {
      try {
        if (resendApiKey) {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'ShopOpti <noreply@shopopti.io>',
              to: email,
              subject: subject,
              html: formatEmailHtml(emailBody)
            })
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(errorText)
          }

          results.push({ email, success: true })
        } else {
          // Fallback: Log email (development mode)
          console.log(`[DEV] Email would be sent to: ${email}`)
          results.push({ email, success: true })
        }
      } catch (error) {
        console.error(`Failed to send to ${email}:`, error)
        results.push({ email, success: false, error: error.message })
      }
    }

    // Update campaign status if campaignId provided - SCOPED to user
    if (campaignId) {
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      await supabase
        .from('automated_campaigns')
        .update({
          status: 'sent',
          last_executed_at: new Date().toISOString(),
          current_metrics: {
            sent: successCount,
            failed: failCount,
            total_recipients: recipients.length,
            sent_at: new Date().toISOString()
          }
        })
        .eq('id', campaignId)
        .eq('user_id', userId) // CRITICAL: scope to user
    }

    // Log the campaign execution - SCOPED to user
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId, // CRITICAL: from token only
        action: 'email_campaign_sent',
        entity_type: 'campaign',
        entity_id: campaignId,
        description: `Email campaign sent to ${recipients.length} recipients`,
        metadata: {
          subject,
          segment,
          success_count: results.filter(r => r.success).length,
          fail_count: results.filter(r => !r.success).length
        }
      })

    // Log security event
    await logSecurityEvent(supabase, userId, 'email_campaign_sent', 'info', {
      campaign_id: campaignId,
      recipients_count: recipients.length,
      success_count: results.filter(r => r.success).length
    })

    return new Response(JSON.stringify({
      success: true,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total: recipients.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Email campaign error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' }
    })
  }
})

function formatEmailHtml(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    .button:hover { background: #4f46e5; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">ShopOpti</h1>
  </div>
  <div class="content">
    ${body.replace(/\n/g, '<br>')}
  </div>
  <div class="footer">
    <p>Cet email a été envoyé par ShopOpti</p>
    <p><a href="{{unsubscribe_url}}">Se désabonner</a></p>
  </div>
</body>
</html>
  `
}
