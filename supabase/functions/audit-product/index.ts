import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuditRequest {
  productId: string
  productSource: 'products' | 'imported_products' | 'supplier_products'
  auditType: 'full' | 'quick' | 'seo_only'
  userId: string
}

interface AuditResult {
  overallScore: number
  titleScore: number
  descriptionScore: number
  imageScore: number
  seoScore: number
  pricingScore: number
  variantsScore: number
  errors: Array<{ type: string; message: string; field: string }>
  warnings: Array<{ type: string; message: string; field: string }>
  recommendations: Array<{ type: string; message: string; priority: 'high' | 'medium' | 'low' }>
  suggestedTitle?: string
  suggestedDescription?: string
  suggestedTags?: string[]
}

function auditTitle(title: string | null): { score: number; errors: any[]; warnings: any[]; recommendations: any[] } {
  const errors: any[] = []
  const warnings: any[] = []
  const recommendations: any[] = []
  
  if (!title || title.trim() === '') {
    errors.push({ type: 'missing_title', message: 'Le titre du produit est manquant', field: 'title' })
    return { score: 0, errors, warnings, recommendations }
  }
  
  let score = 100
  
  // Longueur du titre
  if (title.length < 15) {
    score -= 20
    warnings.push({ type: 'title_too_short', message: 'Le titre est trop court (< 15 caractères)', field: 'title' })
    recommendations.push({ type: 'title_length', message: 'Allongez le titre pour inclure plus de détails', priority: 'high' })
  } else if (title.length > 120) {
    score -= 15
    warnings.push({ type: 'title_too_long', message: 'Le titre est trop long (> 120 caractères)', field: 'title' })
    recommendations.push({ type: 'title_length', message: 'Raccourcissez le titre pour améliorer la lisibilité', priority: 'medium' })
  }
  
  // Majuscules excessives
  const upperCount = (title.match(/[A-Z]/g) || []).length
  if (upperCount / title.length > 0.5) {
    score -= 10
    warnings.push({ type: 'excessive_caps', message: 'Trop de majuscules dans le titre', field: 'title' })
  }
  
  // Caractères spéciaux excessifs
  const specialChars = (title.match(/[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/g) || []).length
  if (specialChars > 3) {
    score -= 10
    warnings.push({ type: 'excessive_special_chars', message: 'Trop de caractères spéciaux', field: 'title' })
  }
  
  return { score: Math.max(0, score), errors, warnings, recommendations }
}

function auditDescription(description: string | null): { score: number; errors: any[]; warnings: any[]; recommendations: any[] } {
  const errors: any[] = []
  const warnings: any[] = []
  const recommendations: any[] = []
  
  if (!description || description.trim() === '') {
    errors.push({ type: 'missing_description', message: 'La description du produit est manquante', field: 'description' })
    return { score: 0, errors, warnings, recommendations }
  }
  
  let score = 100
  
  // Longueur
  if (description.length < 50) {
    score -= 30
    errors.push({ type: 'description_too_short', message: 'La description est trop courte (< 50 caractères)', field: 'description' })
    recommendations.push({ type: 'description_length', message: 'Ajoutez plus de détails sur les caractéristiques et avantages', priority: 'high' })
  } else if (description.length < 100) {
    score -= 15
    warnings.push({ type: 'description_short', message: 'La description pourrait être plus détaillée', field: 'description' })
  }
  
  // Structuration
  if (!description.includes('\n') && description.length > 200) {
    score -= 10
    warnings.push({ type: 'no_paragraphs', message: 'La description manque de structuration (paragraphes)', field: 'description' })
    recommendations.push({ type: 'structure', message: 'Utilisez des paragraphes pour améliorer la lisibilité', priority: 'medium' })
  }
  
  // Mots-clés de qualité
  const qualityKeywords = ['premium', 'haute qualité', 'durable', 'confortable', 'élégant', 'moderne']
  const hasQualityKeywords = qualityKeywords.some(keyword => description.toLowerCase().includes(keyword))
  if (!hasQualityKeywords) {
    score -= 10
    recommendations.push({ type: 'quality_keywords', message: 'Ajoutez des mots-clés qui mettent en valeur la qualité', priority: 'medium' })
  }
  
  return { score: Math.max(0, score), errors, warnings, recommendations }
}

function auditImages(imageUrl: string | null, imageUrls: string[] | null): { score: number; errors: any[]; warnings: any[]; recommendations: any[] } {
  const errors: any[] = []
  const warnings: any[] = []
  const recommendations: any[] = []
  
  const totalImages = (imageUrls?.length || 0) + (imageUrl ? 1 : 0)
  
  if (totalImages === 0) {
    errors.push({ type: 'no_images', message: 'Aucune image de produit', field: 'images' })
    return { score: 0, errors, warnings, recommendations }
  }
  
  let score = 100
  
  if (totalImages < 3) {
    score -= 20
    warnings.push({ type: 'few_images', message: `Seulement ${totalImages} image(s) - recommandé: au moins 3`, field: 'images' })
    recommendations.push({ type: 'more_images', message: 'Ajoutez plus d\'images sous différents angles', priority: 'high' })
  }
  
  if (totalImages < 5) {
    recommendations.push({ type: 'optimal_images', message: 'Pour une meilleure conversion, ajoutez jusqu\'à 5-7 images', priority: 'medium' })
  }
  
  return { score: Math.max(0, score), errors, warnings, recommendations }
}

function auditSEO(product: any): { score: number; errors: any[]; warnings: any[]; recommendations: any[] } {
  const errors: any[] = []
  const warnings: any[] = []
  const recommendations: any[] = []
  
  let score = 100
  
  // SEO Title
  if (!product.seo_title) {
    score -= 15
    warnings.push({ type: 'missing_seo_title', message: 'Titre SEO manquant', field: 'seo_title' })
    recommendations.push({ type: 'seo_title', message: 'Ajoutez un titre SEO optimisé (50-60 caractères)', priority: 'high' })
  } else if (product.seo_title.length > 60) {
    score -= 10
    warnings.push({ type: 'seo_title_long', message: 'Titre SEO trop long', field: 'seo_title' })
  }
  
  // SEO Description
  if (!product.seo_description) {
    score -= 15
    warnings.push({ type: 'missing_seo_description', message: 'Meta description manquante', field: 'seo_description' })
    recommendations.push({ type: 'seo_description', message: 'Ajoutez une meta description (150-160 caractères)', priority: 'high' })
  } else if (product.seo_description.length > 160) {
    score -= 10
    warnings.push({ type: 'seo_description_long', message: 'Meta description trop longue', field: 'seo_description' })
  }
  
  // Keywords/Tags
  const tags = product.tags || product.seo_keywords || []
  if (tags.length === 0) {
    score -= 20
    errors.push({ type: 'no_tags', message: 'Aucun tag ou mot-clé', field: 'tags' })
    recommendations.push({ type: 'tags', message: 'Ajoutez 3-5 tags pertinents pour le SEO', priority: 'high' })
  } else if (tags.length < 3) {
    score -= 10
    warnings.push({ type: 'few_tags', message: 'Peu de tags (recommandé: 3-5)', field: 'tags' })
  }
  
  // SKU
  if (!product.sku) {
    score -= 10
    warnings.push({ type: 'missing_sku', message: 'SKU manquant', field: 'sku' })
    recommendations.push({ type: 'sku', message: 'Ajoutez un SKU unique pour le suivi', priority: 'medium' })
  }
  
  return { score: Math.max(0, score), errors, warnings, recommendations }
}

function auditPricing(price: number | null, costPrice: number | null): { score: number; errors: any[]; warnings: any[]; recommendations: any[] } {
  const errors: any[] = []
  const warnings: any[] = []
  const recommendations: any[] = []
  
  if (!price || price <= 0) {
    errors.push({ type: 'invalid_price', message: 'Prix invalide ou manquant', field: 'price' })
    return { score: 0, errors, warnings, recommendations }
  }
  
  let score = 100
  
  if (!costPrice || costPrice <= 0) {
    score -= 20
    warnings.push({ type: 'missing_cost_price', message: 'Prix de coût manquant', field: 'cost_price' })
    recommendations.push({ type: 'cost_price', message: 'Ajoutez le prix de coût pour calculer la marge', priority: 'high' })
  } else {
    const margin = ((price - costPrice) / price) * 100
    
    if (margin < 20) {
      score -= 20
      warnings.push({ type: 'low_margin', message: `Marge faible: ${margin.toFixed(1)}%`, field: 'price' })
      recommendations.push({ type: 'increase_margin', message: 'Augmentez le prix pour améliorer la marge (recommandé: > 30%)', priority: 'high' })
    } else if (margin > 80) {
      score -= 10
      warnings.push({ type: 'very_high_margin', message: `Marge très élevée: ${margin.toFixed(1)}%`, field: 'price' })
      recommendations.push({ type: 'competitive_pricing', message: 'Vérifiez que le prix reste compétitif', priority: 'low' })
    }
  }
  
  // Prix psychologique
  const priceStr = price.toString()
  if (!priceStr.endsWith('9') && !priceStr.endsWith('99')) {
    recommendations.push({ type: 'psychological_pricing', message: 'Considérez un prix psychologique (ex: 19.99 au lieu de 20)', priority: 'low' })
  }
  
  return { score: Math.max(0, score), errors, warnings, recommendations }
}

function auditVariants(product: any): { score: number; errors: any[]; warnings: any[]; recommendations: any[] } {
  const errors: any[] = []
  const warnings: any[] = []
  const recommendations: any[] = []
  
  let score = 100
  
  // Pour simplifier, on considère que les variantes sont bonnes si le produit a des attributs
  const hasVariants = product.attributes && Object.keys(product.attributes).length > 0
  
  if (!hasVariants) {
    score -= 10
    recommendations.push({ type: 'variants', message: 'Considérez d\'ajouter des variantes (taille, couleur) si applicable', priority: 'low' })
  }
  
  return { score: Math.max(0, score), errors, warnings, recommendations }
}

async function generateAISuggestions(product: any): Promise<{ title?: string; description?: string; tags?: string[] }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not configured, skipping AI suggestions')
    return {}
  }
  
  try {
    const prompt = `Analysez ce produit et générez:
1. Un titre optimisé (50-80 caractères, clair, descriptif, avec mots-clés)
2. Une description marketing (150-250 caractères, engageante, avec bénéfices)
3. 5 tags pertinents pour le SEO

Produit actuel:
- Nom: ${product.name || 'Sans nom'}
- Description: ${product.description || 'Sans description'}
- Prix: ${product.price || 0}€
- Catégorie: ${product.category || 'Non catégorisé'}

Format de réponse (JSON strict):
{
  "title": "...",
  "description": "...",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: 'Tu es un expert en e-commerce et SEO. Réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    })
    
    if (!response.ok) {
      console.error('AI API error:', response.status, await response.text())
      return {}
    }
    
    const data = await response.json()
    const content = data.choices[0].message.content
    
    // Extraire le JSON du contenu
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in AI response')
      return {}
    }
    
    const suggestions = JSON.parse(jsonMatch[0])
    return {
      title: suggestions.title,
      description: suggestions.description,
      tags: suggestions.tags,
    }
  } catch (error) {
    console.error('Error generating AI suggestions:', error)
    return {}
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

    const { productId, productSource, auditType, userId }: AuditRequest = await req.json()

    if (!productId || !productSource || !userId) {
      throw new Error('Missing required fields: productId, productSource, userId')
    }

    console.log(`Auditing product ${productId} from ${productSource} for user ${userId}`)
    const startTime = Date.now()

    // Récupérer le produit
    const { data: product, error: productError } = await supabaseClient
      .from(productSource)
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      throw new Error(`Product not found: ${productError?.message}`)
    }

    console.log('Product retrieved:', product.name)

    // Effectuer l'audit selon le type
    const titleAudit = auditTitle(product.name)
    const descriptionAudit = auditDescription(product.description)
    const imageAudit = auditImages(product.image_url, product.image_urls)
    const seoAudit = auditType === 'quick' ? { score: 100, errors: [], warnings: [], recommendations: [] } : auditSEO(product)
    const pricingAudit = auditType === 'seo_only' ? { score: 100, errors: [], warnings: [], recommendations: [] } : auditPricing(product.price, product.cost_price)
    const variantsAudit = auditType === 'seo_only' ? { score: 100, errors: [], warnings: [], recommendations: [] } : auditVariants(product)

    // Générer suggestions IA (seulement pour audit complet)
    const aiSuggestions = auditType === 'full' ? await generateAISuggestions(product) : {}

    // Calculer le score global
    const scores = [
      titleAudit.score,
      descriptionAudit.score,
      imageAudit.score,
      seoAudit.score,
      pricingAudit.score,
      variantsAudit.score
    ]
    const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length

    // Compiler les résultats
    const result: AuditResult = {
      overallScore: Math.round(overallScore * 10) / 10,
      titleScore: titleAudit.score,
      descriptionScore: descriptionAudit.score,
      imageScore: imageAudit.score,
      seoScore: seoAudit.score,
      pricingScore: pricingAudit.score,
      variantsScore: variantsAudit.score,
      errors: [
        ...titleAudit.errors,
        ...descriptionAudit.errors,
        ...imageAudit.errors,
        ...seoAudit.errors,
        ...pricingAudit.errors,
        ...variantsAudit.errors
      ],
      warnings: [
        ...titleAudit.warnings,
        ...descriptionAudit.warnings,
        ...imageAudit.warnings,
        ...seoAudit.warnings,
        ...pricingAudit.warnings,
        ...variantsAudit.warnings
      ],
      recommendations: [
        ...titleAudit.recommendations,
        ...descriptionAudit.recommendations,
        ...imageAudit.recommendations,
        ...seoAudit.recommendations,
        ...pricingAudit.recommendations,
        ...variantsAudit.recommendations
      ],
      suggestedTitle: aiSuggestions.title,
      suggestedDescription: aiSuggestions.description,
      suggestedTags: aiSuggestions.tags,
    }

    const auditDuration = Date.now() - startTime

    // Sauvegarder l'audit dans la DB
    const { error: insertError } = await supabaseClient
      .from('product_audits')
      .insert({
        user_id: userId,
        product_id: productId,
        product_source: productSource,
        audit_type: auditType,
        overall_score: result.overallScore,
        title_score: result.titleScore,
        description_score: result.descriptionScore,
        image_score: result.imageScore,
        seo_score: result.seoScore,
        pricing_score: result.pricingScore,
        variants_score: result.variantsScore,
        errors: result.errors,
        warnings: result.warnings,
        recommendations: result.recommendations,
        suggested_title: result.suggestedTitle,
        suggested_description: result.suggestedDescription,
        suggested_tags: result.suggestedTags,
        audit_duration_ms: auditDuration,
      })

    if (insertError) {
      console.error('Error saving audit:', insertError)
    } else {
      console.log('Audit saved successfully')
    }

    return new Response(
      JSON.stringify({ success: true, audit: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in audit-product:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})