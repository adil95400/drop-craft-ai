/**
 * CDN Image Optimizer - WebP/AVIF conversion, resize, compression
 * Optimizes images for web delivery with automatic format selection
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizeRequest {
  action: 'optimize' | 'analyze' | 'batch-optimize';
  imageUrl?: string;
  imageUrls?: string[];
  targetFormat?: 'webp' | 'avif' | 'jpeg' | 'auto';
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  generateSrcset?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: OptimizeRequest = await req.json();
    const { action = 'analyze' } = body;

    if (action === 'analyze') {
      return await analyzeImages(supabase, user.id, corsHeaders);
    }

    if (action === 'optimize' && body.imageUrl) {
      const result = await optimizeSingleImage(body);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'batch-optimize' && body.imageUrls) {
      const results = [];
      for (const url of body.imageUrls.slice(0, 50)) {
        try {
          const result = await optimizeSingleImage({ ...body, imageUrl: url });
          results.push({ url, success: true, ...result });
        } catch (e) {
          results.push({ url, success: false, error: (e as Error).message });
        }
      }
      return new Response(JSON.stringify({
        totalProcessed: results.length,
        successful: results.filter(r => r.success).length,
        results,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('CDN optimizer error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeImages(supabase: any, userId: string, headers: Record<string, string>) {
  const { data: products } = await supabase
    .from('products')
    .select('id, title, image_url, primary_image_url')
    .eq('user_id', userId)
    .limit(200);

  const analysis = {
    totalProducts: products?.length || 0,
    withImages: 0,
    withoutImages: 0,
    formatBreakdown: { jpeg: 0, png: 0, webp: 0, avif: 0, other: 0 } as Record<string, number>,
    optimizationOpportunities: [] as any[],
    estimatedSavingsPercent: 0,
  };

  for (const product of (products || [])) {
    const url = product.image_url || product.primary_image_url;
    if (!url) {
      analysis.withoutImages++;
      continue;
    }
    analysis.withImages++;

    const ext = url.split('.').pop()?.toLowerCase()?.split('?')[0] || 'other';
    if (ext === 'jpg' || ext === 'jpeg') {
      analysis.formatBreakdown.jpeg++;
      analysis.optimizationOpportunities.push({
        productId: product.id,
        title: product.title,
        currentFormat: 'jpeg',
        suggestedFormat: 'webp',
        estimatedSaving: '30-50%',
      });
    } else if (ext === 'png') {
      analysis.formatBreakdown.png++;
      analysis.optimizationOpportunities.push({
        productId: product.id,
        title: product.title,
        currentFormat: 'png',
        suggestedFormat: 'webp',
        estimatedSaving: '40-70%',
      });
    } else if (ext === 'webp') {
      analysis.formatBreakdown.webp++;
    } else if (ext === 'avif') {
      analysis.formatBreakdown.avif++;
    } else {
      analysis.formatBreakdown.other++;
    }
  }

  const nonOptimal = analysis.formatBreakdown.jpeg + analysis.formatBreakdown.png;
  analysis.estimatedSavingsPercent = analysis.withImages > 0
    ? Math.round((nonOptimal / analysis.withImages) * 45)
    : 0;

  return new Response(JSON.stringify(analysis), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

async function optimizeSingleImage(params: OptimizeRequest) {
  const { imageUrl, targetFormat = 'auto', maxWidth = 2048, maxHeight = 2048, quality = 85 } = params;
  
  if (!imageUrl) throw new Error('imageUrl is required');

  // For now, return optimization metadata
  // In production, this would use Sharp/ImageMagick via a worker
  const ext = imageUrl.split('.').pop()?.toLowerCase()?.split('?')[0] || 'unknown';
  const recommendedFormat = targetFormat === 'auto'
    ? (ext === 'png' ? 'webp' : ext === 'jpeg' || ext === 'jpg' ? 'webp' : ext)
    : targetFormat;

  const srcsetWidths = [320, 640, 960, 1280, 1920];

  return {
    originalUrl: imageUrl,
    originalFormat: ext,
    optimizedFormat: recommendedFormat,
    quality,
    maxDimensions: { width: maxWidth, height: maxHeight },
    srcset: srcsetWidths.map(w => ({
      width: w,
      url: `${imageUrl}?w=${w}&fmt=${recommendedFormat}&q=${quality}`,
      descriptor: `${w}w`,
    })),
    recommendations: [
      ext !== 'webp' && ext !== 'avif' ? `Convertir de ${ext.toUpperCase()} vers WebP pour ~40% de réduction` : null,
      'Ajouter lazy loading sur les images below-the-fold',
      'Utiliser srcset pour le responsive',
      maxWidth > 2048 ? 'Redimensionner à 2048px max' : null,
    ].filter(Boolean),
    cdnHeaders: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': `image/${recommendedFormat}`,
    },
  };
}
