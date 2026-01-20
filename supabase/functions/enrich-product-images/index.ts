import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, method, sourceUrl, existingImageUrl, productTitle } = await req.json();

    if (!productId) {
      throw new Error('productId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let newImages: string[] = [];

    switch (method) {
      case 'scrape':
        newImages = await scrapeImagesFromSource(sourceUrl);
        break;
      case 'ai':
        newImages = await generateImagesWithAI(productTitle, existingImageUrl);
        break;
      case 'search':
        // Future implementation
        throw new Error('Search method not yet implemented');
      default:
        throw new Error('Invalid method');
    }

    if (newImages.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No new images found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get existing images
    const { data: product } = await supabase
      .from('products')
      .select('image_url, images')
      .eq('id', productId)
      .single();

    // Combine existing and new images (max 10)
    const existingImages = Array.isArray(product?.images) ? product.images : [];
    const allImages = [...new Set([...existingImages, ...newImages])].slice(0, 10);

    // Update product
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        images: allImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) {
      // Try imported_products table
      await supabase
        .from('imported_products')
        .update({ 
          images: allImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imagesAdded: newImages.length,
        totalImages: allImages.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error enriching images:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function scrapeImagesFromSource(sourceUrl: string): Promise<string[]> {
  if (!sourceUrl) return [];

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) return [];

    const html = await response.text();
    const images: string[] = [];

    // Extract images based on source type
    if (sourceUrl.includes('amazon')) {
      // Amazon image patterns
      const amazonPatterns = [
        /data-old-hires="([^"]+)"/g,
        /data-a-dynamic-image="[^"]*"(https:\/\/[^"]+\.jpg)/g,
        /"hiRes":"(https:\/\/[^"]+)"/g,
        /"large":"(https:\/\/[^"]+)"/g,
        /https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9._%-]+\.jpg/g
      ];

      for (const pattern of amazonPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const url = match[1] || match[0];
          if (url && url.startsWith('http') && !images.includes(url)) {
            // Normalize Amazon URLs to get high-res versions
            const normalizedUrl = normalizeAmazonImageUrl(url);
            if (!images.includes(normalizedUrl)) {
              images.push(normalizedUrl);
            }
          }
        }
      }
    } else {
      // Generic image extraction
      const imgPattern = /<img[^>]+src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/gi;
      const matches = html.matchAll(imgPattern);
      for (const match of matches) {
        if (match[1] && !images.includes(match[1])) {
          images.push(match[1]);
        }
      }

      // Also check og:image meta tags
      const ogImagePattern = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/gi;
      const ogMatches = html.matchAll(ogImagePattern);
      for (const match of ogMatches) {
        if (match[1] && !images.includes(match[1])) {
          images.push(match[1]);
        }
      }
    }

    // Return unique images, max 5 new ones
    return [...new Set(images)].slice(0, 5);
  } catch (error) {
    console.error('Error scraping images:', error);
    return [];
  }
}

function normalizeAmazonImageUrl(url: string): string {
  // Remove Amazon size modifiers to get original high-res image
  return url.replace(/\._[A-Z]{2}_[A-Z0-9,_]+_\./, '.');
}

async function generateImagesWithAI(productTitle: string, existingImageUrl: string | null): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const images: string[] = [];

  // Generate 2 variations
  const prompts = [
    `Product photo of ${productTitle}, professional studio lighting, white background, high resolution, e-commerce style`,
    `Lifestyle product shot of ${productTitle}, natural lighting, modern interior setting, commercial photography`
  ];

  for (const prompt of prompts) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: existingImageUrl ? [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: existingImageUrl } }
              ] : prompt
            }
          ],
          modalities: ['image', 'text']
        })
      });

      if (!response.ok) continue;

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (imageUrl) {
        images.push(imageUrl);
      }
    } catch (error) {
      console.error('Error generating AI image:', error);
    }
  }

  return images;
}
