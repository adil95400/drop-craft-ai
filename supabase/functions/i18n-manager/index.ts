import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranslationRequest {
  action: 'translate_products' | 'update_rates' | 'detect_geo' | 'bulk_translate'
  data: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const { action, data } = await req.json() as TranslationRequest

    switch (action) {
      case 'translate_products': {
        const { productIds, targetLocales, sourceLocale = 'fr' } = data
        
        console.log(`Translating ${productIds.length} products to ${targetLocales.length} locales`)

        // Get products to translate
        const { data: products, error: productsError } = await supabaseClient
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('user_id', user.id)

        if (productsError) throw productsError

        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY not configured')
        }

        const translations = []

        for (const product of products) {
          for (const targetLocale of targetLocales) {
            // Check if translation already exists
            const { data: existing } = await supabaseClient
              .from('product_translations')
              .select('id')
              .eq('product_id', product.id)
              .eq('locale', targetLocale)
              .single()

            if (existing) {
              console.log(`Translation already exists for product ${product.id} in ${targetLocale}`)
              continue
            }

            // Use Lovable AI for translation
            const prompt = `Translate this e-commerce product information from ${sourceLocale} to ${targetLocale}. Maintain professional tone and marketing appeal.

Product Name: ${product.name}
Description: ${product.description || ''}
Short Description: ${product.short_description || ''}

Return ONLY a JSON object with these exact keys:
{
  "name": "translated name",
  "description": "translated description",
  "short_description": "translated short description"
}`

            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'openai/gpt-5-nano',
                messages: [
                  { 
                    role: 'system', 
                    content: 'You are a professional translator specializing in e-commerce product descriptions. Always respond with valid JSON only.' 
                  },
                  { role: 'user', content: prompt }
                ],
                temperature: 0.3,
              })
            })

            if (!aiResponse.ok) {
              if (aiResponse.status === 429) {
                return new Response(
                  JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
                  { status: 429, headers: corsHeaders }
                )
              }
              if (aiResponse.status === 402) {
                return new Response(
                  JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
                  { status: 402, headers: corsHeaders }
                )
              }
              throw new Error(`AI translation failed: ${aiResponse.status}`)
            }

            const aiData = await aiResponse.json()
            const translatedText = aiData.choices[0].message.content
            
            // Parse JSON response
            let translatedContent
            try {
              translatedContent = JSON.parse(translatedText.replace(/```json\n?|\n?```/g, ''))
            } catch (e) {
              console.error('Failed to parse AI response:', translatedText)
              continue
            }

            // Save translation
            const { data: translation, error: translationError } = await supabaseClient
              .from('product_translations')
              .insert({
                user_id: user.id,
                product_id: product.id,
                locale: targetLocale,
                name: translatedContent.name,
                description: translatedContent.description,
                short_description: translatedContent.short_description,
                translation_status: 'ai_generated',
                translation_quality_score: 0.85,
                ai_translation_metadata: {
                  provider: 'lovable_ai',
                  model: 'openai/gpt-5-nano',
                  source_locale: sourceLocale,
                  timestamp: new Date().toISOString()
                }
              })
              .select()
              .single()

            if (translationError) {
              console.error('Error saving translation:', translationError)
              continue
            }

            translations.push(translation)
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            translations,
            message: `Successfully translated ${translations.length} products`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_rates': {
        const { baseCurrency = 'EUR' } = data

        // Fetch latest rates from ECB (free API)
        const ratesResponse = await fetch('https://api.exchangerate-api.com/v4/latest/' + baseCurrency)
        
        if (!ratesResponse.ok) {
          throw new Error('Failed to fetch currency rates')
        }

        const ratesData = await ratesResponse.json()
        const rates = ratesData.rates

        // Update rates in database
        const updates = []
        for (const [currency, rate] of Object.entries(rates)) {
          const { error } = await supabaseClient
            .from('currency_rates')
            .upsert({
              user_id: user.id,
              from_currency: baseCurrency,
              to_currency: currency,
              rate: rate as number,
              source: 'exchangerate-api',
              last_updated: new Date().toISOString()
            }, {
              onConflict: 'user_id,from_currency,to_currency'
            })

          if (!error) {
            updates.push({ from: baseCurrency, to: currency, rate })
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            rates: updates,
            message: `Updated ${updates.length} currency rates`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'detect_geo': {
        const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        
        // Use ipapi for geo detection (free tier)
        const geoResponse = await fetch(`https://ipapi.co/${clientIP}/json/`)
        
        if (!geoResponse.ok) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Failed to detect location',
              default: { country: 'FR', currency: 'EUR', locale: 'fr' }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const geoData = await geoResponse.json()

        // Match with user's geo targeting rules
        const { data: rules } = await supabaseClient
          .from('geo_targeting_rules')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('priority', { ascending: false })

        let matchedRule = null
        if (rules) {
          for (const rule of rules) {
            if (rule.countries.includes(geoData.country_code)) {
              matchedRule = rule
              break
            }
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            geo: {
              country: geoData.country_code,
              country_name: geoData.country_name,
              region: geoData.region,
              city: geoData.city,
              currency: matchedRule?.default_currency || geoData.currency || 'EUR',
              locale: matchedRule?.default_locale || 'fr',
              matched_rule: matchedRule
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'bulk_translate': {
        const { jobId } = data

        // Get job details
        const { data: job, error: jobError } = await supabaseClient
          .from('translation_jobs')
          .select('*')
          .eq('id', jobId)
          .eq('user_id', user.id)
          .single()

        if (jobError || !job) {
          throw new Error('Translation job not found')
        }

        // Update job status
        await supabaseClient
          .from('translation_jobs')
          .update({ 
            status: 'processing',
            started_at: new Date().toISOString()
          })
          .eq('id', jobId)

        // Process translations in batches
        const batchSize = 5
        const results = []

        for (let i = 0; i < job.entity_ids.length; i += batchSize) {
          const batch = job.entity_ids.slice(i, i + batchSize)
          
          // Recursively call translate_products for each batch
          const batchResponse = await fetch(req.url, {
            method: 'POST',
            headers: {
              ...req.headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'translate_products',
              data: {
                productIds: batch,
                targetLocales: job.target_locales,
                sourceLocale: job.source_locale
              }
            })
          })

          const batchResult = await batchResponse.json()
          results.push(batchResult)

          // Update progress
          await supabaseClient
            .from('translation_jobs')
            .update({ 
              progress: Math.round(((i + batch.length) / job.entity_ids.length) * 100),
              completed_items: i + batch.length
            })
            .eq('id', jobId)
        }

        // Mark job as completed
        await supabaseClient
          .from('translation_jobs')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            results: { batches: results }
          })
          .eq('id', jobId)

        return new Response(
          JSON.stringify({ 
            success: true,
            message: `Bulk translation job completed`,
            results
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: corsHeaders }
        )
    }

  } catch (error) {
    console.error('I18n Manager Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})