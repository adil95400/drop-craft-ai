import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const log = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);
};

// Product → plan mapping (same as check-subscription)
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_T3RS5DA7XYPWBP": "standard",
  "prod_T3RTReiXnCg9hy": "pro",
  "prod_T3RTMipVwUA7Ud": "ultra_pro",
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    log("ERROR", { message: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" });
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // 1. Verify signature
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    log("Signature verification failed", { error: (err as Error).message });
    return new Response("Invalid signature", { status: 400 });
  }

  log("Event received", { type: event.type, id: event.id });

  // 2. Idempotence check via stripe_event_id
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing) {
    log("Duplicate event, skipping", { eventId: event.id });
    return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
  }

  // 3. Store event (using existing schema: platform is required)
  await supabase.from("webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    platform: "stripe",
    payload: event.data.object as unknown,
    status: "processing",
  });

  try {
    // 4. Handle event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supabase, stripe, event.data.object as Stripe.Checkout.Session);
        break;

      case "invoice.paid":
        await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supabase, event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, stripe, event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;

      default:
        log("Unhandled event type", { type: event.type });
    }

    // 5. Mark as processed
    await supabase
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);

    log("Event processed successfully", { type: event.type, id: event.id });
  } catch (err) {
    const errMsg = (err as Error).message;
    log("Processing error", { type: event.type, error: errMsg });
    await supabase
      .from("webhook_events")
      .update({ status: "failed", error_message: errMsg })
      .eq("stripe_event_id", event.id);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

// ── Handlers ──────────────────────────────────────────────

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  log("checkout.session.completed", { sessionId: session.id, customerId: session.customer });

  if (session.mode !== "subscription") return;

  const customerEmail = session.customer_details?.email || session.customer_email;
  if (!customerEmail) {
    log("No customer email found in session");
    return;
  }

  // Find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find((u: { email?: string }) => u.email === customerEmail);
  if (!user) {
    log("No user found for email", { email: customerEmail });
    return;
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const productId = subscription.items.data[0]?.price?.product as string;
  const plan = PRODUCT_TO_PLAN[productId] || "standard";

  await supabase
    .from("profiles")
    .update({
      plan,
      subscription_plan: plan,
      subscription_status: "active",
      stripe_customer_id: session.customer as string,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  log("Profile updated after checkout", { userId: user.id, plan });
}

async function handleInvoicePaid(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  log("invoice.paid", { invoiceId: invoice.id, customerId: invoice.customer });

  const customerId = invoice.customer as string;
  if (!customerId) return;

  // Update profile subscription_status to active
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (data) {
    await supabase
      .from("profiles")
      .update({ subscription_status: "active", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    log("Profile marked active after invoice.paid", { userId: data.id });
  }
}

async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  log("invoice.payment_failed", { invoiceId: invoice.id, customerId: invoice.customer });

  const customerId = invoice.customer as string;
  if (!customerId) return;

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (data) {
    await supabase
      .from("profiles")
      .update({ subscription_status: "past_due", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    log("Profile marked past_due", { userId: data.id });
  }
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  log("subscription.updated", { subId: subscription.id, status: subscription.status });

  const customerId = subscription.customer as string;
  const productId = subscription.items.data[0]?.price?.product as string;
  const plan = PRODUCT_TO_PLAN[productId] || "standard";

  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "inactive",
    incomplete_expired: "inactive",
    paused: "inactive",
  };

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (data) {
    await supabase
      .from("profiles")
      .update({
        plan,
        subscription_plan: plan,
        subscription_status: statusMap[subscription.status] || "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    log("Profile updated after subscription change", { userId: data.id, plan, status: subscription.status });
  }
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  log("subscription.deleted", { subId: subscription.id });

  const customerId = subscription.customer as string;
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (data) {
    await supabase
      .from("profiles")
      .update({
        plan: "free",
        subscription_plan: "free",
        subscription_status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    log("Profile downgraded to free after cancellation", { userId: data.id });
  }
}
