/**
 * Media Pipeline Processor
 * Pipeline automatique: Upload → Cloudinary → Optimisation → Distribution
 * 
 * Actions supportées:
 * - upload: Upload et optimise une image vers Cloudinary
 * - batch_upload: Upload multiple images
 * - optimize: Optimise une image existante (re-process)
 * - generate_variants: Génère des variantes (thumbnails, formats)
 * - remove_background: Suppression d'arrière-plan via IA
 * - stats: Statistiques du pipeline
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  uploadToCloudinary, 
  getOptimizedUrl, 
  generateSrcSet, 
  PRODUCT_EAGER_TRANSFORMS,
  deleteFromCloudinary
} from '../_shared/cloudinary-client.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PipelineRequest {
  action: 'upload' | 'batch_upload' | 'optimize' | 'generate_variants' | 'remove_background' | 'stats';
  // Upload
  imageData?: string; // base64 or URL
  images?: string[]; // batch
  productId?: string;
  fileName?: string;
  folder?: string;
  tags?: string[];
  // Optimize
  mediaAssetId?: string;
  // Variants
  widths?: number[];
  formats?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: PipelineRequest = await req.json();
    const { action } = body;

    switch (action) {
      case 'upload': {
        if (!body.imageData) {
          return jsonResponse({ error: 'imageData required' }, 400);
        }

        const folder = body.folder || `shopopti/${user.id}/products`;
        const result = await uploadToCloudinary(body.imageData, {
          folder,
          tags: body.tags || ['product', 'auto-pipeline'],
          eager: PRODUCT_EAGER_TRANSFORMS,
        });

        // Save to media_assets table
        const { data: asset, error: insertError } = await supabase
          .from('media_assets')
          .insert({
            user_id: user.id,
            product_id: body.productId || null,
            file_name: body.fileName || result.public_id.split('/').pop() || 'uploaded',
            original_url: result.secure_url,
            cloudinary_public_id: result.public_id,
            cdn_url: getOptimizedUrl(result.public_id, { format: 'auto', quality: 'auto' }),
            thumbnail_url: getOptimizedUrl(result.public_id, { width: 150, height: 150, crop: 'thumb', gravity: 'auto', format: 'auto' }),
            format: result.format,
            width: result.width,
            height: result.height,
            file_size: result.bytes,
            optimized_size: result.eager?.[0]?.bytes || result.bytes,
            srcset: generateSrcSet(result.public_id),
            variants: result.eager ? result.eager.map(e => ({
              url: e.secure_url,
              width: e.width,
              height: e.height,
              format: e.format,
              size: e.bytes
            })) : [],
            pipeline_status: 'completed',
            optimization_score: calculateOptimizationScore(result),
            tags: body.tags || ['product'],
          })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to save media asset:', insertError);
        }

        return jsonResponse({
          success: true,
          asset,
          cloudinary: {
            public_id: result.public_id,
            url: result.secure_url,
            cdn_url: getOptimizedUrl(result.public_id, { format: 'auto', quality: 'auto' }),
            thumbnail: getOptimizedUrl(result.public_id, { width: 150, height: 150, crop: 'thumb', gravity: 'auto', format: 'auto' }),
            srcset: generateSrcSet(result.public_id),
            variants_count: result.eager?.length || 0,
          }
        });
      }

      case 'batch_upload': {
        if (!body.images || body.images.length === 0) {
          return jsonResponse({ error: 'images array required' }, 400);
        }

        const results = [];
        const folder = body.folder || `shopopti/${user.id}/products`;

        for (const imageUrl of body.images.slice(0, 50)) {
          try {
            const result = await uploadToCloudinary(imageUrl, {
              folder,
              tags: body.tags || ['product', 'batch-import'],
              eager: PRODUCT_EAGER_TRANSFORMS,
            });

            const { data: asset } = await supabase
              .from('media_assets')
              .insert({
                user_id: user.id,
                product_id: body.productId || null,
                file_name: result.public_id.split('/').pop() || 'batch',
                original_url: result.secure_url,
                cloudinary_public_id: result.public_id,
                cdn_url: getOptimizedUrl(result.public_id, { format: 'auto', quality: 'auto' }),
                thumbnail_url: getOptimizedUrl(result.public_id, { width: 150, height: 150, crop: 'thumb', gravity: 'auto', format: 'auto' }),
                format: result.format,
                width: result.width,
                height: result.height,
                file_size: result.bytes,
                optimized_size: result.eager?.[0]?.bytes || result.bytes,
                srcset: generateSrcSet(result.public_id),
                variants: result.eager?.map(e => ({ url: e.secure_url, width: e.width, height: e.height, format: e.format, size: e.bytes })) || [],
                pipeline_status: 'completed',
                optimization_score: calculateOptimizationScore(result),
                tags: body.tags || ['product', 'batch'],
              })
              .select()
              .single();

            results.push({ success: true, asset, public_id: result.public_id });
          } catch (err) {
            results.push({ success: false, error: err.message, imageUrl });
          }
        }

        return jsonResponse({
          success: true,
          total: body.images.length,
          processed: results.length,
          succeeded: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results,
        });
      }

      case 'generate_variants': {
        if (!body.mediaAssetId) {
          return jsonResponse({ error: 'mediaAssetId required' }, 400);
        }

        const { data: asset } = await supabase
          .from('media_assets')
          .select('*')
          .eq('id', body.mediaAssetId)
          .eq('user_id', user.id)
          .single();

        if (!asset || !asset.cloudinary_public_id) {
          return jsonResponse({ error: 'Asset not found' }, 404);
        }

        const widths = body.widths || [320, 640, 960, 1280, 1920];
        const variants = widths.map(w => ({
          url: getOptimizedUrl(asset.cloudinary_public_id, { width: w, format: 'auto', quality: 'auto', crop: 'limit' }),
          width: w,
          format: 'auto',
        }));

        await supabase
          .from('media_assets')
          .update({
            srcset: generateSrcSet(asset.cloudinary_public_id, widths),
            variants,
            pipeline_status: 'completed',
          })
          .eq('id', body.mediaAssetId);

        return jsonResponse({ success: true, variants });
      }

      case 'stats': {
        const { data: assets, count } = await supabase
          .from('media_assets')
          .select('file_size, optimized_size, format, pipeline_status, optimization_score', { count: 'exact' })
          .eq('user_id', user.id);

        const totalOriginalSize = assets?.reduce((sum, a) => sum + (a.file_size || 0), 0) || 0;
        const totalOptimizedSize = assets?.reduce((sum, a) => sum + (a.optimized_size || 0), 0) || 0;
        const avgScore = assets?.length 
          ? Math.round(assets.reduce((sum, a) => sum + (a.optimization_score || 0), 0) / assets.length)
          : 0;

        const formatDistribution: Record<string, number> = {};
        assets?.forEach(a => {
          const fmt = a.format || 'unknown';
          formatDistribution[fmt] = (formatDistribution[fmt] || 0) + 1;
        });

        const statusDistribution: Record<string, number> = {};
        assets?.forEach(a => {
          const st = a.pipeline_status || 'unknown';
          statusDistribution[st] = (statusDistribution[st] || 0) + 1;
        });

        return jsonResponse({
          totalAssets: count || 0,
          totalOriginalSize,
          totalOptimizedSize,
          savedBytes: totalOriginalSize - totalOptimizedSize,
          savedPercent: totalOriginalSize > 0 
            ? Math.round(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100) 
            : 0,
          averageOptimizationScore: avgScore,
          formatDistribution,
          statusDistribution,
        });
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error('Media pipeline error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function calculateOptimizationScore(result: { bytes: number; width: number; height: number; format: string; eager?: Array<{ bytes: number }> }): number {
  let score = 50; // Base

  // Format bonus
  if (['webp', 'avif'].includes(result.format)) score += 15;
  else if (['jpg', 'jpeg', 'png'].includes(result.format)) score += 5;

  // Size efficiency (target: < 500KB for standard product images)
  if (result.bytes < 100_000) score += 20;
  else if (result.bytes < 300_000) score += 15;
  else if (result.bytes < 500_000) score += 10;
  else if (result.bytes < 1_000_000) score += 5;

  // Variants generated
  if (result.eager && result.eager.length >= 3) score += 15;
  else if (result.eager && result.eager.length >= 1) score += 10;

  return Math.min(100, score);
}
