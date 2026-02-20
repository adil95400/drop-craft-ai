/**
 * Revenue Analytics - Stripe-powered SaaS metrics
 * Returns MRR, ARR, Churn, LTV, subscriber counts, and monthly trends
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/cors.ts';

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[REVENUE-ANALYTICS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  const preflight = handleCorsPreflightSecure(req);
  if (preflight) return preflight;

  const origin = req.headers.get('origin');
  const headers = { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' };

  try {
    // Auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });
    }
    logStep("Authenticated", { userId: userData.user.id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Fetch all subscriptions (active + canceled recently)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [activeSubs, canceledSubs, invoices] = await Promise.all([
      stripe.subscriptions.list({ status: "active", limit: 100 }),
      stripe.subscriptions.list({ status: "canceled", limit: 100 }),
      stripe.invoices.list({ status: "paid", limit: 100, created: { gte: Math.floor(sixtyDaysAgo.getTime() / 1000) } }),
    ]);

    logStep("Stripe data fetched", {
      active: activeSubs.data.length,
      canceled: canceledSubs.data.length,
      invoices: invoices.data.length,
    });

    // --- MRR ---
    let mrr = 0;
    for (const sub of activeSubs.data) {
      for (const item of sub.items.data) {
        const amount = item.price?.unit_amount || 0;
        const interval = item.price?.recurring?.interval;
        if (interval === "month") mrr += amount;
        else if (interval === "year") mrr += Math.round(amount / 12);
      }
    }
    mrr = mrr / 100; // cents → dollars

    // --- ARR ---
    const arr = mrr * 12;

    // --- Churn (last 30 days) ---
    const recentCanceled = canceledSubs.data.filter(
      (s) => s.canceled_at && s.canceled_at * 1000 > thirtyDaysAgo.getTime()
    ).length;
    const totalSubsStart = activeSubs.data.length + recentCanceled;
    const churnRate = totalSubsStart > 0 ? (recentCanceled / totalSubsStart) * 100 : 0;

    // --- LTV ---
    const avgRevenuePerUser = activeSubs.data.length > 0 ? mrr / activeSubs.data.length : 0;
    const avgLifespanMonths = churnRate > 0 ? 100 / churnRate : 24; // cap at 24 months if no churn
    const ltv = avgRevenuePerUser * Math.min(avgLifespanMonths, 60);

    // --- Monthly revenue trend (last 6 months) ---
    const monthlyRevenue: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenue[key] = 0;
    }

    for (const inv of invoices.data) {
      const d = new Date(inv.created * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyRevenue) {
        monthlyRevenue[key] += (inv.amount_paid || 0) / 100;
      }
    }

    const trend = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }));

    // --- Previous period MRR for growth ---
    // Approximate: use invoices from 30-60 days ago vs 0-30 days
    let revLast30 = 0, revPrev30 = 0;
    for (const inv of invoices.data) {
      const created = inv.created * 1000;
      const amt = (inv.amount_paid || 0) / 100;
      if (created > thirtyDaysAgo.getTime()) revLast30 += amt;
      else revPrev30 += amt;
    }
    const mrrGrowth = revPrev30 > 0 ? ((revLast30 - revPrev30) / revPrev30) * 100 : 0;

    // --- Plan distribution ---
    const planDistribution: Record<string, number> = {};
    for (const sub of activeSubs.data) {
      const productName = sub.items.data[0]?.price?.product as string || "unknown";
      planDistribution[productName] = (planDistribution[productName] || 0) + 1;
    }

    const result = {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      mrr_growth: Math.round(mrrGrowth * 10) / 10,
      churn_rate: Math.round(churnRate * 10) / 10,
      ltv: Math.round(ltv * 100) / 100,
      active_subscribers: activeSubs.data.length,
      canceled_last_30d: recentCanceled,
      trend,
      plan_distribution: planDistribution,
      revenue_last_30d: Math.round(revLast30 * 100) / 100,
      computed_at: new Date().toISOString(),
    };

    logStep("Metrics computed", { mrr: result.mrr, arr: result.arr, churn: result.churn_rate });

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
});
