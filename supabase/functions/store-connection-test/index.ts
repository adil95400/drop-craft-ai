import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json()
    console.log('Request body received:', JSON.stringify(requestBody, null, 2))

    // Support both old format (integrationId, shopDomain, accessToken) 
    // and new format (platform, credentials, optionally integrationId)
    let integrationId, shopDomain, accessToken, platform

    if (requestBody.credentials && requestBody.platform) {
      // New format: { platform, credentials: { shop_domain, access_token }, integrationId? }
      platform = requestBody.platform
      integrationId = requestBody.integrationId // Optional for tests
      
      const { shop_domain, access_token } = requestBody.credentials
      shopDomain = shop_domain
      accessToken = access_token
      
      console.log(`Using new format for platform: ${platform}`)
    } else {
      // Old format: { integrationId, shopDomain, accessToken }
      integrationId = requestBody.integrationId
      shopDomain = requestBody.shopDomain 
      accessToken = requestBody.accessToken
      platform = 'shopify' // Assume shopify for old format
      
      console.log('Using old format')
    }

    // Validate required parameters (integrationId is optional for connection tests)
    if (!shopDomain || !accessToken) {
      console.error('Missing required parameters:', { shopDomain: !!shopDomain, accessToken: !!accessToken })
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: shop_domain and access_token are required',
          received: {
            shop_domain: !!shopDomain,
            access_token: !!accessToken,
            integration_id: !!integrationId
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Clean and validate shop domain
    let cleanedDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!cleanedDomain.includes('.myshopify.com') && !cleanedDomain.includes('.')) {
      cleanedDomain = `${cleanedDomain}.myshopify.com`
    }

    console.log(`Testing connection for shop: ${cleanedDomain}`)

    // Test de connexion à Shopify
    const shopUrl = `https://${cleanedDomain}/admin/api/2023-10/shop.json`
    const response = await fetch(shopUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Shopify API error: ${response.status} - ${error}`)
      
      let errorMessage = `Erreur Shopify API (${response.status})`
      if (response.status === 401) {
        errorMessage = 'Token d\'accès invalide. Vérifiez vos permissions Shopify.'
      } else if (response.status === 403) {
        errorMessage = 'Accès refusé. Le token n\'a pas les bonnes permissions.'
      } else if (response.status === 404) {
        errorMessage = 'Boutique introuvable. Vérifiez le domaine de votre boutique.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: error,
          status_code: response.status
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const shopData = await response.json()
    console.log(`Connection successful for shop: ${shopData.shop?.name}`)

    // Mettre à jour le statut de connexion seulement si integrationId est fourni
    if (integrationId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { error: updateError } = await supabase
        .from('store_integrations')
        .update({
          connection_status: 'connected',
          store_name: shopData.shop?.name || cleanedDomain,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId)

      if (updateError) {
        console.error('Error updating store status:', updateError)
      } else {
        console.log(`Updated integration ${integrationId} status to connected`)
      }
    } else {
      console.log('Connection test successful - no integration to update')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        shop: {
          name: shopData.shop?.name,
          domain: shopData.shop?.domain,
          email: shopData.shop?.email,
          currency: shopData.shop?.currency,
          timezone: shopData.shop?.timezone
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Connection test error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors du test de connexion',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})