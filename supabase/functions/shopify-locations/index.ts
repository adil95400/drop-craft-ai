import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  shop_domain: string
  access_token: string
}

async function getShopifyLocations(credentials: RequestBody) {
  try {
    const { shop_domain, access_token } = credentials;
    
    if (!shop_domain || !access_token) {
      return { success: false, error: 'Missing required Shopify credentials' }
    }

    // Get locations
    const locationsResponse = await fetch(
      `https://${shop_domain}/admin/api/2023-10/locations.json`,
      {
        headers: {
          'X-Shopify-Access-Token': access_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!locationsResponse.ok) {
      const errorText = await locationsResponse.text();
      return { success: false, error: `Failed to fetch locations: ${locationsResponse.statusText} - ${errorText}` }
    }

    const locationsData = await locationsResponse.json();
    
    // Get shop info as well
    const shopResponse = await fetch(
      `https://${shop_domain}/admin/api/2023-10/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': access_token,
          'Content-Type': 'application/json',
        },
      }
    );

    let shopInfo = null;
    if (shopResponse.ok) {
      const shopData = await shopResponse.json();
      shopInfo = {
        name: shopData.shop.name,
        domain: shopData.shop.domain,
        currency: shopData.shop.currency,
        timezone: shopData.shop.timezone
      };
    }

    return { 
      success: true, 
      locations: locationsData.locations.map((location: any) => ({
        id: location.id,
        name: location.name,
        address: `${location.address1}, ${location.city}, ${location.country}`,
        active: location.active
      })),
      shop_info: shopInfo
    }
  } catch (error) {
    console.error('Shopify locations fetch error:', error);
    return { success: false, error: `Failed to fetch locations: ${error.message}` }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Shopify locations function called');
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      throw new Error('No authorization header')
    }

    // Initialize Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the user is authenticated by validating the JWT
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('User not authenticated')
    }
    
    console.log('User authenticated:', user.id)

    const credentials: RequestBody = await req.json();

    const result = await getShopifyLocations(credentials);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in shopify-locations:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});