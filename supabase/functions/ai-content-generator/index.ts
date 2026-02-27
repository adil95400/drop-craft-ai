/**
 * AI Content Generator - Secure Implementation
 * P1.1: Uses unified wrapper with auth + validation + rate limit + secure CORS
 */

import { createEdgeFunction, z } from '../_shared/create-edge-function.ts'

// Input schema for AI content generation
const aiContentSchema = z.object({
  type: z.enum(['product_description', 'blog_article', 'ad_copy', 'seo_content', 'email_marketing']).optional(),
  prompt: z.string().max(2000).optional(),
  keywords: z.array(z.string().max(50)).max(10).default([]),
  language: z.string().length(2).default('fr'),
  action: z.enum(['generate', 'improve', 'expand', 'summarize', 'translate', 'ideas']).optional(),
  content: z.string().max(10000).optional(),
  tone: z.enum(['professional', 'casual', 'enthusiastic', 'persuasive', 'informative', 'friendly']).optional(),
  contentType: z.enum(['blog', 'description', 'social', 'email', 'seo']).optional()
})

type AIContentInput = z.infer<typeof aiContentSchema>

const handler = createEdgeFunction<AIContentInput>({
  requireAuth: true,
  inputSchema: aiContentSchema,
  rateLimit: { maxRequests: 50, windowMinutes: 60, action: 'ai_content_generation' }
}, async (ctx) => {
  const { user, input, correlationId } = ctx
  const { type, prompt, keywords, language, action, content, tone, contentType } = input
  
  console.log(`[${correlationId}] AI Content request from user: ${user.id}`)

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured')
    throw new Error('AI service not configured')
  }

  let systemPrompt = ""
  let userPrompt = ""

  // Handle new format (from AIContentAssistant)
  if (action) {
    const langName = language === 'fr' ? 'français' : 
                     language === 'en' ? 'anglais' : 
                     language === 'es' ? 'espagnol' : 
                     language === 'de' ? 'allemand' : 'italien'
    
    systemPrompt = `Tu es un expert en création de contenu marketing et SEO. Tu réponds toujours en ${langName}.`
    
    const toneInstructions: Record<string, string> = {
      professional: 'Utilise un ton professionnel et sérieux.',
      casual: 'Utilise un ton décontracté et accessible.',
      enthusiastic: 'Utilise un ton enthousiaste et dynamique.',
      persuasive: 'Utilise un ton persuasif et convaincant.',
      informative: 'Utilise un ton informatif et éducatif.',
      friendly: 'Utilise un ton amical et chaleureux.'
    }

    systemPrompt += ` ${toneInstructions[tone || 'professional']}`

    const contentTypeInstructions: Record<string, string> = {
      blog: 'Crée du contenu optimisé pour les articles de blog avec des titres, sous-titres et paragraphes bien structurés.',
      description: 'Crée des descriptions de produits engageantes qui mettent en avant les bénéfices.',
      social: 'Crée du contenu adapté aux réseaux sociaux, concis et engageant avec des emojis appropriés.',
      email: 'Crée du contenu pour emails marketing avec un objet accrocheur et un call-to-action clair.',
      seo: 'Crée du contenu optimisé pour le référencement naturel avec les mots-clés appropriés.'
    }

    if (contentType) {
      systemPrompt += ` ${contentTypeInstructions[contentType] || ''}`
    }

    switch (action) {
      case 'generate':
        userPrompt = `Génère du contenu basé sur ces instructions: ${prompt || 'Contenu marketing engageant'}`
        break
      case 'improve':
        if (!content) throw new Error('Content is required for improve action')
        userPrompt = `Améliore ce texte en le rendant plus engageant et professionnel:\n\n${content}\n\nInstructions supplémentaires: ${prompt || 'Améliore la clarté et l\'impact.'}`
        break
      case 'expand':
        if (!content) throw new Error('Content is required for expand action')
        userPrompt = `Développe et enrichis ce contenu avec plus de détails:\n\n${content}\n\nPoints à développer: ${prompt || 'Ajoute des exemples, des données et des arguments.'}`
        break
      case 'summarize':
        if (!content) throw new Error('Content is required for summarize action')
        userPrompt = `Résume ce contenu de manière concise tout en gardant l'essentiel:\n\n${content}\n\nInstructions: ${prompt || 'Garde les points clés.'}`
        break
      case 'translate':
        if (!content) throw new Error('Content is required for translate action')
        userPrompt = `Traduis ce contenu en ${langName}:\n\n${content}`
        break
      case 'ideas':
        userPrompt = `Génère 5 idées de contenu créatives sur ce sujet: ${prompt || content || 'marketing digital'}. Pour chaque idée, donne un titre accrocheur et une brève description.`
        break
      default:
        userPrompt = prompt || 'Génère du contenu marketing engageant.'
    }
  } else {
    // Handle legacy format
    const keywordsStr = keywords?.join(", ") || ''
    
    switch (type) {
      case "product_description":
        systemPrompt = `Tu es un expert en rédaction de descriptions produits pour le e-commerce en dropshipping. Crée des descriptions persuasives, optimisées SEO et qui convertissent. Utilise un ton professionnel mais accessible en ${language}.`
        userPrompt = `Écris une description produit complète pour: ${prompt || 'produit générique'}\n\nMots-clés à inclure: ${keywordsStr}\n\nInclus:\n- Titre accrocheur\n- Description détaillée (200-300 mots)\n- Points clés/bénéfices\n- Appel à l'action\n- Balises SEO suggestions`
        break

      case "blog_article":
        systemPrompt = `Tu es un rédacteur expert en contenu de blog pour le e-commerce et dropshipping. Crée des articles informatifs, engaging et optimisés SEO en ${language}.`
        userPrompt = `Écris un article de blog complet sur: ${prompt || 'sujet e-commerce'}\n\nMots-clés: ${keywordsStr}\n\nStructure:\n- Titre SEO (H1)\n- Introduction accrocheuse\n- Sous-titres (H2, H3)\n- Contenu détaillé (800-1200 mots)\n- Conclusion avec CTA\n- Meta description`
        break

      case "seo_content":
        systemPrompt = `Tu es un spécialiste SEO. Génère du contenu optimisé pour les moteurs de recherche en ${language}, avec une densité de mots-clés naturelle.`
        userPrompt = `Crée du contenu SEO pour: ${prompt || 'contenu SEO'}\n\nMots-clés principaux: ${keywordsStr}\n\nFournis:\n- Titre SEO optimisé\n- Meta description (155 caractères max)\n- Contenu principal (500-800 mots)\n- Suggestions de mots-clés longue traîne\n- Structure Hn recommandée`
        break

      case "ad_copy":
        systemPrompt = `Tu es un copywriter spécialisé en publicités e-commerce. Crée des textes publicitaires qui convertissent pour Facebook Ads, Google Ads en ${language}.`
        userPrompt = `Crée plusieurs versions de copy publicitaire pour: ${prompt || 'produit publicitaire'}\n\nMots-clés: ${keywordsStr}\n\nInclus:\n- 3 headlines accrocheurs\n- 2 descriptions courtes (90 caractères)\n- 2 descriptions longues (200 caractères)\n- CTA suggérés\n- Angles marketing différents`
        break

      case "email_marketing":
        systemPrompt = `Tu es un expert en email marketing pour le e-commerce. Crée des emails qui engagent et convertissent en ${language}.`
        userPrompt = `Crée une série d'emails marketing pour: ${prompt || 'campagne email'}\n\nMots-clés: ${keywordsStr}\n\nFournis:\n- Objet email accrocheur\n- Email de bienvenue\n- Email promotionnel\n- Email de relance panier abandonné\n- Personnalisation suggérée`
        break

      default:
        systemPrompt = `Tu es un assistant IA spécialisé en contenu e-commerce et marketing digital en ${language}.`
        userPrompt = prompt || 'Génère du contenu marketing.'
    }
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit reached. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: 'Insufficient credits.' }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    console.error('AI service error:', response.status)
    throw new Error('AI service unavailable')
  }

  const data = await response.json()
  const generatedContent = data.choices[0].message.content

  return new Response(JSON.stringify({ 
    success: true,
    content: generatedContent,
    type: type || action,
    language,
    keywords,
    generated_at: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

Deno.serve(handler)
