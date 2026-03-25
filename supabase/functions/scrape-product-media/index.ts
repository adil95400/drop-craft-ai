/**
 * Scrape Product Media & Reviews
 * Uses Firecrawl to scrape images, videos, and reviews from a product's source URL
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/secure-cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const preflightResponse = handleCorsPreflightRequest(req, corsHeaders)
  if (preflightResponse) return preflightResponse

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { url, productId, scrapeType } = body // scrapeType: 'images' | 'videos' | 'reviews' | 'all'

    if (!url || !productId) {
      return new Response(JSON.stringify({ error: 'url and productId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use Firecrawl if available, otherwise fallback to direct scraping
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')

    let scrapedData: any = { images: [], videos: [], reviews: [] }

    if (firecrawlKey) {
      console.log('Scraping with Firecrawl:', url)
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html', 'links'],
          onlyMainContent: false,
          waitFor: 3000,
        }),
      })

      const scrapeResult = await scrapeResponse.json()
      const html = scrapeResult.data?.html || scrapeResult.html || ''
      const markdown = scrapeResult.data?.markdown || scrapeResult.markdown || ''

      // Extract images
      if (scrapeType === 'images' || scrapeType === 'all') {
        const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
        const images: string[] = []
        let match
        while ((match = imgRegex.exec(html)) !== null) {
          const src = match[1]
          if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('sprite') 
              && !src.includes('pixel') && !src.includes('tracking')
              && !src.endsWith('.svg') && !src.endsWith('.gif')
              && src.length > 10) {
            // Resolve relative URLs
            let fullUrl = src
            try {
              fullUrl = new URL(src, url).href
            } catch { /* keep as-is */ }
            if (!images.includes(fullUrl)) images.push(fullUrl)
          }
        }

        // Also extract from data-src, data-zoom-image, etc.
        const dataSrcRegex = /data-(?:src|zoom-image|large-image|original)=["']([^"']+)["']/gi
        while ((match = dataSrcRegex.exec(html)) !== null) {
          const src = match[1]
          if (src && src.length > 10) {
            let fullUrl = src
            try { fullUrl = new URL(src, url).href } catch {}
            if (!images.includes(fullUrl)) images.push(fullUrl)
          }
        }

        // Filter for product-relevant images (larger images)
        scrapedData.images = images.filter(img => {
          const lower = img.toLowerCase()
          return !lower.includes('avatar') && !lower.includes('flag') && !lower.includes('payment')
            && !lower.includes('badge') && !lower.includes('banner') && !lower.includes('ads')
        }).slice(0, 20)
      }

      // Extract videos
      if (scrapeType === 'videos' || scrapeType === 'all') {
        const videoRegex = /<(?:video|source)[^>]+src=["']([^"']+)["'][^>]*>/gi
        const iframeRegex = /<iframe[^>]+src=["']([^"']*(?:youtube|vimeo|dailymotion)[^"']*)["'][^>]*>/gi
        const videos: string[] = []
        let vMatch
        while ((vMatch = videoRegex.exec(html)) !== null) {
          const src = vMatch[1]
          if (src) {
            let fullUrl = src
            try { fullUrl = new URL(src, url).href } catch {}
            if (!videos.includes(fullUrl)) videos.push(fullUrl)
          }
        }
        while ((vMatch = iframeRegex.exec(html)) !== null) {
          const src = vMatch[1]
          if (src && !videos.includes(src)) videos.push(src)
        }

        // Also extract YouTube links from markdown/html
        const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/g
        while ((vMatch = ytRegex.exec(html + ' ' + markdown)) !== null) {
          const ytUrl = `https://www.youtube.com/watch?v=${vMatch[1]}`
          if (!videos.includes(ytUrl)) videos.push(ytUrl)
        }

        scrapedData.videos = videos.slice(0, 10)
      }

      // Extract reviews from markdown/HTML
      if (scrapeType === 'reviews' || scrapeType === 'all') {
        // Use AI to extract reviews from the page content
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
        if (LOVABLE_API_KEY && markdown.length > 100) {
          try {
            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  {
                    role: 'system',
                    content: `You extract product reviews from web page content. Return a JSON array of reviews. Each review should have: author (string), rating (number 1-5), text (string), verified_purchase (boolean), country (string or null). Only extract real customer reviews, not promotional content. If no reviews found, return empty array. Return ONLY the JSON array, no other text.`
                  },
                  {
                    role: 'user',
                    content: `Extract reviews from this page content (first 8000 chars):\n\n${markdown.slice(0, 8000)}`
                  }
                ],
                tools: [{
                  type: 'function',
                  function: {
                    name: 'extract_reviews',
                    description: 'Extract product reviews from page content',
                    parameters: {
                      type: 'object',
                      properties: {
                        reviews: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              author: { type: 'string' },
                              rating: { type: 'number', minimum: 1, maximum: 5 },
                              text: { type: 'string' },
                              verified_purchase: { type: 'boolean' },
                              country: { type: 'string' }
                            },
                            required: ['author', 'rating', 'text']
                          }
                        }
                      },
                      required: ['reviews']
                    }
                  }
                }],
                tool_choice: { type: 'function', function: { name: 'extract_reviews' } }
              }),
            })

            if (aiResponse.ok) {
              const aiData = await aiResponse.json()
              const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
              if (toolCall) {
                const parsed = JSON.parse(toolCall.function.arguments)
                scrapedData.reviews = (parsed.reviews || []).slice(0, 50)
              }
            }
          } catch (e) {
            console.error('AI review extraction failed:', e)
          }
        }
      }
    } else {
      // Fallback: basic HTML fetch
      console.log('Scraping with basic fetch:', url)
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
          },
        })
        const html = await response.text()

        if (scrapeType === 'images' || scrapeType === 'all') {
          const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
          const images: string[] = []
          let match
          while ((match = imgRegex.exec(html)) !== null) {
            const src = match[1]
            if (src && src.length > 10 && !src.includes('icon') && !src.includes('logo') && !src.endsWith('.svg')) {
              let fullUrl = src
              try { fullUrl = new URL(src, url).href } catch {}
              if (!images.includes(fullUrl)) images.push(fullUrl)
            }
          }
          scrapedData.images = images.slice(0, 20)
        }
      } catch (e) {
        console.error('Basic fetch failed:', e)
      }
    }

    // Optionally save scraped images to product
    if (scrapeType === 'images' || scrapeType === 'all') {
      if (scrapedData.images.length > 0) {
        // Save to product_images table
        const imageInserts = scrapedData.images.map((imgUrl: string, idx: number) => ({
          product_id: productId,
          url: imgUrl,
          alt_text: `Image scrapée ${idx + 1}`,
          position: idx,
          is_primary: false,
          user_id: user.id,
        }))

        // Check for existing images to avoid duplicates
        const { data: existing } = await supabase
          .from('product_images')
          .select('url')
          .eq('product_id', productId)

        const existingUrls = new Set((existing || []).map((e: any) => e.url))
        const newImages = imageInserts.filter((img: any) => !existingUrls.has(img.url))

        if (newImages.length > 0) {
          await supabase.from('product_images').insert(newImages)
        }

        // Also update main product image if none exists
        const { data: prod } = await supabase
          .from('products')
          .select('image_url')
          .eq('id', productId)
          .single()

        if (prod && !prod.image_url && scrapedData.images[0]) {
          await supabase
            .from('products')
            .update({ image_url: scrapedData.images[0] })
            .eq('id', productId)
        }
      }
    }

    // Save scraped reviews
    if ((scrapeType === 'reviews' || scrapeType === 'all') && scrapedData.reviews.length > 0) {
      const reviewInserts = scrapedData.reviews.map((r: any) => ({
        product_id: productId,
        user_id: user.id,
        author: r.author || 'Anonyme',
        rating: Math.min(5, Math.max(1, r.rating || 5)),
        text: r.text || '',
        verified_purchase: r.verified_purchase || false,
        country: r.country || null,
        source_platform: 'scraped',
      }))

      await supabase.from('product_reviews').insert(reviewInserts)
    }

    return new Response(JSON.stringify({
      success: true,
      scraped: {
        images: scrapedData.images?.length || 0,
        videos: scrapedData.videos?.length || 0,
        reviews: scrapedData.reviews?.length || 0,
      },
      data: scrapedData,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.error('Scrape error:', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Scrape failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
