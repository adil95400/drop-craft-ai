import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Unified Payments Function called:', req.method, req.url)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url)
    const endpoint = url.pathname.split('/').pop()
    const body = await req.json()

    console.log('Processing payment endpoint:', endpoint, 'with body:', body)

    switch (endpoint) {
      case 'create-checkout':
        return handleCreateCheckout(body)
      
      case 'stripe-checkout':
        return handleStripeCheckout(body)
      
      case 'create-payment':
        return handleCreatePayment(body)
      
      case 'customer-portal':
        return handleCustomerPortal(body)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown payment endpoint' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in unified payments:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleCreateCheckout(body: any) {
  console.log('Creating checkout:', body)
  
  const response = {
    success: true,
    message: 'Checkout created successfully',
    data: {
      checkoutId: `checkout_${Date.now()}`,
      url: 'https://checkout.example.com/mock',
      timestamp: new Date().toISOString()
    }
  }

  return new Response(
    JSON.stringify(response),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleStripeCheckout(body: any) {
  console.log('Processing Stripe checkout:', body)
  
  const response = {
    success: true,
    message: 'Stripe checkout processed',
    data: {
      sessionId: `cs_${Date.now()}`,
      url: 'https://checkout.stripe.com/mock',
      timestamp: new Date().toISOString()
    }
  }

  return new Response(
    JSON.stringify(response),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCreatePayment(body: any) {
  console.log('Creating payment:', body)
  
  const response = {
    success: true,
    message: 'Payment created successfully',
    data: {
      paymentId: `pay_${Date.now()}`,
      status: 'pending',
      timestamp: new Date().toISOString()
    }
  }

  return new Response(
    JSON.stringify(response),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCustomerPortal(body: any) {
  console.log('Accessing customer portal:', body)
  
  const response = {
    success: true,
    message: 'Customer portal access granted',
    data: {
      portalUrl: 'https://portal.example.com/mock',
      sessionId: `portal_${Date.now()}`,
      timestamp: new Date().toISOString()
    }
  }

  return new Response(
    JSON.stringify(response),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}