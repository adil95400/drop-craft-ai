/**
 * PHASE 3: Supabase Edge Function pour OpenAI Realtime API
 * Proxy sécurisé entre le frontend et OpenAI avec WebSockets
 * P0.1: JWT authentication required before WebSocket upgrade
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  console.log('🚀 Realtime chat function called')
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  // P0.1: Require JWT authentication BEFORE WebSocket upgrade
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('❌ No authorization header')
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  })
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    console.error('❌ Invalid token:', authError?.message)
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  console.log(`✅ User authenticated: ${user.id}`)

  // Get OpenAI API Key
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    console.error('❌ OpenAI API Key not found')
    return new Response(
      JSON.stringify({ error: 'OpenAI API Key not configured' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  console.log('✅ OpenAI API Key found')

  // Upgrade to WebSocket (only after authentication)
  if (req.headers.get("upgrade") !== "websocket") {
    console.error('❌ Not a WebSocket request')
    return new Response("Expected WebSocket", { status: 400, headers: corsHeaders })
  }

  console.log('🔄 Upgrading to WebSocket connection...')

  const { socket: clientSocket, response } = Deno.upgradeWebSocket(req)

  // Variables for managing connections
  let openaiSocket: WebSocket | null = null
  let sessionCreated = false
  const authenticatedUserId = user.id  // Store for session logging

  console.log('📡 Setting up client WebSocket handlers...')

  clientSocket.onopen = () => {
    console.log('✅ Client WebSocket connected')
    
    // Connect to OpenAI Realtime API
    console.log('🔗 Connecting to OpenAI Realtime API...')
    openaiSocket = new WebSocket(OPENAI_REALTIME_URL, {
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "OpenAI-Beta": "realtime=v1"
      }
    })

    // OpenAI WebSocket handlers
    openaiSocket.onopen = () => {
      console.log('✅ Connected to OpenAI Realtime API')
      
      // Send initial session configuration after connection
      // We'll send session.update after receiving session.created
    }

    openaiSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 Received from OpenAI:', data.type)

        // Handle session.created event
        if (data.type === 'session.created' && !sessionCreated) {
          console.log('🎉 Session created, sending configuration...')
          sessionCreated = true
          
          // Configure session with optimal settings for business assistant
          const sessionConfig = {
            event_id: `config_${Date.now()}`,
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: `Tu es un assistant IA expert en e-commerce et business intelligence pour Drop Craft AI. 

CONTEXTE: Tu aides les utilisateurs à optimiser leur boutique en ligne, analyser leurs performances et prendre de meilleures décisions business.

CAPACITÉS PRINCIPALES:
- Analyse des données de vente et recommandations
- Optimisation SEO et pricing
- Stratégies marketing et automation
- Insights sur la concurrence et les tendances
- Support technique pour l'utilisation de la plateforme

STYLE DE COMMUNICATION:
- Professionnel mais accessible
- Orienté solutions et actionnable
- Utilise des exemples concrets
- Pose des questions pour clarifier les besoins

OUTILS DISPONIBLES:
- Analyse des performances produits
- Recommandations de prix
- Suggestions d'optimisation SEO
- Insights marketing

Réponds toujours en français et sois proactif dans tes suggestions.`,
              voice: "alloy",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              input_audio_transcription: {
                model: "whisper-1"
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              tools: [
                {
                  type: "function",
                  name: "analyze_business_performance",
                  description: "Analyser les performances business de l'utilisateur et donner des recommandations",
                  parameters: {
                    type: "object",
                    properties: {
                      metric_type: { 
                        type: "string",
                        enum: ["revenue", "conversion", "traffic", "products", "customers"],
                        description: "Type de métrique à analyser"
                      },
                      time_period: {
                        type: "string", 
                        enum: ["7d", "30d", "90d"],
                        description: "Période d'analyse"
                      }
                    },
                    required: ["metric_type", "time_period"]
                  }
                },
                {
                  type: "function", 
                  name: "get_seo_recommendations",
                  description: "Obtenir des recommandations SEO pour améliorer le référencement",
                  parameters: {
                    type: "object",
                    properties: {
                      product_name: { type: "string", description: "Nom du produit à optimiser" },
                      current_title: { type: "string", description: "Titre SEO actuel" },
                      target_keywords: { type: "string", description: "Mots-clés cibles" }
                    },
                    required: ["product_name"]
                  }
                },
                {
                  type: "function",
                  name: "suggest_pricing_optimization", 
                  description: "Suggérer une optimisation de prix basée sur l'IA",
                  parameters: {
                    type: "object",
                    properties: {
                      product_name: { type: "string", description: "Nom du produit" },
                      current_price: { type: "number", description: "Prix actuel" },
                      competitor_prices: { type: "string", description: "Prix des concurrents" }
                    },
                    required: ["product_name", "current_price"]
                  }
                },
                {
                  type: "function",
                  name: "create_marketing_campaign",
                  description: "Créer une campagne marketing automatisée",
                  parameters: {
                    type: "object", 
                    properties: {
                      campaign_type: { 
                        type: "string",
                        enum: ["email", "social", "retargeting"],
                        description: "Type de campagne"
                      },
                      target_audience: { type: "string", description: "Audience cible" },
                      budget: { type: "number", description: "Budget estimé" }
                    },
                    required: ["campaign_type", "target_audience"]
                  }
                }
              ],
              tool_choice: "auto",
              temperature: 0.8,
              max_response_output_tokens: "inf"
            }
          }

          console.log('📤 Sending session configuration to OpenAI...')
          openaiSocket?.send(JSON.stringify(sessionConfig))
        }

        // Handle function calls
        if (data.type === 'response.function_call_arguments.done') {
          console.log('🛠️ Function call completed:', data.name, data.arguments)
          
          // Execute the function and return result
          const functionResult = await handleFunctionCall(data.name, JSON.parse(data.arguments))
          
          const functionResponse = {
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: data.call_id,
              output: JSON.stringify(functionResult)
            }
          }
          
          console.log('📤 Sending function result to OpenAI...')
          openaiSocket?.send(JSON.stringify(functionResponse))
          openaiSocket?.send(JSON.stringify({ type: "response.create" }))
        }

        // Forward all messages to client
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(event.data)
        }

      } catch (error) {
        console.error('❌ Error processing OpenAI message:', error)
      }
    }

    openaiSocket.onerror = (error) => {
      console.error('❌ OpenAI WebSocket error:', error)
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({
          type: 'error',
          message: 'Connection to AI service failed'
        }))
      }
    }

    openaiSocket.onclose = (event) => {
      console.log('🔌 OpenAI WebSocket closed:', event.code, event.reason)
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.close()
      }
    }
  }

  clientSocket.onmessage = (event) => {
    console.log('📨 Received from client, forwarding to OpenAI...')
    if (openaiSocket && openaiSocket.readyState === WebSocket.OPEN) {
      openaiSocket.send(event.data)
    } else {
      console.error('❌ OpenAI socket not ready')
    }
  }

  clientSocket.onerror = (error) => {
    console.error('❌ Client WebSocket error:', error)
    openaiSocket?.close()
  }

  clientSocket.onclose = () => {
    console.log('🔌 Client WebSocket closed')
    openaiSocket?.close()
  }

  return response
})

/**
 * Handle function calls from OpenAI
 */
async function handleFunctionCall(functionName: string, args: any) {
  console.log('🛠️ Executing function:', functionName, args)
  
  try {
    switch (functionName) {
      case 'analyze_business_performance':
        return await analyzeBusinessPerformance(args.metric_type, args.time_period)
        
      case 'get_seo_recommendations':
        return await getSEORecommendations(args.product_name, args.current_title, args.target_keywords)
        
      case 'suggest_pricing_optimization':
        return await suggestPricingOptimization(args.product_name, args.current_price, args.competitor_prices)
        
      case 'create_marketing_campaign':
        return await createMarketingCampaign(args.campaign_type, args.target_audience, args.budget)
        
      default:
        return { error: 'Function not found', function: functionName }
    }
  } catch (error) {
    console.error('❌ Error in function call:', error)
    return { error: 'Function execution failed', details: error.message }
  }
}

/**
 * Business Intelligence Functions
 */
async function analyzeBusinessPerformance(metricType: string, timePeriod: string) {
  console.log('📊 Analyzing business performance:', metricType, timePeriod)
  
  // Mock data - en production, récupérer les vraies données de la DB
  const mockData = {
    revenue: {
      current: 45280,
      previous: 38200,
      growth: 18.5,
      trend: 'up',
      recommendations: [
        'Votre croissance de revenus est excellente (+18.5%)',
        'Concentrez-vous sur les produits haute marge pour optimiser la rentabilité',
        'Considérez une expansion vers de nouvelles catégories'
      ]
    },
    conversion: {
      current: 3.2,
      previous: 2.8,
      growth: 14.3,
      trend: 'up', 
      recommendations: [
        'Excellente amélioration du taux de conversion (+0.4%)',
        'Optimisez davantage les pages produits pour atteindre 4%',
        'Testez des variantes d\'appel à l\'action'
      ]
    },
    traffic: {
      current: 12450,
      previous: 9800,
      growth: 27.0,
      trend: 'up',
      recommendations: [
        'Très forte croissance du trafic (+27%)',
        'Diversifiez vos sources de trafic pour réduire les risques',
        'Investissez davantage dans les canaux performants'
      ]
    }
  }

  const data = mockData[metricType as keyof typeof mockData] || mockData.revenue
  
  return {
    success: true,
    metric_type: metricType,
    time_period: timePeriod,
    data: data,
    summary: `Analyse ${metricType} sur ${timePeriod}: Performance ${data.trend === 'up' ? 'positive' : 'négative'} avec une évolution de ${data.growth}%`,
    action_items: data.recommendations
  }
}

async function getSEORecommendations(productName: string, currentTitle?: string, targetKeywords?: string) {
  console.log('🔍 Getting SEO recommendations for:', productName)
  
  const recommendations = {
    title_suggestions: [
      `${productName} - Qualité Premium | Livraison Rapide`,
      `${productName} Pas Cher | Meilleur Prix Garanti`,
      `Acheter ${productName} | ${targetKeywords || 'Haute Qualité'} | Boutique en Ligne`
    ],
    meta_description: `Découvrez notre ${productName.toLowerCase()} de qualité premium. ${targetKeywords ? `Spécialisé en ${targetKeywords.toLowerCase()}.` : ''} Livraison rapide, satisfaction garantie. Commandez maintenant !`,
    keywords: [
      productName.toLowerCase(),
      `${productName.toLowerCase()} pas cher`,
      `acheter ${productName.toLowerCase()}`,
      `${productName.toLowerCase()} prix`,
      ...(targetKeywords ? targetKeywords.split(',').map(k => k.trim().toLowerCase()) : [])
    ],
    content_improvements: [
      'Ajouter une section FAQ pour améliorer le SEO longue traîne',
      'Intégrer des avis clients pour renforcer la confiance',
      'Optimiser les images avec des balises alt descriptives',
      'Créer du contenu éducatif autour du produit'
    ],
    score_improvement: '+25 points SEO estimés'
  }

  return {
    success: true,
    product: productName,
    current_title: currentTitle,
    recommendations: recommendations,
    priority_actions: [
      'Mettre à jour le titre avec des mots-clés stratégiques',
      'Rédiger une méta-description engageante sous 160 caractères',
      'Optimiser le contenu avec les mots-clés longue traîne'
    ]
  }
}

async function suggestPricingOptimization(productName: string, currentPrice: number, competitorPrices?: string) {
  console.log('💰 Suggesting pricing optimization for:', productName, currentPrice)
  
  // Simulation d'analyse de pricing intelligent
  const marketAnalysis = {
    suggested_price: Math.round(currentPrice * 1.12 * 100) / 100, // +12%
    price_range: {
      min: Math.round(currentPrice * 0.95 * 100) / 100,
      max: Math.round(currentPrice * 1.25 * 100) / 100
    },
    confidence: 87,
    reasoning: [
      'Analyse concurrentielle favorable à une augmentation',
      'Élasticité-prix optimale dans cette gamme',
      'Positionnement premium justifié par la qualité'
    ],
    expected_impact: {
      revenue_increase: '+8.5%',
      conversion_impact: '-2.1%',
      net_benefit: '+6.4%'
    },
    test_strategy: 'A/B test sur 2 semaines avec 30% du trafic'
  }

  return {
    success: true,
    product: productName,
    current_price: currentPrice,
    analysis: marketAnalysis,
    recommendation: `Augmenter le prix de ${currentPrice}€ à ${marketAnalysis.suggested_price}€ pour optimiser les revenus`,
    next_steps: [
      'Lancer un test A/B sur le nouveau prix',
      'Surveiller les métriques de conversion',
      'Ajuster selon les résultats après 2 semaines'
    ]
  }
}

async function createMarketingCampaign(campaignType: string, targetAudience: string, budget?: number) {
  console.log('📧 Creating marketing campaign:', campaignType, targetAudience)
  
  const campaigns = {
    email: {
      name: `Campagne Email - ${targetAudience}`,
      strategy: 'Séquence de nurturing en 5 emails sur 2 semaines',
      content: [
        'Email 1: Bienvenue et présentation valeur',
        'Email 2: Cas d\'usage et témoignages clients',
        'Email 3: Offre spéciale limitée (-15%)',
        'Email 4: Rappel urgence + bénéfices',
        'Email 5: Dernière chance + bonus'
      ],
      expected_results: {
        open_rate: '24%',
        click_rate: '8.5%', 
        conversion_rate: '2.8%',
        roi: '340%'
      }
    },
    social: {
      name: `Campagne Social Media - ${targetAudience}`,
      strategy: 'Contenu engageant sur Facebook et Instagram',
      content: [
        'Posts éducatifs (40%): Tips et conseils',
        'Contenu produit (30%): Mises en avant',
        'Social proof (20%): Avis et témoignages',
        'Promotionnel (10%): Offres spéciales'
      ],
      expected_results: {
        reach: '25,000 personnes',
        engagement_rate: '4.2%',
        traffic_increase: '+35%',
        conversion_rate: '1.9%'
      }
    },
    retargeting: {
      name: `Campagne Retargeting - ${targetAudience}`,
      strategy: 'Recibler les visiteurs sans achat avec offres personnalisées',
      content: [
        'Annonces produits consultés',
        'Offres panier abandonné', 
        'Cross-sell produits complémentaires',
        'Témoignages et social proof'
      ],
      expected_results: {
        ctr: '2.8%',
        conversion_rate: '12.5%',
        roas: '450%',
        recovery_rate: '35%'
      }
    }
  }

  const campaign = campaigns[campaignType as keyof typeof campaigns] || campaigns.email

  return {
    success: true,
    campaign_type: campaignType,
    target_audience: targetAudience,
    budget: budget,
    campaign_details: campaign,
    implementation_steps: [
      'Créer les segments d\'audience',
      'Préparer les créatifs et contenus',
      'Configurer le tracking et KPIs',
      'Lancer la campagne en mode test',
      'Optimiser selon les premiers résultats'
    ],
    timeline: '2-3 jours de préparation, lancement immédiat possible'
  }
}