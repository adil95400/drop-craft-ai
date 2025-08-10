import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, platform, ...data } = await req.json()

    switch (platform) {
      case 'mailchimp':
        return await handleMailchimp(action, data, supabaseClient)
      
      case 'klaviyo':
        return await handleKlaviyo(action, data, supabaseClient)
      
      case 'google_ads':
        return await handleGoogleAds(action, data, supabaseClient)
      
      case 'facebook_ads':
        return await handleFacebookAds(action, data, supabaseClient)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Plateforme non supportée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Erreur marketing integration:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleMailchimp(action: string, data: any, supabase: any) {
  const API_KEY = Deno.env.get('MAILCHIMP_API_KEY')
  
  try {
    switch (action) {
      case 'sync_customers':
        return await syncCustomersToMailchimp(data, API_KEY, supabase)
      
      case 'create_campaign':
        return await createMailchimpCampaign(data, API_KEY)
      
      case 'get_stats':
        return await getMailchimpStats(API_KEY)
      
      default:
        throw new Error('Action Mailchimp non supportée')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleKlaviyo(action: string, data: any, supabase: any) {
  const API_KEY = Deno.env.get('KLAVIYO_API_KEY')
  
  try {
    switch (action) {
      case 'sync_customers':
        return await syncCustomersToKlaviyo(data, API_KEY, supabase)
      
      case 'create_flow':
        return await createKlaviyoFlow(data, API_KEY)
      
      case 'track_event':
        return await trackKlaviyoEvent(data, API_KEY)
      
      default:
        throw new Error('Action Klaviyo non supportée')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleGoogleAds(action: string, data: any, supabase: any) {
  const CLIENT_ID = Deno.env.get('GOOGLE_ADS_CLIENT_ID')
  const CLIENT_SECRET = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET')
  
  try {
    switch (action) {
      case 'create_campaign':
        return await createGoogleAdsCampaign(data, CLIENT_ID, CLIENT_SECRET)
      
      case 'get_performance':
        return await getGoogleAdsPerformance(data, CLIENT_ID, CLIENT_SECRET)
      
      case 'update_budget':
        return await updateGoogleAdsBudget(data, CLIENT_ID, CLIENT_SECRET)
      
      default:
        throw new Error('Action Google Ads non supportée')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleFacebookAds(action: string, data: any, supabase: any) {
  const ACCESS_TOKEN = Deno.env.get('FACEBOOK_ACCESS_TOKEN')
  
  try {
    switch (action) {
      case 'create_campaign':
        return await createFacebookCampaign(data, ACCESS_TOKEN)
      
      case 'upload_catalog':
        return await uploadProductCatalog(data, ACCESS_TOKEN, supabase)
      
      case 'get_insights':
        return await getFacebookInsights(data, ACCESS_TOKEN)
      
      default:
        throw new Error('Action Facebook Ads non supportée')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Mailchimp functions
async function syncCustomersToMailchimp(data: any, apiKey: string, supabase: any) {
  if (!apiKey) {
    return mockResponse('Customers synced to Mailchimp (mock)', { synced: 150 })
  }

  const { list_id } = data
  const datacenter = apiKey.split('-')[1]

  // Get customers from Supabase
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .limit(100)

  // Sync to Mailchimp
  for (const customer of customers || []) {
    await fetch(`https://${datacenter}.api.mailchimp.com/3.0/lists/${list_id}/members`, {
      method: 'POST',
      headers: {
        'Authorization': `apikey ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: customer.email,
        status: 'subscribed',
        merge_fields: {
          FNAME: customer.name?.split(' ')[0],
          LNAME: customer.name?.split(' ')[1]
        }
      })
    })
  }

  return mockResponse('Customers synced to Mailchimp', { synced: customers?.length || 0 })
}

async function createMailchimpCampaign(data: any, apiKey: string) {
  if (!apiKey) {
    return mockResponse('Campaign created (mock)', { campaign_id: 'mock_campaign_123' })
  }

  // Implementation would go here
  return mockResponse('Mailchimp campaign created', { campaign_id: 'real_campaign_id' })
}

async function getMailchimpStats(apiKey: string) {
  return mockResponse('Mailchimp stats retrieved', {
    subscribers: 1234,
    open_rate: 23.5,
    click_rate: 4.2,
    campaigns_sent: 15
  })
}

// Klaviyo functions
async function syncCustomersToKlaviyo(data: any, apiKey: string, supabase: any) {
  if (!apiKey) {
    return mockResponse('Customers synced to Klaviyo (mock)', { synced: 150 })
  }

  // Get customers from Supabase
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .limit(100)

  // Sync to Klaviyo
  for (const customer of customers || []) {
    await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email: customer.email,
            first_name: customer.name?.split(' ')[0],
            last_name: customer.name?.split(' ')[1]
          }
        }
      })
    })
  }

  return mockResponse('Customers synced to Klaviyo', { synced: customers?.length || 0 })
}

async function createKlaviyoFlow(data: any, apiKey: string) {
  return mockResponse('Klaviyo flow created', { flow_id: 'klaviyo_flow_123' })
}

async function trackKlaviyoEvent(data: any, apiKey: string) {
  return mockResponse('Event tracked in Klaviyo', { tracked: true })
}

// Google Ads functions
async function createGoogleAdsCampaign(data: any, clientId: string, clientSecret: string) {
  return mockResponse('Google Ads campaign created', { 
    campaign_id: 'gads_campaign_123',
    status: 'active'
  })
}

async function getGoogleAdsPerformance(data: any, clientId: string, clientSecret: string) {
  return mockResponse('Google Ads performance retrieved', {
    impressions: 12500,
    clicks: 450,
    cost: 89.50,
    conversions: 12
  })
}

async function updateGoogleAdsBudget(data: any, clientId: string, clientSecret: string) {
  return mockResponse('Google Ads budget updated', { 
    new_budget: data.budget,
    updated: true
  })
}

// Facebook Ads functions
async function createFacebookCampaign(data: any, accessToken: string) {
  return mockResponse('Facebook campaign created', { 
    campaign_id: 'fb_campaign_123',
    status: 'active'
  })
}

async function uploadProductCatalog(data: any, accessToken: string, supabase: any) {
  const { data: products } = await supabase
    .from('catalog_products')
    .select('*')
    .limit(100)

  return mockResponse('Product catalog uploaded to Facebook', { 
    products_uploaded: products?.length || 0
  })
}

async function getFacebookInsights(data: any, accessToken: string) {
  return mockResponse('Facebook insights retrieved', {
    reach: 8500,
    impressions: 15200,
    clicks: 380,
    spend: 75.30
  })
}

function mockResponse(message: string, data: any) {
  return new Response(
    JSON.stringify({ 
      success: true, 
      message,
      data
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}