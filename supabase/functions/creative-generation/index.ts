import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { prompt, type, brand_colors } = await req.json()

    // Log the creative generation request
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Simulate AI creative generation
    const creativeResults = {
      asset_url: `https://api.placeholder.com/600x400/${brand_colors?.[0]?.replace('#', '') || '3B82F6'}/FFFFFF?text=${encodeURIComponent(type + ' Creative')}`,
      thumbnail_url: `https://api.placeholder.com/300x200/${brand_colors?.[0]?.replace('#', '') || '3B82F6'}/FFFFFF?text=${encodeURIComponent(type)}`,
      dimensions: getDimensionsForType(type),
      estimated_cost: 0.50,
      generation_time_ms: Math.floor(Math.random() * 3000) + 2000
    }

    // Store the generated creative in activity_logs
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'creative_generated',
        entity_type: 'creative_asset',
        entity_id: crypto.randomUUID(),
        description: `AI generated ${type} creative`,
        metadata: {
          prompt,
          type,
          brand_colors,
          ...creativeResults
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Creative generated successfully',
        ...creativeResults
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