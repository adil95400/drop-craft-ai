/**
 * Check Renewal Alerts - Checks Stripe subscriptions and sends renewal notifications
 * Can be called by cron or manually by user
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/cors.ts';

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[RENEWAL-ALERTS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

const ALERT_THRESHOLDS = [
  { key: '30_days', days: 30, label: '30 jours' },
  { key: '7_days', days: 7, label: '7 jours' },
  { key: '3_days', days: 3, label: '3 jours' },
  { key: '1_day', days: 1, label: '1 jour' },
];

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
    const userEmail = userData.user.email;
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    logStep("Action", { action, userId });

    // --- Get alerts for current user ---
    if (action === 'get_alerts') {
      const { data: alerts } = await supabase
        .from('renewal_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({ alerts: alerts || [] }), { status: 200, headers });
    }

    // --- Mark alert as read ---
    if (action === 'mark_read') {
      const { alert_id } = body;
      await supabase.from('renewal_alerts').update({ is_read: true }).eq('id', alert_id).eq('user_id', userId);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // --- Get/Update preferences ---
    if (action === 'get_preferences') {
      let { data: prefs } = await supabase
        .from('renewal_alert_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!prefs) {
        const { data: newPrefs } = await supabase
          .from('renewal_alert_preferences')
          .insert({ user_id: userId })
          .select()
          .single();
        prefs = newPrefs;
      }

      return new Response(JSON.stringify(prefs), { status: 200, headers });
    }

    if (action === 'update_preferences') {
      const { alert_30_days, alert_7_days, alert_3_days, alert_1_day, channel } = body;
      const { data, error } = await supabase
        .from('renewal_alert_preferences')
        .upsert({
          user_id: userId,
          alert_30_days: alert_30_days ?? true,
          alert_7_days: alert_7_days ?? true,
          alert_3_days: alert_3_days ?? true,
          alert_1_day: alert_1_day ?? true,
          channel: channel ?? 'both',
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), { status: 200, headers });
    }

    // --- Check subscription & create alerts ---
    if (action === 'check_renewal') {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

      // Find customer
      if (!userEmail) throw new Error("No email");
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length === 0) {
        return new Response(JSON.stringify({ alerts_created: 0, message: "No Stripe customer" }), { status: 200, headers });
      }

      const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: 'active', limit: 5 });
      if (subs.data.length === 0) {
        return new Response(JSON.stringify({ alerts_created: 0, message: "No active subscription" }), { status: 200, headers });
      }

      // Get preferences
      let { data: prefs } = await supabase
        .from('renewal_alert_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!prefs) prefs = { alert_30_days: true, alert_7_days: true, alert_3_days: true, alert_1_day: true, channel: 'both' };

      const now = Date.now();
      let alertsCreated = 0;

      for (const sub of subs.data) {
        const endDate = new Date(sub.current_period_end * 1000);
        const daysUntilRenewal = Math.ceil((endDate.getTime() - now) / (1000 * 60 * 60 * 24));

        for (const threshold of ALERT_THRESHOLDS) {
          // Check if user wants this alert
          const prefKey = `alert_${threshold.key}` as keyof typeof prefs;
          if (!prefs[prefKey]) continue;

          if (daysUntilRenewal <= threshold.days) {
            // Check if already sent
            const { data: existing } = await supabase
              .from('renewal_alerts')
              .select('id')
              .eq('user_id', userId)
              .eq('alert_type', threshold.key)
              .gte('sent_at', new Date(now - 24 * 60 * 60 * 1000).toISOString())
              .limit(1);

            if (existing && existing.length > 0) continue;

            // Create alert
            await supabase.from('renewal_alerts').insert({
              user_id: userId,
              alert_type: threshold.key,
              subscription_end_date: endDate.toISOString(),
              channel: prefs.channel || 'in_app',
            });

            alertsCreated++;
            logStep("Alert created", { type: threshold.key, daysUntilRenewal });

            // Send email if channel includes email
            if (prefs.channel === 'email' || prefs.channel === 'both') {
              try {
                await supabase.functions.invoke('send-transactional-email', {
                  body: {
                    to: userEmail,
                    template: 'renewal_reminder',
                    variables: {
                      days_remaining: daysUntilRenewal,
                      renewal_date: endDate.toLocaleDateString('fr-FR'),
                    },
                  },
                });
              } catch (e) {
                logStep("Email send failed (non-blocking)", { error: String(e) });
              }
            }
            break; // Only one alert per subscription per check
          }
        }
      }

      return new Response(JSON.stringify({ alerts_created: alertsCreated, checked_subs: subs.data.length }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
});
