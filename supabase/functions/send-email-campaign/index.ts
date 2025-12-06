import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface EmailCampaignRequest {
  campaignId?: string;
  to?: string | string[];
  subject: string;
  body: string;
  segment?: string;
  sendNow?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { campaignId, to, subject, body, segment, sendNow }: EmailCampaignRequest = await req.json();
    
    console.log(`Processing email campaign for user ${user.id}`);

    let recipients: string[] = [];

    // Get recipients based on segment or direct list
    if (to) {
      recipients = Array.isArray(to) ? to : [to];
    } else if (segment) {
      // Fetch contacts from CRM based on segment
      let query = supabase
        .from('crm_contacts')
        .select('email')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .not('email', 'is', null);

      if (segment === 'vip') {
        query = query.gte('total_spent', 1000);
      } else if (segment === 'new') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('created_at', thirtyDaysAgo.toISOString());
      } else if (segment === 'inactive') {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        query = query.lte('last_activity_at', ninetyDaysAgo.toISOString());
      }

      const { data: contacts, error: contactsError } = await query;
      
      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        throw new Error('Failed to fetch contacts');
      }

      recipients = contacts?.map(c => c.email).filter(Boolean) || [];
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No recipients found'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Sending to ${recipients.length} recipients`);

    // Send emails using Resend API (or fallback to logging)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const email of recipients) {
      try {
        if (resendApiKey) {
          // Real email sending via Resend
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
              html: formatEmailHtml(body)
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
          }

          results.push({ email, success: true });
        } else {
          // Fallback: Log email (development mode)
          console.log(`[DEV] Email would be sent to: ${email}`);
          console.log(`[DEV] Subject: ${subject}`);
          console.log(`[DEV] Body: ${body.substring(0, 200)}...`);
          results.push({ email, success: true });
        }
      } catch (error) {
        console.error(`Failed to send to ${email}:`, error);
        results.push({ email, success: false, error: error.message });
      }
    }

    // Update campaign status if campaignId provided
    if (campaignId) {
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

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
        .eq('id', campaignId);
    }

    // Log the campaign execution
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
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
      });

    return new Response(JSON.stringify({
      success: true,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total: recipients.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Email campaign error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

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
  `;
}
