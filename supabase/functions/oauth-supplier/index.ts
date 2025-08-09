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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error('Non autorisé');
    }

    const { action, supplier_id, redirect_uri, auth_data } = await req.json();

    switch (action) {
      case 'initiate_oauth':
        return await initiateOAuth(supplier_id, redirect_uri, user.id);
      
      case 'handle_callback':
        return await handleOAuthCallback(supabaseClient, auth_data, user.id);
        
      case 'test_connection':
        return await testConnection(supabaseClient, supplier_id, user.id);
        
      default:
        throw new Error('Action non supportée');
    }

  } catch (error) {
    console.error('Error in oauth-supplier:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function initiateOAuth(supplier_id: string, redirect_uri: string, user_id: string) {
  const oauthConfigs = {
    ebay: {
      auth_url: 'https://auth.ebay.com/oauth2/authorize',
      scope: 'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
      client_id: Deno.env.get('EBAY_CLIENT_ID')
    },
    google_shopping: {
      auth_url: 'https://accounts.google.com/oauth2/auth',
      scope: 'https://www.googleapis.com/auth/content',
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')
    },
    facebook: {
      auth_url: 'https://www.facebook.com/v18.0/dialog/oauth',
      scope: 'catalog_management,ads_management,business_management',
      client_id: Deno.env.get('FACEBOOK_APP_ID')
    },
    meta: {
      auth_url: 'https://www.facebook.com/v18.0/dialog/oauth',
      scope: 'catalog_management,ads_management,business_management',
      client_id: Deno.env.get('META_APP_ID')
    },
    tiktok: {
      auth_url: 'https://business-api.tiktok.com/portal/auth',
      scope: 'user_info:read,ad_management:read,business_info:read',
      client_id: Deno.env.get('TIKTOK_CLIENT_KEY')
    },
    allegro: {
      auth_url: 'https://allegro.pl/auth/oauth/authorize',
      scope: 'allegro:api:profile:read allegro:api:sale:offers:read',
      client_id: Deno.env.get('ALLEGRO_CLIENT_ID')
    }
  };

  const config = oauthConfigs[supplier_id as keyof typeof oauthConfigs];
  if (!config) {
    throw new Error(`Configuration OAuth non trouvée pour ${supplier_id}`);
  }

  if (!config.client_id) {
    throw new Error(`Client ID manquant pour ${supplier_id}`);
  }

  const state = btoa(JSON.stringify({ user_id, supplier_id, timestamp: Date.now() }));
  
  const authUrl = new URL(config.auth_url);
  authUrl.searchParams.set('client_id', config.client_id);
  authUrl.searchParams.set('redirect_uri', redirect_uri);
  authUrl.searchParams.set('scope', config.scope);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');

  return new Response(
    JSON.stringify({
      success: true,
      auth_url: authUrl.toString(),
      state
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function handleOAuthCallback(supabaseClient: any, auth_data: any, user_id: string) {
  const { code, state, supplier_id } = auth_data;
  
  // Verify state
  try {
    const decodedState = JSON.parse(atob(state));
    if (decodedState.user_id !== user_id) {
      throw new Error('State invalide');
    }
  } catch {
    throw new Error('State corrompu');
  }

  // Exchange code for token
  const tokenData = await exchangeCodeForToken(supplier_id, code);
  
  // Store or update integration
  const { data: existingIntegration } = await supabaseClient
    .from('integrations')
    .select('*')
    .eq('user_id', user_id)
    .eq('platform_name', supplier_id)
    .single();

  const integrationData = {
    user_id,
    platform_type: 'supplier',
    platform_name: supplier_id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || null,
    connection_status: 'connected',
    is_active: true,
    last_sync_at: new Date().toISOString(),
    encrypted_credentials: {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in || 3600,
      scope: tokenData.scope
    }
  };

  let result;
  if (existingIntegration) {
    result = await supabaseClient
      .from('integrations')
      .update(integrationData)
      .eq('id', existingIntegration.id);
  } else {
    result = await supabaseClient
      .from('integrations')
      .insert(integrationData);
  }

  if (result.error) {
    throw new Error(`Erreur lors de la sauvegarde: ${result.error.message}`);
  }

  // Log the successful OAuth connection
  await supabaseClient.from('activity_logs').insert({
    user_id,
    action: 'oauth_supplier_connected',
    description: `Connexion OAuth réussie avec ${supplier_id}`,
    entity_type: 'integration',
    metadata: {
      supplier_id,
      connection_type: 'oauth',
      has_refresh_token: !!tokenData.refresh_token
    }
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Connexion OAuth réussie',
      integration: {
        platform_name: supplier_id,
        status: 'connected',
        scopes: tokenData.scope?.split(' ') || []
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function exchangeCodeForToken(supplier_id: string, code: string) {
  const tokenConfigs = {
    ebay: {
      token_url: 'https://api.ebay.com/identity/v1/oauth2/token',
      client_id: Deno.env.get('EBAY_CLIENT_ID'),
      client_secret: Deno.env.get('EBAY_CLIENT_SECRET')
    },
    google_shopping: {
      token_url: 'https://oauth2.googleapis.com/token',
      client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')
    },
    facebook: {
      token_url: 'https://graph.facebook.com/v18.0/oauth/access_token',
      client_id: Deno.env.get('FACEBOOK_APP_ID'),
      client_secret: Deno.env.get('FACEBOOK_APP_SECRET')
    },
    meta: {
      token_url: 'https://graph.facebook.com/v18.0/oauth/access_token',
      client_id: Deno.env.get('META_APP_ID'),
      client_secret: Deno.env.get('META_APP_SECRET')
    },
    tiktok: {
      token_url: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
      client_id: Deno.env.get('TIKTOK_CLIENT_KEY'),
      client_secret: Deno.env.get('TIKTOK_CLIENT_SECRET')
    },
    allegro: {
      token_url: 'https://allegro.pl/auth/oauth/token',
      client_id: Deno.env.get('ALLEGRO_CLIENT_ID'),
      client_secret: Deno.env.get('ALLEGRO_CLIENT_SECRET')
    }
  };

  const config = tokenConfigs[supplier_id as keyof typeof tokenConfigs];
  if (!config) {
    throw new Error(`Configuration token non trouvée pour ${supplier_id}`);
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.client_id!,
    client_secret: config.client_secret!,
    code,
    redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/oauth-supplier`
  });

  const response = await fetch(config.token_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur lors de l'échange du code: ${errorText}`);
  }

  return await response.json();
}

async function testConnection(supabaseClient: any, supplier_id: string, user_id: string) {
  const { data: integration } = await supabaseClient
    .from('integrations')
    .select('*')
    .eq('user_id', user_id)
    .eq('platform_name', supplier_id)
    .single();

  if (!integration) {
    throw new Error('Intégration non trouvée');
  }

  const credentials = integration.encrypted_credentials;
  if (!credentials?.access_token) {
    throw new Error('Token d\'accès manquant');
  }

  // Test API calls for each supplier
  const testConfigs = {
    ebay: {
      test_url: 'https://api.ebay.com/sell/inventory/v1/inventory_item',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json'
      }
    },
    google_shopping: {
      test_url: 'https://merchantapi.googleapis.com/accounts/v1beta/accounts',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Content-Type': 'application/json'
      }
    },
    facebook: {
      test_url: 'https://graph.facebook.com/v18.0/me/adaccounts',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`
      }
    },
    meta: {
      test_url: 'https://graph.facebook.com/v18.0/me/businesses',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`
      }
    },
    tiktok: {
      test_url: 'https://business-api.tiktok.com/open_api/v1.3/user/info/',
      headers: {
        'Access-Token': credentials.access_token,
        'Content-Type': 'application/json'
      }
    },
    allegro: {
      test_url: 'https://api.allegro.pl/sale/offers',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Accept': 'application/vnd.allegro.public.v1+json'
      }
    }
  };

  const config = testConfigs[supplier_id as keyof typeof testConfigs];
  if (!config) {
    throw new Error(`Test non configuré pour ${supplier_id}`);
  }

  try {
    const response = await fetch(config.test_url, {
      method: 'GET',
      headers: config.headers
    });

    const isConnected = response.ok || response.status === 200;
    
    // Update connection status
    await supabaseClient
      .from('integrations')
      .update({ 
        connection_status: isConnected ? 'connected' : 'error',
        last_sync_at: new Date().toISOString()
      })
      .eq('id', integration.id);

    return new Response(
      JSON.stringify({
        success: true,
        connected: isConnected,
        supplier_id,
        message: isConnected ? 'Connexion active' : 'Problème de connexion',
        status_code: response.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    await supabaseClient
      .from('integrations')
      .update({ 
        connection_status: 'error',
        last_error: error.message
      })
      .eq('id', integration.id);

    throw new Error(`Test de connexion échoué: ${error.message}`);
  }
}