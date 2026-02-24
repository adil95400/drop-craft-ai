/**
 * Check Subscription — SECURED (JWT-first via getClaims)
 * 
 * NOTE: This function legitimately needs SERVICE_ROLE_KEY to sync profile
 * data (plan, subscription_status) because RLS prevents users from updating
 * their own plan column. The auth check itself uses getClaims() (no round-trip).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { getSecureCorsHeaders } from '../_shared/cors.ts'
import Stripe from 'https://esm.sh/stripe@18.5.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PRODUCT_TO_PLAN: Record<string, string> = {
  'prod_TuImodwMnB71NS': 'standard',
  'prod_TuImFSanPs0svj': 'pro',
  'prod_T3RTMipVwUA7Ud': 'ultra_pro',
}

const logStep = (step: string, details?: any) => {
  const safeDetails = details ? { ...details } : undefined
  if (safeDetails?.email) safeDetails.email = safeDetails.email.slice(0, 3) + '***'
  console.log(`[CHECK-SUBSCRIPTION] ${step}${safeDetails ? ` - ${JSON.stringify(safeDetails)}` : ''}`)
}

// Simple in-memory cache (per worker instance)
const cache: { [userId: string]: { data: any; timestamp: number } } = {}
const CACHE_TTL = 60 * 1000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin')
    return new Response(null, { status: 204, headers: getSecureCorsHeaders(origin) })
  }

  const origin = req.headers.get('origin')
  const corsHeaders = getSecureCorsHeaders(origin)

  try {
    logStep('Function started')

    // ── Auth: JWT-first via getClaims (no server round-trip) ──
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = claimsData.claims.sub as string
    const email = claimsData.claims.email as string
    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'Invalid token claims' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    logStep('User authenticated', { userId: userId.slice(0, 8), email })

    // ── Cache check ──
    const cached = cache[userId]
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logStep('Returning cached response')
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Stripe lookup ──
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set')

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' })

    let customers
    try {
      customers = await stripe.customers.list({ email, limit: 1 })
    } catch (stripeError: any) {
      if (stripeError.code === 'rate_limit') {
        logStep('Stripe rate limited, returning cached or default')
        if (cached) {
          return new Response(JSON.stringify(cached.data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify({ subscribed: false, product_id: null, plan: 'free', subscription_end: null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw stripeError
    }

    if (customers.data.length === 0) {
      logStep('No customer found, returning free plan')
      const result = { subscribed: false, product_id: null, plan: 'free', subscription_end: null }
      cache[userId] = { data: result, timestamp: Date.now() }
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const customerId = customers.data[0].id
    logStep('Found Stripe customer', { customerId })

    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 })

    let hasActiveSub = subscriptions.data.length > 0
    let productId: string | null = null
    let subscriptionEnd: string | null = null
    let plan = 'free'

    if (!hasActiveSub) {
      const trialingSubs = await stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 1 })
      if (trialingSubs.data.length > 0) {
        hasActiveSub = true
        const sub = trialingSubs.data[0]
        subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString()
        productId = sub.items.data[0].price.product as string
        plan = PRODUCT_TO_PLAN[productId] || 'standard'
      }
    }

    if (hasActiveSub && !productId) {
      const sub = subscriptions.data[0]
      subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString()
      productId = sub.items.data[0].price.product as string
      plan = PRODUCT_TO_PLAN[productId] || 'standard'
    }

    // ── Profile sync (requires SERVICE_ROLE to bypass RLS on plan column) ──
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    if (hasActiveSub) {
      await adminClient.from('profiles').update({
        plan,
        subscription_plan: plan,
        subscription_status: 'active',
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
    } else {
      const pastDueSubs = await stripe.subscriptions.list({ customer: customerId, status: 'past_due', limit: 1 })
      const isPastDue = pastDueSubs.data.length > 0

      const { data: profile } = await adminClient.from('profiles')
        .select('plan, subscription_status').eq('id', userId).single()

      if (profile?.subscription_status === 'active' || isPastDue) {
        await adminClient.from('profiles').update({
          plan: 'free',
          subscription_plan: 'free',
          subscription_status: isPastDue ? 'past_due' : 'inactive',
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
      }
    }

    const { data: finalProfile } = await adminClient.from('profiles')
      .select('subscription_status').eq('id', userId).single()

    const result = {
      subscribed: hasActiveSub,
      product_id: productId,
      plan,
      subscription_end: subscriptionEnd,
      subscription_status: finalProfile?.subscription_status || (hasActiveSub ? 'active' : 'inactive'),
    }

    cache[userId] = { data: result, timestamp: Date.now() }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logStep('ERROR', { message: msg })
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})