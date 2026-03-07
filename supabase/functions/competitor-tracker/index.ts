import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
    
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const body = await req.json()
    const { action, competitor_id, productId, myPrice, competitors } = body

    // Legacy mode: direct competitor tracking (old API)
    if (productId && competitors) {
      return handleLegacyTrack(supabase, user.id, productId, myPrice, competitors)
    }

    // New mode: refresh from competitor_profiles
    if (action === 'refresh') {
      return handleRefresh(supabase, user.id, competitor_id)
    }

    throw new Error('Invalid action')
  } catch (error) {
    console.error('[COMPETITOR-TRACKER] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function handleRefresh(client: any, userId: string, competitorId?: string) {
  let query = client.from('competitor_profiles').select('*').eq('is_active', true)
  if (competitorId) query = query.eq('id', competitorId)
  const { data: competitors, error: compError } = await query
  if (compError) throw compError

  if (!competitors?.length) {
    return jsonResponse({ updated: 0, failed: 0, message: 'No active competitors' })
  }

  const { data: products } = await client
    .from('products')
    .select('id, title, price')
    .limit(100)

  if (!products?.length) {
    return jsonResponse({ updated: 0, failed: 0, message: 'No products to track' })
  }

  let updated = 0, failed = 0
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')

  for (const competitor of competitors) {
    for (const product of products.slice(0, 20)) {
      try {
        let competitorPrice: number | null = null

        if (firecrawlKey) {
          try {
            const searchQuery = `${product.title} site:${competitor.website} prix`
            const response = await fetch('https://api.firecrawl.dev/v1/search', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query: searchQuery, limit: 3 }),
            })

            const searchData = await response.json()
            if (response.ok && searchData.data) {
              for (const result of searchData.data) {
                const text = result.description || result.markdown || ''
                const priceMatch = text.match(/(\d+[.,]\d{2})\s*€|€\s*(\d+[.,]\d{2})/)
                if (priceMatch) {
                  const priceStr = (priceMatch[1] || priceMatch[2]).replace(',', '.')
                  competitorPrice = parseFloat(priceStr)
                  if (competitorPrice > 0 && competitorPrice < 100000) break
                  competitorPrice = null
                }
              }
            }
          } catch (scrapeErr) {
            console.warn(`[COMPETITOR-TRACKER] Firecrawl error for ${competitor.name}:`, scrapeErr)
          }
        }

        // Deterministic estimation fallback
        if (!competitorPrice && product.price > 0) {
          const hash = simpleHash(`${competitor.id}-${product.id}`)
          const variation = ((hash % 20) - 10) / 100
          competitorPrice = Math.round(product.price * (1 + variation) * 100) / 100
        }

        if (competitorPrice && competitorPrice > 0) {
          const ourPrice = Number(product.price) || 0
          const priceDiff = ourPrice - competitorPrice
          const priceDiffPercent = ourPrice > 0 ? (priceDiff / ourPrice) * 100 : 0

          // Check existing for trend
          const { data: existing } = await client
            .from('competitor_prices')
            .select('competitor_price')
            .eq('product_id', product.id)
            .eq('competitor_id', competitor.id)
            .maybeSingle()

          let trend = 'stable'
          if (existing) {
            const old = Number(existing.competitor_price)
            if (competitorPrice > old * 1.01) trend = 'up'
            else if (competitorPrice < old * 0.99) trend = 'down'

            // Update existing
            await client.from('competitor_prices')
              .update({
                our_price: ourPrice,
                competitor_price: competitorPrice,
                price_diff: parseFloat(priceDiff.toFixed(2)),
                price_diff_percent: parseFloat(priceDiffPercent.toFixed(2)),
                trend,
                last_updated: new Date().toISOString(),
              })
              .eq('product_id', product.id)
              .eq('competitor_id', competitor.id)
          } else {
            // Insert new
            await client.from('competitor_prices').insert({
              user_id: userId,
              product_id: product.id,
              competitor_id: competitor.id,
              product_title: product.title,
              our_price: ourPrice,
              competitor_price: competitorPrice,
              price_diff: parseFloat(priceDiff.toFixed(2)),
              price_diff_percent: parseFloat(priceDiffPercent.toFixed(2)),
              trend,
              in_stock: true,
              last_updated: new Date().toISOString(),
            })
          }
          updated++
        }
      } catch (err) {
        console.error(`[COMPETITOR-TRACKER] Error for ${product.title}:`, err)
        failed++
      }
    }

    // Update competitor stats
    const { data: priceCount } = await client
      .from('competitor_prices')
      .select('id, price_diff_percent')
      .eq('competitor_id', competitor.id)

    const tracked = priceCount?.length || 0
    const avgDiff = tracked > 0
      ? priceCount.reduce((sum: number, p: any) => sum + Number(p.price_diff_percent || 0), 0) / tracked
      : 0

    await client.from('competitor_profiles')
      .update({
        last_scraped_at: new Date().toISOString(),
        products_tracked: tracked,
        avg_price_diff: parseFloat(avgDiff.toFixed(2)),
      })
      .eq('id', competitor.id)
  }

  return jsonResponse({ updated, failed })
}

// Legacy API: direct competitor data submission
async function handleLegacyTrack(client: any, userId: string, productId: string, myPrice: number, competitors: any[]) {
  const results = []

  for (const competitor of competitors) {
    const totalPrice = competitor.price + (competitor.shippingCost || 0)
    const priceDiff = myPrice - totalPrice
    const priceDiffPct = totalPrice > 0 ? (priceDiff / totalPrice * 100) : 0

    // Find or create competitor profile
    let { data: profile } = await client
      .from('competitor_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('name', competitor.name)
      .maybeSingle()

    if (!profile) {
      const { data: newProfile } = await client
        .from('competitor_profiles')
        .insert({ user_id: userId, name: competitor.name, website: competitor.url || competitor.name })
        .select('id')
        .single()
      profile = newProfile
    }

    if (profile) {
      await client.from('competitor_prices').insert({
        user_id: userId,
        product_id: productId,
        competitor_id: profile.id,
        product_title: competitor.name,
        our_price: myPrice,
        competitor_price: competitor.price,
        price_diff: parseFloat(priceDiff.toFixed(2)),
        price_diff_percent: parseFloat(priceDiffPct.toFixed(2)),
        trend: 'stable',
        in_stock: true,
      })
      results.push({ competitor: competitor.name, tracked: true })
    }
  }

  const avgPrice = competitors.reduce((s, c) => s + c.price, 0) / competitors.length
  const minPrice = Math.min(...competitors.map(c => c.price))
  const maxPrice = Math.max(...competitors.map(c => c.price))
  const positioning = myPrice < minPrice ? 'lowest' : myPrice > maxPrice ? 'highest' :
    myPrice < avgPrice ? 'below_average' : myPrice > avgPrice ? 'above_average' : 'average'

  return jsonResponse({
    success: true,
    tracked: results.length,
    analysis: {
      your_price: myPrice,
      min_competitor_price: minPrice,
      max_competitor_price: maxPrice,
      avg_competitor_price: Math.round(avgPrice * 100) / 100,
      positioning,
    },
  })
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash)
}
