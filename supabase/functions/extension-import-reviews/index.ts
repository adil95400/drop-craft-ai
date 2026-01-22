import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ReviewImportRequest {
  productId: string
  reviews: {
    rating: number
    text: string
    author?: string
    date?: string
    country?: string
    images?: string[]
    verified?: boolean
  }[]
  sourceUrl?: string
  platform?: string
}

// Plan limits for reviews
const PLAN_LIMITS = {
  starter: 0,
  pro: 50,
  ultra: 200,
  enterprise: 500
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Validate token
    const token = req.headers.get('x-extension-token')?.replace(/[^a-zA-Z0-9-_]/g, '')

    if (!token || token.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token d\'extension requis' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify token and get user
    const { data: authData, error: tokenError } = await supabase
      .from('extension_auth_tokens')
      .select('id, user_id, expires_at')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (tokenError || !authData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token invalide ou expiré' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = authData.user_id

    // Get user's plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    const userPlan = subscription?.plan || 'starter'
    const maxReviews = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || 0

    // Check if user can import reviews
    if (maxReviews === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'L\'import d\'avis n\'est pas disponible avec votre plan. Passez à Pro ou Ultra pour débloquer cette fonctionnalité.',
          upgrade_required: true,
          plan: userPlan
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const { productId, reviews, sourceUrl, platform }: ReviewImportRequest = await req.json()

    if (!productId || !reviews || !Array.isArray(reviews)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Données manquantes: productId et reviews requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[extension-import-reviews] Importing:', {
      productId,
      reviewsCount: reviews.length,
      platform,
      userPlan,
      maxAllowed: maxReviews
    })

    // Limit reviews based on plan
    const limitedReviews = reviews.slice(0, maxReviews)

    // Check how many reviews already exist for this product
    const { count: existingCount } = await supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('user_id', userId)

    const remainingSlots = maxReviews - (existingCount || 0)
    const reviewsToImport = limitedReviews.slice(0, Math.max(0, remainingSlots))

    if (reviewsToImport.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Limite atteinte: vous avez déjà ${existingCount} avis sur ${maxReviews} autorisés pour ce produit.`,
          limit_reached: true,
          current_count: existingCount,
          max_allowed: maxReviews
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare review records
    const reviewRecords = reviewsToImport.map(review => ({
      user_id: userId,
      product_id: productId,
      reviewer_name: (review.author || 'Anonymous').substring(0, 100),
      rating: Math.min(5, Math.max(1, review.rating || 5)),
      comment: (review.text || '').substring(0, 2000),
      review_date: review.date || new Date().toISOString(),
      images: (review.images || []).slice(0, 5),
      source_platform: platform || 'extension',
      is_verified: review.verified ?? true,
      is_published: false, // Default to unpublished for compliance
      metadata: {
        country: review.country,
        source_url: sourceUrl,
        imported_at: new Date().toISOString()
      }
    }))

    // Insert reviews
    const { data: insertedReviews, error: insertError } = await supabase
      .from('product_reviews')
      .insert(reviewRecords)
      .select('id')

    if (insertError) {
      console.error('[extension-import-reviews] Insert error:', insertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erreur d'insertion: ${insertError.message}`,
          code: insertError.code
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log activity
    await supabase.from('extension_analytics').insert({
      user_id: userId,
      event_type: 'reviews_import',
      event_data: {
        product_id: productId,
        reviews_imported: insertedReviews?.length || 0,
        platform,
        plan: userPlan
      },
      source_url: sourceUrl || ''
    })

    console.log('[extension-import-reviews] Success:', {
      imported: insertedReviews?.length,
      remaining: maxReviews - (existingCount || 0) - (insertedReviews?.length || 0)
    })

    return new Response(
      JSON.stringify({
        success: true,
        imported: insertedReviews?.length || 0,
        skipped: reviews.length - reviewsToImport.length,
        limit: {
          plan: userPlan,
          max_allowed: maxReviews,
          current_count: (existingCount || 0) + (insertedReviews?.length || 0),
          remaining: maxReviews - (existingCount || 0) - (insertedReviews?.length || 0)
        },
        message: `${insertedReviews?.length} avis importés avec succès. ${reviews.length - reviewsToImport.length > 0 ? `${reviews.length - reviewsToImport.length} avis ignorés (limite atteinte).` : ''}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[extension-import-reviews] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
