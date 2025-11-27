import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { productIds, userId } = await req.json()

    if (!productIds || !Array.isArray(productIds)) {
      throw new Error('productIds array is required')
    }

    console.log(`Calculating scores for ${productIds.length} products for user ${userId}`)

    const results = []
    const errors = []

    for (const productId of productIds) {
      try {
        // Fetch product data from both tables
        const [productsResult, importedResult] = await Promise.all([
          supabase.from('products').select('*').eq('id', productId).eq('user_id', userId).maybeSingle(),
          supabase.from('imported_products').select('*').eq('id', productId).eq('user_id', userId).maybeSingle()
        ])

        const product = productsResult.data || importedResult.data
        const table = productsResult.data ? 'products' : 'imported_products'

        if (!product) {
          errors.push({ productId, error: 'Product not found' })
          continue
        }

        // Calculate AI Score (0-100)
        const aiScore = calculateAIScore(product)

        // Calculate Trend Score (0-100)
        const trendScore = calculateTrendScore(product)

        // Calculate Competition Score (0-100)
        const competitionScore = calculateCompetitionScore(product)

        // Calculate Profit Potential (0-100)
        const profitPotential = calculateProfitPotential(product)

        // Determine badges
        const is_winner = aiScore >= 75 && trendScore >= 70 && profitPotential >= 60
        const is_trending = trendScore >= 80
        const is_bestseller = (product.view_count || 0) > 100 && (product.conversion_rate || 0) > 3

        // Update product
        const { error: updateError } = await supabase
          .from(table)
          .update({
            ai_score: aiScore,
            trend_score: trendScore,
            competition_score: competitionScore,
            profit_potential: profitPotential,
            is_winner,
            is_trending,
            is_bestseller,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId)
          .eq('user_id', userId)

        if (updateError) throw updateError

        results.push({
          productId,
          scores: { aiScore, trendScore, competitionScore, profitPotential },
          badges: { is_winner, is_trending, is_bestseller }
        })

      } catch (error) {
        console.error(`Error calculating scores for product ${productId}:`, error)
        errors.push({ productId, error: error.message })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        failed: errors.length,
        results,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in calculate-product-scores:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

function calculateAIScore(product: any): number {
  let score = 50 // Base score

  // Title quality (0-20 points)
  const titleLength = product.name?.length || 0
  if (titleLength >= 30 && titleLength <= 80) score += 20
  else if (titleLength >= 20) score += 10

  // Description quality (0-20 points)
  const descLength = product.description?.length || 0
  if (descLength >= 200) score += 20
  else if (descLength >= 100) score += 10

  // Images (0-15 points)
  const imageCount = product.image_urls?.length || (product.image_url ? 1 : 0)
  score += Math.min(imageCount * 5, 15)

  // Pricing (0-15 points)
  if (product.price > 0 && product.cost_price > 0) {
    const margin = ((product.price - product.cost_price) / product.price) * 100
    if (margin >= 30 && margin <= 70) score += 15
    else if (margin >= 20) score += 8
  }

  // Category (0-10 points)
  if (product.category) score += 10

  // SKU (0-10 points)
  if (product.sku) score += 10

  // Tags (0-10 points)
  const tagCount = product.tags?.length || 0
  score += Math.min(tagCount * 2, 10)

  return Math.min(Math.max(score, 0), 100)
}

function calculateTrendScore(product: any): number {
  let score = 40 // Base score

  // Recent creation (0-20 points)
  const daysOld = (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24)
  if (daysOld <= 7) score += 20
  else if (daysOld <= 30) score += 15
  else if (daysOld <= 90) score += 10

  // View count (0-25 points)
  const views = product.view_count || 0
  if (views >= 500) score += 25
  else if (views >= 200) score += 20
  else if (views >= 50) score += 15
  else if (views >= 10) score += 10

  // Conversion rate (0-20 points)
  const conversionRate = product.conversion_rate || 0
  if (conversionRate >= 5) score += 20
  else if (conversionRate >= 3) score += 15
  else if (conversionRate >= 1) score += 10

  // Category trends (0-15 points)
  const trendingCategories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports']
  if (trendingCategories.includes(product.category)) score += 15

  // Recent updates (0-10 points)
  const daysSinceUpdate = (Date.now() - new Date(product.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceUpdate <= 7) score += 10
  else if (daysSinceUpdate <= 30) score += 5

  // Stock availability (0-10 points)
  if (product.stock_quantity > 50) score += 10
  else if (product.stock_quantity > 10) score += 5

  return Math.min(Math.max(score, 0), 100)
}

function calculateCompetitionScore(product: any): number {
  let score = 50 // Base score (neutral)

  // Price point analysis (0-30 points)
  if (product.price > 0) {
    if (product.price < 20) score += 30 // Low price = less competition
    else if (product.price < 50) score += 20
    else if (product.price < 100) score += 10
    else score += 5 // High price = more competition
  }

  // Niche category (0-25 points)
  const nicheCategories = ['Collectibles', 'Handmade', 'Vintage', 'Specialty']
  if (nicheCategories.some(cat => product.category?.includes(cat))) score += 25
  else if (product.subcategory) score += 15

  // Unique features (0-20 points)
  const uniqueWords = ['unique', 'rare', 'exclusive', 'limited', 'custom', 'handmade']
  const hasUniqueFeatures = uniqueWords.some(word => 
    product.name?.toLowerCase().includes(word) || 
    product.description?.toLowerCase().includes(word)
  )
  if (hasUniqueFeatures) score += 20

  // Brand presence (0-15 points)
  if (product.brand && product.brand !== 'Generic') score -= 10 // Branded = more competition
  else score += 15 // Unbranded = less competition

  // Supplier availability (0-10 points)
  const supplierCount = product.supplier_ids?.length || 0
  if (supplierCount >= 3) score -= 10 // Many suppliers = high competition
  else if (supplierCount === 1) score += 10 // Exclusive = low competition
  else if (supplierCount === 2) score += 5

  return Math.min(Math.max(score, 0), 100)
}

function calculateProfitPotential(product: any): number {
  let score = 30 // Base score

  // Profit margin (0-40 points)
  if (product.price > 0 && product.cost_price > 0) {
    const margin = ((product.price - product.cost_price) / product.price) * 100
    if (margin >= 50) score += 40
    else if (margin >= 40) score += 35
    else if (margin >= 30) score += 30
    else if (margin >= 20) score += 20
    else if (margin >= 10) score += 10
  }

  // Price range (0-20 points)
  if (product.price >= 20 && product.price <= 100) score += 20 // Sweet spot
  else if (product.price >= 10 && product.price <= 200) score += 15
  else if (product.price >= 5) score += 10

  // Conversion potential (0-20 points)
  const conversionRate = product.conversion_rate || 0
  if (conversionRate >= 5) score += 20
  else if (conversionRate >= 3) score += 15
  else if (conversionRate >= 1) score += 10

  // Stock availability (0-10 points)
  if (product.stock_quantity >= 100) score += 10
  else if (product.stock_quantity >= 50) score += 8
  else if (product.stock_quantity >= 10) score += 5

  // Market demand indicators (0-10 points)
  const views = product.view_count || 0
  if (views >= 100) score += 10
  else if (views >= 50) score += 8
  else if (views >= 10) score += 5

  return Math.min(Math.max(score, 0), 100)
}
