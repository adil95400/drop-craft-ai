import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[process-scheduled] Checking for due publications...')

    // Fetch scheduled publications that are due
    const { data: duePublications, error } = await supabase
      .from('scheduled_publications')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50)

    if (error) throw error
    if (!duePublications?.length) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No publications due' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[process-scheduled] Found ${duePublications.length} due publications`)

    let processed = 0
    let succeeded = 0
    let failed = 0

    // Group by user_id and product_id for batch processing
    const grouped = new Map<string, typeof duePublications>()
    for (const pub of duePublications) {
      const key = `${pub.user_id}:${pub.product_id}`
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(pub)
    }

    for (const [key, pubs] of grouped) {
      const [userId, productId] = key.split(':')
      
      // Mark as publishing
      const pubIds = pubs.map(p => p.id)
      await supabase
        .from('scheduled_publications')
        .update({ status: 'publishing', updated_at: new Date().toISOString() })
        .in('id', pubIds)

      // Separate marketplace vs social channels
      const marketplaceChannels = pubs.filter(p => p.channel_type === 'marketplace')
      const socialChannels = pubs.filter(p => p.channel_type === 'social')

      // Get a valid auth token for the user (use service role)
      // Process marketplace publications
      if (marketplaceChannels.length > 0) {
        try {
          const storeIds = marketplaceChannels.map(p => p.channel_id)
          const { data, error: mktError } = await supabase.functions.invoke('marketplace-publish', {
            body: { productId, storeIds, publishOptions: marketplaceChannels[0].publish_options || {} },
          })

          for (const pub of marketplaceChannels) {
            const result = data?.results?.find((r: any) => r.storeId === pub.channel_id || r.platform === pub.channel_id)
            await supabase
              .from('scheduled_publications')
              .update({
                status: result?.success ? 'published' : 'failed',
                published_at: result?.success ? new Date().toISOString() : null,
                error_message: result?.success ? null : (result?.message || mktError?.message || 'Unknown error'),
                updated_at: new Date().toISOString(),
              })
              .eq('id', pub.id)

            if (result?.success) succeeded++
            else failed++
            processed++
          }
        } catch (e) {
          await supabase
            .from('scheduled_publications')
            .update({ status: 'failed', error_message: e.message, updated_at: new Date().toISOString() })
            .in('id', marketplaceChannels.map(p => p.id))
          failed += marketplaceChannels.length
          processed += marketplaceChannels.length
        }
      }

      // Process social publications
      if (socialChannels.length > 0) {
        try {
          const channels = socialChannels.map(p => p.channel_id)
          const { data, error: socError } = await supabase.functions.invoke('social-media-publish', {
            body: { 
              productId, 
              channels, 
              customMessage: socialChannels[0].custom_message 
            },
          })

          for (const pub of socialChannels) {
            const result = data?.results?.find((r: any) => r.channel === pub.channel_id)
            await supabase
              .from('scheduled_publications')
              .update({
                status: result?.success ? 'published' : 'failed',
                published_at: result?.success ? new Date().toISOString() : null,
                error_message: result?.success ? null : (result?.error || socError?.message || 'Unknown error'),
                updated_at: new Date().toISOString(),
              })
              .eq('id', pub.id)

            if (result?.success) succeeded++
            else failed++
            processed++
          }
        } catch (e) {
          await supabase
            .from('scheduled_publications')
            .update({ status: 'failed', error_message: e.message, updated_at: new Date().toISOString() })
            .in('id', socialChannels.map(p => p.id))
          failed += socialChannels.length
          processed += socialChannels.length
        }
      }
    }

    // Retry failed publications (up to max_retries)
    const { data: failedPubs } = await supabase
      .from('scheduled_publications')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', 3)
    
    if (failedPubs?.length) {
      await supabase
        .from('scheduled_publications')
        .update({ 
          status: 'scheduled', 
          retry_count: failedPubs[0].retry_count + 1,
          scheduled_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Retry in 15 min
          updated_at: new Date().toISOString() 
        })
        .in('id', failedPubs.map(p => p.id))
    }

    return new Response(
      JSON.stringify({ processed, succeeded, failed, retriesScheduled: failedPubs?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[process-scheduled] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
