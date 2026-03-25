import { createClient } from 'npm:@supabase/supabase-js@2
import { corsHeaders } from '../_shared/cors.ts'
import { callOpenAI } from '../_shared/ai-client.ts'
import { checkAndIncrementQuota, quotaExceededResponse } from '../_shared/ai-quota.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { campaignId, name, adType, headline, description, callToAction, aiPrompt } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    // Quota check
    const quota = await checkAndIncrementQuota(user.id, 'marketing')
    if (!quota.allowed) return quotaExceededResponse(corsHeaders, quota)

    console.log('Generating creative with AI...')

    let imageUrl = ''

    // Generate image description if prompt is provided
    if (aiPrompt && adType === 'image') {
      try {
        const imageResult = await callOpenAI(
          [{ role: 'user', content: `Create a professional advertising image description: ${aiPrompt}. High quality, suitable for ${adType} format, eye-catching and engaging.` }],
          { module: 'marketing', enableCache: true }
        )
        imageUrl = imageResult.choices?.[0]?.message?.content || ''
      } catch (e) {
        console.warn('Image generation failed, continuing without image:', e)
      }
    }

    // Calculate performance score with AI
    const scoreResult = await callOpenAI(
      [
        { role: 'system', content: 'You are an advertising expert. Return only a number between 0-100.' },
        { role: 'user', content: `Analyze this ad creative and rate it 0-100:\nHeadline: ${headline}\nDescription: ${description}\nCTA: ${callToAction}\nType: ${adType}\n\nConsider: clarity, engagement, call-to-action strength, visual appeal.\nReturn only a number between 0-100.` }
      ],
      { module: 'marketing', temperature: 0.3, maxTokens: 10, enableCache: true }
    )

    let performanceScore = 85
    const scoreText = scoreResult.choices?.[0]?.message?.content || ''
    const scoreMatch = scoreText.match(/\d+/)
    if (scoreMatch) performanceScore = parseInt(scoreMatch[0])

    // Save creative to database
    const { data: creative, error: creativeError } = await supabase
      .from('ad_creatives')
      .insert({
        user_id: user.id,
        campaign_id: campaignId,
        name,
        ad_type: adType,
        headline,
        description,
        call_to_action: callToAction,
        image_url: imageUrl,
        is_ai_generated: true,
        ai_prompt: aiPrompt,
        performance_score: performanceScore
      })
      .select()
      .single()

    if (creativeError) throw creativeError

    return new Response(
      JSON.stringify({ success: true, creative, imageUrl, performanceScore }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ads-creative-generator:', error)
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
