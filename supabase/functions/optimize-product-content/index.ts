import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!

interface OptimizationRequest {
  userId: string
  productId: string
  platform: string
  optimizationType: 'title' | 'description' | 'keywords' | 'full'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, productId, platform, optimizationType } = await req.json() as OptimizationRequest

    console.log(`Optimizing content for product ${productId}, platform: ${platform}, type: ${optimizationType}`)

    // Récupérer le produit
    const { data: product, error: productError } = await supabase
      .from('imported_products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .single()

    if (productError || !product) {
      throw new Error('Product not found')
    }

    // Préparer le prompt selon le type d'optimisation et la plateforme
    let systemPrompt = `You are an expert e-commerce content optimizer specializing in ${platform} marketplace.`
    let userPrompt = ''

    const platformGuidelines: Record<string, string> = {
      amazon: 'Focus on keywords, search optimization, and bullet points. Keep titles under 200 characters.',
      ebay: 'Use compelling, action-oriented language. Highlight unique features and condition.',
      shopify: 'Create engaging, brand-focused content. Tell a story about the product.',
      facebook: 'Short, catchy descriptions with emojis. Focus on emotional appeal.',
      google: 'SEO-optimized with structured data. Include key specifications.',
      default: 'Clear, concise, and compelling product information.'
    }

    const guidelines = platformGuidelines[platform.toLowerCase()] || platformGuidelines.default

    switch (optimizationType) {
      case 'title':
        userPrompt = `Optimize this product title for ${platform}:\n\nCurrent title: ${product.name}\n\nGuidelines: ${guidelines}\n\nProvide an optimized title that will improve visibility and conversion.`
        break
      
      case 'description':
        userPrompt = `Optimize this product description for ${platform}:\n\nCurrent description: ${product.description || 'No description'}\n\nProduct name: ${product.name}\nPrice: ${product.price}\nCategory: ${product.category}\n\nGuidelines: ${guidelines}\n\nProvide an optimized description that highlights benefits, features, and includes relevant keywords.`
        break
      
      case 'keywords':
        userPrompt = `Generate SEO keywords for this product on ${platform}:\n\nProduct: ${product.name}\nDescription: ${product.description || ''}\nCategory: ${product.category}\n\nProvide a list of 10-15 relevant keywords that would improve search visibility.`
        break
      
      case 'full':
        userPrompt = `Fully optimize this product listing for ${platform}:\n\nName: ${product.name}\nDescription: ${product.description || ''}\nPrice: ${product.price}\nCategory: ${product.category}\n\nGuidelines: ${guidelines}\n\nProvide:\n1. Optimized title\n2. Optimized description\n3. SEO keywords\n4. Key bullet points`
        break
    }

    // Appeler l'IA via Lovable AI Gateway
    console.log('Calling AI Gateway for optimization...')
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API error:', aiResponse.status, errorText)
      throw new Error(`AI optimization failed: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const optimizedContent = aiData.choices[0].message.content

    // Calculer un score d'optimisation (simple heuristique)
    const score = calculateOptimizationScore(product, optimizedContent, platform)

    // Générer des suggestions
    const suggestions = generateSuggestions(product, platform)

    // Stocker l'optimisation
    const { data: optimization, error: saveError } = await supabase
      .from('content_optimizations')
      .insert({
        user_id: userId,
        product_id: productId,
        platform,
        optimization_type: optimizationType,
        original_content: {
          name: product.name,
          description: product.description,
          category: product.category
        },
        optimized_content: {
          text: optimizedContent,
          parsed: parseOptimizedContent(optimizedContent, optimizationType)
        },
        optimization_score: score,
        ai_suggestions: suggestions
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving optimization:', saveError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        optimizedContent,
        optimizationScore: score,
        suggestions,
        optimizationId: optimization?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Content optimization error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function calculateOptimizationScore(product: any, optimizedContent: string, platform: string): number {
  let score = 50 // Base score

  // Longueur du contenu
  if (optimizedContent.length > product.description?.length || 0) {
    score += 10
  }

  // Mots-clés de la catégorie présents
  if (product.category && optimizedContent.toLowerCase().includes(product.category.toLowerCase())) {
    score += 10
  }

  // Contient des call-to-action
  const cta = ['buy', 'order', 'get', 'discover', 'shop', 'acheter', 'commander']
  if (cta.some(word => optimizedContent.toLowerCase().includes(word))) {
    score += 10
  }

  // Longueur appropriée selon la plateforme
  const idealLengths: Record<string, { min: number, max: number }> = {
    amazon: { min: 500, max: 2000 },
    ebay: { min: 300, max: 1500 },
    facebook: { min: 100, max: 500 },
    default: { min: 200, max: 1000 }
  }
  const ideal = idealLengths[platform.toLowerCase()] || idealLengths.default
  if (optimizedContent.length >= ideal.min && optimizedContent.length <= ideal.max) {
    score += 20
  }

  return Math.min(100, score)
}

function generateSuggestions(product: any, platform: string): any[] {
  const suggestions = []

  if (!product.images || product.images.length < 3) {
    suggestions.push({
      type: 'images',
      priority: 'high',
      message: 'Ajoutez au moins 3 images de haute qualité pour améliorer la conversion'
    })
  }

  if (product.price && product.cost_price) {
    const margin = ((product.price - product.cost_price) / product.price) * 100
    if (margin < 20) {
      suggestions.push({
        type: 'pricing',
        priority: 'medium',
        message: 'Marge faible : considérez augmenter le prix pour améliorer la rentabilité'
      })
    }
  }

  if (!product.description || product.description.length < 100) {
    suggestions.push({
      type: 'description',
      priority: 'high',
      message: 'Description trop courte : ajoutez plus de détails sur le produit'
    })
  }

  return suggestions
}

function parseOptimizedContent(content: string, type: string): any {
  // Parser le contenu optimisé selon le type
  const parsed: any = { raw: content }

  if (type === 'full') {
    // Essayer d'extraire les différentes sections
    const titleMatch = content.match(/(?:title|titre):\s*(.+)/i)
    const descMatch = content.match(/(?:description):\s*([\s\S]+?)(?=\n\n|keywords|$)/i)
    const keywordsMatch = content.match(/(?:keywords|mots-clés):\s*(.+)/i)

    if (titleMatch) parsed.title = titleMatch[1].trim()
    if (descMatch) parsed.description = descMatch[1].trim()
    if (keywordsMatch) {
      parsed.keywords = keywordsMatch[1].split(',').map(k => k.trim())
    }
  }

  return parsed
}
