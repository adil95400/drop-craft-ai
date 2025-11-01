import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { url, userId } = await req.json()

    if (!url || !userId) {
      return new Response(
        JSON.stringify({ error: 'URL and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Analyzing supplier:', url)

    // Fetch the supplier website
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch supplier page: ${pageResponse.status}`)
    }

    const html = await pageResponse.text()

    // Use AI to analyze the supplier
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a supplier analysis expert. Analyze the HTML content and extract supplier information.
Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "name": "supplier name",
  "country": "country code or name",
  "website": "website url",
  "description": "brief description",
  "product_categories": ["category1", "category2"],
  "estimated_products": number,
  "contact_email": "email if found or null",
  "contact_phone": "phone if found or null",
  "reliability_score": number between 0-5,
  "has_api": boolean,
  "shipping_countries": ["country1", "country2"]
}`
          },
          {
            role: 'user',
            content: `Analyze this supplier website and extract information:\n\nURL: ${url}\n\nHTML excerpt (first 5000 chars):\n${html.substring(0, 5000)}`
          }
        ],
        temperature: 0.3,
      })
    })

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw new Error(`AI analysis failed: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices[0].message.content
    
    // Parse the JSON from AI response
    let supplierData
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      supplierData = JSON.parse(cleanContent)
    } catch (e) {
      console.error('Failed to parse AI response:', content)
      throw new Error('Failed to parse supplier data from AI response')
    }

    // Insert supplier into database
    const { data: supplier, error: dbError } = await supabaseClient
      .from('suppliers')
      .insert({
        user_id: userId,
        name: supplierData.name,
        website: supplierData.website || url,
        country: supplierData.country,
        description: supplierData.description,
        status: 'active',
        rating: supplierData.reliability_score || 0,
        api_endpoint: supplierData.has_api ? url : null,
        contact_email: supplierData.contact_email,
        contact_phone: supplierData.contact_phone,
        product_count: supplierData.estimated_products || 0,
        tags: supplierData.product_categories || [],
        supplier_type: supplierData.has_api ? 'api' : 'manual',
        sector: supplierData.product_categories?.[0] || 'General'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'supplier_analyzed',
        entity_type: 'supplier',
        entity_id: supplier.id,
        description: `Analyzed supplier: ${supplierData.name}`,
        metadata: {
          url,
          categories: supplierData.product_categories,
          reliability_score: supplierData.reliability_score
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        supplier,
        analysis: {
          name: supplierData.name,
          categories: supplierData.product_categories,
          estimated_products: supplierData.estimated_products,
          reliability_score: supplierData.reliability_score,
          has_api: supplierData.has_api
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Supplier analysis error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze supplier',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
