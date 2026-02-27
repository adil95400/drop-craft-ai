/**
 * Marketing AI Generator - Secure Implementation
 * P1.1: Uses Lovable AI, auth obligatoire, rate limiting
 */
import { createEdgeFunction, z } from '../_shared/create-edge-function.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const marketingSchema = z.object({
  campaign_type: z.string().min(1).max(100),
  target_audience: z.string().min(1).max(500),
  campaign_name: z.string().min(1).max(200)
})

type MarketingInput = z.infer<typeof marketingSchema>

const handler = createEdgeFunction<MarketingInput>({
  requireAuth: true,
  inputSchema: marketingSchema,
  rateLimit: { maxRequests: 20, windowMinutes: 60, action: 'marketing_ai_generation' }
}, async (ctx) => {
  const { user, input, correlationId } = ctx
  const { campaign_type, target_audience, campaign_name } = input
  
  console.log(`[${correlationId}] Marketing AI request from user: ${user.id}`)

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured')
  }

  const systemPrompt = `Tu es un expert en marketing digital et copywriting. 
Tu dois générer du contenu d'email marketing persuasif et engageant.
Utilise des techniques de copywriting éprouvées (AIDA, PAS, storytelling).
Le contenu doit être professionnel mais accessible, avec un ton amical.`

  const userPrompt = `Génère un email marketing pour:
- Nom de campagne: ${campaign_name}
- Type: ${campaign_type}
- Audience cible: ${target_audience}

Format de réponse (JSON uniquement):
{
  "subject": "Sujet accrocheur de 40-60 caractères",
  "content": "Contenu complet de l'email en HTML avec structure marketing persuasive"
}`

  console.log('Calling Lovable AI for marketing content generation...')
  
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
      max_tokens: 2000,
      temperature: 0.8,
    }),
  })

  if (!aiResponse.ok) {
    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit atteint' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const errorText = await aiResponse.text()
    console.error('Lovable AI error:', aiResponse.status, errorText)
    throw new Error(`AI generation failed: ${aiResponse.status}`)
  }

  const aiData = await aiResponse.json()
  const generatedText = aiData.choices[0].message.content
  
  console.log('AI Response received:', generatedText.substring(0, 200))

  // Parse JSON response
  let parsedContent
  try {
    const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                     generatedText.match(/```\n([\s\S]*?)\n```/)
    const jsonStr = jsonMatch ? jsonMatch[1] : generatedText
    parsedContent = JSON.parse(jsonStr)
  } catch (parseError) {
    console.error('JSON parse error:', parseError)
    parsedContent = {
      subject: campaign_name,
      content: generatedText
    }
  }

  // Log the generation - SCOPED to user
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  await supabase.from('activity_logs').insert({
    user_id: user.id, // CRITICAL: from token only
    action: 'ai_content_generation',
    description: `Contenu marketing généré par IA pour ${campaign_name}`,
    metadata: {
      campaign_type,
      target_audience,
      generated_at: new Date().toISOString()
    }
  })

  return new Response(
    JSON.stringify(parsedContent),
    { 
      headers: { 'Content-Type': 'application/json' },
      status: 200 
    }
  )
})

Deno.serve(handler)
