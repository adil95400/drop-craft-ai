import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
}

interface Review {
  author?: string
  rating: number
  content: string
  date?: string
  images?: string[]
  videos?: string[]
  verified?: boolean
  helpful_count?: number
  country?: string
  variant?: string
}

interface ImportOptions {
  minRating?: number
  maxReviews?: number
  withPhotosOnly?: boolean
  withVideosOnly?: boolean
  countries?: string[]
  translate?: boolean
  targetLanguage?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Auth check
    let userId: string | null = null
    
    const authHeader = req.headers.get('Authorization')
    const extensionToken = req.headers.get('x-extension-token')
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      userId = user.id
    } else if (extensionToken) {
      const { data: tokenData, error: tokenError } = await supabase
        .from('extension_tokens')
        .select('user_id, is_active')
        .eq('token', extensionToken)
        .single()
      
      if (tokenError || !tokenData?.is_active) {
        return new Response(JSON.stringify({ error: 'Invalid extension token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      userId = tokenData.user_id
    } else {
      return new Response(JSON.stringify({ error: 'No authentication provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { action } = body
    
    // Preview reviews - filter and prepare for display
    if (action === 'preview') {
      const { reviews, options = {} } = body as { reviews: Review[], options: ImportOptions }
      
      if (!reviews || !Array.isArray(reviews)) {
        return new Response(JSON.stringify({ error: 'No reviews provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      let filteredReviews = [...reviews]
      
      // Apply filters
      if (options.minRating) {
        filteredReviews = filteredReviews.filter(r => r.rating >= options.minRating!)
      }
      
      if (options.withPhotosOnly) {
        filteredReviews = filteredReviews.filter(r => r.images && r.images.length > 0)
      }
      
      if (options.withVideosOnly) {
        filteredReviews = filteredReviews.filter(r => r.videos && r.videos.length > 0)
      }
      
      if (options.countries && options.countries.length > 0) {
        filteredReviews = filteredReviews.filter(r => 
          r.country && options.countries!.includes(r.country)
        )
      }
      
      if (options.maxReviews) {
        filteredReviews = filteredReviews.slice(0, options.maxReviews)
      }
      
      // Calculate stats
      const stats = {
        total: filteredReviews.length,
        withPhotos: filteredReviews.filter(r => r.images && r.images.length > 0).length,
        withVideos: filteredReviews.filter(r => r.videos && r.videos.length > 0).length,
        verified: filteredReviews.filter(r => r.verified).length,
        averageRating: filteredReviews.length > 0 
          ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length 
          : 0,
        ratingDistribution: {
          5: filteredReviews.filter(r => r.rating === 5).length,
          4: filteredReviews.filter(r => r.rating === 4).length,
          3: filteredReviews.filter(r => r.rating === 3).length,
          2: filteredReviews.filter(r => r.rating === 2).length,
          1: filteredReviews.filter(r => r.rating === 1).length,
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        reviews: filteredReviews,
        stats
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Import reviews to database
    if (action === 'import') {
      const { reviews, productId, options = {} } = body as { 
        reviews: Review[], 
        productId: string, 
        options: ImportOptions 
      }
      
      if (!reviews || !productId) {
        return new Response(JSON.stringify({ error: 'Missing reviews or productId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      // Apply filters
      let filteredReviews = [...reviews]
      
      if (options.minRating) {
        filteredReviews = filteredReviews.filter(r => r.rating >= options.minRating!)
      }
      
      if (options.withPhotosOnly) {
        filteredReviews = filteredReviews.filter(r => r.images && r.images.length > 0)
      }
      
      if (options.maxReviews) {
        filteredReviews = filteredReviews.slice(0, options.maxReviews)
      }
      
      // Translate if requested
      if (options.translate && options.targetLanguage) {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
        
        if (LOVABLE_API_KEY) {
          console.log(`🌐 Translating ${filteredReviews.length} reviews to ${options.targetLanguage}`)
          
          // Batch translate (5 at a time to avoid rate limits)
          for (let i = 0; i < filteredReviews.length; i += 5) {
            const batch = filteredReviews.slice(i, i + 5)
            
            const translationPromises = batch.map(async (review, idx) => {
              try {
                const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    model: 'google/gemini-2.5-flash-lite',
                    messages: [
                      {
                        role: 'system',
                        content: `Translate the following product review to ${options.targetLanguage}. Keep the same tone and formatting. Return only the translated text.`
                      },
                      {
                        role: 'user',
                        content: review.content
                      }
                    ],
                    max_tokens: 500
                  })
                })
                
                if (response.ok) {
                  const data = await response.json()
                  const translated = data.choices?.[0]?.message?.content
                  if (translated) {
                    filteredReviews[i + idx].content = translated
                  }
                }
              } catch (err) {
                console.error('Translation error:', err)
              }
            })
            
            await Promise.all(translationPromises)
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
      }
      
      // Insert reviews into database
      const reviewsToInsert = filteredReviews.map(review => ({
        user_id: userId,
        product_id: productId,
        author: review.author || 'Anonymous',
        rating: review.rating,
        content: review.content,
        review_date: review.date || new Date().toISOString(),
        images: review.images || [],
        videos: review.videos || [],
        is_verified: review.verified || false,
        helpful_count: review.helpful_count || 0,
        country: review.country,
        variant: review.variant,
        source: 'import',
        created_at: new Date().toISOString()
      }))
      
      const { data: insertedReviews, error: insertError } = await supabase
        .from('product_reviews')
        .insert(reviewsToInsert)
        .select('id')
      
      if (insertError) {
        // Table might not exist, create it dynamically or log
        console.error('Error inserting reviews:', insertError)
        
        // Fallback: store in imported_products metadata
        const { error: updateError } = await supabase
          .from('imported_products')
          .update({
            reviews: filteredReviews,
            reviews_count: filteredReviews.length
          })
          .eq('id', productId)
        
        if (updateError) {
          return new Response(JSON.stringify({ 
            error: 'Failed to save reviews',
            details: updateError.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }
      
      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'reviews_imported',
        description: `${filteredReviews.length} avis importés pour le produit`,
        entity_type: 'product',
        entity_id: productId,
        source: 'extension',
        details: {
          count: filteredReviews.length,
          withPhotos: filteredReviews.filter(r => r.images?.length).length,
          averageRating: filteredReviews.reduce((s, r) => s + r.rating, 0) / filteredReviews.length
        }
      })
      
      return new Response(JSON.stringify({
        success: true,
        imported: filteredReviews.length,
        message: `${filteredReviews.length} avis importés avec succès`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Reviews import error:', error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
