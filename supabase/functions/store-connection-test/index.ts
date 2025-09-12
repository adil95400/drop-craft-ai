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
    const { integrationId, shopDomain, accessToken } = await req.json()

    if (!integrationId || !shopDomain || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Testing connection for shop: ${shopDomain}`)

    // Test de connexion à Shopify
    const shopUrl = `https://${shopDomain}/admin/api/2023-10/shop.json`
    const response = await fetch(shopUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Shopify API error: ${response.status} - ${error}`)
      
      return new Response(
        JSON.stringify({ 
          error: `Erreur Shopify API (${response.status}): Vérifiez votre token d'accès`,
          details: error
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const shopData = await response.json()
    console.log(`Connection successful for shop: ${shopData.shop?.name}`)

    // Mettre à jour le statut de connexion
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabase
      .from('store_integrations')
      .update({
        connection_status: 'connected',
        store_name: shopData.shop?.name || shopDomain,
        updated_at: new Date().toISOString()
      })
      .eq('id', integrationId)

    if (updateError) {
      console.error('Error updating store status:', updateError)
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