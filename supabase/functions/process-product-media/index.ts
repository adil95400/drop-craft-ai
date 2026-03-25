/**
 * Process Product Media — Async variant generation & transformations
 * 
 * Actions:
 * - generate_variants: Re-generate all named transforms for an existing media
 * - batch_process: Process multiple product media items
 * - reprocess: Re-upload and process a failed media
 * - get_status: Get processing status for a product's media
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  uploadToCloudinary,
  getOptimizedUrl,
  generateSrcSet,
} from '../_shared/cloudinary-client.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const NAMED_TRANSFORMS: Record<string, { w?: number; h?: number; crop: string; gravity?: string }> = {
  thumbnail:  { w: 300,  h: 300,  crop: 'fill', gravity: 'auto' },
  gallery:    { w: 1200, h: 1200, crop: 'limit' },
  ads_square: { w: 1080, h: 1080, crop: 'fill', gravity: 'auto' },
  ads_story:  { w: 1080, h: 1920, crop: 'fill', gravity: 'auto' },
  cdn_auto:   { crop: 'limit' },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Authorization required' }, 401)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return json({ error: 'Invalid token' }, 401)

    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'generate_variants': {
        const { mediaId } = body
        if (!mediaId) return json({ error: 'mediaId required' }, 400)

        const { data: media } = await supabase
          .from('product_media')
          .select('*')
          .eq('id', mediaId)
          .eq('user_id', user.id)
          .single()

        if (!media) return json({ error: 'Media not found' }, 404)
        if (!media.cloudinary_public_id) return json({ error: 'No Cloudinary ID' }, 400)

        await supabase.from('product_media').update({ status: 'processing' }).eq('id', mediaId)

        try {
          const transforms: Record<string, { url: string; width: number; height: number }> = {}

          for (const [name, config] of Object.entries(NAMED_TRANSFORMS)) {
            const url = getOptimizedUrl(media.cloudinary_public_id, {
              width: config.w,
              height: config.h,
              crop: config.crop as any,
              gravity: config.gravity as any,
              format: 'auto',
              quality: 'auto',
            })
            transforms[name] = { url, width: config.w || media.original_width || 0, height: config.h || media.original_height || 0 }
          }

          const srcset = generateSrcSet(media.cloudinary_public_id)
          const thumbnailUrl = transforms.thumbnail?.url || media.thumbnail_url

          await supabase.from('product_media').update({
            status: 'ready',
            transforms,
            srcset,
            thumbnail_url: thumbnailUrl,
            processed_at: new Date().toISOString(),
            error_message: null,
          }).eq('id', mediaId)

          return json({ success: true, transforms, srcset })
        } catch (err) {
          await supabase.from('product_media').update({
            status: 'failed',
            error_message: (err as Error).message,
          }).eq('id', mediaId)
          return json({ error: (err as Error).message }, 500)
        }
      }

      case 'batch_process': {
        const { productId } = body
        if (!productId) return json({ error: 'productId required' }, 400)

        const { data: mediaItems } = await supabase
          .from('product_media')
          .select('*')
          .eq('product_id', productId)
          .eq('user_id', user.id)
          .in('status', ['ready', 'failed'])

        if (!mediaItems || mediaItems.length === 0) {
          return json({ success: true, processed: 0, message: 'No media to process' })
        }

        const results = []
        for (const media of mediaItems) {
          if (!media.cloudinary_public_id) {
            results.push({ id: media.id, success: false, error: 'No Cloudinary ID' })
            continue
          }

          try {
            const transforms: Record<string, { url: string; width: number; height: number }> = {}
            for (const [name, config] of Object.entries(NAMED_TRANSFORMS)) {
              const url = getOptimizedUrl(media.cloudinary_public_id, {
                width: config.w,
                height: config.h,
                crop: config.crop as any,
                gravity: config.gravity as any,
                format: 'auto',
                quality: 'auto',
              })
              transforms[name] = { url, width: config.w || 0, height: config.h || 0 }
            }

            await supabase.from('product_media').update({
              status: 'ready',
              transforms,
              srcset: generateSrcSet(media.cloudinary_public_id),
              thumbnail_url: transforms.thumbnail?.url,
              processed_at: new Date().toISOString(),
              error_message: null,
            }).eq('id', media.id)

            results.push({ id: media.id, success: true })
          } catch (err) {
            await supabase.from('product_media').update({
              status: 'failed',
              error_message: (err as Error).message,
            }).eq('id', media.id)
            results.push({ id: media.id, success: false, error: (err as Error).message })
          }
        }

        return json({
          success: true,
          total: mediaItems.length,
          succeeded: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results,
        })
      }

      case 'reprocess': {
        const { mediaId, imageData } = body
        if (!mediaId) return json({ error: 'mediaId required' }, 400)

        const { data: media } = await supabase
          .from('product_media')
          .select('*')
          .eq('id', mediaId)
          .eq('user_id', user.id)
          .single()

        if (!media) return json({ error: 'Media not found' }, 404)

        const source = imageData || media.cloudinary_url
        if (!source) return json({ error: 'No source image available' }, 400)

        await supabase.from('product_media').update({ status: 'processing' }).eq('id', mediaId)

        try {
          const folder = `shopopti/${user.id}/products/${media.product_id}`
          const eager = Object.values(NAMED_TRANSFORMS).map(t => {
            const parts = ['f_auto', 'q_auto']
            if (t.w) parts.push(`w_${t.w}`)
            if (t.h) parts.push(`h_${t.h}`)
            parts.push(`c_${t.crop}`)
            if (t.gravity) parts.push(`g_${t.gravity}`)
            return parts.join(',')
          })

          const result = await uploadToCloudinary(source, { folder, eager, tags: ['reprocess', media.product_id] })

          const transforms: Record<string, { url: string; width: number; height: number }> = {}
          const names = Object.keys(NAMED_TRANSFORMS)
          result.eager?.forEach((e, i) => {
            if (names[i]) transforms[names[i]] = { url: e.secure_url, width: e.width, height: e.height }
          })

          const cdnUrl = getOptimizedUrl(result.public_id, { format: 'auto', quality: 'auto' })

          await supabase.from('product_media').update({
            status: 'ready',
            cloudinary_public_id: result.public_id,
            cloudinary_url: result.secure_url,
            cdn_url: cdnUrl,
            thumbnail_url: transforms.thumbnail?.url || cdnUrl,
            srcset: generateSrcSet(result.public_id),
            original_width: result.width,
            original_height: result.height,
            original_size: result.bytes,
            format: result.format,
            mime_type: `image/${result.format}`,
            transforms,
            processed_at: new Date().toISOString(),
            error_message: null,
            retry_count: (media.retry_count || 0) + 1,
          }).eq('id', mediaId)

          return json({ success: true, media: { id: mediaId, status: 'ready', transforms } })
        } catch (err) {
          await supabase.from('product_media').update({
            status: 'failed',
            error_message: (err as Error).message,
            retry_count: (media.retry_count || 0) + 1,
          }).eq('id', mediaId)
          return json({ error: (err as Error).message }, 500)
        }
      }

      case 'get_status': {
        const { productId } = body
        if (!productId) return json({ error: 'productId required' }, 400)

        const { data: mediaItems } = await supabase
          .from('product_media')
          .select('id, status, original_filename, thumbnail_url, cdn_url, optimization_score, position, error_message, processed_at')
          .eq('product_id', productId)
          .eq('user_id', user.id)
          .order('position', { ascending: true })

        const statusCounts = { pending: 0, processing: 0, ready: 0, failed: 0 }
        mediaItems?.forEach(m => {
          if (m.status in statusCounts) statusCounts[m.status as keyof typeof statusCounts]++
        })

        return json({
          success: true,
          productId,
          total: mediaItems?.length || 0,
          statusCounts,
          media: mediaItems || [],
        })
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (error) {
    console.error('Process product media error:', error)
    return json({ error: (error as Error).message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
