import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  products?: string[]
  analysisType?: 'trending' | 'competitive' | 'optimization' | 'winner-prediction'
  filters?: Record<string, any>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      supabaseClient.auth.setAuth(authHeader.replace('Bearer ', ''))
    }

    const { products = [], analysisType = 'trending', filters = {} }: AnalysisRequest = await req.json()

    console.log('Starting AI catalog analysis:', { analysisType, productsCount: products.length })

    // Get real catalog data for analysis
    const { data: catalogData, error: catalogError } = await supabaseClient
      .rpc('get_marketplace_products', {
        category_filter: filters.category || null,
        search_term: filters.search || null,
        limit_count: 200
      })

    if (catalogError) {
      console.error('Error fetching catalog data:', catalogError)
      throw catalogError
    }

    console.log('Fetched catalog data:', catalogData?.length, 'products')

    let analysisResults = {}

    switch (analysisType) {
      case 'trending':
        analysisResults = analyzeTrends(catalogData || [])
        break
      case 'competitive':
        analysisResults = analyzeCompetition(catalogData || [])
        break
      case 'optimization':
        analysisResults = analyzeOptimization(catalogData || [])
        break
      case 'winner-prediction':
        analysisResults = predictWinners(catalogData || [])
        break
      default:
        analysisResults = { error: 'Unknown analysis type' }
    }

    // Store analysis results for caching
    const { error: insertError } = await supabaseClient
      .from('ai_optimization_jobs')
      .insert({
        user_id: (await supabaseClient.auth.getUser()).data.user?.id,
        job_type: `catalog_${analysisType}`,
        status: 'completed',
        input_data: { products, analysisType, filters },
        output_data: analysisResults,
        completed_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error storing analysis results:', insertError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysisType,
        results: analysisResults,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in AI catalog analysis:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: 'Failed to analyze catalog data'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Analysis functions

function analyzeTrends(products: any[]) {
  console.log('Analyzing trends for', products.length, 'products')
  
  const categoryTrends = {}
  const brandTrends = {}
  const priceTrends = {}

  products.forEach(product => {
    // Category trends
    if (product.category) {
      if (!categoryTrends[product.category]) {
        categoryTrends[product.category] = {
          count: 0,
          avgRating: 0,
          avgPrice: 0,
          trendingCount: 0
        }
      }
      categoryTrends[product.category].count++
      categoryTrends[product.category].avgRating += product.rating || 0
      categoryTrends[product.category].avgPrice += product.price || 0
      if (product.is_trending) categoryTrends[product.category].trendingCount++
    }

    // Brand trends
    if (product.brand) {
      if (!brandTrends[product.brand]) {
        brandTrends[product.brand] = {
          count: 0,
          avgRating: 0,
          trendingPercentage: 0
        }
      }
      brandTrends[product.brand].count++
      brandTrends[product.brand].avgRating += product.rating || 0
      if (product.is_trending) brandTrends[product.brand].trendingPercentage++
    }

    // Price trends
    const priceRange = getPriceRange(product.price || 0)
    if (!priceTrends[priceRange]) {
      priceTrends[priceRange] = { count: 0, avgRating: 0 }
    }
    priceTrends[priceRange].count++
    priceTrends[priceRange].avgRating += product.rating || 0
  })

  // Calculate averages
  Object.keys(categoryTrends).forEach(category => {
    const trend = categoryTrends[category]
    trend.avgRating = trend.avgRating / trend.count
    trend.avgPrice = trend.avgPrice / trend.count
    trend.trendingPercentage = (trend.trendingCount / trend.count) * 100
  })

  Object.keys(brandTrends).forEach(brand => {
    const trend = brandTrends[brand]
    trend.avgRating = trend.avgRating / trend.count
    trend.trendingPercentage = (trend.trendingPercentage / trend.count) * 100
  })

  return {
    categoryTrends,
    brandTrends,
    priceTrends,
    topTrendingCategories: Object.entries(categoryTrends)
      .sort(([,a], [,b]) => (b as any).trendingPercentage - (a as any).trendingPercentage)
      .slice(0, 5),
    summary: {
      totalProducts: products.length,
      trendingProducts: products.filter(p => p.is_trending).length,
      avgRating: products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length
    }
  }
}

function analyzeCompetition(products: any[]) {
  console.log('Analyzing competition for', products.length, 'products')
  
  const competitiveAnalysis = {
    priceRanges: {},
    categoryCompetition: {},
    opportunities: [],
    threats: []
  }

  // Group products by category for competition analysis
  const categoryGroups = {}
  products.forEach(product => {
    if (!product.category) return
    
    if (!categoryGroups[product.category]) {
      categoryGroups[product.category] = []
    }
    categoryGroups[product.category].push(product)
  })

  // Analyze each category
  Object.entries(categoryGroups).forEach(([category, categoryProducts]: [string, any[]]) => {
    const prices = categoryProducts.map(p => p.price || 0).sort((a, b) => a - b)
    const ratings = categoryProducts.map(p => p.rating || 0)
    
    competitiveAnalysis.categoryCompetition[category] = {
      productCount: categoryProducts.length,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        median: prices[Math.floor(prices.length / 2)],
        avg: prices.reduce((a, b) => a + b, 0) / prices.length
      },
      ratingStats: {
        avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        max: Math.max(...ratings)
      },
      competitionLevel: categoryProducts.length > 20 ? 'high' : categoryProducts.length > 10 ? 'medium' : 'low'
    }

    // Identify opportunities (low competition, good ratings)
    if (categoryProducts.length < 15 && ratings.reduce((a, b) => a + b, 0) / ratings.length > 4) {
      competitiveAnalysis.opportunities.push({
        category,
        reason: 'Low competition with good average rating',
        metrics: competitiveAnalysis.categoryCompetition[category]
      })
    }

    // Identify threats (high competition, price wars)
    if (categoryProducts.length > 30) {
      competitiveAnalysis.threats.push({
        category,
        reason: 'High competition market',
        metrics: competitiveAnalysis.categoryCompetition[category]
      })
    }
  })

  return competitiveAnalysis
}

function analyzeOptimization(products: any[]) {
  console.log('Analyzing optimization opportunities for', products.length, 'products')
  
  const optimizationSuggestions = {
    pricing: [],
    content: [],
    categorization: [],
    performance: []
  }

  products.forEach(product => {
    // Pricing optimization
    if (product.price && product.rating) {
      if (product.rating > 4.5 && product.price < 50) {
        optimizationSuggestions.pricing.push({
          productId: product.id,
          productName: product.name,
          suggestion: 'Consider increasing price - high rating suggests premium value',
          currentPrice: product.price,
          suggestedPrice: product.price * 1.2,
          confidence: 0.8
        })
      }
    }

    // Content optimization
    if (!product.description || product.description.length < 100) {
      optimizationSuggestions.content.push({
        productId: product.id,
        productName: product.name,
        suggestion: 'Add detailed product description',
        issue: 'Missing or short description',
        priority: 'high'
      })
    }

    // Category optimization
    if (!product.category || !product.subcategory) {
      optimizationSuggestions.categorization.push({
        productId: product.id,
        productName: product.name,
        suggestion: 'Complete product categorization',
        missing: !product.category ? 'category' : 'subcategory'
      })
    }

    // Performance optimization
    if (product.rating && product.rating < 3.5) {
      optimizationSuggestions.performance.push({
        productId: product.id,
        productName: product.name,
        suggestion: 'Review product quality or consider removal',
        currentRating: product.rating,
        issue: 'Low customer satisfaction'
      })
    }
  })

  return {
    suggestions: optimizationSuggestions,
    summary: {
      totalSuggestions: Object.values(optimizationSuggestions).reduce((sum, arr) => sum + arr.length, 0),
      priorityAreas: Object.entries(optimizationSuggestions)
        .sort(([,a], [,b]) => b.length - a.length)
        .map(([area, suggestions]) => ({ area, count: suggestions.length }))
    }
  }
}

function predictWinners(products: any[]) {
  console.log('Predicting winner products from', products.length, 'products')
  
  const predictions = products.map(product => {
    let score = 0
    const factors = []

    // Rating factor (40% weight)
    if (product.rating) {
      const ratingScore = (product.rating / 5) * 40
      score += ratingScore
      factors.push({ factor: 'rating', score: ratingScore, value: product.rating })
    }

    // Reviews count factor (20% weight)
    if (product.reviews_count) {
      const reviewsScore = Math.min((product.reviews_count / 100) * 20, 20)
      score += reviewsScore
      factors.push({ factor: 'reviews', score: reviewsScore, value: product.reviews_count })
    }

    // Price competitiveness (20% weight)
    const avgPrice = products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length
    if (product.price && product.price < avgPrice) {
      const priceScore = 20
      score += priceScore
      factors.push({ factor: 'competitive_price', score: priceScore, value: product.price })
    }

    // Availability factor (10% weight)
    if (product.availability_status === 'in_stock') {
      score += 10
      factors.push({ factor: 'availability', score: 10, value: 'in_stock' })
    }

    // Trending status (10% weight)
    if (product.is_trending) {
      score += 10
      factors.push({ factor: 'trending', score: 10, value: true })
    }

    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      brand: product.brand,
      winnerScore: Math.round(score),
      prediction: score > 70 ? 'high_potential' : score > 40 ? 'medium_potential' : 'low_potential',
      factors,
      currentMetrics: {
        price: product.price,
        rating: product.rating,
        reviews: product.reviews_count,
        isWinner: product.is_winner,
        isTrending: product.is_trending
      }
    }
  })

  // Sort by score
  predictions.sort((a, b) => b.winnerScore - a.winnerScore)

  return {
    predictions: predictions.slice(0, 20), // Top 20 predictions
    summary: {
      highPotential: predictions.filter(p => p.prediction === 'high_potential').length,
      mediumPotential: predictions.filter(p => p.prediction === 'medium_potential').length,
      lowPotential: predictions.filter(p => p.prediction === 'low_potential').length,
      avgScore: predictions.reduce((sum, p) => sum + p.winnerScore, 0) / predictions.length
    }
  }
}

function getPriceRange(price: number): string {
  if (price < 10) return '0-10€'
  if (price < 25) return '10-25€'
  if (price < 50) return '25-50€'
  if (price < 100) return '50-100€'
  if (price < 200) return '100-200€'
  return '200€+'
}