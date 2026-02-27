import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    const { message, history = [] } = await req.json()

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-8),
      { role: 'user', content: message }
    ]

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
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
        return new Response(JSON.stringify({ response: 'Crédits IA épuisés. Veuillez recharger.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Fallback to simple responses
      const fallbackResponses: Record<string, string> = {
        'import': 'Pour importer des produits, allez dans Catalogue > Importer. Vous pouvez coller des URLs AliExpress ou uploader un CSV.',
        'seo': 'Pour optimiser le SEO, rendez-vous dans Performance > SEO. L\'IA analysera et optimisera vos métadonnées automatiquement.',
        'commande': 'Gérez vos commandes dans Ventes > Commandes. Le fulfillment automatique est configurable dans Ventes > Auto-Fulfillment.',
        'prix': 'Configurez vos règles de repricing dans Catalogue > Repricing. L\'IA ajuste les prix automatiquement.',
      }

      const key = Object.keys(fallbackResponses).find(k => message.toLowerCase().includes(k))
      const fallback = key ? fallbackResponses[key] : 'Je suis là pour vous aider ! Précisez votre question et je ferai de mon mieux. Pour un support détaillé, créez un ticket dans le Centre d\'aide.'

      return new Response(JSON.stringify({ response: fallback }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || 'Je suis disponible pour vous aider !'

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      response: 'Je suis là pour vous aider ! Posez-moi une question sur l\'importation, le SEO, les commandes ou toute autre fonctionnalité.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
