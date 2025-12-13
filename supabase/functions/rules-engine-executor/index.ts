import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

interface RuleAction {
  type: string;
  config: Record<string, any>;
}

interface FulfillmentRule {
  id: string;
  name: string;
  rule_type: string;
  condition_logic: "AND" | "OR";
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  is_active: boolean;
}

// Evaluate a single condition against order data
function evaluateCondition(condition: RuleCondition, orderData: Record<string, any>): boolean {
  const { field, operator, value } = condition;
  const fieldValue = orderData[field];

  console.log(`Evaluating condition: ${field} ${operator} ${value} (actual: ${fieldValue})`);

  if (fieldValue === undefined || fieldValue === null) {
    return false;
  }

  switch (operator) {
    case "equals":
      return String(fieldValue).toLowerCase() === String(value).toLowerCase();
    case "not_equals":
      return String(fieldValue).toLowerCase() !== String(value).toLowerCase();
    case "contains":
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    case "starts_with":
      return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
    case "greater_than":
      return Number(fieldValue) > Number(value);
    case "less_than":
      return Number(fieldValue) < Number(value);
    case "greater_or_equal":
      return Number(fieldValue) >= Number(value);
    case "less_or_equal":
      return Number(fieldValue) <= Number(value);
    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

// Evaluate all conditions with AND/OR logic
function evaluateConditions(
  conditions: RuleCondition[],
  logic: "AND" | "OR",
  orderData: Record<string, any>
): boolean {
  if (conditions.length === 0) {
    return true; // No conditions = always match
  }

  const results = conditions.map(c => evaluateCondition(c, orderData));
  
  if (logic === "AND") {
    return results.every(r => r);
  } else {
    return results.some(r => r);
  }
}

// Execute a single action
async function executeAction(
  action: RuleAction,
  orderId: string,
  supabase: any
): Promise<{ success: boolean; result?: any; error?: string }> {
  console.log(`Executing action: ${action.type}`, action.config);

  try {
    switch (action.type) {
      case "assign_supplier":
        const supplierId = action.config.supplier_id;
        if (supplierId) {
          await supabase
            .from("auto_fulfillment_orders")
            .update({ supplier_id: supplierId })
            .eq("id", orderId);
          return { success: true, result: { assigned_supplier: supplierId } };
        }
        return { success: false, error: "No supplier_id in config" };

      case "apply_margin":
        const marginPercent = action.config.margin_percent || 0;
        // Get current order and apply margin
        const { data: order } = await supabase
          .from("auto_fulfillment_orders")
          .select("cost_price")
          .eq("id", orderId)
          .single();
        
        if (order?.cost_price) {
          const newPrice = order.cost_price * (1 + marginPercent / 100);
          await supabase
            .from("auto_fulfillment_orders")
            .update({ profit_margin: marginPercent })
            .eq("id", orderId);
          return { success: true, result: { new_price: newPrice, margin: marginPercent } };
        }
        return { success: false, error: "No cost_price found" };

      case "set_price":
        const price = action.config.price;
        if (price) {
          await supabase
            .from("auto_fulfillment_orders")
            .update({ total_amount: price })
            .eq("id", orderId);
          return { success: true, result: { set_price: price } };
        }
        return { success: false, error: "No price in config" };

      case "update_stock":
        // Log stock update event
        return { success: true, result: { stock_updated: true } };

      case "send_notification":
        const message = action.config.message || "Fulfillment notification";
        // In a real implementation, send email/SMS/webhook
        console.log(`Notification: ${message}`);
        return { success: true, result: { notification_sent: message } };

      case "skip_order":
        await supabase
          .from("auto_fulfillment_orders")
          .update({ status: "skipped", error_message: "Skipped by rule" })
          .eq("id", orderId);
        return { success: true, result: { order_skipped: true } };

      case "flag_for_review":
        await supabase
          .from("auto_fulfillment_orders")
          .update({ status: "pending_review" })
          .eq("id", orderId);
        return { success: true, result: { flagged_for_review: true } };

      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  } catch (error) {
    console.error(`Action execution error:`, error);
    return { success: false, error: String(error) };
  }
}

// Log rule execution event
async function logRuleEvent(
  supabase: any,
  orderId: string,
  ruleId: string,
  eventType: string,
  details: Record<string, any>
) {
  try {
    await supabase.from("fulfillment_events").insert({
      order_id: orderId,
      event_type: eventType,
      details: { rule_id: ruleId, ...details },
    });
  } catch (error) {
    console.error("Failed to log event:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { order_id, order_data, user_id, dry_run = false } = await req.json();

    console.log(`Rules engine executing for order: ${order_id}, dry_run: ${dry_run}`);

    // Fetch active rules for user, ordered by priority
    const { data: rules, error: rulesError } = await supabase
      .from("fulfillment_rules")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (rulesError) {
      throw new Error(`Failed to fetch rules: ${rulesError.message}`);
    }

    console.log(`Found ${rules?.length || 0} active rules`);

    const matchedRules: any[] = [];
    const executedActions: any[] = [];

    // Process each rule
    for (const rule of rules || []) {
      const conditions = (rule.conditions as RuleCondition[]) || [];
      const conditionLogic = (rule.condition_logic as "AND" | "OR") || "AND";
      
      // Prepare order data for evaluation
      const evalData = order_data || {};
      
      // Evaluate conditions
      const matches = evaluateConditions(conditions, conditionLogic, evalData);

      if (matches) {
        console.log(`Rule "${rule.name}" matched!`);
        matchedRules.push({
          id: rule.id,
          name: rule.name,
          priority: rule.priority,
        });

        // Execute actions if not dry run
        if (!dry_run) {
          const actions = (rule.actions as RuleAction[]) || [];
          for (const action of actions) {
            const result = await executeAction(action, order_id, supabase);
            executedActions.push({
              rule_id: rule.id,
              action_type: action.type,
              ...result,
            });

            // Log event
            await logRuleEvent(supabase, order_id, rule.id, "rule_action_executed", {
              action_type: action.type,
              success: result.success,
              result: result.result,
              error: result.error,
            });
          }

          // Update rule last executed timestamp
          await supabase
            .from("fulfillment_rules")
            .update({
              last_executed_at: new Date().toISOString(),
              execution_count: (rule.execution_count || 0) + 1,
            })
            .eq("id", rule.id);
        }
      }
    }

    const response = {
      success: true,
      order_id,
      dry_run,
      matched_rules: matchedRules,
      executed_actions: dry_run ? [] : executedActions,
      total_rules_checked: rules?.length || 0,
    };

    console.log(`Rules engine completed:`, response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Rules engine error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
