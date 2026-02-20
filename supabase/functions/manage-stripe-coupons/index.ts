/**
 * Manage Stripe Coupons & Promotion Codes
 * CRUD operations: create, list, delete coupons synced to Stripe
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getSecureCorsHeaders, isAllowedOrigin } from '../_shared/secure-cors.ts';

const log = (step: string, details?: unknown) =>
  console.log(`[MANAGE-COUPONS] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req);

  if (req.method === "OPTIONS") {
    const origin = req.headers.get("Origin");
    if (!origin || !isAllowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
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
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.json();
    const { action } = body;

    log("Action", { action, userId: user.id.slice(0, 8) });

    // ── CREATE ──
    if (action === "create") {
      const {
        code, discount_type, discount_value, duration, duration_in_months,
        max_redemptions, description, min_purchase_amount, expires_at
      } = body;

      if (!code || !discount_value) {
        return new Response(JSON.stringify({ error: "code and discount_value required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create Stripe coupon
      const couponParams: Stripe.CouponCreateParams = {
        name: code.toUpperCase(),
        duration: duration || "once",
      };

      if (discount_type === "percentage") {
        couponParams.percent_off = discount_value;
      } else {
        couponParams.amount_off = Math.round(discount_value * 100); // cents
        couponParams.currency = "eur";
      }

      if (duration === "repeating" && duration_in_months) {
        couponParams.duration_in_months = duration_in_months;
      }

      if (max_redemptions) {
        couponParams.max_redemptions = max_redemptions;
      }

      const stripeCoupon = await stripe.coupons.create(couponParams);
      log("Stripe coupon created", { couponId: stripeCoupon.id });

      // Create Stripe promotion code (customer-facing code)
      const promoCodeParams: Stripe.PromotionCodeCreateParams = {
        coupon: stripeCoupon.id,
        code: code.toUpperCase(),
      };

      if (max_redemptions) {
        promoCodeParams.max_redemptions = max_redemptions;
      }

      if (expires_at) {
        promoCodeParams.expires_at = Math.floor(new Date(expires_at).getTime() / 1000);
      }

      if (min_purchase_amount) {
        promoCodeParams.restrictions = {
          minimum_amount: Math.round(min_purchase_amount * 100),
          minimum_amount_currency: "eur",
        };
      }

      const stripePromoCode = await stripe.promotionCodes.create(promoCodeParams);
      log("Stripe promo code created", { promoCodeId: stripePromoCode.id });

      // Save to DB
      const { data: coupon, error: insertError } = await supabase
        .from("promotional_coupons")
        .insert({
          user_id: user.id,
          code: code.toUpperCase(),
          description: description || null,
          discount_type: discount_type || "percentage",
          discount_value,
          coupon_type: discount_type || "percentage",
          currency: "eur",
          duration: duration || "once",
          duration_in_months: duration_in_months || null,
          min_purchase_amount: min_purchase_amount || null,
          max_uses: max_redemptions || null,
          max_redemptions: max_redemptions || null,
          expires_at: expires_at || null,
          stripe_coupon_id: stripeCoupon.id,
          stripe_promotion_code_id: stripePromoCode.id,
          synced_to_stripe: true,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ success: true, coupon }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── LIST ──
    if (action === "list") {
      const { data: coupons, error } = await supabase
        .from("promotional_coupons")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ coupons: coupons || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── TOGGLE ACTIVE ──
    if (action === "toggle") {
      const { coupon_id, is_active } = body;

      // Get coupon
      const { data: coupon, error: fetchError } = await supabase
        .from("promotional_coupons")
        .select("*")
        .eq("id", coupon_id)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !coupon) {
        return new Response(JSON.stringify({ error: "Coupon not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If deactivating and has Stripe promo code, deactivate it
      if (!is_active && coupon.stripe_promotion_code_id) {
        await stripe.promotionCodes.update(coupon.stripe_promotion_code_id, { active: false });
      }

      // If reactivating, create a new promotion code (Stripe doesn't allow reactivating)
      if (is_active && coupon.stripe_coupon_id && !is_active) {
        // Can't reactivate promo codes in Stripe, create new one
        const newPromo = await stripe.promotionCodes.create({
          coupon: coupon.stripe_coupon_id,
          code: coupon.code,
        });
        await supabase.from("promotional_coupons").update({
          stripe_promotion_code_id: newPromo.id,
          is_active: true,
        }).eq("id", coupon_id);
      } else {
        await supabase.from("promotional_coupons").update({ is_active }).eq("id", coupon_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DELETE ──
    if (action === "delete") {
      const { coupon_id } = body;

      const { data: coupon, error: fetchError } = await supabase
        .from("promotional_coupons")
        .select("stripe_coupon_id, stripe_promotion_code_id")
        .eq("id", coupon_id)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !coupon) {
        return new Response(JSON.stringify({ error: "Coupon not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Deactivate in Stripe (can't delete promotion codes)
      if (coupon.stripe_promotion_code_id) {
        await stripe.promotionCodes.update(coupon.stripe_promotion_code_id, { active: false }).catch(() => {});
      }
      if (coupon.stripe_coupon_id) {
        await stripe.coupons.del(coupon.stripe_coupon_id).catch(() => {});
      }

      // Delete from DB
      await supabase.from("promotional_coupons").delete().eq("id", coupon_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...getSecureCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
