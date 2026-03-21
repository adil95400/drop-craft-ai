/**
 * Temporary: ensure product_media has all Cloudinary columns
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

  const columns = [
    { name: 'cloudinary_public_id', type: 'text' },
    { name: 'cloudinary_url', type: 'text' },
    { name: 'cdn_url', type: 'text' },
    { name: 'thumbnail_url', type: 'text' },
    { name: 'srcset', type: 'text' },
    { name: 'transforms', type: 'jsonb', default: "'{}'::jsonb" },
    { name: 'optimized_size', type: 'bigint' },
    { name: 'optimization_score', type: 'int', default: '0' },
    { name: 'original_size', type: 'bigint' },
    { name: 'original_width', type: 'int' },
    { name: 'original_height', type: 'int' },
    { name: 'format', type: 'text' },
    { name: 'original_filename', type: 'text' },
    { name: 'mime_type', type: 'text' },
    { name: 'is_primary', type: 'boolean', default: 'false' },
    { name: 'alt_text', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'tags', type: 'text[]', default: "'{}'::text[]" },
    { name: 'error_message', type: 'text' },
    { name: 'retry_count', type: 'int', default: '0' },
    { name: 'processed_at', type: 'timestamptz' },
    { name: 'position', type: 'int', default: '1' },
    { name: 'status', type: 'text', default: "'pending'" },
  ]

  const results: string[] = []

  for (const col of columns) {
    try {
      const defaultClause = col.default ? ` DEFAULT ${col.default}` : ''
      const { error } = await supabase.rpc('exec_sql' as any, { 
        sql: `ALTER TABLE public.product_media ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}${defaultClause};`
      })
      
      if (error) {
        // Try alternative approach - just test if column exists by selecting
        const { error: testErr } = await supabase
          .from('product_media')
          .select(col.name)
          .limit(0)
        
        if (testErr && testErr.message.includes('does not exist')) {
          results.push(`MISSING: ${col.name} - needs manual migration`)
        } else {
          results.push(`OK: ${col.name}`)
        }
      } else {
        results.push(`ADDED: ${col.name}`)
      }
    } catch (e) {
      results.push(`ERROR: ${col.name} - ${(e as Error).message}`)
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
