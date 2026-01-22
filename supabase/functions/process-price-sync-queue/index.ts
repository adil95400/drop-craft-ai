import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les jobs en attente (max 50 à la fois)
    const { data: pendingJobs, error: fetchError } = await supabase
      .from('price_sync_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    if (!pendingJobs || pendingJobs.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending jobs',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${pendingJobs.length} pending price sync jobs`);

    const results: Array<{
      queue_id: string;
      status: 'completed' | 'failed' | 'retry';
      synced: number;
      total: number;
    }> = [];

    for (const job of pendingJobs) {
      // Marquer comme en cours
      await supabase
        .from('price_sync_queue')
        .update({ 
          status: 'processing', 
          processed_at: new Date().toISOString(),
          attempts: job.attempts + 1
        })
        .eq('id', job.id);

      try {
        // Appeler la fonction de synchronisation
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-prices-to-channels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            queue_id: job.id,
            product_id: job.product_id,
            new_price: job.new_price,
            user_id: job.user_id,
            channels: job.channels_to_sync
          })
        });

        const syncResult = await syncResponse.json();

        if (syncResponse.ok && syncResult.success) {
          // Marquer comme terminé
          await supabase
            .from('price_sync_queue')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString(),
              channels_synced: syncResult.results || []
            })
            .eq('id', job.id);

          results.push({
            queue_id: job.id,
            status: 'completed',
            synced: syncResult.synced || 0,
            total: syncResult.total || 0
          });
        } else {
          throw new Error(syncResult.error || 'Sync failed');
        }

      } catch (err) {
        console.error(`Error processing job ${job.id}:`, err);

        const shouldRetry = job.attempts + 1 < job.max_attempts;

        await supabase
          .from('price_sync_queue')
          .update({ 
            status: shouldRetry ? 'pending' : 'failed',
            error_message: err.message,
            completed_at: shouldRetry ? null : new Date().toISOString()
          })
          .eq('id', job.id);

        results.push({
          queue_id: job.id,
          status: shouldRetry ? 'retry' : 'failed',
          synced: 0,
          total: 0
        });
      }
    }

    const completed = results.filter(r => r.status === 'completed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const retrying = results.filter(r => r.status === 'retry').length;

    console.log(`Processed: ${completed} completed, ${failed} failed, ${retrying} retrying`);

    return new Response(JSON.stringify({
      success: true,
      processed: pendingJobs.length,
      completed,
      failed,
      retrying,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Queue processor error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
