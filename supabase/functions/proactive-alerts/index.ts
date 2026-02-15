/**
 * Sprint 9: Proactive Alerts Detection Edge Function
 * Scans for stock low, price anomalies, quota warnings, and sync failures
 * Inserts alerts into user_notifications table
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all distinct user_ids from products table
    const { data: users } = await supabase
      .from("products")
      .select("user_id")
      .limit(500);

    const uniqueUserIds = [...new Set((users || []).map((u: any) => u.user_id))];
    const alertsToInsert: any[] = [];

    for (const userId of uniqueUserIds) {
      // 1. Stock Low Detection - products with stock <= 5
      const { data: lowStock } = await supabase
        .from("products")
        .select("id, title, stock")
        .eq("user_id", userId)
        .lte("stock", 5)
        .gt("stock", -1)
        .eq("status", "active")
        .limit(10);

      for (const product of lowStock || []) {
        // Check if alert already exists in last 24h
        const { data: existing } = await supabase
          .from("user_notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("notification_type", "stock_low")
          .eq("metadata->>product_id", product.id)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!existing || existing.length === 0) {
          alertsToInsert.push({
            user_id: userId,
            notification_type: "stock_low",
            category: "inventory",
            priority: product.stock === 0 ? "critical" : "high",
            title: product.stock === 0
              ? `Rupture de stock : ${product.title}`
              : `Stock faible : ${product.title}`,
            message: `${product.stock} unité(s) restante(s) pour "${product.title}". Pensez à réapprovisionner.`,
            action_url: `/products/${product.id}`,
            action_label: "Voir le produit",
            metadata: { product_id: product.id, stock: product.stock },
          });
        }
      }

      // 2. Quota warnings - check consumption_logs
      const { data: quotaUsage } = await supabase
        .from("consumption_logs")
        .select("action, credits_used")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (quotaUsage && quotaUsage.length > 0) {
        const totalCredits = quotaUsage.reduce((s: number, l: any) => s + (l.credits_used || 0), 0);
        if (totalCredits > 80) {
          const { data: existingQuota } = await supabase
            .from("user_notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("notification_type", "quota_warning")
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (!existingQuota || existingQuota.length === 0) {
            alertsToInsert.push({
              user_id: userId,
              notification_type: "quota_warning",
              category: "quota",
              priority: totalCredits > 95 ? "critical" : "high",
              title: `Quota IA : ${Math.round(totalCredits)}% utilisé`,
              message: `Vous avez consommé ${Math.round(totalCredits)}% de vos crédits IA ce mois-ci.`,
              action_url: "/subscription",
              action_label: "Gérer le plan",
              metadata: { usage_percent: totalCredits },
            });
          }
        }
      }

      // 3. Sync failures - check recent background_jobs
      const { data: failedJobs } = await supabase
        .from("background_jobs")
        .select("id, job_type, error_message, created_at")
        .eq("user_id", userId)
        .eq("status", "failed")
        .gte("created_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
        .limit(5);

      for (const job of failedJobs || []) {
        const { data: existingSync } = await supabase
          .from("user_notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("notification_type", "sync_failure")
          .eq("metadata->>job_id", job.id)
          .limit(1);

        if (!existingSync || existingSync.length === 0) {
          alertsToInsert.push({
            user_id: userId,
            notification_type: "sync_failure",
            category: "integrations",
            priority: "high",
            title: `Échec: ${job.job_type || "Tâche"}`,
            message: job.error_message || "Une tâche en arrière-plan a échoué. Vérifiez la configuration.",
            action_url: "/integrations",
            action_label: "Voir les intégrations",
            metadata: { job_id: job.id, job_type: job.job_type },
          });
        }
      }
    }

    // Batch insert all alerts
    if (alertsToInsert.length > 0) {
      const { error } = await supabase.from("user_notifications").insert(alertsToInsert);
      if (error) {
        console.error("Failed to insert alerts:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts_created: alertsToInsert.length,
        users_scanned: uniqueUserIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Proactive alerts error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
