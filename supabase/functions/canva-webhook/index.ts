import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
);

const CANVA_CLIENT_SECRET = Deno.env.get('CANVA_CLIENT_SECRET');
const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

// Fonction pour vérifier la signature du webhook
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(body);
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key => 
    crypto.subtle.sign('HMAC', key, messageData)
  ).then(signatureBuffer => {
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `sha256=${expectedSignature}` === signature;
  }).catch(() => false);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('X-Canva-Signatures');
    const body = await req.text();
    
    // Vérifier la signature du webhook
    if (signature && CANVA_CLIENT_SECRET) {
      const isValid = await verifyWebhookSignature(body, signature, CANVA_CLIENT_SECRET);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const webhookData = JSON.parse(body);
    console.log('Received Canva webhook:', JSON.stringify(webhookData, null, 2));

    // Traiter différents types d'événements
    switch (webhookData.event_type) {
      case 'design.publish': {
        await handleDesignPublish(webhookData);
        break;
      }
      
      case 'design.update': {
        await handleDesignUpdate(webhookData);
        break;
      }
      
      case 'design.delete': {
        await handleDesignDelete(webhookData);
        break;
      }
      
      default:
        console.log('Unhandled webhook event type:', webhookData.event_type);
    }

    // Enregistrer l'événement de webhook
    await supabaseClient.from('canva_webhook_events').insert({
      user_id: webhookData.user_id || null,
      canva_design_id: webhookData.resource?.id || null,
      event_type: webhookData.event_type,
      event_data: webhookData,
      processed: true
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    // Enregistrer l'erreur
    await supabaseClient.from('canva_webhook_events').insert({
      event_type: 'error',
      event_data: { error: error.message },
      processed: false
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handleDesignPublish(webhookData: any) {
  const designId = webhookData.resource?.id;
  if (!designId) return;

  console.log('Processing design publish:', designId);

  // Récupérer les détails du design depuis l'API Canva
  const designDetails = await fetchDesignDetails(designId, webhookData.user_id);
  
  if (designDetails) {
    // Sauvegarder ou mettre à jour le design
    await supabaseClient.from('canva_designs').upsert({
      canva_design_id: designId,
      user_id: webhookData.user_id,
      canva_integration_id: await getIntegrationId(webhookData.user_id),
      title: designDetails.title,
      design_type: designDetails.design_type,
      thumbnail_url: designDetails.thumbnail?.url,
      design_url: designDetails.urls?.view_url,
      export_urls: designDetails.export_urls || {},
      metadata: designDetails,
      status: 'active',
      last_modified_at: new Date().toISOString()
    }, {
      onConflict: 'canva_design_id'
    });

    console.log('Design saved successfully:', designId);
  }
}

async function handleDesignUpdate(webhookData: any) {
  const designId = webhookData.resource?.id;
  if (!designId) return;

  console.log('Processing design update:', designId);

  // Mettre à jour les détails du design
  const designDetails = await fetchDesignDetails(designId, webhookData.user_id);
  
  if (designDetails) {
    await supabaseClient
      .from('canva_designs')
      .update({
        title: designDetails.title,
        thumbnail_url: designDetails.thumbnail?.url,
        metadata: designDetails,
        last_modified_at: new Date().toISOString()
      })
      .eq('canva_design_id', designId);

    console.log('Design updated successfully:', designId);
  }
}

async function handleDesignDelete(webhookData: any) {
  const designId = webhookData.resource?.id;
  if (!designId) return;

  console.log('Processing design delete:', designId);

  // Marquer le design comme supprimé
  await supabaseClient
    .from('canva_designs')
    .update({
      status: 'deleted',
      last_modified_at: new Date().toISOString()
    })
    .eq('canva_design_id', designId);

  console.log('Design marked as deleted:', designId);
}

async function fetchDesignDetails(designId: string, userId: string) {
  try {
    // Récupérer le token d'accès de l'utilisateur
    const { data: integration } = await supabaseClient
      .from('canva_integrations')
      .select('access_token')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!integration?.access_token) {
      console.error('No active integration found for user:', userId);
      return null;
    }

    // Appeler l'API Canva pour récupérer les détails
    const response = await fetch(`${CANVA_API_BASE}/designs/${designId}`, {
      headers: {
        'Authorization': `Bearer ${integration.access_token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch design details:', response.status);
      return null;
    }

    const designData = await response.json();
    return designData;

  } catch (error) {
    console.error('Error fetching design details:', error);
    return null;
  }
}

async function getIntegrationId(userId: string): Promise<string | null> {
  const { data: integration } = await supabaseClient
    .from('canva_integrations')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  return integration?.id || null;
}