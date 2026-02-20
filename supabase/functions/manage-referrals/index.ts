/**
 * Manage Referrals - CRUD + apply referral code
 * Actions: generate_code, apply_code, get_stats, complete_referral
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/cors.ts';

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[MANAGE-REFERRALS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

serve(async (req) => {
  const preflight = handleCorsPreflightSecure(req);
  if (preflight) return preflight;

  const origin = req.headers.get('origin');
  const headers = { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' };

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });
    }
    const userId = userData.user.id;
    const body = await req.json();
    const { action } = body;

    logStep("Action", { action, userId });

    // --- Generate a referral code ---
    if (action === 'generate_code') {
      const code = body.custom_code?.toUpperCase() || generateCode();
      const { data, error } = await supabase.from('referral_codes').insert({
        user_id: userId,
        code,
        reward_type: body.reward_type || 'credits',
        reward_value: body.reward_value || 10,
        referee_reward_type: body.referee_reward_type || 'credits',
        referee_reward_value: body.referee_reward_value || 10,
        max_uses: body.max_uses || null,
      }).select().single();

      if (error) throw error;
      logStep("Code generated", { code });
      return new Response(JSON.stringify(data), { status: 200, headers });
    }

    // --- Apply a referral code (filleul) ---
    if (action === 'apply_code') {
      const { code } = body;
      if (!code) throw new Error("Code required");

      // Look up code
      const { data: codeData, error: codeErr } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (codeErr || !codeData) {
        return new Response(JSON.stringify({ error: "Code invalide ou expiré" }), { status: 400, headers });
      }

      // Can't refer yourself
      if (codeData.user_id === userId) {
        return new Response(JSON.stringify({ error: "Vous ne pouvez pas utiliser votre propre code" }), { status: 400, headers });
      }

      // Check max uses
      if (codeData.max_uses && codeData.current_uses >= codeData.max_uses) {
        return new Response(JSON.stringify({ error: "Ce code a atteint son nombre maximum d'utilisations" }), { status: 400, headers });
      }

      // Check expiry
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Ce code a expiré" }), { status: 400, headers });
      }

      // Check if already referred
      const { data: existing } = await supabase
        .from('referrals')
        .select('id')
        .eq('referee_id', userId)
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ error: "Vous avez déjà utilisé un code de parrainage" }), { status: 400, headers });
      }

      // Create referral
      const { data: referral, error: refErr } = await supabase.from('referrals').insert({
        referrer_id: codeData.user_id,
        referee_id: userId,
        referral_code_id: codeData.id,
        status: 'completed',
        referrer_reward_amount: codeData.reward_value,
        referee_reward_amount: codeData.referee_reward_value,
        referee_reward_given: true,
        completed_at: new Date().toISOString(),
      }).select().single();

      if (refErr) throw refErr;

      // Increment code usage
      await supabase.from('referral_codes')
        .update({ current_uses: codeData.current_uses + 1 })
        .eq('id', codeData.id);

      logStep("Referral applied", { referrer: codeData.user_id, referee: userId });
      return new Response(JSON.stringify({
        success: true,
        reward_type: codeData.referee_reward_type,
        reward_value: codeData.referee_reward_value,
        referral,
      }), { status: 200, headers });
    }

    // --- Get referral stats ---
    if (action === 'get_stats') {
      const { data: codes } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      const totalReferred = referrals?.length || 0;
      const totalRewards = referrals?.reduce((sum, r) => sum + (r.referrer_reward_amount || 0), 0) || 0;
      const pendingRewards = referrals?.filter(r => !r.referrer_reward_given).reduce((sum, r) => sum + (r.referrer_reward_amount || 0), 0) || 0;

      return new Response(JSON.stringify({
        codes: codes || [],
        referrals: referrals || [],
        stats: {
          total_referred: totalReferred,
          total_rewards: totalRewards,
          pending_rewards: pendingRewards,
        }
      }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
});
