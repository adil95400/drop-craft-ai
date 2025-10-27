import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { validateInput, analyzeCompetitorInputSchema } from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzeRequest {
  url: string
  userId: string
  competitorName: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const { url, userId, competitorName } = validateInput(analyzeCompetitorInputSchema, rawBody);

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      supabase,
      userId,
      'analyze_competitor',
      RATE_LIMITS.ANALYZE_COMPETITOR
    );

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    console.log(`Analyzing competitor: ${competitorName} at ${url}`);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()

    // Extract meta tags
    const extractMetaTag = (content: string, property: string): string | null => {
      const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i')
      const match = content.match(regex)
      return match ? match[1] : null
    }

    const extractTitle = (content: string): string => {
      const match = content.match(/<title[^>]*>([^<]+)<\/title>/i)
      return match ? match[1].trim() : ''
    }

    // Count products on page
    const countProducts = (content: string): number => {
      const productIndicators = [
        /<article/gi,
        /class="product/gi,
        /data-product-id/gi,
        /itemtype="[^"]*Product"/gi
      ]
      
      let maxCount = 0
      for (const indicator of productIndicators) {
        const matches = content.match(indicator)
        if (matches) {
          maxCount = Math.max(maxCount, matches.length)
        }
      }
      return maxCount
    }

    // Extract prices for analysis
    const extractPrices = (content: string): number[] => {
      const prices: number[] = []
      const pricePatterns = [
        /€\s*(\d+[,.]?\d*)/g,
        /(\d+[,.]?\d*)\s*€/g,
        /\$\s*(\d+[.,]?\d*)/g,
      ]

      for (const pattern of pricePatterns) {
        let match
        while ((match = pattern.exec(content)) !== null) {
          const price = parseFloat(match[1].replace(',', '.'))
          if (!isNaN(price) && price > 0 && price < 10000) {
            prices.push(price)
          }
        }
      }

      return prices.slice(0, 50) // Limit to 50 prices
    }

    // Analyze the data
    const title = extractTitle(html)
    const description = extractMetaTag(html, 'description') || extractMetaTag(html, 'og:description') || ''
    const productCount = countProducts(html)
    const prices = extractPrices(html)
    
    const avgPrice = prices.length > 0 
      ? prices.reduce((a, b) => a + b, 0) / prices.length 
      : 0
    
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

    // Analyze SEO elements
    const hasH1 = /<h1/i.test(html)
    const hasStructuredData = /application\/ld\+json/i.test(html)
    const metaKeywords = extractMetaTag(html, 'keywords')
    const ogImage = extractMetaTag(html, 'og:image')

    // Build competitive data
    const competitiveData = {
      url,
      title,
      description,
      productCount,
      priceAnalysis: {
        averagePrice: avgPrice.toFixed(2),
        minPrice: minPrice.toFixed(2),
        maxPrice: maxPrice.toFixed(2),
        priceRange: `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)} €`,
        sampleSize: prices.length
      },
      seoAnalysis: {
        hasH1,
        hasStructuredData,
        hasMetaKeywords: !!metaKeywords,
        hasOgImage: !!ogImage,
        titleLength: title.length,
        descriptionLength: description.length
      },
      analyzedAt: new Date().toISOString()
    }

    // Calculate market position
    const marketPosition = {
      priceCompetitiveness: avgPrice > 0 ? Math.min(100, Math.round((50 / avgPrice) * 100)) : 50,
      seoScore: (
        (hasH1 ? 25 : 0) +
        (hasStructuredData ? 25 : 0) +
        (metaKeywords ? 15 : 0) +
        (ogImage ? 15 : 0) +
        (title.length > 30 && title.length < 60 ? 10 : 0) +
        (description.length > 120 && description.length < 160 ? 10 : 0)
      ),
      productRange: productCount > 100 ? 'large' : productCount > 50 ? 'medium' : 'small'
    }

    // Determine threat level
    let threatLevel = 'low'
    if (marketPosition.seoScore > 70 && productCount > 100) {
      threatLevel = 'high'
    } else if (marketPosition.seoScore > 50 || productCount > 50) {
      threatLevel = 'medium'
    }

    // Gap opportunities
    const gapOpportunities = []
    if (!hasStructuredData) {
      gapOpportunities.push({
        type: 'seo',
        opportunity: 'Données structurées manquantes',
        impact: 'high',
        recommendation: 'Implémentez Schema.org pour améliorer votre référencement'
      })
    }
    if (avgPrice > 50) {
      gapOpportunities.push({
        type: 'pricing',
        opportunity: 'Prix moyens élevés',
        impact: 'medium',
        recommendation: 'Opportunité de proposer des prix plus compétitifs'
      })
    }
    if (productCount < 50) {
      gapOpportunities.push({
        type: 'catalog',
        opportunity: 'Catalogue limité',
        impact: 'medium',
        recommendation: 'Élargissez votre catalogue pour gagner des parts de marché'
      })
    }

    // Save to database
    const { data: intelligence, error: dbError } = await supabase
      .from('competitive_intelligence')
      .insert({
        user_id: userId,
        competitor_name: competitorName,
        competitive_data: competitiveData,
        price_analysis: competitiveData.priceAnalysis,
        market_position: marketPosition,
        threat_level: threatLevel,
        gap_opportunities: gapOpportunities
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving competitive intelligence:', dbError)
      throw dbError
    }

    console.log('Competitive analysis completed:', intelligence.id)

    return new Response(
      JSON.stringify({
        success: true,
        intelligence,
        summary: {
          competitorName,
          url,
          productCount,
          avgPrice: avgPrice.toFixed(2),
          seoScore: marketPosition.seoScore,
          threatLevel,
          opportunities: gapOpportunities.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in analyze-competitor function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
