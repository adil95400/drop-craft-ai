import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

  try {
    // JWT Authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = claimsData.claims.sub as string
    const { code, amount } = await req.json()

    console.log(`[coupon-validate] Validating coupon ${code} for user ${userId}`)

    // Récupérer le coupon (RLS-scoped)
    const { data: coupon, error: couponError } = await supabase
      .from('promotional_coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (couponError || !coupon) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Coupon invalide ou expiré' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Vérifications de validité
    const now = new Date()
    
    if (!coupon.is_active) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Ce coupon n\'est plus actif' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (new Date(coupon.valid_from) > now) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Ce coupon n\'est pas encore valide' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Ce coupon a expiré' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Vérifier limite d'utilisation globale
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Ce coupon a atteint sa limite d\'utilisation' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Vérifier limite d'utilisation par utilisateur
    const { count: userUsageCount } = await supabase
      .from('coupon_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId)

    if (userUsageCount && coupon.per_user_limit && userUsageCount >= coupon.per_user_limit) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Vous avez déjà utilisé ce coupon le nombre maximum de fois' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Vérifier montant minimum
    if (coupon.min_purchase_amount && amount < coupon.min_purchase_amount) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: `Montant minimum requis: ${coupon.min_purchase_amount}${coupon.currency}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calculer la réduction
    let discountAmount = 0
    if (coupon.coupon_type === 'percentage') {
      discountAmount = (amount * coupon.discount_value) / 100
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount
      }
    } else if (coupon.coupon_type === 'fixed_amount') {
      discountAmount = coupon.discount_value
    }

    const finalAmount = Math.max(0, amount - discountAmount)

    return new Response(JSON.stringify({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.coupon_type,
        description: coupon.description,
        trial_days: coupon.trial_days
      },
      discount: {
        amount: discountAmount,
        original_amount: amount,
        final_amount: finalAmount,
        percentage: coupon.coupon_type === 'percentage' ? coupon.discount_value : null
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[coupon-validate] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
