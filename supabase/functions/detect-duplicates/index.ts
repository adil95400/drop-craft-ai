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

    const { userId, threshold = 0.8 } = await req.json()

    if (!userId) {
      throw new Error('userId is required')
    }

    console.log(`Detecting duplicates for user ${userId} with threshold ${threshold}`)

    // Fetch all products
    const [productsResult, importedResult] = await Promise.all([
      supabase.from('products').select('*').eq('user_id', userId),
      supabase.from('imported_products').select('*').eq('user_id', userId)
    ])

    const products = [
      ...(productsResult.data || []).map(p => ({ ...p, source: 'products' })),
      ...(importedResult.data || []).map(p => ({ ...p, source: 'imported_products' }))
    ]

    console.log(`Analyzing ${products.length} products for duplicates`)

    // Find duplicates
    const duplicates = []
    const processed = new Set()

    for (let i = 0; i < products.length; i++) {
      if (processed.has(products[i].id)) continue

      const group = [products[i]]
      
      for (let j = i + 1; j < products.length; j++) {
        if (processed.has(products[j].id)) continue

        const similarity = calculateSimilarity(products[i], products[j])
        
        if (similarity >= threshold) {
          group.push(products[j])
          processed.add(products[j].id)
        }
      }

      if (group.length > 1) {
        duplicates.push({
          group,
          count: group.length,
          similarity: calculateGroupSimilarity(group),
          suggestedMaster: selectMasterProduct(group)
        })
      }

      processed.add(products[i].id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalProducts: products.length,
        duplicateGroups: duplicates.length,
        totalDuplicates: duplicates.reduce((sum, g) => sum + g.count - 1, 0),
        duplicates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in detect-duplicates:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

function calculateSimilarity(product1: any, product2: any): number {
  let score = 0
  let factors = 0

  // Name similarity (weight: 40%)
  const nameSimilarity = stringSimilarity(product1.name, product2.name)
  score += nameSimilarity * 0.4
  factors += 0.4

  // SKU exact match (weight: 30%)
  if (product1.sku && product2.sku) {
    score += (product1.sku === product2.sku ? 1 : 0) * 0.3
    factors += 0.3
  }

  // Price similarity (weight: 15%)
  if (product1.price > 0 && product2.price > 0) {
    const priceDiff = Math.abs(product1.price - product2.price) / Math.max(product1.price, product2.price)
    score += (1 - priceDiff) * 0.15
    factors += 0.15
  }

  // Category match (weight: 10%)
  if (product1.category && product2.category) {
    score += (product1.category === product2.category ? 1 : 0) * 0.1
    factors += 0.1
  }

  // Image similarity (weight: 5%)
  const img1 = product1.image_url || product1.image_urls?.[0]
  const img2 = product2.image_url || product2.image_urls?.[0]
  if (img1 && img2) {
    score += (img1 === img2 ? 1 : 0) * 0.05
    factors += 0.05
  }

  return factors > 0 ? score / factors : 0
}

function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  
  // Levenshtein distance
  const len1 = s1.length
  const len2 = s2.length
  const matrix: number[][] = []

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  const distance = matrix[len1][len2]
  const maxLen = Math.max(len1, len2)
  return 1 - distance / maxLen
}

function calculateGroupSimilarity(group: any[]): number {
  if (group.length < 2) return 1

  let totalSimilarity = 0
  let comparisons = 0

  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      totalSimilarity += calculateSimilarity(group[i], group[j])
      comparisons++
    }
  }

  return comparisons > 0 ? totalSimilarity / comparisons : 0
}

function selectMasterProduct(group: any[]): any {
  // Score each product
  const scores = group.map(product => {
    let score = 0

    // Prefer products with more data
    if (product.description?.length > 100) score += 20
    if (product.image_urls?.length > 1 || product.image_url) score += 15
    if (product.sku) score += 10
    if (product.category) score += 10
    if (product.tags?.length > 0) score += 10
    if (product.ai_score > 0) score += 15
    if (product.stock_quantity > 0) score += 10
    
    // Prefer newer products
    const daysOld = (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysOld <= 30) score += 10

    return { product, score }
  })

  // Return product with highest score
  scores.sort((a, b) => b.score - a.score)
  return scores[0].product
}
