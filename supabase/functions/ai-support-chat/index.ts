import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'

import { callOpenAI } from '../_shared/ai-client.ts';

const SYSTEM_PROMPT = `Tu es l'assistant support de ShopOpti+, une plateforme SaaS de dropshipping intelligent.
Tu aides les utilisateurs avec :
- L'importation de produits (AliExpress, CJ, BigBuy, CSV, URL)
- L'optimisation IA (descriptions, SEO, pricing)
- La gestion des commandes et du fulfillment
- La configuration des boutiques et intégrations
- Les analytics et rapports
- Le marketing et CRM

Règles :
- Réponds toujours en français
- Sois concis et pratique (max 3 phrases)
- Propose des liens vers les pages pertinentes quand possible
- Si tu ne sais pas, suggère de créer un ticket de support
- Ne invente jamais de fonctionnalités qui n'existent pas`

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

  try {
    // JWT Authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // API key resolved by ai-client.ts (module: chat)
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const { message, history = [] } = await req.json()

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-8),
      { role: 'user', content: message }
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      })
    })

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ response: 'Limite de requêtes atteinte. Réessayez dans quelques instants.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ response: 'Service temporairement indisponible. Réessayez plus tard.' }), {
          status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      const errorText = await response.text()
      console.error('OpenAI error:', response.status, errorText)
      throw new Error(`AI service error: ${response.status}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.'

    return new Response(JSON.stringify({ response: reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('[ai-support-chat] Error:', error)
    return new Response(JSON.stringify({ 
      response: 'Une erreur est survenue. Essayez à nouveau ou contactez le support.',
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
