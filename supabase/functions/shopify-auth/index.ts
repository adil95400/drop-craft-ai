import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { shop, code, state } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth header to identify user
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Exchange code for access token
    const clientId = Deno.env.get('SHOPIFY_APP_CLIENT_ID');
    const clientSecret = Deno.env.get('SHOPIFY_APP_CLIENT_SECRET');
    
    const tokenResponse = await fetch(`https://${shop}.myshopify.com/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Store shop credentials in database
    const { data: shopData, error } = await supabase
      .from('shops')
      .upsert({
        shop_domain: `${shop}.myshopify.com`,
        access_token: tokenData.access_token,
        scope: tokenData.scope,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store shop data: ${error.message}`);
    }

    // Log the connection
    await supabase.from('events_logs').insert({
      topic: 'shopify_connected',
      payload: {
        shop_domain: `${shop}.myshopify.com`,
        user_id: userData.user.id,
        scope: tokenData.scope,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      shop: shopData,
      message: 'Shopify store connected successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Shopify auth error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});