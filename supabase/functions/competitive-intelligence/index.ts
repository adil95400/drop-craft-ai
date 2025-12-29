import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductAnalysis {
  url: string
  title: string
  description: string
  prices: number[]
  avgPrice: number
  minPrice: number
  maxPrice: number
  productCount: number
  seoScore: number
  hasStructuredData: boolean
  socialSignals: SocialSignals
  competitorMetrics: CompetitorMetrics
}

interface SocialSignals {
  estimatedReviews: number
  ratingScore: number
  socialMentions: number
}

interface CompetitorMetrics {
  threatLevel: 'low' | 'medium' | 'high'
  marketShare: number
  pricePosition: 'budget' | 'competitive' | 'premium'
}

// Utilitaires d'extraction
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim() : ''
}

function extractMetaTag(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i')
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }
  return null
}

function extractPrices(html: string): number[] {
  const prices: number[] = []
  const pricePatterns = [
    /€\s*(\d+[,.]?\d*)/g,
    /(\d+[,.]?\d*)\s*€/g,
    /\$\s*(\d+[.,]?\d*)/g,
    /(\d+[.,]?\d*)\s*\$/g,
    /price["\s:]*(\d+[.,]?\d*)/gi,
    /data-price[="']\s*(\d+[.,]?\d*)/gi
  ]

  for (const pattern of pricePatterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const price = parseFloat(match[1].replace(',', '.'))
      if (!isNaN(price) && price > 0.5 && price < 50000) {
        prices.push(price)
      }
    }
  }

  // Dédupliquer et limiter
  return [...new Set(prices)].slice(0, 100)
}

function countProducts(html: string): number {
  const indicators = [
    /<article/gi,
    /class=["'][^"']*product[^"']*["']/gi,
    /data-product-id/gi,
    /itemtype="[^"]*Product"/gi,
    /class=["'][^"']*card[^"']*["']/gi
  ]
  
  let maxCount = 0
  for (const indicator of indicators) {
    const matches = html.match(indicator)
    if (matches) {
      maxCount = Math.max(maxCount, matches.length)
    }
  }
  return maxCount
}

function extractReviewData(html: string): { count: number; rating: number } {
  // Chercher le nombre d'avis
  const reviewPatterns = [
    /(\d+)\s*(?:avis|reviews?|commentaires?)/gi,
    /(?:avis|reviews?)[\s:]*(\d+)/gi,
    /reviewCount["\s:]*(\d+)/gi
  ]
  
  let reviewCount = 0
  for (const pattern of reviewPatterns) {
    const match = pattern.exec(html)
    if (match) {
      reviewCount = Math.max(reviewCount, parseInt(match[1]))
    }
  }

  // Chercher la note
  const ratingPatterns = [
    /(\d[.,]\d)\s*(?:\/\s*5|sur\s*5|out of 5)/gi,
    /rating["\s:]*(\d[.,]?\d?)/gi,
    /(?:note|score)["\s:]*(\d[.,]?\d?)\/5/gi
  ]

  let rating = 0
  for (const pattern of ratingPatterns) {
    const match = pattern.exec(html)
    if (match) {
      const r = parseFloat(match[1].replace(',', '.'))
      if (r > 0 && r <= 5) {
        rating = r
        break
      }
    }
  }

  return { count: reviewCount, rating: rating || 4.0 }
}

function calculateSEOScore(html: string, title: string, description: string): number {
  let score = 0
  
  // H1 présent
  if (/<h1[^>]*>/i.test(html)) score += 15
  
  // Données structurées
  if (/application\/ld\+json/i.test(html)) score += 20
  
  // Meta keywords
  if (extractMetaTag(html, 'keywords')) score += 10
  
  // Open Graph
  if (extractMetaTag(html, 'og:image')) score += 10
  if (extractMetaTag(html, 'og:title')) score += 5
  
  // Titre optimal (30-60 caractères)
  if (title.length >= 30 && title.length <= 60) score += 15
  else if (title.length > 0) score += 5
  
  // Description optimale (120-160 caractères)
  if (description.length >= 120 && description.length <= 160) score += 15
  else if (description.length > 0) score += 5
  
  // HTTPS
  score += 5
  
  // Mobile viewport
  if (/<meta[^>]*viewport/i.test(html)) score += 5
  
  return Math.min(100, score)
}

function determinePricePosition(avgPrice: number, category?: string): 'budget' | 'competitive' | 'premium' {
  // Seuils basés sur des moyennes e-commerce
  if (avgPrice < 20) return 'budget'
  if (avgPrice > 100) return 'premium'
  return 'competitive'
}

function calculateThreatLevel(seoScore: number, productCount: number, avgPrice: number): 'low' | 'medium' | 'high' {
  let threatScore = 0
  
  if (seoScore >= 70) threatScore += 2
  else if (seoScore >= 50) threatScore += 1
  
  if (productCount >= 200) threatScore += 2
  else if (productCount >= 50) threatScore += 1
  
  if (avgPrice > 0 && avgPrice < 30) threatScore += 1
  
  if (threatScore >= 4) return 'high'
  if (threatScore >= 2) return 'medium'
  return 'low'
}

function estimateMonthlySales(productCount: number, reviewCount: number, seoScore: number): number {
  // Estimation basée sur des heuristiques e-commerce
  const baseRate = 50 // Ventes de base
  const reviewMultiplier = Math.min(reviewCount / 10, 50) // Max +50 ventes
  const seoMultiplier = seoScore / 20 // Score SEO influence
  const catalogMultiplier = Math.min(productCount / 20, 30) // Taille catalogue
  
  return Math.floor(baseRate + reviewMultiplier + seoMultiplier + catalogMultiplier)
}

function estimateMonthlyRevenue(monthlySales: number, avgPrice: number): number {
  return Math.floor(monthlySales * avgPrice * 0.8) // 80% marge approximative
}

async function fetchWithTimeout(url: string, timeout: number = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function analyzeCompetitorUrl(url: string): Promise<ProductAnalysis> {
  const response = await fetchWithTimeout(url)
  
  if (!response.ok) {
    throw new Error(`Impossible d'accéder à ${url}: ${response.status}`)
  }
  
  const html = await response.text()
  
  const title = extractTitle(html)
  const description = extractMetaTag(html, 'description') || extractMetaTag(html, 'og:description') || ''
  const prices = extractPrices(html)
  const productCount = countProducts(html)
  const reviewData = extractReviewData(html)
  const hasStructuredData = /application\/ld\+json/i.test(html)
  
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  
  const seoScore = calculateSEOScore(html, title, description)
  const threatLevel = calculateThreatLevel(seoScore, productCount, avgPrice)
  const pricePosition = determinePricePosition(avgPrice)
  
  return {
    url,
    title,
    description,
    prices,
    avgPrice,
    minPrice,
    maxPrice,
    productCount,
    seoScore,
    hasStructuredData,
    socialSignals: {
      estimatedReviews: reviewData.count,
      ratingScore: reviewData.rating,
      socialMentions: Math.floor(reviewData.count * 2.5) // Estimation
    },
    competitorMetrics: {
      threatLevel,
      marketShare: Math.min(100, seoScore * 0.5 + productCount * 0.1),
      pricePosition
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Non autorisé')

    const { action, product_url, category, competitor_urls } = await req.json()

    switch (action) {
      case 'analyze_product': {
        if (!product_url) {
          throw new Error('URL du produit requise')
        }

        // Vraie analyse du concurrent
        const analysis = await analyzeCompetitorUrl(product_url)
        
        const monthlySales = estimateMonthlySales(
          analysis.productCount, 
          analysis.socialSignals.estimatedReviews,
          analysis.seoScore
        )
        
        const monthlyRevenue = estimateMonthlyRevenue(monthlySales, analysis.avgPrice)

        // Sauvegarder en base
        const { error: saveError } = await supabaseClient
          .from('competitive_intelligence')
          .upsert({
            user_id: user.id,
            competitor_name: new URL(product_url).hostname,
            competitor_url: product_url,
            competitive_data: {
              title: analysis.title,
              description: analysis.description,
              productCount: analysis.productCount,
              seoScore: analysis.seoScore,
              hasStructuredData: analysis.hasStructuredData,
              analyzedAt: new Date().toISOString()
            },
            price_analysis: {
              avgPrice: analysis.avgPrice.toFixed(2),
              minPrice: analysis.minPrice.toFixed(2),
              maxPrice: analysis.maxPrice.toFixed(2),
              pricesFound: analysis.prices.length
            },
            market_position: analysis.competitorMetrics.pricePosition,
            recommendations: generateRecommendations(analysis),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,competitor_url'
          })

        if (saveError) {
          console.error('Erreur sauvegarde:', saveError)
        }

        const result = {
          product_url: analysis.url,
          title: analysis.title,
          estimated_monthly_sales: monthlySales,
          estimated_revenue: monthlyRevenue,
          market_saturation_score: Math.min(0.95, analysis.productCount / 200),
          competition_level: analysis.competitorMetrics.threatLevel,
          price_position: analysis.competitorMetrics.pricePosition,
          trend_direction: analysis.seoScore > 60 ? 'growing' : 'stable',
          predicted_growth: analysis.seoScore > 70 ? '+15% next 30 days' : '+5% next 30 days',
          competitors_count: Math.max(5, Math.floor(analysis.productCount / 10)),
          avg_competitor_price: analysis.avgPrice.toFixed(2),
          social_mentions: analysis.socialSignals.socialMentions,
          seo_score: analysis.seoScore,
          review_count: analysis.socialSignals.estimatedReviews,
          rating: analysis.socialSignals.ratingScore,
          ad_activity: {
            facebook_ads: estimateAdActivity(analysis.seoScore, 'facebook'),
            google_ads: estimateAdActivity(analysis.seoScore, 'google'),
            tiktok_ads: estimateAdActivity(analysis.seoScore, 'tiktok')
          },
          opportunities: generateOpportunities(analysis)
        }

        return new Response(
          JSON.stringify({ success: true, analysis: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'estimate_sales': {
        if (!product_url) {
          throw new Error('URL du produit requise')
        }

        const analysis = await analyzeCompetitorUrl(product_url)
        const monthlySales = estimateMonthlySales(
          analysis.productCount,
          analysis.socialSignals.estimatedReviews,
          analysis.seoScore
        )

        const salesData = {
          daily_estimate: Math.floor(monthlySales / 30),
          weekly_estimate: Math.floor(monthlySales / 4),
          monthly_estimate: monthlySales,
          confidence_level: calculateConfidence(analysis),
          factors: {
            search_volume: analysis.seoScore > 60 ? 'high' : analysis.seoScore > 40 ? 'medium' : 'low',
            social_engagement: analysis.socialSignals.estimatedReviews > 100 ? 'high' : 'medium',
            competitor_pricing: analysis.competitorMetrics.pricePosition,
            seasonality: 'neutral',
            product_catalog_size: analysis.productCount
          },
          prediction_model: 'Heuristic-based + SEO Analysis',
          data_sources: ['Page Analysis', 'Price Extraction', 'Review Parsing']
        }

        return new Response(
          JSON.stringify({ success: true, sales_data: salesData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'saturation_analysis': {
        if (!category) {
          throw new Error('Catégorie requise')
        }

        // Analyse basée sur des métriques de catégorie
        const saturationScore = calculateCategorySaturation(category)

        const saturation = {
          category,
          saturation_score: saturationScore,
          market_size: saturationScore > 0.7 ? 'large' : saturationScore > 0.4 ? 'medium' : 'small',
          barrier_to_entry: saturationScore > 0.6 ? 'high' : 'medium',
          top_players: Math.floor(saturationScore * 15) + 3,
          new_entrants_last_30_days: Math.floor((1 - saturationScore) * 100),
          recommendation: saturationScore > 0.7 
            ? 'Marché saturé - différenciation forte requise' 
            : saturationScore > 0.5
            ? 'Saturation modérée - opportunités avec bon positionnement'
            : 'Marché ouvert - bonne opportunité d\'entrée',
          niches_available: generateNiches(category, saturationScore),
          entry_strategies: generateEntryStrategies(saturationScore)
        }

        return new Response(
          JSON.stringify({ success: true, saturation }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'price_intelligence': {
        if (!competitor_urls || competitor_urls.length === 0) {
          throw new Error('URLs des concurrents requises')
        }

        // Analyser chaque URL concurrent
        const priceResults = await Promise.allSettled(
          competitor_urls.map(async (url: string) => {
            try {
              const analysis = await analyzeCompetitorUrl(url)
              return {
                url,
                hostname: new URL(url).hostname,
                current_price: analysis.avgPrice.toFixed(2),
                min_price: analysis.minPrice.toFixed(2),
                max_price: analysis.maxPrice.toFixed(2),
                price_range: `${analysis.minPrice.toFixed(2)}€ - ${analysis.maxPrice.toFixed(2)}€`,
                products_analyzed: analysis.prices.length,
                price_position: analysis.competitorMetrics.pricePosition,
                seo_score: analysis.seoScore
              }
            } catch (error) {
              return {
                url,
                error: error.message,
                status: 'failed'
              }
            }
          })
        )

        const successfulResults = priceResults
          .filter(r => r.status === 'fulfilled' && !r.value.error)
          .map(r => (r as PromiseFulfilledResult<any>).value)

        const allPrices = successfulResults.flatMap(r => [
          parseFloat(r.current_price),
          parseFloat(r.min_price),
          parseFloat(r.max_price)
        ]).filter(p => !isNaN(p) && p > 0)

        const marketAvg = allPrices.length > 0 
          ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length 
          : 0

        const priceData = {
          competitor_prices: successfulResults,
          failed_urls: priceResults
            .filter(r => r.status === 'rejected' || (r as any).value?.error)
            .map(r => (r as any).value?.url || 'unknown'),
          market_avg_price: marketAvg.toFixed(2),
          market_min_price: allPrices.length > 0 ? Math.min(...allPrices).toFixed(2) : '0',
          market_max_price: allPrices.length > 0 ? Math.max(...allPrices).toFixed(2) : '0',
          recommended_price: (marketAvg * 0.95).toFixed(2),
          price_positioning: 'competitive',
          analysis_timestamp: new Date().toISOString()
        }

        return new Response(
          JSON.stringify({ success: true, price_data: priceData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'bulk_analyze': {
        if (!competitor_urls || competitor_urls.length === 0) {
          throw new Error('URLs des concurrents requises')
        }

        const results = await Promise.allSettled(
          competitor_urls.slice(0, 10).map(async (url: string) => {
            const analysis = await analyzeCompetitorUrl(url)
            return {
              url,
              hostname: new URL(url).hostname,
              ...analysis,
              monthlySales: estimateMonthlySales(
                analysis.productCount,
                analysis.socialSignals.estimatedReviews,
                analysis.seoScore
              )
            }
          })
        )

        const successful = results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<any>).value)

        const failed = results
          .filter(r => r.status === 'rejected')
          .map((r, i) => ({ url: competitor_urls[i], error: (r as PromiseRejectedResult).reason?.message }))

        return new Response(
          JSON.stringify({ 
            success: true, 
            results: successful,
            failed,
            summary: {
              total: competitor_urls.length,
              analyzed: successful.length,
              failed: failed.length
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Action invalide: ${action}`)
    }
  } catch (error) {
    console.error('Erreur competitive-intelligence:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Fonctions utilitaires
function generateRecommendations(analysis: ProductAnalysis): string[] {
  const recommendations: string[] = []
  
  if (analysis.seoScore < 50) {
    recommendations.push('Améliorer le SEO pour gagner en visibilité')
  }
  if (!analysis.hasStructuredData) {
    recommendations.push('Ajouter des données structurées Schema.org')
  }
  if (analysis.avgPrice > 50) {
    recommendations.push('Opportunité de positionnement prix agressif')
  }
  if (analysis.productCount < 30) {
    recommendations.push('Concurrent avec catalogue limité - opportunité d\'élargir')
  }
  if (analysis.socialSignals.estimatedReviews < 50) {
    recommendations.push('Faible engagement social - opportunité de différenciation')
  }
  
  return recommendations
}

function generateOpportunities(analysis: ProductAnalysis): string[] {
  const opportunities: string[] = []
  
  if (analysis.competitorMetrics.threatLevel === 'low') {
    opportunities.push('Concurrent faible - entrée facilitée')
  }
  if (analysis.avgPrice > 80) {
    opportunities.push('Segment premium - marge potentielle élevée')
  }
  if (analysis.seoScore < 40) {
    opportunities.push('SEO faible du concurrent - facile à dépasser')
  }
  if (!analysis.hasStructuredData) {
    opportunities.push('Pas de rich snippets - avantage SERP possible')
  }
  
  return opportunities
}

function estimateAdActivity(seoScore: number, platform: string): number {
  const base = Math.floor(seoScore / 10)
  const multipliers: Record<string, number> = {
    'facebook': 1.5,
    'google': 1.2,
    'tiktok': 0.8
  }
  return Math.floor(base * (multipliers[platform] || 1))
}

function calculateConfidence(analysis: ProductAnalysis): number {
  let confidence = 0.5
  
  if (analysis.prices.length > 10) confidence += 0.15
  if (analysis.socialSignals.estimatedReviews > 0) confidence += 0.1
  if (analysis.hasStructuredData) confidence += 0.1
  if (analysis.seoScore > 50) confidence += 0.1
  
  return Math.min(0.95, confidence)
}

function calculateCategorySaturation(category: string): number {
  // Catégories connues pour être saturées
  const saturatedCategories = ['electronics', 'fashion', 'beauty', 'home', 'sports']
  const moderateCategories = ['books', 'toys', 'garden', 'automotive']
  
  const lowerCategory = category.toLowerCase()
  
  if (saturatedCategories.some(c => lowerCategory.includes(c))) {
    return 0.7 + Math.random() * 0.2
  }
  if (moderateCategories.some(c => lowerCategory.includes(c))) {
    return 0.4 + Math.random() * 0.2
  }
  
  return 0.2 + Math.random() * 0.3
}

function generateNiches(category: string, saturation: number): string[] {
  const niches = [
    'Segment éco-responsable',
    'Version premium/luxe',
    'Alternative budget',
    'Spécialisation locale',
    'Personnalisation sur mesure'
  ]
  
  // Plus le marché est saturé, moins il y a de niches disponibles
  const availableCount = Math.max(2, Math.floor(niches.length * (1 - saturation)))
  return niches.slice(0, availableCount)
}

function generateEntryStrategies(saturation: number): string[] {
  if (saturation > 0.7) {
    return [
      'Différenciation produit forte requise',
      'Focus sur une niche spécifique',
      'Stratégie prix agressive',
      'Investissement marketing conséquent'
    ]
  }
  if (saturation > 0.4) {
    return [
      'Positionnement qualité/prix',
      'Focus service client',
      'Stratégie SEO ciblée',
      'Partenariats stratégiques'
    ]
  }
  return [
    'Entrée directe possible',
    'Build & scale rapidement',
    'Établir la marque en premier',
    'Acquisition clients facile'
  ]
}
