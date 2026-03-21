/**
 * Upload Product Media → Cloudinary
 * Accepts base64 or URL, uploads to Cloudinary, saves metadata to product_media table.
 * Generates eager transforms: thumbnail, gallery, ads_square, ads_story + f_auto/q_auto.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  uploadToCloudinary,
  getOptimizedUrl,
  generateSrcSet,
} from '../_shared/cloudinary-client.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

/** Named transform presets */
const TRANSFORM_PRESETS: Record<string, string> = {
  thumbnail:   'w_300,h_300,c_fill,g_auto,f_auto,q_auto',
  gallery:     'w_1200,h_1200,c_limit,f_auto,q_auto',
  ads_square:  'w_1080,h_1080,c_fill,g_auto,f_auto,q_auto',
  ads_story:   'w_1080,h_1920,c_fill,g_auto,f_auto,q_auto',
  cdn_auto:    'f_auto,q_auto',
}

const ALL_EAGER = Object.values(TRANSFORM_PRESETS)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Authorization required' }, 401)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return json({ error: 'Invalid token' }, 401)

    const body = await req.json()
    const { imageData, productId, fileName, folder, tags, position } = body

    if (!imageData) return json({ error: 'imageData (base64 or URL) required' }, 400)
    if (!productId) return json({ error: 'productId required' }, 400)

    // Determine next position if not provided
    let mediaPosition = position
    if (mediaPosition == null) {
      const { count } = await supabase
        .from('product_media')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
        .eq('user_id', user.id)
      mediaPosition = (count || 0) + 1
    }

    // Insert row with status=pending
    const { data: mediaRow, error: insertErr } = await supabase
      .from('product_media')
      .insert({
        user_id: user.id,
        product_id: productId,
        status: 'pending',
        original_filename: fileName || 'upload',
        position: mediaPosition,
        tags: tags || [],
      })
      .select()
      .single()

    if (insertErr) {
      console.error('Insert error:', insertErr)
      return json({ error: 'Failed to create media record' }, 500)
    }

    // Update to processing
    await supabase.from('product_media').update({ status: 'processing' }).eq('id', mediaRow.id)

    try {
      const uploadFolder = folder || `shopopti/${user.id}/products/${productId}`

      // Upload to Cloudinary with eager transforms
      const result = await uploadToCloudinary(imageData, {
        folder: uploadFolder,
        tags: [...(tags || []), 'product', productId],
        eager: ALL_EAGER,
      })

      // Build transforms map
      const transforms: Record<string, { url: string; width: number; height: number }> = {}
      const presetNames = Object.keys(TRANSFORM_PRESETS)
      if (result.eager) {
        result.eager.forEach((e, i) => {
          if (presetNames[i]) {
            transforms[presetNames[i]] = {
              url: e.secure_url,
              width: e.width,
              height: e.height,
            }
          }
        })
      }

      // Also build named URLs via getOptimizedUrl for deterministic access
      const cdnUrl = getOptimizedUrl(result.public_id, { format: 'auto', quality: 'auto' })
      const thumbnailUrl = getOptimizedUrl(result.public_id, {
        width: 300, height: 300, crop: 'fill', gravity: 'auto', format: 'auto', quality: 'auto',
      })
      const srcset = generateSrcSet(result.public_id)

      // Calculate optimization score
      let score = 50
      if (['webp', 'avif'].includes(result.format)) score += 15
      else if (['jpg', 'jpeg', 'png'].includes(result.format)) score += 5
      if (result.bytes < 100_000) score += 20
      else if (result.bytes < 300_000) score += 15
      else if (result.bytes < 500_000) score += 10
      if (result.eager && result.eager.length >= 3) score += 15
      score = Math.min(100, score)

      // Update row with Cloudinary data
      const { data: updated, error: updateErr } = await supabase
        .from('product_media')
        .update({
          status: 'ready',
          cloudinary_public_id: result.public_id,
          cloudinary_url: result.secure_url,
          cdn_url: cdnUrl,
          thumbnail_url: thumbnailUrl,
          srcset,
          original_width: result.width,
          original_height: result.height,
          original_size: result.bytes,
          optimized_size: result.eager?.[0]?.bytes || result.bytes,
          mime_type: `image/${result.format}`,
          format: result.format,
          optimization_score: score,
          transforms,
          processed_at: new Date().toISOString(),
        })
        .eq('id', mediaRow.id)
        .select()
        .single()

      if (updateErr) console.error('Update error:', updateErr)

      return json({
        success: true,
        media: updated || mediaRow,
        cloudinary: {
          public_id: result.public_id,
          url: result.secure_url,
          cdn_url: cdnUrl,
          thumbnail_url: thumbnailUrl,
          srcset,
          transforms,
          optimization_score: score,
        },
      })
    } catch (cloudinaryError) {
      // Mark as failed
      await supabase.from('product_media').update({
        status: 'failed',
        error_message: (cloudinaryError as Error).message,
      }).eq('id', mediaRow.id)

      return json({
        success: false,
        error: (cloudinaryError as Error).message,
        mediaId: mediaRow.id,
      }, 500)
    }
  } catch (error) {
    console.error('Upload product media error:', error)
    return json({ error: (error as Error).message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
