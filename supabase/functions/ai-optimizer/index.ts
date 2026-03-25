/**
 * AI Optimizer — Unified AI Client for SEO sub-module
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { generateJSON } from '../_shared/ai-client.ts'

interface OptimizationRequest {
  extensionType: 'seo' | 'pricing' | 'quality' | 'categorization' | 'image_enhancement'
  productData: any
  userPreferences?: any
  marketData?: any
}

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  if (req.method === 'OPTIONS') return handleCorsPreflightSecure(req)

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { extensionType, productData, userPreferences = {}, marketData = {} }: OptimizationRequest = await req.json()

    let optimizationResult: any = {}

    switch (extensionType) {
      case 'seo':
        optimizationResult = await optimizeSEO(productData)
        break
      case 'pricing':
        optimizationResult = optimizePricing(productData, marketData)
        break
      case 'quality':
        optimizationResult = checkQuality(productData)
        break
      case 'categorization':
        optimizationResult = categorizeProduct(productData)
        break
      case 'image_enhancement':
        optimizationResult = enhanceImages(productData)
        break
      default:
        throw new Error(`Unknown extension type: ${extensionType}`)
    }

    await supabase.from('ai_optimization_jobs').insert({
      user_id: user.id, job_type: extensionType, status: 'completed',
      input_data: { productData, userPreferences, marketData },
      output_data: optimizationResult, started_at: new Date().toISOString(), completed_at: new Date().toISOString()
    }).catch(e => console.error('Failed to log:', e))

    return new Response(JSON.stringify({ success: true, extensionType, optimization: optimizationResult, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: (error as any).status || 500,
    })
  }
})

async function optimizeSEO(productData: any) {
  try {
    const seoResult = await generateJSON(
      'Tu es un expert SEO e-commerce. Réponds uniquement en JSON valide.',
      `Optimise ce produit pour les moteurs de recherche français:\nProduit: ${productData.name || 'Non défini'}\nDescription: ${productData.description || 'Aucune'}\nCatégorie: ${productData.category || 'Non définie'}\nPrix: ${productData.price || 'Non défini'}€\n\nGénère: titre SEO (max 60 chars), méta-description (max 160), 5-8 mots-clés, description optimisée (150-200 mots), score SEO /100.\nJSON: {\"optimized_title\", \"meta_description\", \"keywords\", \"optimized_description\", \"seo_score\", \"improvements\"}`,
      { module: 'seo', temperature: 0.3, enableCache: true }
    )

    return { type: 'seo_optimization', confidence: 0.92, ...seoResult, ai_model: 'gpt-4o-mini' }
  } catch (error) {
    return {
      type: 'seo_optimization', confidence: 0.7, fallback: true, error: error.message,
      optimized_title: `${productData.name || 'Produit'} - Meilleur Prix en Ligne`,
      meta_description: `Découvrez ${productData.name || 'ce produit'} au meilleur prix.`,
      keywords: [productData.name?.toLowerCase(), productData.category?.toLowerCase(), 'pas cher'].filter(Boolean),
      seo_score: 75, improvements: ['Ajouter plus de mots-clés']
    }
  }
}

// --- Non-AI helpers (unchanged logic) ---

function optimizePricing(productData: any, marketData: any) {
  const currentPrice = parseFloat(productData.price) || 0
  const costPrice = parseFloat(productData.cost_price) || currentPrice * 0.6
  const competitorPrices = marketData.competitor_prices || []
  const avgCompetitorPrice = competitorPrices.length > 0 ? competitorPrices.reduce((a: number, b: number) => a + b, 0) / competitorPrices.length : currentPrice * 1.1
  const demandScore = Math.random() * 100
  const seasonalFactor = 1 + (Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 30)) * 0.1)

  let optimizedPrice = currentPrice
  const reasoning: string[] = []
  if (currentPrice > avgCompetitorPrice * 1.2) { optimizedPrice = avgCompetitorPrice * 1.05; reasoning.push('Prix réduit pour compétitivité') }
  else if (currentPrice < avgCompetitorPrice * 0.8 && demandScore > 70) { optimizedPrice = avgCompetitorPrice * 0.95; reasoning.push('Prix augmenté, forte demande') }
  optimizedPrice = Math.round(optimizedPrice * seasonalFactor * 100) / 100

  return {
    type: 'pricing_optimization', confidence: 0.88, current_price: currentPrice, optimized_price: optimizedPrice,
    price_change_percentage: ((optimizedPrice - currentPrice) / currentPrice * 100),
    competitor_analysis: { avg_competitor_price: avgCompetitorPrice, price_position: optimizedPrice < avgCompetitorPrice ? 'competitive' : 'premium' },
    demand_forecast: { demand_score: Math.round(demandScore), seasonal_factor: Math.round(seasonalFactor * 100) / 100 },
    profit_analysis: { cost_price: costPrice, profit_margin: Math.round(((optimizedPrice - costPrice) / optimizedPrice * 100)) },
    reasoning, ai_model: 'pricing_algorithm_v2'
  }
}

function checkQuality(productData: any) {
  let qualityScore = 100
  const issues: string[] = [], suggestions: string[] = []
  if (!productData.name || productData.name.length < 10) { qualityScore -= 20; issues.push('Nom trop court'); suggestions.push('Min 10 caractères') }
  if (!productData.description || productData.description.length < 50) { qualityScore -= 15; issues.push('Description insuffisante') }
  if (!productData.image_urls || productData.image_urls.length === 0) { qualityScore -= 25; issues.push('Aucune image') }
  if (!productData.category) { qualityScore -= 10; issues.push('Catégorie non définie') }
  if (!productData.price || productData.price <= 0) { qualityScore -= 30; issues.push('Prix invalide') }
  return { type: 'quality_check', confidence: 0.95, quality_score: Math.max(0, qualityScore), issues, suggestions }
}

function categorizeProduct(productData: any) {
  const text = `${productData.name || ''} ${productData.description || ''}`.toLowerCase()
  const rules = [
    { category: 'Électronique', keywords: ['phone', 'smartphone', 'ordinateur', 'laptop', 'tv', 'tech'] },
    { category: 'Mode & Vêtements', keywords: ['vêtement', 'shirt', 'pantalon', 'robe', 'chaussure', 'mode'] },
    { category: 'Maison & Jardin', keywords: ['maison', 'décoration', 'meuble', 'jardin', 'cuisine'] },
    { category: 'Sport & Loisirs', keywords: ['sport', 'fitness', 'gym', 'loisir', 'jeu'] },
    { category: 'Beauté & Santé', keywords: ['beauté', 'cosmétique', 'parfum', 'santé'] },
  ]
  let best = { category: 'Divers', confidence: 0 }
  for (const r of rules) {
    const c = r.keywords.reduce((n, k) => n + (text.includes(k) ? 1 : 0), 0) / r.keywords.length
    if (c > best.confidence) best = { category: r.category, confidence: c }
  }
  return { type: 'categorization', confidence: Math.max(0.6, best.confidence), suggested_category: best.category }
}

function enhanceImages(productData: any) {
  const images = productData.image_urls || []
  return { type: 'image_enhancement', confidence: 0.85, original_images_count: images.length, recommendations: images.length === 0 ? ['Ajouter des images'] : ['Utiliser les images améliorées'] }
}
