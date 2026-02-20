import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[BILLING-DETAILS] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    log("User authenticated", { userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({
        subscription: null,
        invoices: [],
        payment_methods: [],
        upcoming_invoice: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customer = customers.data[0];
    log("Customer found", { customerId: customer.id });

    // Fetch subscription, invoices, payment methods in parallel
    const [subsResult, invoicesResult, pmResult] = await Promise.all([
      stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 1 }),
      stripe.invoices.list({ customer: customer.id, limit: 24 }),
      stripe.customers.listPaymentMethods(customer.id, { limit: 5 }),
    ]);

    // Try to get upcoming invoice
    let upcomingInvoice = null;
    try {
      upcomingInvoice = await stripe.invoices.retrieveUpcoming({ customer: customer.id });
    } catch {
      // No upcoming invoice (no active sub)
    }

    // Format subscription
    const sub = subsResult.data[0] || null;
    const subscription = sub ? {
      id: sub.id,
      status: sub.status,
      plan_name: sub.items.data[0]?.price?.product as string,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      amount: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
      currency: sub.items.data[0]?.price?.currency || "eur",
      interval: sub.items.data[0]?.price?.recurring?.interval || "month",
    } : null;

    // Format invoices
    const invoices = invoicesResult.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount: (inv.amount_paid || inv.total || 0) / 100,
      currency: inv.currency,
      created: new Date(inv.created * 1000).toISOString(),
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      description: inv.lines?.data?.[0]?.description || null,
    }));

    // Format payment methods
    const payment_methods = pmResult.data.map((pm) => ({
      id: pm.id,
      type: pm.type,
      brand: pm.card?.brand || null,
      last4: pm.card?.last4 || null,
      exp_month: pm.card?.exp_month || null,
      exp_year: pm.card?.exp_year || null,
      is_default: pm.id === (customer.invoice_settings?.default_payment_method as string),
    }));

    // Format upcoming
    const upcoming_invoice = upcomingInvoice ? {
      amount: (upcomingInvoice.total || 0) / 100,
      currency: upcomingInvoice.currency,
      next_payment_date: upcomingInvoice.next_payment_attempt
        ? new Date(upcomingInvoice.next_payment_attempt * 1000).toISOString()
        : null,
    } : null;

    log("Billing details fetched", {
      invoiceCount: invoices.length,
      pmCount: payment_methods.length,
      hasSub: !!subscription,
    });

    return new Response(JSON.stringify({
      subscription,
      invoices,
      payment_methods,
      upcoming_invoice,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
