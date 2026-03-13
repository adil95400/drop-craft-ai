/**
 * Auto-Refund Engine — Rules-based automated refund processing
 * Evaluates refund requests against configurable rules and auto-approves eligible ones
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RefundRule {
  max_amount: number;
  auto_approve_categories: string[];
  max_days_since_order: number;
  require_return: boolean;
  max_daily_auto_approvals: number;
}

const DEFAULT_RULES: RefundRule = {
  max_amount: 50,
  auto_approve_categories: ['defective', 'wrong_item', 'damaged', 'not_as_described'],
  max_days_since_order: 30,
  require_return: false,
  max_daily_auto_approvals: 20,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { action, refund_id, custom_rules } = await req.json();
    const rules: RefundRule = { ...DEFAULT_RULES, ...custom_rules };

    if (action === 'evaluate') {
      // Fetch pending refund requests
      const { data: pendingRefunds, error: fetchError } = await supabase
        .from('refund_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Count today's auto-approvals
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('refund_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('auto_approved', true)
        .gte('updated_at', today);

      let autoApproved = 0;
      let manualReview = 0;
      let rejected = 0;
      const results: any[] = [];

      for (const refund of (pendingRefunds || [])) {
        if ((todayCount || 0) + autoApproved >= rules.max_daily_auto_approvals) {
          results.push({ id: refund.id, decision: 'manual', reason: 'Limite quotidienne atteinte' });
          manualReview++;
          continue;
        }

        const eligible = refund.amount <= rules.max_amount &&
          rules.auto_approve_categories.includes(refund.reason_category);

        if (eligible) {
          await supabase
            .from('refund_requests')
            .update({ status: 'approved', auto_approved: true, notes: 'Auto-approuvé par le moteur de règles' })
            .eq('id', refund.id);
          autoApproved++;
          results.push({ id: refund.id, decision: 'auto_approved', amount: refund.amount });
        } else {
          const reasons: string[] = [];
          if (refund.amount > rules.max_amount) reasons.push(`Montant > ${rules.max_amount}€`);
          if (!rules.auto_approve_categories.includes(refund.reason_category)) reasons.push('Catégorie non éligible');
          results.push({ id: refund.id, decision: 'manual', reason: reasons.join(', ') });
          manualReview++;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        summary: { total: (pendingRefunds || []).length, auto_approved: autoApproved, manual_review: manualReview, rejected },
        results,
        rules_applied: rules,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === 'process_single' && refund_id) {
      const { data: refund, error } = await supabase
        .from('refund_requests')
        .select('*')
        .eq('id', refund_id)
        .eq('user_id', user.id)
        .single();

      if (error || !refund) throw new Error('Refund not found');

      const eligible = refund.amount <= rules.max_amount &&
        rules.auto_approve_categories.includes(refund.reason_category);

      if (eligible) {
        await supabase
          .from('refund_requests')
          .update({ status: 'approved', auto_approved: true, notes: 'Auto-approuvé' })
          .eq('id', refund_id);
      }

      return new Response(JSON.stringify({
        success: true,
        decision: eligible ? 'auto_approved' : 'requires_manual_review',
        refund_id,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      success: true,
      rules: DEFAULT_RULES,
      message: 'Use action: "evaluate" to process pending refunds',
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("auto-refund-engine error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
