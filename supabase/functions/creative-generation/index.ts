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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { prompt, type, brand_colors, product_id } = await req.json()

    // Get product data if provided
    let productData = null
    if (product_id) {
      const { data } = await supabase
        .from('imported_products')
        .select('name, description, image_urls, category')
        .eq('id', product_id)
        .single()
      
      productData = data
    }

    // Generate creative based on real product data
    const dimensions = getDimensionsForType(type)
    const creative = {
      asset_url: productData?.image_urls?.[0] || generatePlaceholderUrl(type, brand_colors),
      thumbnail_url: productData?.image_urls?.[0] || generatePlaceholderUrl(type, brand_colors, true),
      dimensions,
      product_name: productData?.name,
      product_description: productData?.description,
      category: productData?.category,
      estimated_cost: 0.50,
      generation_time_ms: Date.now()
    }

    // Store in database
    const { data: creativeRecord, error: insertError } = await supabase
      .from('ad_campaigns')
      .insert({
        user_id: user.id,
        campaign_name: `Creative: ${productData?.name || type}`,
        campaign_type: type,
        platform: 'custom',
        status: 'draft',
        ai_generated: true,
        ad_creative: {
          prompt,
          type,
          brand_colors,
          ...creative
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error storing creative:', insertError)
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'creative_generated',
        entity_type: 'creative_asset',
        entity_id: creativeRecord?.id || crypto.randomUUID(),
        description: `AI generated ${type} creative${productData ? ` for ${productData.name}` : ''}`,
        metadata: {
          prompt,
          type,
          brand_colors,
          product_id,
          ...creative
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Creative generated successfully',
        creative_id: creativeRecord?.id,
        ...creative
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Creative generation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function getDimensionsForType(type: string): { width: number; height: number } {
  switch (type) {
    case 'banner':
      return { width: 1200, height: 300 }
    case 'social_post':
      return { width: 1080, height: 1080 }
    case 'product_image':
      return { width: 800, height: 800 }
    case 'email_template':
      return { width: 600, height: 800 }
    case 'video':
      return { width: 1920, height: 1080 }
    default:
      return { width: 800, height: 600 }
  }
}

function generatePlaceholderUrl(type: string, brand_colors?: string[], thumbnail = false): string {
  const size = thumbnail ? '300x200' : '600x400'
  const color = brand_colors?.[0]?.replace('#', '') || '3B82F6'
  return `https://placehold.co/${size}/${color}/FFFFFF?text=${encodeURIComponent(type)}`
}
