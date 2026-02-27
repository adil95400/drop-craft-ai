/**
 * Enrich Product Images — JWT-first, RLS-enforced
 * Accepts both `product_id` and `productId` for backward compatibility.
 * Uses requireAuth() for ownership validation.
 */
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const body = await req.json()
    // Accept both naming conventions
    const productId = body.productId || body.product_id
    const { method = 'multi-search', sourceUrl, existingImageUrl, productTitle, sku, marketplace, generateAltText = true } = body

    if (!productId) {
      return errorResponse('productId or product_id is required', corsHeaders)
    }

    // Verify ownership via RLS-scoped client
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id, title, image_url, images, category')
      .eq('id', productId)
      .single()

    if (prodErr || !product) {
      return errorResponse('Product not found or access denied', corsHeaders, 404)
    }

    let newImages: string[] = []
    let source = method

    switch (method) {
      case 'scrape':
        newImages = await scrapeImagesFromSource(sourceUrl)
        break
      case 'ai':
        newImages = await generateImagesWithAI(productTitle || product.title, existingImageUrl)
        break
      case 'multi-search': {
        const result = await multiSourceSearch(productTitle || product.title, sku, existingImageUrl)
        newImages = result.images
        source = result.source
        break
      }
      case 'alt-text-only':
        break
      default:
        return errorResponse('Invalid method', corsHeaders)
    }

    const title = productTitle || product.title || 'Product'

    if (method !== 'alt-text-only') {
      if (newImages.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'No new images found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const existingImages = Array.isArray(product.images) ? product.images : []
      const allImages = [...new Set([...existingImages, ...newImages])].slice(0, 10)

      // Update via RLS-scoped client (ownership guaranteed)
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: allImages, updated_at: new Date().toISOString() })
        .eq('id', productId)

      if (updateError) {
        // Fallback to imported_products
        await supabase
          .from('imported_products')
          .update({ images: allImages, updated_at: new Date().toISOString() })
          .eq('id', productId)
      }
    }

    // Generate AI alt texts
    let altTextsGenerated = 0
    if (generateAltText) {
      altTextsGenerated = await generateAndStoreAltTexts(supabase, productId, title, product.category)
    }

    return successResponse({
      imagesAdded: method === 'alt-text-only' ? 0 : newImages.length,
      totalImages: method === 'alt-text-only' ? 0 : newImages.length,
      altTextsGenerated,
      source,
    }, corsHeaders)

  } catch (error) {
    if (error instanceof Response) return error
    console.error('Error enriching images:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})

// ── Alt text generation ──

async function generateAndStoreAltTexts(
  supabase: any,
  productId: string,
  productTitle: string,
  category?: string | null
): Promise<number> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    console.warn('[ALT-TEXT] LOVABLE_API_KEY not configured, skipping')
    return 0
  }

  const { data: images } = await supabase
    .from('product_images')
    .select('id, url, position')
    .eq('product_id', productId)
    .or('alt_text.is.null,alt_text.eq.')
    .order('position', { ascending: true })
    .limit(10)

  if (!images || images.length === 0) return 0

  const imageCount = images.length
  console.log(`[ALT-TEXT] Generating alt texts for ${imageCount} images of "${productTitle}"`)

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert SEO et accessibilité web. Génère des textes alternatifs concis et descriptifs pour des images produit e-commerce.
Règles :
- Max 125 caractères par alt text
- Inclure le nom du produit et les détails visuels clés
- Intégrer naturellement les mots-clés SEO
- Être spécifique et descriptif
- Langue : Français`,
          },
          {
            role: 'user',
            content: `Produit : "${productTitle}"${category ? `\nCatégorie : ${category}` : ''}
Nombre d'images : ${imageCount}
Positions : ${images.map((img: any) => img.position ?? '?').join(', ')}

Génère ${imageCount} textes alternatifs uniques.`,
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
    })

    if (!response.ok) return 0

    const aiData = await response.json()
    let altTexts: { position: number; alt_text: string }[]

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
      const args = JSON.parse(toolCall.function.arguments)
      altTexts = args.alt_texts
    } catch {
      return 0
    }

    let updated = 0
    for (const img of images) {
      const match = altTexts.find((a) => a.position === img.position) || altTexts[updated]
      if (match?.alt_text) {
        const { error } = await supabase
          .from('product_images')
          .update({ alt_text: match.alt_text.substring(0, 125) })
          .eq('id', img.id)
        if (!error) updated++
      }
    }

    console.log(`[ALT-TEXT] Updated ${updated}/${imageCount} images`)
    return updated
  } catch (err) {
    console.error('[ALT-TEXT] Error:', err)
    return 0
  }
}

// ── Image search helpers ──

async function multiSourceSearch(
  productTitle: string,
  sku?: string,
  existingImageUrl?: string
): Promise<{ images: string[]; source: string }> {
  try {
    const firecrawlImages = await searchImagesWithFirecrawl(productTitle, sku)
    if (firecrawlImages.length >= 2) {
      return { images: firecrawlImages, source: 'firecrawl' }
    }
  } catch (error) {
    console.error('Firecrawl search failed:', error)
  }

  const aiImages = await generateImagesWithAI(productTitle, existingImageUrl)
  return { images: aiImages, source: 'ai' }
}

async function searchImagesWithFirecrawl(productName: string, sku?: string): Promise<string[]> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('FIRECRAWL_API_KEY_1')
  if (!FIRECRAWL_API_KEY) return []

  const query = sku
    ? `${productName} ${sku} product image high resolution`
    : `${productName} product image high resolution`

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit: 10, scrapeOptions: { formats: ['markdown', 'links'] } }),
    })

    if (!response.ok) return []
    const data = await response.json()
    return extractImageUrlsFromResults(data)
  } catch {
    return []
  }
}

function extractImageUrlsFromResults(data: any): string[] {
  const images: string[] = []
  const results = data.data || data.results || []

  for (const result of results) {
    const markdown = result.markdown || result.content || ''
    const imgPattern = /!\[.*?\]\((https?:\/\/[^\s)]+\.(jpg|jpeg|png|webp)[^\s)]*)\)/gi
    let match
    while ((match = imgPattern.exec(markdown)) !== null) {
      if (isValidProductImage(match[1])) images.push(match[1])
    }

    const links = result.links || []
    for (const link of links) {
      const url = typeof link === 'string' ? link : link.url
      if (url && /\.(jpg|jpeg|png|webp)$/i.test(url) && isValidProductImage(url)) images.push(url)
    }

    const metadata = result.metadata || {}
    if (metadata.ogImage && isValidProductImage(metadata.ogImage)) images.push(metadata.ogImage)
  }

  return [...new Set(images)].slice(0, 5)
}

function isValidProductImage(url: string): boolean {
  const excludePatterns = [/icon/i, /logo/i, /favicon/i, /avatar/i, /badge/i, /thumbnail/i, /placeholder/i, /spinner/i, /loading/i, /\d+x\d+/]
  return !excludePatterns.some((p) => p.test(url))
}

async function scrapeImagesFromSource(sourceUrl: string): Promise<string[]> {
  if (!sourceUrl) return []

  try {
    const response = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })
    if (!response.ok) return []

    const html = await response.text()
    const images: string[] = []

    if (sourceUrl.includes('amazon')) {
      const amazonPatterns = [
        /data-old-hires="([^"]+)"/g,
        /"hiRes":"(https:\/\/[^"]+)"/g,
        /"large":"(https:\/\/[^"]+)"/g,
        /https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9._%-]+\.jpg/g,
      ]
      for (const pattern of amazonPatterns) {
        for (const match of html.matchAll(pattern)) {
          const url = match[1] || match[0]
          if (url?.startsWith('http') && !images.includes(url)) {
            const normalized = url.replace(/\._[A-Z]{2}_[A-Z0-9,_]+_\./, '.')
            if (!images.includes(normalized)) images.push(normalized)
          }
        }
      }
    } else {
      const imgPattern = /<img[^>]+src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/gi
      for (const match of html.matchAll(imgPattern)) {
        if (match[1] && !images.includes(match[1])) images.push(match[1])
      }
      const ogImagePattern = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/gi
      for (const match of html.matchAll(ogImagePattern)) {
        if (match[1] && !images.includes(match[1])) images.push(match[1])
      }
    }

    return [...new Set(images)].slice(0, 5)
  } catch {
    return []
  }
}

async function generateImagesWithAI(productTitle: string, existingImageUrl: string | null): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured')

  const images: string[] = []
  const prompts = [
    `Product photo of ${productTitle}, professional studio lighting, white background, high resolution, e-commerce style`,
    `Lifestyle product shot of ${productTitle}, natural lighting, modern interior setting, commercial photography`,
  ]

  for (const prompt of prompts) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: existingImageUrl
                ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: existingImageUrl } }]
                : prompt,
            },
          ],
          modalities: ['image', 'text'],
        }),
      })

      if (!response.ok) continue
      const data = await response.json()
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
      if (imageUrl) images.push(imageUrl)
    } catch (error) {
      console.error('Error generating AI image:', error)
    }
  }

  return images
}
