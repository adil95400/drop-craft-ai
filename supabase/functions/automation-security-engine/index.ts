import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Invalid token");

    const { action, ...params } = await req.json();

    switch (action) {
      // ─── 1. Audit Log Query ───
      case "get_audit_logs": {
        const { filters = {}, page = 1, per_page = 50 } = params;
        let query = supabase
          .from("audit_logs")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range((page - 1) * per_page, page * per_page - 1);

        if (filters.action_category) query = query.eq("action_category", filters.action_category);
        if (filters.severity) query = query.eq("severity", filters.severity);
        if (filters.user_id) query = query.eq("user_id", filters.user_id);
        if (filters.resource_type) query = query.eq("resource_type", filters.resource_type);
        if (filters.date_from) query = query.gte("created_at", filters.date_from);
        if (filters.date_to) query = query.lte("created_at", filters.date_to);

        const { data, error, count } = await query;
        if (error) throw error;

        return json({ items: data, total: count, page, per_page });
      }

      // ─── 2. Create Audit Entry ───
      case "log_action": {
        const { data, error } = await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: params.action_name,
          action_category: params.category || "automation",
          severity: params.severity || "info",
          resource_type: params.resource_type,
          resource_id: params.resource_id,
          resource_name: params.resource_name,
          old_values: params.old_values,
          new_values: params.new_values,
          description: params.description,
          metadata: params.metadata || {},
          actor_type: "user",
          actor_email: user.email,
        });
        if (error) throw error;
        return json({ success: true });
      }

      // ─── 3. Retry Failed Operations ───
      case "retry_failed": {
        const { entity_type, entity_id } = params;

        if (entity_type === "auto_order") {
          const { data: order, error: fetchErr } = await supabase
            .from("auto_order_queue")
            .select("*")
            .eq("id", entity_id)
            .eq("user_id", user.id)
            .single();
          if (fetchErr || !order) throw new Error("Order not found");
          if (order.retry_count >= order.max_retries) throw new Error("Max retries exceeded");

          const { error } = await supabase
            .from("auto_order_queue")
            .update({
              status: "pending",
              retry_count: order.retry_count + 1,
              error_message: null,
              next_retry_at: new Date(Date.now() + 60000).toISOString(),
            })
            .eq("id", entity_id);
          if (error) throw error;

          // Audit
          await supabase.from("audit_logs").insert({
            user_id: user.id,
            action: "retry_auto_order",
            action_category: "automation",
            severity: "info",
            resource_type: "auto_order",
            resource_id: entity_id,
            description: `Manual retry #${order.retry_count + 1}`,
            actor_type: "user",
            actor_email: user.email,
          });

          return json({ success: true, retry_count: order.retry_count + 1 });
        }

        if (entity_type === "supplier_sync") {
          const { error } = await supabase
            .from("supplier_sync_logs")
            .update({ status: "pending", error_details: null })
            .eq("id", entity_id)
            .eq("user_id", user.id);
          if (error) throw error;
          return json({ success: true });
        }

        throw new Error(`Unknown entity_type: ${entity_type}`);
      }

      // ─── 4. Get Error Summary ───
      case "get_error_summary": {
        const { period = "24h" } = params;
        const since = new Date(
          Date.now() - (period === "7d" ? 7 * 86400000 : period === "30d" ? 30 * 86400000 : 86400000)
        ).toISOString();

        // Failed auto orders
        const { data: failedOrders, count: orderErrors } = await supabase
          .from("auto_order_queue")
          .select("id, order_id, error_message, status, retry_count, max_retries, updated_at", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "failed")
          .gte("updated_at", since)
          .order("updated_at", { ascending: false })
          .limit(20);

        // Failed syncs
        const { data: failedSyncs, count: syncErrors } = await supabase
          .from("supplier_sync_logs")
          .select("id, supplier_id, sync_type, error_details, status, created_at", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "error")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(20);

        // Critical audit events
        const { data: criticalEvents, count: criticalCount } = await supabase
          .from("audit_logs")
          .select("id, action, severity, description, created_at, resource_type", { count: "exact" })
          .in("severity", ["error", "critical"])
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(20);

        return json({
          period,
          summary: {
            total_errors: (orderErrors || 0) + (syncErrors || 0) + (criticalCount || 0),
            order_errors: orderErrors || 0,
            sync_errors: syncErrors || 0,
            critical_events: criticalCount || 0,
          },
          failed_orders: failedOrders || [],
          failed_syncs: failedSyncs || [],
          critical_events: criticalEvents || [],
        });
      }

      // ─── 5. RBAC Check ───
      case "check_permission": {
        const { permission } = params;
        
        // Check admin via has_role
        const { data: isAdmin } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });

        const permissionMap: Record<string, string[]> = {
          "pricing.modify": ["admin"],
          "pricing.view": ["admin", "user"],
          "automation.configure": ["admin"],
          "automation.view": ["admin", "user"],
          "supplier.order": ["admin"],
          "supplier.view": ["admin", "user"],
          "audit.view": ["admin"],
          "audit.export": ["admin"],
        };

        const allowed = isAdmin ? true : (permissionMap[permission] || []).includes("user");

        // Log denied access
        if (!allowed) {
          await supabase.from("security_events").insert({
            user_id: user.id,
            event_type: "permission_denied",
            severity: "warn",
            description: `Access denied: ${permission}`,
            metadata: { permission, user_email: user.email },
          });
        }

        return json({ allowed, permission, role: isAdmin ? "admin" : "user" });
      }

      // ─── 6. Security Dashboard Stats ───
      case "get_security_stats": {
        const since30d = new Date(Date.now() - 30 * 86400000).toISOString();

        const [auditStats, secEvents, failedOps] = await Promise.all([
          supabase.from("audit_logs").select("severity", { count: "exact" }).gte("created_at", since30d),
          supabase.from("security_events").select("event_type, severity", { count: "exact" }).gte("created_at", since30d),
          supabase.from("auto_order_queue").select("status", { count: "exact" }).eq("status", "failed").eq("user_id", user.id),
        ]);

        return json({
          audit_entries_30d: auditStats.count || 0,
          security_events_30d: secEvents.count || 0,
          failed_operations: failedOps.count || 0,
          health_score: Math.max(0, 100 - (failedOps.count || 0) * 5),
        });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e: any) {
    return json({ error: e.message }, e.message === "Unauthorized" ? 401 : 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
