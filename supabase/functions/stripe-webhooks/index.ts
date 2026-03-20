import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const log = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);
};

// Product → plan mapping
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

  // 1. Verify Stripe signature
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

  // 2. Race-condition-safe idempotence: try insert first, catch unique violation
  const { error: insertError } = await supabase.from("webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    platform: "stripe",
    payload: event.data.object as unknown,
    status: "processing",
  });

  if (insertError) {
    // Unique constraint violation = duplicate event
    if (insertError.code === "23505") {
      log("Duplicate event (race-safe), skipping", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
    // Other insert errors: log but still try to process
    log("Insert warning", { error: insertError.message });
  }

  try {
    // 3. Route event to handler
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

    // 4. Mark as processed
    await supabase
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);

    log("Event processed successfully", { type: event.type, id: event.id });
  } catch (err) {
    const errMsg = (err as Error).message;
    log("Processing error", { type: event.type, error: errMsg });

    // Increment retry count and mark failed
    await supabase.rpc("increment_webhook_retry", { p_stripe_event_id: event.id, p_error: errMsg });
  }

  // Always return 200 to Stripe to prevent unnecessary retries on our side
  // (we handle our own retry logic via status tracking)
  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

// ── Helper: find user by Stripe customer ID (scalable, no listUsers) ──

async function findUserByStripeCustomer(
  supabase: ReturnType<typeof createClient>,
  stripeCustomerId: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  return data;
}

async function findUserByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return data;
}

// ── Handlers ──────────────────────────────────────────────

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  log("checkout.session.completed", { sessionId: session.id, mode: session.mode });

  const stripeCustomerId = session.customer as string;
  const customerEmail = session.customer_details?.email || session.customer_email;

  // ── Credit pack purchase (one-time payment) ──
  if (session.mode === "payment") {
    const metadata = session.metadata || {};
    if (metadata.pack_id && metadata.user_id && metadata.credits) {
      log("Fulfilling credit purchase", { packId: metadata.pack_id, credits: metadata.credits });

      const { error } = await supabase.from("credit_addons").insert({
        user_id: metadata.user_id,
        quota_key: "ai_generations",
        credits_purchased: parseInt(metadata.credits, 10),
        credits_remaining: parseInt(metadata.credits, 10),
        price_paid: (session.amount_total || 0) / 100,
        currency: session.currency?.toUpperCase() || "EUR",
        status: "active",
        stripe_session_id: session.id,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) {
        log("Credit addon insert error", { error: error.message });
        throw new Error(`Credit fulfillment failed: ${error.message}`);
      }

      log("Credits fulfilled", { userId: metadata.user_id, credits: metadata.credits });
    }
    return;
  }

  // ── Subscription checkout ──
  if (session.mode !== "subscription") return;

  // Find user: try stripe_customer_id first, then email
  let user = stripeCustomerId ? await findUserByStripeCustomer(supabase, stripeCustomerId) : null;
  if (!user && customerEmail) {
    user = await findUserByEmail(supabase, customerEmail);
  }

  if (!user) {
    log("No user found for checkout", { customerId: stripeCustomerId, email: customerEmail });
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
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  log("Profile updated after checkout", { userId: user.id, plan });
}

async function handleInvoicePaid(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;
  if (!customerId) return;
  log("invoice.paid", { invoiceId: invoice.id, customerId });

  const user = await findUserByStripeCustomer(supabase, customerId);
  if (user) {
    await supabase
      .from("profiles")
      .update({ subscription_status: "active", updated_at: new Date().toISOString() })
      .eq("id", user.id);
    log("Profile marked active after invoice.paid", { userId: user.id });
  }
}

async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;
  if (!customerId) return;
  log("invoice.payment_failed", { invoiceId: invoice.id, customerId });

  const user = await findUserByStripeCustomer(supabase, customerId);
  if (user) {
    await supabase
      .from("profiles")
      .update({ subscription_status: "past_due", updated_at: new Date().toISOString() })
      .eq("id", user.id);
    log("Profile marked past_due", { userId: user.id });
  }
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createClient>,
  _stripe: Stripe,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const productId = subscription.items.data[0]?.price?.product as string;
  const plan = PRODUCT_TO_PLAN[productId] || "standard";
  log("subscription.updated", { subId: subscription.id, status: subscription.status, plan });

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

  const user = await findUserByStripeCustomer(supabase, customerId);
  if (user) {
    await supabase
      .from("profiles")
      .update({
        plan,
        subscription_plan: plan,
        subscription_status: statusMap[subscription.status] || "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    log("Profile updated after subscription change", { userId: user.id, plan, status: subscription.status });
  }
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  log("subscription.deleted", { subId: subscription.id, customerId });

  const user = await findUserByStripeCustomer(supabase, customerId);
  if (user) {
    await supabase
      .from("profiles")
      .update({
        plan: "free",
        subscription_plan: "free",
        subscription_status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    log("Profile downgraded to free after cancellation", { userId: user.id });
  }
}
