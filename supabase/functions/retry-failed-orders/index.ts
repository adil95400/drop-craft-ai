import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FailedOrder {
  id: string;
  order_number: string;
  retry_count: number;
  last_error: string;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get failed orders with exponential backoff check
    const { data: failedOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', 5) // Max 5 retries
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch orders: ${fetchError.message}`);
    }

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const order of (failedOrders || [])) {
      const retryCount = order.retry_count || 0;
      
      // Exponential backoff: 2^retry_count minutes
      const backoffMinutes = Math.pow(2, retryCount);
      const lastAttempt = order.updated_at ? new Date(order.updated_at) : new Date(order.created_at);
      const nextRetryTime = new Date(lastAttempt.getTime() + backoffMinutes * 60 * 1000);
      
      if (new Date() < nextRetryTime) {
        results.skipped++;
        continue;
      }

      results.processed++;

      try {
        // Attempt to reprocess the order
        const { error: processError } = await supabase.functions.invoke('process-order', {
          body: { orderId: order.id, isRetry: true }
        });

        if (processError) {
          throw processError;
        }

        // Update order status on success
        await supabase
          .from('orders')
          .update({ 
            status: 'processing',
            retry_count: retryCount + 1,
            last_error: null
          })
          .eq('id', order.id);

        results.succeeded++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        // Update retry count and error
        await supabase
          .from('orders')
          .update({ 
            retry_count: retryCount + 1,
            last_error: errorMessage,
            status: retryCount >= 4 ? 'permanently_failed' : 'failed'
          })
          .eq('id', order.id);

        results.failed++;
        results.errors.push(`Order ${order.order_number}: ${errorMessage}`);
      }
    }

    // Log execution
    await supabase.from('api_logs').insert({
      endpoint: '/retry-failed-orders',
      method: 'CRON',
      status_code: 200,
      response_body: results,
    });

    return new Response(JSON.stringify({
      success: true,
      ...results,
      message: `Processed ${results.processed} orders: ${results.succeeded} succeeded, ${results.failed} failed, ${results.skipped} skipped`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Retry failed orders error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
