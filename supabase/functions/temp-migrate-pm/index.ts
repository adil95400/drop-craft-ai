/**
 * Temporary: Add missing Cloudinary columns to product_media
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  // Check current columns
  const { data: testRow, error } = await supabase
    .from('product_media')
    .select('*')
    .limit(0)

  // Try inserting a test row with all needed columns to see which fail
  const neededColumns = [
    'cloudinary_public_id', 'cloudinary_url', 'cdn_url', 'thumbnail_url',
    'srcset', 'transforms', 'optimized_size', 'optimization_score',
    'original_size', 'original_width', 'original_height', 'format',
    'is_primary', 'alt_text', 'title', 'tags', 'error_message',
    'retry_count', 'processed_at', 'position', 'original_filename',
    'mime_type', 'status'
  ]

  return new Response(JSON.stringify({ 
    message: 'Table exists', 
    error: error?.message,
    hint: 'Check columns via select *'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
