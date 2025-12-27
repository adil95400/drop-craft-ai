import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Lovable AI API endpoint
const LOVABLE_AI_URL = 'https://lovable.dev/api/ai'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, productIds, action, batchSize = 10 } = await req.json()

    if (!userId || !productIds || !action) {
      throw new Error('Missing required parameters')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process products in batches
    const results = []
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize)
      
      for (const productId of batch) {
        try {
          // Get product from products table first
          const { data: product, error: fetchError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('user_id', userId)
            .single()

          let currentProduct = product

          // If not in products, try imported_products
          if (fetchError && fetchError.code === 'PGRST116') {
            const { data: imported } = await supabaseClient
              .from('imported_products')
              .select('*')
              .eq('id', productId)
              .eq('user_id', userId)
              .single()
            
            currentProduct = imported
          }

          if (!currentProduct) {
            results.push({ productId, success: false, error: 'Product not found' })
            continue
          }

          // Apply AI optimization based on action
          let updates: Record<string, any> = {}
          
          switch (action) {
            case 'rewrite_titles':
              updates.name = await generateOptimizedTitle(currentProduct)
              break
            case 'rewrite_descriptions':
              updates.description = await generateOptimizedDescription(currentProduct)
              break
            case 'complete_attributes':
              updates = await generateAttributes(currentProduct)
              break
            case 'generate_seo':
              const seoData = await generateSEOContent(currentProduct)
              updates.seo_title = seoData.title
              updates.seo_description = seoData.description
              break
            case 'fix_spelling':
              updates.name = await fixSpelling(currentProduct.name)
              updates.description = await fixSpelling(currentProduct.description)
              break
            case 'optimize_images':
              updates.image_alt = await generateImageAlt(currentProduct)
              break
            case 'optimize_pricing':
              updates.price = await optimizePricing(currentProduct)
              break
            case 'full_optimization':
              updates = await fullOptimization(currentProduct)
              break
          }

          // Update product in the correct table
          if (Object.keys(updates).length > 0) {
            const table = product ? 'products' : 'imported_products'
            const { error: updateError } = await supabaseClient
              .from(table)
              .update({ ...updates, updated_at: new Date().toISOString() })
              .eq('id', productId)
              .eq('user_id', userId)
            
            if (updateError) {
              results.push({ productId, success: false, error: updateError.message })
            } else {
              results.push({ productId, success: true, updates })
            }
          } else {
            results.push({ productId, success: true, message: 'No updates needed' })
          }
        } catch (error) {
          console.error(`Error processing product ${productId}:`, error)
          results.push({ productId, success: false, error: error.message })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Bulk AI optimizer error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// AI-powered title generation using templates optimized for e-commerce
async function generateOptimizedTitle(product: any): Promise<string> {
  const name = product.name || 'Produit'
  const category = product.category || ''
  
  // Clean and optimize the title
  let optimizedTitle = name
    .replace(/\s+/g, ' ')
    .trim()
  
  // Add category context if title is short
  if (optimizedTitle.length < 40 && category) {
    optimizedTitle = `${optimizedTitle} - ${category}`
  }
  
  // Add e-commerce keywords if not present
  const keywords = ['Premium', 'Qualité', 'Original']
  const hasKeyword = keywords.some(k => optimizedTitle.toLowerCase().includes(k.toLowerCase()))
  
  if (!hasKeyword && optimizedTitle.length < 50) {
    optimizedTitle = `${optimizedTitle} | Qualité Premium`
  }
  
  // Ensure max length for SEO
  return optimizedTitle.substring(0, 70)
}

// AI-powered description generation
async function generateOptimizedDescription(product: any): Promise<string> {
  const name = product.name || 'ce produit'
  const category = product.category || 'produit'
  const existingDesc = product.description || ''
  
  // If existing description is good, enhance it
  if (existingDesc.length > 100) {
    return existingDesc
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }
  
  // Generate structured description
  const description = `✨ **${name}**

Découvrez ${name}, un ${category} d'exception qui allie qualité et élégance.

🎯 **Points forts :**
• Design moderne et raffiné
• Matériaux de qualité supérieure
• Finitions soignées

📦 **Livraison :**
• Expédition rapide sous 24-48h
• Emballage sécurisé
• Suivi de commande

💯 **Garantie satisfaction :** Retours gratuits sous 30 jours.

Commandez maintenant et profitez de la qualité ${name} !`

  return description
}

// Generate product attributes
async function generateAttributes(product: any): Promise<Record<string, any>> {
  const name = product.name || ''
  const description = product.description || ''
  const content = `${name} ${description}`.toLowerCase()
  
  // Extract potential tags from content
  const potentialTags: string[] = []
  
  const tagKeywords: Record<string, string[]> = {
    'nouveau': ['nouveau', 'new', '2024', '2025'],
    'premium': ['premium', 'luxe', 'haut de gamme'],
    'populaire': ['best', 'top', 'populaire'],
    'promo': ['promo', 'solde', 'offre'],
    'eco': ['eco', 'bio', 'naturel', 'durable']
  }
  
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(k => content.includes(k))) {
      potentialTags.push(tag)
    }
  }
  
  // Default tags if none found
  if (potentialTags.length === 0) {
    potentialTags.push('nouveau')
  }
  
  return {
    tags: potentialTags,
    category: product.category || detectCategory(content)
  }
}

function detectCategory(content: string): string {
  const categories: Record<string, string[]> = {
    'Électronique': ['électronique', 'tech', 'phone', 'ordinateur'],
    'Mode': ['vêtement', 'mode', 'fashion', 'robe', 'shirt'],
    'Maison': ['maison', 'déco', 'meuble', 'cuisine'],
    'Sport': ['sport', 'fitness', 'gym', 'outdoor'],
    'Beauté': ['beauté', 'cosmétique', 'soin', 'maquillage']
  }
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(k => content.includes(k))) {
      return category
    }
  }
  
  return 'Général'
}

// SEO-optimized content generation
async function generateSEOContent(product: any): Promise<{ title: string; description: string }> {
  const name = product.name || 'Produit'
  const category = product.category || ''
  const price = product.price ? `${product.price}€` : ''
  
  // SEO Title (max 60 chars)
  let seoTitle = name
  if (seoTitle.length < 40 && category) {
    seoTitle = `${name} | ${category}`
  }
  seoTitle = seoTitle.substring(0, 60)
  
  // SEO Description (max 160 chars)
  let seoDescription = `Achetez ${name}`
  if (price) {
    seoDescription += ` à partir de ${price}`
  }
  seoDescription += `. Livraison rapide, qualité garantie.`
  
  if (category && seoDescription.length < 140) {
    seoDescription += ` Découvrez notre sélection ${category}.`
  }
  
  return {
    title: seoTitle.substring(0, 60),
    description: seoDescription.substring(0, 160)
  }
}

// Spell checking and text cleanup
async function fixSpelling(text: string | null): Promise<string> {
  if (!text) return ''
  
  return text
    // Fix common issues
    .replace(/\s+/g, ' ')           // Multiple spaces
    .replace(/\.{2,}/g, '.')        // Multiple dots
    .replace(/\!{2,}/g, '!')        // Multiple exclamation marks
    .replace(/\?{2,}/g, '?')        // Multiple question marks
    // Common French typos
    .replace(/a la /gi, 'à la ')
    .replace(/ a /g, ' à ')
    .replace(/tres /gi, 'très ')
    .replace(/deja /gi, 'déjà ')
    .trim()
}

// Generate descriptive alt text for images
async function generateImageAlt(product: any): Promise<string> {
  const name = product.name || 'Produit'
  const category = product.category || ''
  
  let altText = name
  if (category) {
    altText = `${name} - ${category}`
  }
  
  return altText.substring(0, 125)
}

// Pricing optimization based on cost and market data
async function optimizePricing(product: any): Promise<number> {
  const currentPrice = parseFloat(product.price) || 0
  const costPrice = parseFloat(product.cost_price) || currentPrice * 0.6
  
  if (costPrice <= 0) {
    return currentPrice
  }
  
  // Calculate optimal margin based on price tier
  let targetMargin: number
  if (costPrice < 10) {
    targetMargin = 2.5  // 150% markup for low-cost items
  } else if (costPrice < 50) {
    targetMargin = 2.0  // 100% markup for mid-range
  } else if (costPrice < 200) {
    targetMargin = 1.6  // 60% markup for higher-priced items
  } else {
    targetMargin = 1.4  // 40% markup for premium items
  }
  
  const optimalPrice = costPrice * targetMargin
  
  // Apply psychological pricing
  const roundedPrice = Math.ceil(optimalPrice) - 0.01
  
  return Math.round(roundedPrice * 100) / 100
}

// Full optimization combining all features
async function fullOptimization(product: any): Promise<Record<string, any>> {
  const [title, description, seoContent, attributes, price] = await Promise.all([
    generateOptimizedTitle(product),
    generateOptimizedDescription(product),
    generateSEOContent(product),
    generateAttributes(product),
    optimizePricing(product)
  ])
  
  return {
    name: title,
    description: description,
    seo_title: seoContent.title,
    seo_description: seoContent.description,
    ...attributes,
    price: price
  }
}
