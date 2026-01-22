import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : ''
  console.log(`[EXTENSION-IMPORT-VIDEOS] ${step}${detailsStr}`)
}

interface VideoData {
  url: string
  type: 'mp4' | 'webm' | 'embed' | 'youtube' | 'unknown'
  thumbnail?: string
  duration?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Validate extension token
    const extensionToken = req.headers.get('x-extension-token')
    if (!extensionToken || !extensionToken.startsWith('ext_')) {
      return new Response(JSON.stringify({ error: 'Invalid extension token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    // Get user from token
    const { data: tokenData } = await supabaseClient
      .from('extension_tokens')
      .select('user_id, is_active')
      .eq('token', extensionToken)
      .eq('is_active', true)
      .single()

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Token expired or invalid' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    const userId = tokenData.user_id

    const body = await req.json()
    const { product_id, videos, source_url } = body

    logStep('Import videos request', { 
      userId, 
      productId: product_id, 
      videosCount: videos?.length || 0 
    })

    if (!product_id || !videos || videos.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'product_id and videos array required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Verify product ownership
    const { data: product } = await supabaseClient
      .from('imported_products')
      .select('id, user_id, title')
      .eq('id', product_id)
      .eq('user_id', userId)
      .single()

    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      })
    }

    // Process and validate videos
    const processedVideos: VideoData[] = []

    for (const video of videos) {
      const videoUrl = typeof video === 'string' ? video : video.url
      
      if (!videoUrl) continue

      // Determine video type
      let videoType: VideoData['type'] = 'unknown'
      
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        videoType = 'youtube'
      } else if (videoUrl.endsWith('.mp4') || videoUrl.includes('.mp4')) {
        videoType = 'mp4'
      } else if (videoUrl.endsWith('.webm') || videoUrl.includes('.webm')) {
        videoType = 'webm'
      } else if (videoUrl.includes('embed') || videoUrl.includes('iframe')) {
        videoType = 'embed'
      }

      // Only add valid video URLs
      if (videoUrl.startsWith('http')) {
        processedVideos.push({
          url: videoUrl,
          type: videoType,
          thumbnail: video.thumbnail || null,
          duration: video.duration || null
        })
      }
    }

    if (processedVideos.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'No valid videos found to import',
        imported: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Get existing product data
    const { data: existingProduct } = await supabaseClient
      .from('imported_products')
      .select('video_urls')
      .eq('id', product_id)
      .single()

    // Merge with existing videos (deduplicate)
    const existingVideos = existingProduct?.video_urls || []
    const existingUrls = new Set(
      existingVideos.map((v: string | VideoData) => typeof v === 'string' ? v : v.url)
    )
    
    const newVideos = processedVideos.filter(v => !existingUrls.has(v.url))
    const allVideos = [...existingVideos, ...newVideos.map(v => v.url)]

    // Update product with videos
    const { error: updateError } = await supabaseClient
      .from('imported_products')
      .update({ 
        video_urls: allVideos,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id)

    if (updateError) throw updateError

    // Also insert into product_media table for better tracking
    const mediaInserts = newVideos.map(video => ({
      product_id,
      user_id: userId,
      media_type: 'video',
      url: video.url,
      metadata: {
        type: video.type,
        thumbnail: video.thumbnail,
        duration: video.duration,
        source_url
      }
    }))

    if (mediaInserts.length > 0) {
      await supabaseClient
        .from('product_media')
        .insert(mediaInserts)
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'extension_videos_imported',
        entity_type: 'product',
        entity_id: product_id,
        description: `${newVideos.length} videos imported via extension`,
        details: {
          product_title: product.title,
          videos_count: newVideos.length,
          source_url
        },
        source: 'extension'
      })

    logStep('Videos imported successfully', { 
      productId: product_id, 
      newVideos: newVideos.length,
      totalVideos: allVideos.length
    })

    return new Response(JSON.stringify({
      success: true,
      imported: newVideos.length,
      total_videos: allVideos.length,
      videos: newVideos
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    logStep('ERROR', { message: error.message })
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
