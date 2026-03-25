import { createClient } from 'npm:@supabase/supabase-js@2

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OpenAIMessage {
  type: string
  [key: string]: any
}

Deno.serve(async (req) => {
  const { headers } = req
  const upgradeHeader = headers.get("upgrade") || ""

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    })
  }

  console.log('🚀 WebSocket upgrade requested for AI Realtime Chat')

  const { socket, response } = Deno.upgradeWebSocket(req)
  
  // Get environment variables
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment')
    return new Response("OpenAI API key not configured", { 
      status: 500,
      headers: corsHeaders 
    })
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  let supabase: any = null
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  }

  let openAISocket: WebSocket | null = null
  let sessionCreated = false
  let isConnected = false
  let sessionId: string | null = null

  console.log('🔗 Setting up WebSocket handlers')

  socket.onopen = () => {
    console.log('✅ Client WebSocket connected')
    isConnected = true
    
    // Connect to OpenAI Realtime API
    try {
      console.log('🤖 Connecting to OpenAI Realtime API...')
      openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", 
        ["realtime", `openai-insecure-api-key.${OPENAI_API_KEY}`]
      )

      openAISocket.onopen = () => {
        console.log('✅ OpenAI WebSocket connected')
        socket.send(JSON.stringify({
          type: 'connection_status',
          status: 'connected_to_openai'
        }))
      }

      openAISocket.onmessage = async (event) => {
        try {
          const data: OpenAIMessage = JSON.parse(event.data)
          console.log('📨 OpenAI message type:', data.type)

          // Handle session created event
          if (data.type === 'session.created') {
            console.log('🎉 Session created, sending session update...')
            sessionCreated = true
            sessionId = data.session?.id || null
            
            // Send session configuration AFTER session.created
            const sessionUpdate = {
              type: "session.update",
              session: {
                modalities: ["text", "audio"],
                instructions: "Tu es un assistant IA intelligent pour Shopopti Pro, une plateforme e-commerce avancée. Tu aides les utilisateurs avec leurs questions sur l'import de produits, la gestion de catalogue, les commandes, le CRM, le marketing, le SEO, et toutes les fonctionnalités de la plateforme. Réponds en français de manière claire et professionnelle.",
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
                    name: "search_products",
                    description: "Rechercher des produits dans le catalogue Shopopti",
                    parameters: {
                      type: "object",
                      properties: {
                        query: { 
                          type: "string",
                          description: "Terme de recherche pour les produits"
                        },
                        category: {
                          type: "string", 
                          description: "Catégorie de produits (optionnel)"
                        }
                      },
                      required: ["query"]
                    }
                  },
                  {
                    type: "function",
                    name: "get_import_stats",
                    description: "Obtenir les statistiques d'import de l'utilisateur",
                    parameters: {
                      type: "object",
                      properties: {},
                      required: []
                    }
                  },
                  {
                    type: "function",
                    name: "get_platform_help",
                    description: "Obtenir de l'aide sur une fonctionnalité spécifique de Shopopti Pro",
                    parameters: {
                      type: "object",
                      properties: {
                        feature: {
                          type: "string",
                          description: "Fonctionnalité pour laquelle obtenir de l'aide (import, catalogue, commandes, crm, marketing, seo, etc.)"
                        }
                      },
                      required: ["feature"]
                    }
                  }
                ],
                tool_choice: "auto",
                temperature: 0.8,
                max_response_output_tokens: "inf"
              }
            }

            openAISocket!.send(JSON.stringify(sessionUpdate))
            console.log('📤 Session update sent')
          }

          // Handle function calls
          if (data.type === 'response.function_call_arguments.done') {
            console.log('🔧 Function call completed:', data.name)
            await handleFunctionCall(data, openAISocket!, supabase)
          }

          // Log important events for debugging
          if (data.type === 'response.audio.delta') {
            console.log('🎵 Audio delta received, length:', data.delta?.length || 0)
          }

          if (data.type === 'response.audio_transcript.delta') {
            console.log('📝 Transcript delta:', data.delta)
          }

          if (data.type === 'error') {
            console.error('❌ OpenAI error:', data)
          }

          // Forward message to client
          socket.send(event.data)

          // Store message in database
          if (supabase && sessionId && (data.type === 'response.audio_transcript.done' || data.type === 'conversation.item.created')) {
            await storeMessage(supabase, sessionId, data)
          }

        } catch (error) {
          console.error('❌ Error processing OpenAI message:', error)
        }
      }

      openAISocket.onerror = (error) => {
        console.error('❌ OpenAI WebSocket error:', error)
        socket.send(JSON.stringify({
          type: 'error',
          message: 'OpenAI connection error'
        }))
      }

      openAISocket.onclose = (event) => {
        console.log('🔌 OpenAI WebSocket closed:', event.code, event.reason)
        socket.send(JSON.stringify({
          type: 'connection_status',
          status: 'disconnected_from_openai'
        }))
      }

    } catch (error) {
      console.error('❌ Error connecting to OpenAI:', error)
    }
  }

  socket.onmessage = (event) => {
    if (!openAISocket || openAISocket.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ OpenAI socket not ready, message dropped')
      return
    }

    try {
      const message = JSON.parse(event.data)
      console.log('📨 Client message type:', message.type)

      // Only forward valid messages after session is created
      if (sessionCreated) {
        openAISocket.send(event.data)
        console.log('📤 Message forwarded to OpenAI')
      } else {
        console.log('⏳ Session not ready, message queued')
      }
    } catch (error) {
      console.error('❌ Error processing client message:', error)
    }
  }

  socket.onclose = () => {
    console.log('🔌 Client WebSocket closed')
    isConnected = false
    if (openAISocket) {
      openAISocket.close()
    }
  }

  socket.onerror = (error) => {
    console.error('❌ Client WebSocket error:', error)
    if (openAISocket) {
      openAISocket.close()
    }
  }

  return response
})

// Function to handle OpenAI function calls
async function handleFunctionCall(data: any, openAISocket: WebSocket, supabase: any) {
  console.log('🔧 Handling function call:', data.name, 'with args:', data.arguments)

  let functionResult = { error: "Function not implemented" }

  try {
    const args = JSON.parse(data.arguments)

    switch (data.name) {
      case 'search_products':
        if (supabase) {
          const { data: products, error } = await supabase
            .from('catalog_products')
            .select('name, description, price, category')
            .ilike('name', `%${args.query}%`)
            .limit(5)
          
          if (error) {
            functionResult = { error: error.message }
          } else {
            functionResult = { 
              products: products || [],
              message: `Trouvé ${products?.length || 0} produits pour "${args.query}"`
            }
          }
        }
        break

      case 'get_import_stats':
        if (supabase) {
          const { data: stats, error } = await supabase
            .from('import_jobs')
            .select('status')
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          
          if (error) {
            functionResult = { error: error.message }
          } else {
            const completed = stats?.filter(s => s.status === 'completed').length || 0
            const total = stats?.length || 0
            functionResult = {
              total_imports: total,
              completed_imports: completed,
              success_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
              message: `${completed}/${total} imports réussis ce mois (${total > 0 ? Math.round((completed / total) * 100) : 0}%)`
            }
          }
        }
        break

      case 'get_platform_help':
        const helpContent = {
          import: "L'import de produits dans Shopopti Pro supporte plusieurs sources : CSV/Excel, URL de produits, AliExpress, BigBuy, Shopify, etc. Utilisez l'IA pour optimiser automatiquement les descriptions et le SEO.",

          catalogue: "Le catalogue vous permet de gérer tous vos produits avec des fonctionnalités avancées : filtres, recherche, optimisation SEO, gestion des stocks et analytics détaillés.",
          commandes: "Gérez vos commandes avec un workflow complet : traitement, facturation, suivi des expéditions et intégrations avec les transporteurs.",
          crm: "Le CRM intégré vous aide à gérer vos clients, prospects, pipeline de ventes, activités et communications.",
          marketing: "Créez des campagnes marketing, gérez vos contenus, optimisez votre SEO et analysez les performances avec les outils intégrés.",
          seo: "Optimisez automatiquement vos pages produits, générez des meta-descriptions avec l'IA et suivez vos performances SEO."
        }
        
        functionResult = {
          help_content: helpContent[args.feature as keyof typeof helpContent] || "Fonctionnalité non trouvée",
          message: `Aide pour la fonctionnalité : ${args.feature}`
        }
        break

      default:
        functionResult = { error: `Function ${data.name} not implemented` }
    }

  } catch (error) {
    console.error('❌ Error in function call:', error)
    functionResult = { error: error.message }
  }

  // Send function result back to OpenAI
  const resultMessage = {
    type: "conversation.item.create",
    item: {
      type: "function_call_output",
      call_id: data.call_id,
      output: JSON.stringify(functionResult)
    }
  }

  openAISocket.send(JSON.stringify(resultMessage))
  console.log('📤 Function result sent to OpenAI')
}

// Function to store messages in database
async function storeMessage(supabase: any, sessionId: string, data: any) {
  try {
    let messageData: any = {
      session_id: sessionId,
      message_type: 'text',
      metadata: data
    }

    if (data.type === 'response.audio_transcript.done') {
      messageData.role = 'assistant'
      messageData.transcript = data.transcript
      messageData.message_type = 'audio'
    } else if (data.type === 'conversation.item.created' && data.item?.role) {
      messageData.role = data.item.role
      messageData.content = data.item.content?.[0]?.text || data.item.content?.[0]?.transcript
    }

    const { error } = await supabase
      .from('realtime_chat_messages')
      .insert([messageData])

    if (error) {
      console.error('❌ Error storing message:', error)
    } else {
      console.log('✅ Message stored in database')
    }
  } catch (error) {
    console.error('❌ Error storing message:', error)
  }
}