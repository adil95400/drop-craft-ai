/**
 * Media Pipeline Processor
 * Pipeline automatique: Upload → Cloudinary → Optimisation → Distribution
 * 
 * Uses existing media_assets table schema with metadata JSONB for Cloudinary fields.
 * 
 * Actions:
 * - upload: Upload et optimise une image vers Cloudinary
 * - batch_upload: Upload multiple images
 * - generate_variants: Génère des variantes (thumbnails, formats)
 * - stats: Statistiques du pipeline
 */

import { createClient } from 'npm:@supabase/supabase-js@2
import { 
  uploadToCloudinary, 
  getOptimizedUrl, 
  generateSrcSet, 
  PRODUCT_EAGER_TRANSFORMS,
} from '../_shared/cloudinary-client.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PipelineRequest {
  action: 'upload' | 'batch_upload' | 'generate_variants' | 'stats';
  imageData?: string;
  images?: string[];
  productId?: string;
  fileName?: string;
  folder?: string;
  tags?: string[];
  mediaAssetId?: string;
  widths?: number[];
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
      return jsonResponse({ error: 'Authorization required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    const body: PipelineRequest = await req.json();

    switch (body.action) {
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

        const cdnUrl = getOptimizedUrl(result.public_id, { format: 'auto', quality: 'auto' });
        const thumbnailUrl = getOptimizedUrl(result.public_id, { 
          width: 150, height: 150, crop: 'thumb', gravity: 'auto', format: 'auto' 
        });
        const srcset = generateSrcSet(result.public_id);
        const optimizationScore = calculateOptimizationScore(result);

        // Save to existing media_assets table using its actual schema
        const { data: asset, error: insertError } = await supabase
          .from('media_assets')
          .insert({
            user_id: user.id,
            file_name: body.fileName || result.public_id.split('/').pop() || 'uploaded',
            original_name: body.fileName || 'uploaded',
            file_path: result.public_id,
            file_url: result.secure_url,
            file_size: result.bytes,
            mime_type: `image/${result.format}`,
            media_type: 'image',
            width: result.width,
            height: result.height,
            tags: body.tags || ['product'],
            variants: result.eager ? result.eager.map(e => ({
              url: e.secure_url,
              width: e.width,
              height: e.height,
              format: e.format,
              size: e.bytes
            })) : [],
            metadata: {
              cloudinary_public_id: result.public_id,
              cdn_url: cdnUrl,
              thumbnail_url: thumbnailUrl,
              srcset,
              optimization_score: optimizationScore,
              optimized_size: result.eager?.[0]?.bytes || result.bytes,
              pipeline_status: 'completed',
              product_id: body.productId || null,
              processed_at: new Date().toISOString(),
            },
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
            cdn_url: cdnUrl,
            thumbnail: thumbnailUrl,
            srcset,
            variants_count: result.eager?.length || 0,
            optimization_score: optimizationScore,
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

            const cdnUrl = getOptimizedUrl(result.public_id, { format: 'auto', quality: 'auto' });
            const thumbnailUrl = getOptimizedUrl(result.public_id, {
              width: 150, height: 150, crop: 'thumb', gravity: 'auto', format: 'auto'
            });

            const { data: asset } = await supabase
              .from('media_assets')
              .insert({
                user_id: user.id,
                file_name: result.public_id.split('/').pop() || 'batch',
                original_name: imageUrl.split('/').pop() || 'batch',
                file_path: result.public_id,
                file_url: result.secure_url,
                file_size: result.bytes,
                mime_type: `image/${result.format}`,
                media_type: 'image',
                width: result.width,
                height: result.height,
                tags: body.tags || ['product', 'batch'],
                variants: result.eager?.map(e => ({ 
                  url: e.secure_url, width: e.width, height: e.height, format: e.format, size: e.bytes 
                })) || [],
                metadata: {
                  cloudinary_public_id: result.public_id,
                  cdn_url: cdnUrl,
                  thumbnail_url: thumbnailUrl,
                  srcset: generateSrcSet(result.public_id),
                  optimization_score: calculateOptimizationScore(result),
                  optimized_size: result.eager?.[0]?.bytes || result.bytes,
                  pipeline_status: 'completed',
                  product_id: body.productId || null,
                  processed_at: new Date().toISOString(),
                },
              })
              .select()
              .single();

            results.push({ success: true, asset, public_id: result.public_id });
          } catch (err) {
            results.push({ success: false, error: (err as Error).message, imageUrl });
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

        if (!asset) {
          return jsonResponse({ error: 'Asset not found' }, 404);
        }

        const publicId = (asset.metadata as any)?.cloudinary_public_id || asset.file_path;
        if (!publicId) {
          return jsonResponse({ error: 'No Cloudinary ID found for this asset' }, 400);
        }

        const widths = body.widths || [320, 640, 960, 1280, 1920];
        const variants = widths.map(w => ({
          url: getOptimizedUrl(publicId, { width: w, format: 'auto', quality: 'auto', crop: 'limit' }),
          width: w,
          format: 'auto',
        }));

        await supabase
          .from('media_assets')
          .update({
            variants,
            metadata: {
              ...(asset.metadata as object || {}),
              srcset: generateSrcSet(publicId, widths),
              pipeline_status: 'completed',
            },
          })
          .eq('id', body.mediaAssetId);

        return jsonResponse({ success: true, variants });
      }

      case 'stats': {
        const { data: assets, count } = await supabase
          .from('media_assets')
          .select('file_size, mime_type, metadata', { count: 'exact' })
          .eq('user_id', user.id);

        const totalOriginalSize = assets?.reduce((sum, a) => sum + (a.file_size || 0), 0) || 0;
        const totalOptimizedSize = assets?.reduce((sum, a) => {
          const meta = a.metadata as any;
          return sum + (meta?.optimized_size || a.file_size || 0);
        }, 0) || 0;

        const avgScore = assets?.length 
          ? Math.round(assets.reduce((sum, a) => {
              const meta = a.metadata as any;
              return sum + (meta?.optimization_score || 0);
            }, 0) / assets.length)
          : 0;

        const pipelineStats: Record<string, number> = {};
        assets?.forEach(a => {
          const status = (a.metadata as any)?.pipeline_status || 'unknown';
          pipelineStats[status] = (pipelineStats[status] || 0) + 1;
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
          pipelineStats,
        });
      }

      default:
        return jsonResponse({ error: `Unknown action: ${body.action}` }, 400);
    }
  } catch (error) {
    console.error('Media pipeline error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function calculateOptimizationScore(result: { 
  bytes: number; format: string; eager?: Array<{ bytes: number }> 
}): number {
  let score = 50;
  if (['webp', 'avif'].includes(result.format)) score += 15;
  else if (['jpg', 'jpeg', 'png'].includes(result.format)) score += 5;

  if (result.bytes < 100_000) score += 20;
  else if (result.bytes < 300_000) score += 15;
  else if (result.bytes < 500_000) score += 10;
  else if (result.bytes < 1_000_000) score += 5;

  if (result.eager && result.eager.length >= 3) score += 15;
  else if (result.eager && result.eager.length >= 1) score += 10;

  return Math.min(100, score);
}
