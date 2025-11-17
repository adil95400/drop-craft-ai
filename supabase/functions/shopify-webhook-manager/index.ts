import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { action, integration_id, topics } = await req.json();

    console.log('Webhook manager action:', { action, integration_id, topics });

    // Get integration details
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .single();

    if (integrationError || !integration) {
      throw new Error('Integration not found');
    }

    const shopifyDomain = integration.shop_domain;
    const accessToken = integration.encrypted_credentials?.access_token;

    if (!shopifyDomain || !accessToken) {
      throw new Error('Missing Shopify credentials');
    }

    let result;

    switch (action) {
      case 'register':
        result = await registerWebhooks(supabaseClient, integration, shopifyDomain, accessToken, topics);
        break;
      
      case 'unregister':
        result = await unregisterWebhooks(supabaseClient, integration, shopifyDomain, accessToken, topics);
        break;
      
      case 'list':
        result = await listWebhooks(supabaseClient, integration_id);
        break;
      
      case 'sync':
        result = await syncWebhooks(supabaseClient, integration, shopifyDomain, accessToken);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook manager error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function registerWebhooks(
  supabaseClient: any,
  integration: any,
  shopifyDomain: string,
  accessToken: string,
  topics: string[]
) {
  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-webhook-handler`;
  const registered = [];

  for (const topic of topics) {
    try {
      // Check if webhook already exists in DB
      const { data: existing } = await supabaseClient
        .from('shopify_webhooks')
        .select('*')
        .eq('integration_id', integration.id)
        .eq('topic', topic)
        .single();

      if (existing) {
        console.log(`Webhook ${topic} already registered`);
        registered.push({ topic, status: 'already_exists', webhook_id: existing.webhook_id });
        continue;
      }

      // Register webhook with Shopify
      const response = await fetch(
        `https://${shopifyDomain}/admin/api/2023-10/webhooks.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            webhook: {
              topic,
              address: webhookUrl,
              format: 'json'
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to register webhook ${topic}: ${error}`);
      }

      const data = await response.json();
      const webhook = data.webhook;

      // Store webhook in database
      await supabaseClient
        .from('shopify_webhooks')
        .insert({
          user_id: integration.user_id,
          integration_id: integration.id,
          webhook_id: webhook.id.toString(),
          topic: webhook.topic,
          address: webhook.address,
          is_active: true
        });

      registered.push({ topic, status: 'registered', webhook_id: webhook.id });
      console.log(`Successfully registered webhook: ${topic}`);

    } catch (error) {
      console.error(`Error registering webhook ${topic}:`, error);
      registered.push({ topic, status: 'error', error: error.message });
    }
  }

  return { registered };
}

async function unregisterWebhooks(
  supabaseClient: any,
  integration: any,
  shopifyDomain: string,
  accessToken: string,
  topics: string[]
) {
  const unregistered = [];

  for (const topic of topics) {
    try {
      // Get webhook from DB
      const { data: webhook, error: webhookError } = await supabaseClient
        .from('shopify_webhooks')
        .select('*')
        .eq('integration_id', integration.id)
        .eq('topic', topic)
        .single();

      if (webhookError || !webhook) {
        unregistered.push({ topic, status: 'not_found' });
        continue;
      }

      // Delete webhook from Shopify
      const response = await fetch(
        `https://${shopifyDomain}/admin/api/2023-10/webhooks/${webhook.webhook_id}.json`,
        {
          method: 'DELETE',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(`Failed to unregister webhook ${topic}: ${error}`);
      }

      // Delete webhook from database
      await supabaseClient
        .from('shopify_webhooks')
        .delete()
        .eq('id', webhook.id);

      unregistered.push({ topic, status: 'unregistered' });
      console.log(`Successfully unregistered webhook: ${topic}`);

    } catch (error) {
      console.error(`Error unregistering webhook ${topic}:`, error);
      unregistered.push({ topic, status: 'error', error: error.message });
    }
  }

  return { unregistered };
}

async function listWebhooks(supabaseClient: any, integrationId: string) {
  const { data: webhooks, error } = await supabaseClient
    .from('shopify_webhooks')
    .select('*')
    .eq('integration_id', integrationId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return { webhooks: webhooks || [] };
}

async function syncWebhooks(
  supabaseClient: any,
  integration: any,
  shopifyDomain: string,
  accessToken: string
) {
  // Fetch webhooks from Shopify
  const response = await fetch(
    `https://${shopifyDomain}/admin/api/2023-10/webhooks.json`,
    {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch webhooks from Shopify');
  }

  const data = await response.json();
  const shopifyWebhooks = data.webhooks || [];

  // Get existing webhooks from DB
  const { data: dbWebhooks } = await supabaseClient
    .from('shopify_webhooks')
    .select('*')
    .eq('integration_id', integration.id);

  const dbWebhookMap = new Map((dbWebhooks || []).map((w: any) => [w.webhook_id, w]));

  // Sync webhooks
  const synced = [];
  const removed = [];

  for (const shopifyWebhook of shopifyWebhooks) {
    const webhookId = shopifyWebhook.id.toString();
    
    if (dbWebhookMap.has(webhookId)) {
      // Update existing webhook
      await supabaseClient
        .from('shopify_webhooks')
        .update({
          topic: shopifyWebhook.topic,
          address: shopifyWebhook.address,
          is_active: true
        })
        .eq('webhook_id', webhookId);
      
      synced.push({ topic: shopifyWebhook.topic, status: 'updated' });
    } else {
      // Add new webhook
      await supabaseClient
        .from('shopify_webhooks')
        .insert({
          user_id: integration.user_id,
          integration_id: integration.id,
          webhook_id: webhookId,
          topic: shopifyWebhook.topic,
          address: shopifyWebhook.address,
          is_active: true
        });
      
      synced.push({ topic: shopifyWebhook.topic, status: 'added' });
    }

    dbWebhookMap.delete(webhookId);
  }

  // Remove webhooks that no longer exist in Shopify
  for (const [webhookId, webhook] of dbWebhookMap.entries()) {
    await supabaseClient
      .from('shopify_webhooks')
      .delete()
      .eq('webhook_id', webhookId);
    
    removed.push({ topic: webhook.topic, status: 'removed' });
  }

  return { synced, removed };
}
