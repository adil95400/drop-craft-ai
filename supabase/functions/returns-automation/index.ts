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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    const { action, ...params } = await req.json();
    console.log('🔄 Returns automation action:', action);

    switch (action) {
      case 'process_return': {
        const { return_id } = params;
        
        // Get return details with automation rules
        const { data: returnData, error: returnError } = await supabaseClient
          .from('returns')
          .select('*, order:orders(*)')
          .eq('id', return_id)
          .single();

        if (returnError) throw returnError;

        // Find matching automation rule
        const { data: rules } = await supabaseClient
          .from('return_automation_rules')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('priority', { ascending: false });

        let matchedRule = null;
        for (const rule of rules || []) {
          const conditions = rule.trigger_conditions as any;
          if (conditions.reason?.includes(returnData.reason)) {
            matchedRule = rule;
            break;
          }
        }

        // Auto-approve if rule allows
        if (matchedRule?.auto_approve) {
          await supabaseClient
            .from('returns')
            .update({
              status: 'approved',
              approved_at: new Date().toISOString(),
              auto_processed: true,
              ai_decision_confidence: 0.95
            })
            .eq('id', return_id);

          // Auto-send confirmation
          if (matchedRule.auto_send_confirmation) {
            await supabaseClient
              .from('customer_confirmations')
              .insert({
                user_id: user.id,
                return_id,
                confirmation_type: 'return_approved',
                email_subject: 'Votre retour a été approuvé',
                email_body: `Votre demande de retour ${returnData.return_number} a été approuvée automatiquement.`,
                channels_used: ['email'],
                sent_at: new Date().toISOString()
              });
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            auto_approved: matchedRule?.auto_approve || false,
            message: 'Return processed'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'auto_refund': {
        const { return_id } = params;
        
        const { data: returnData } = await supabaseClient
          .from('returns')
          .select('*')
          .eq('id', return_id)
          .single();

        if (returnData?.refund_approved_amount) {
          await supabaseClient
            .from('returns')
            .update({
              status: 'refunded',
              refunded_at: new Date().toISOString()
            })
            .eq('id', return_id);

          // Send confirmation
          await supabaseClient
            .from('customer_confirmations')
            .insert({
              user_id: user.id,
              return_id,
              confirmation_type: 'refund_processed',
              email_subject: 'Votre remboursement a été traité',
              channels_used: ['email'],
              sent_at: new Date().toISOString()
            });
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Refund processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('❌ Returns automation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
