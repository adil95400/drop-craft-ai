import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, method, sourceUrl, existingImageUrl, productTitle, sku, marketplace, generateAltText = true } = await req.json();

    if (!productId) {
      throw new Error('productId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let newImages: string[] = [];
    let source = method;

    switch (method) {
      case 'scrape':
        newImages = await scrapeImagesFromSource(sourceUrl);
        break;
      case 'ai':
        newImages = await generateImagesWithAI(productTitle, existingImageUrl);
        break;
      case 'multi-search':
        const result = await multiSourceSearch(productTitle, sku, existingImageUrl);
        newImages = result.images;
        source = result.source;
        break;
      case 'alt-text-only':
        // Only generate alt texts for existing images, no new image fetching
        break;
      case 'search':
        throw new Error('Search method not yet implemented');
      default:
        throw new Error('Invalid method');
    }

    // Get existing product data
    const { data: product } = await supabase
      .from('products')
      .select('id, name, image_url, images, category')
      .eq('id', productId)
      .single();

    const title = productTitle || product?.name || 'Product';

    if (method !== 'alt-text-only') {
      if (newImages.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'No new images found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Combine existing and new images (max 10)
      const existingImages = Array.isArray(product?.images) ? product.images : [];
      const allImages = [...new Set([...existingImages, ...newImages])].slice(0, 10);

      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: allImages, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (updateError) {
        await supabase
          .from('imported_products')
          .update({ images: allImages, updated_at: new Date().toISOString() })
          .eq('id', productId);
      }
    }

    // ── Phase 5: Generate AI alt texts ──
    let altTextsGenerated = 0;
    if (generateAltText) {
      altTextsGenerated = await generateAndStoreAltTexts(supabase, productId, title, product?.category);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imagesAdded: method === 'alt-text-only' ? 0 : newImages.length,
        totalImages: method === 'alt-text-only' ? 0 : newImages.length,
        altTextsGenerated,
        source
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

/**
 * Generate descriptive alt texts for all product images missing one,
 * then persist them in the product_images table.
 */
async function generateAndStoreAltTexts(
  supabase: any,
  productId: string,
  productTitle: string,
  category?: string | null
): Promise<number> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('[ALT-TEXT] LOVABLE_API_KEY not configured, skipping');
    return 0;
  }

  // Fetch images that have no alt_text yet
  const { data: images } = await supabase
    .from('product_images')
    .select('id, url, position')
    .eq('product_id', productId)
    .or('alt_text.is.null,alt_text.eq.')
    .order('position', { ascending: true })
    .limit(10);

  if (!images || images.length === 0) {
    // Fallback: also update the main product image_url alt if product_images is empty
    console.log('[ALT-TEXT] No product_images rows to update');
    return 0;
  }

  const imageCount = images.length;
  console.log(`[ALT-TEXT] Generating alt texts for ${imageCount} images of "${productTitle}"`);

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert SEO et accessibilité web. Génère des textes alternatifs concis et descriptifs pour des images produit e-commerce.
Règles :
- Max 125 caractères par alt text
- Inclure le nom du produit et les détails visuels clés
- Intégrer naturellement les mots-clés SEO (type de produit, couleur, matière, usage)
- Être spécifique et descriptif, jamais générique ("image de produit")
- Langue : Français`,
          },
          {
            role: 'user',
            content: `Produit : "${productTitle}"${category ? `\nCatégorie : ${category}` : ''}
Nombre d'images : ${imageCount}
Positions : ${images.map((img: any) => img.position ?? '?').join(', ')}

Génère ${imageCount} textes alternatifs uniques, un par image. Pour la position 0 ou 1 montre le produit de face, les suivantes montrent des angles, détails ou mises en situation.`,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'set_alt_texts',
              description: 'Store generated alt texts for product images',
              parameters: {
                type: 'object',
                properties: {
                  alt_texts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        position: { type: 'number' },
                        alt_text: { type: 'string', maxLength: 125 },
                      },
                      required: ['position', 'alt_text'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['alt_texts'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'set_alt_texts' } },
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error('[ALT-TEXT] OpenAI gateway error:', status);
      if (status === 429) console.error('[ALT-TEXT] Rate limit exceeded');
      if (status === 402) console.error('[ALT-TEXT] Credits exhausted');
      return 0;
    }

    const aiData = await response.json();
    let altTexts: { position: number; alt_text: string }[];

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      const args = JSON.parse(toolCall.function.arguments);
      altTexts = args.alt_texts;
    } catch {
      console.error('[ALT-TEXT] Failed to parse OpenAI tool call response');
      return 0;
    }

    // Update each image row
    let updated = 0;
    for (const img of images) {
      const match = altTexts.find((a) => a.position === img.position) || altTexts[updated];
      if (match?.alt_text) {
        const { error } = await supabase
          .from('product_images')
          .update({ alt_text: match.alt_text.substring(0, 125) })
          .eq('id', img.id);
        if (!error) updated++;
      }
    }

    console.log(`[ALT-TEXT] Updated ${updated}/${imageCount} images`);
    return updated;
  } catch (err) {
    console.error('[ALT-TEXT] Error:', err);
    return 0;
  }
}

// ── Existing helpers below (unchanged) ──

async function multiSourceSearch(
  productTitle: string, 
  sku?: string, 
  existingImageUrl?: string
): Promise<{ images: string[], source: string }> {
  console.log('Starting multi-source search for:', productTitle);
  
  try {
    const firecrawlImages = await searchImagesWithFirecrawl(productTitle, sku);
    if (firecrawlImages.length >= 2) {
      console.log('Found images via Firecrawl:', firecrawlImages.length);
      return { images: firecrawlImages, source: 'firecrawl' };
    }
  } catch (error) {
    console.error('Firecrawl search failed:', error);
  }

  console.log('Falling back to AI generation');
  const aiImages = await generateImagesWithAI(productTitle, existingImageUrl);
  return { images: aiImages, source: 'ai' };
}

async function searchImagesWithFirecrawl(productName: string, sku?: string): Promise<string[]> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('FIRECRAWL_API_KEY_1');
  
  if (!FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY not configured');
    return [];
  }

  const query = sku 
    ? `${productName} ${sku} product image high resolution`
    : `${productName} product image high resolution`;

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        limit: 10,
        scrapeOptions: { formats: ['markdown', 'links'] }
      })
    });

    if (!response.ok) {
      console.error('Firecrawl API error:', response.status, await response.text());
      return [];
    }

    const data = await response.json();
    return extractImageUrlsFromResults(data);
  } catch (error) {
    console.error('Firecrawl request failed:', error);
    return [];
  }
}

function extractImageUrlsFromResults(data: any): string[] {
  const images: string[] = [];
  const results = data.data || data.results || [];

  for (const result of results) {
    const markdown = result.markdown || result.content || '';
    const imgPattern = /!\[.*?\]\((https?:\/\/[^\s)]+\.(jpg|jpeg|png|webp)[^\s)]*)\)/gi;
    let match;
    while ((match = imgPattern.exec(markdown)) !== null) {
      if (isValidProductImage(match[1])) images.push(match[1]);
    }

    const links = result.links || [];
    for (const link of links) {
      const url = typeof link === 'string' ? link : link.url;
      if (url && /\.(jpg|jpeg|png|webp)$/i.test(url) && isValidProductImage(url)) images.push(url);
    }

    const metadata = result.metadata || {};
    if (metadata.ogImage && isValidProductImage(metadata.ogImage)) images.push(metadata.ogImage);
  }

  return [...new Set(images)].slice(0, 5);
}

function isValidProductImage(url: string): boolean {
  const excludePatterns = [
    /icon/i, /logo/i, /favicon/i, /avatar/i, /badge/i,
    /thumbnail/i, /placeholder/i, /spinner/i, /loading/i,
    /\d+x\d+/,
  ];
  return !excludePatterns.some(p => p.test(url));
}

async function scrapeImagesFromSource(sourceUrl: string): Promise<string[]> {
  if (!sourceUrl) return [];

  try {
    const response = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!response.ok) return [];

    const html = await response.text();
    const images: string[] = [];

    if (sourceUrl.includes('amazon')) {
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
          if (url?.startsWith('http') && !images.includes(url)) {
            const normalizedUrl = normalizeAmazonImageUrl(url);
            if (!images.includes(normalizedUrl)) images.push(normalizedUrl);
          }
        }
      }
    } else {
      const imgPattern = /<img[^>]+src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/gi;
      for (const match of html.matchAll(imgPattern)) {
        if (match[1] && !images.includes(match[1])) images.push(match[1]);
      }
      const ogImagePattern = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/gi;
      for (const match of html.matchAll(ogImagePattern)) {
        if (match[1] && !images.includes(match[1])) images.push(match[1]);
      }
    }

    return [...new Set(images)].slice(0, 5);
  } catch (error) {
    console.error('Error scraping images:', error);
    return [];
  }
}

function normalizeAmazonImageUrl(url: string): string {
  return url.replace(/\._[A-Z]{2}_[A-Z0-9,_]+_\./, '.');
}

async function generateImagesWithAI(productTitle: string, existingImageUrl: string | null): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const images: string[] = [];
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
          messages: [{
            role: 'user',
            content: existingImageUrl ? [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: existingImageUrl } }
            ] : prompt
          }],
          modalities: ['image', 'text']
        })
      });

      if (!response.ok) continue;
      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imageUrl) images.push(imageUrl);
    } catch (error) {
      console.error('Error generating AI image:', error);
    }
  }

  return images;
}
