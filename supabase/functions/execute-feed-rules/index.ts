import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RuleCondition {
  field: string;
  operator: string;
  value?: string | number | boolean;
}

interface RuleAction {
  type: string;
  field?: string;
  value?: string | number;
  operation?: string;
}

interface FeedRule {
  id: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  match_type: "all" | "any";
}

function evaluateCondition(
  product: Record<string, any>,
  condition: RuleCondition
): boolean {
  const fieldValue = product[condition.field];
  const condValue = condition.value;

  switch (condition.operator) {
    case "equals":
      return String(fieldValue).toLowerCase() === String(condValue).toLowerCase();
    case "not_equals":
      return String(fieldValue).toLowerCase() !== String(condValue).toLowerCase();
    case "contains":
      return String(fieldValue ?? "")
        .toLowerCase()
        .includes(String(condValue).toLowerCase());
    case "not_contains":
      return !String(fieldValue ?? "")
        .toLowerCase()
        .includes(String(condValue).toLowerCase());
    case "starts_with":
      return String(fieldValue ?? "")
        .toLowerCase()
        .startsWith(String(condValue).toLowerCase());
    case "ends_with":
      return String(fieldValue ?? "")
        .toLowerCase()
        .endsWith(String(condValue).toLowerCase());
    case "greater_than":
      return Number(fieldValue) > Number(condValue);
    case "less_than":
      return Number(fieldValue) < Number(condValue);
    case "greater_or_equal":
      return Number(fieldValue) >= Number(condValue);
    case "less_or_equal":
      return Number(fieldValue) <= Number(condValue);
    case "is_empty":
      return (
        fieldValue === null ||
        fieldValue === undefined ||
        fieldValue === "" ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );
    case "is_not_empty":
      return (
        fieldValue !== null &&
        fieldValue !== undefined &&
        fieldValue !== "" &&
        (!Array.isArray(fieldValue) || fieldValue.length > 0)
      );
    default:
      return false;
  }
}

function matchesRule(
  product: Record<string, any>,
  rule: FeedRule
): boolean {
  if (rule.conditions.length === 0) return true;
  const results = rule.conditions.map((c) => evaluateCondition(product, c));
  return rule.match_type === "all"
    ? results.every(Boolean)
    : results.some(Boolean);
}

function applyActions(
  product: Record<string, any>,
  actions: RuleAction[]
): { modified: Record<string, any>; changes: Record<string, { before: any; after: any }> } {
  const modified = { ...product };
  const changes: Record<string, { before: any; after: any }> = {};

  for (const action of actions) {
    const field = action.field;
    if (!field && action.type !== "exclude" && action.type !== "include") continue;

    const before = field ? modified[field] : undefined;

    switch (action.type) {
      case "set_field":
        if (field) modified[field] = action.value;
        break;
      case "append_text":
        if (field) modified[field] = String(modified[field] ?? "") + String(action.value ?? "");
        break;
      case "prepend_text":
        if (field) modified[field] = String(action.value ?? "") + String(modified[field] ?? "");
        break;
      case "replace_text":
        if (field && typeof modified[field] === "string" && action.operation) {
          modified[field] = modified[field].replace(
            new RegExp(action.operation, "gi"),
            String(action.value ?? "")
          );
        }
        break;
      case "modify_field":
        if (field && action.operation) {
          const num = Number(modified[field]);
          const val = Number(action.value);
          switch (action.operation) {
            case "add": modified[field] = num + val; break;
            case "subtract": modified[field] = num - val; break;
            case "multiply": modified[field] = num * val; break;
            case "divide": modified[field] = val !== 0 ? num / val : num; break;
            case "round": modified[field] = Math.round(num * 100) / 100; break;
          }
        } else if (field && action.value !== undefined) {
          modified[field] = action.value;
        }
        break;
      case "set_category":
        modified.category = action.value;
        break;
      case "add_tag": {
        const tags = Array.isArray(modified.tags) ? [...modified.tags] : [];
        const tag = String(action.value);
        if (!tags.includes(tag)) tags.push(tag);
        modified.tags = tags;
        break;
      }
      case "remove_tag": {
        if (Array.isArray(modified.tags)) {
          modified.tags = modified.tags.filter(
            (t: string) => t !== String(action.value)
          );
        }
        break;
      }
    }

    const after = field ? modified[field] : undefined;
    if (field && before !== after) {
      changes[field] = { before, after };
    }
  }

  return { modified, changes };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: "Non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { rule_id, preview_only = false, limit = 500 } = body;

    if (!rule_id) {
      return new Response(
        JSON.stringify({ ok: false, error: "rule_id requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the rule
    const { data: rule, error: ruleError } = await supabase
      .from("feed_rules")
      .select("*")
      .eq("id", rule_id)
      .eq("user_id", user.id)
      .single();

    if (ruleError || !rule) {
      return new Response(
        JSON.stringify({ ok: false, error: "Règle introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user products
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, title, name, description, price, compare_at_price, cost_price, stock_quantity, category, brand, sku, tags, status, weight")
      .eq("user_id", user.id)
      .limit(limit);

    if (prodError) {
      return new Response(
        JSON.stringify({ ok: false, error: "Erreur chargement produits" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const feedRule: FeedRule = {
      id: rule.id,
      conditions: rule.conditions || [],
      actions: rule.actions || [],
      match_type: rule.match_type || "all",
    };

    const startTime = Date.now();
    let matched = 0;
    let modified = 0;
    const previewResults: any[] = [];
    const updates: { id: string; data: Record<string, any> }[] = [];

    for (const product of products || []) {
      if (!matchesRule(product, feedRule)) continue;
      matched++;

      const { modified: newProduct, changes } = applyActions(product, feedRule.actions);
      const changeKeys = Object.keys(changes);

      if (changeKeys.length > 0) {
        modified++;

        if (preview_only) {
          previewResults.push({
            product_id: product.id,
            title: product.title || product.name,
            changes,
          });
        } else {
          // Build update payload (only changed fields, excluding id)
          const updateData: Record<string, any> = {};
          for (const key of changeKeys) {
            updateData[key] = newProduct[key];
          }
          updates.push({ id: product.id, data: updateData });
        }
      }
    }

    // Apply updates if not preview
    if (!preview_only && updates.length > 0) {
      // Batch update products
      for (const { id, data } of updates) {
        await supabase
          .from("products")
          .update(data)
          .eq("id", id)
          .eq("user_id", user.id);
      }

      // Log execution
      await supabase.from("feed_rule_executions").insert({
        rule_id,
        user_id: user.id,
        products_matched: matched,
        products_modified: modified,
        execution_time_ms: Date.now() - startTime,
        status: "success",
        changes_summary: { total_changes: modified },
      });

      // Update rule stats
      await supabase
        .from("feed_rules")
        .update({
          execution_count: (rule.execution_count || 0) + 1,
          last_executed_at: new Date().toISOString(),
        })
        .eq("id", rule_id);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          products_total: (products || []).length,
          products_matched: matched,
          products_modified: modified,
          execution_time_ms: Date.now() - startTime,
          preview: preview_only ? previewResults.slice(0, 20) : undefined,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
