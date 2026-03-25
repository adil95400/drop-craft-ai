import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { callOpenAI } from '../_shared/ai-client.ts'
import { checkAndIncrementQuota, quotaExceededResponse } from '../_shared/ai-quota.ts'

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  if (req.method === 'OPTIONS') return handleCorsPreflightSecure(req)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = claimsData.claims.sub as string

    // Quota check
    const quota = await checkAndIncrementQuota(userId, 'automation')
    if (!quota.allowed) return quotaExceededResponse(corsHeaders, quota)

    const { reviews, productId, analysisType = 'detailed' } = await req.json()
    const reviewTexts = reviews.map((r: any) => `Rating: ${r.rating}/5\nReview: ${r.text}`).join('\n\n---\n\n')

    const prompt = `Analyze customer reviews and provide actionable insights:\n\n${reviewTexts}\n\nProvide comprehensive analysis:\n1. Overall sentiment with percentage\n2. Key themes\n3. Top 5 positive aspects\n4. Top 5 concerns\n5. Product improvement suggestions\n6. Customer satisfaction score (0-100)\n7. Emotional tone analysis\n8. Urgency level\n9. Competitor mentions\n10. Response strategy\n\nReturn as JSON:\n{"overallSentiment":{"label":"string","score":0,"distribution":{"positive":0,"neutral":0,"negative":0}},"themes":[{"theme":"string","count":0,"sentiment":"string"}],"positiveAspects":[{"aspect":"string","mentions":0}],"concerns":[{"issue":"string","severity":"low|medium|high","mentions":0}],"improvements":[{"suggestion":"string","priority":"low|medium|high","expectedImpact":"string"}],"satisfactionScore":0,"emotionalTone":{"primary":"string","secondary":"string"},"urgency":"low|medium|high","competitorMentions":[{"competitor":"string","context":"string"}],"responseStrategy":"string","summary":"string"}`

    const result = await callOpenAI(
      [
        { role: 'system', content: 'You are an expert in sentiment analysis and customer feedback interpretation for e-commerce. Provide data-driven, actionable insights.' },
        { role: 'user', content: prompt }
      ],
      { module: 'automation', temperature: 0.2, enableCache: true }
    )

    const content = result.choices?.[0]?.message?.content || '{}'
    let parsedContent
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
    } catch {
      throw new Error('Failed to parse sentiment analysis')
    }

    return new Response(JSON.stringify({
      success: true, productId, userId, reviewCount: reviews.length,
      analysis: parsedContent, analyzedAt: new Date().toISOString()
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
