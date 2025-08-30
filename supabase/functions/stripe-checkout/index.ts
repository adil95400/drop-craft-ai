import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : ''
  console.log(`[STRIPE-CHECKOUT] ${step}${detailsStr}`)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logStep('Function started')

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set')
    logStep('Stripe key verified')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header provided')
    logStep('Authorization header found')

    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError) throw new Error(`Authentication error: ${userError.message}`)
    const user = userData.user
    if (!user?.email) throw new Error('User not authenticated or email not available')
    logStep('User authenticated', { userId: user.id, email: user.email })

    const { plan, priceId } = await req.json()
    if (!plan || !['standard', 'pro', 'ultra_pro'].includes(plan)) {
      throw new Error('Invalid plan specified')
    }
    logStep('Plan validated', { plan })

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 })
    let customerId
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
      logStep('Existing customer found', { customerId })
    } else {
      logStep('Creating new customer')
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      })
      customerId = customer.id
      logStep('New customer created', { customerId })
    }

    // Define plan pricing
    const planPricing = {
      standard: { amount: 0, name: 'Plan Standard' },
      pro: { amount: 2900, name: 'Plan Pro' }, // 29€
      ultra_pro: { amount: 9900, name: 'Plan Ultra Pro' } // 99€
    }

    const pricing = planPricing[plan as keyof typeof planPricing]
    logStep('Pricing determined', pricing)

    if (pricing.amount === 0) {
      // Free plan - just update user plan directly
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ plan: 'standard' })
        .eq('id', user.id)

      if (updateError) throw updateError

      return new Response(JSON.stringify({
        success: true,
        plan: 'standard',
        message: 'Plan gratuit activé'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const origin = req.headers.get('origin') || 'http://localhost:8080'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { 
              name: pricing.name,
              description: `Abonnement ${pricing.name} - Accès complet aux fonctionnalités`
            },
            unit_amount: pricing.amount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard?checkout=success&plan=${plan}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      metadata: { 
        user_id: user.id, 
        plan: plan,
        email: user.email
      }
    })

    logStep('Checkout session created', { sessionId: session.id, url: session.url })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logStep('ERROR in stripe-checkout', { message: errorMessage })
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})