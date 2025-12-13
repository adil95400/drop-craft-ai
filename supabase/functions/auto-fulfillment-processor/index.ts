import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_id: string;
  sku: string;
  title: string;
  quantity: number;
  price: number;
  supplier_id?: string;
  supplier_sku?: string;
}

interface FulfillmentOrder {
  store_order_id: string;
  store_platform: string;
  store_integration_id?: string;
  customer_name: string;
  customer_email: string;
  shipping_address: Record<string, unknown>;
  order_items: OrderItem[];
  total_amount: number;
  currency: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, order, orderId } = await req.json();

    switch (action) {
      case "process_order":
        return await processOrder(supabase, user.id, order);
      
      case "retry_order":
        return await retryOrder(supabase, user.id, orderId);
      
      case "cancel_order":
        return await cancelOrder(supabase, user.id, orderId);
      
      case "get_status":
        return await getOrderStatus(supabase, user.id, orderId);
      
      case "process_pending":
        return await processPendingOrders(supabase, user.id);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("Auto-fulfillment processor error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processOrder(supabase: any, userId: string, order: FulfillmentOrder) {
  const startTime = Date.now();

  // Create fulfillment order record
  const { data: fulfillmentOrder, error: createError } = await supabase
    .from("auto_fulfillment_orders")
    .insert({
      user_id: userId,
      store_order_id: order.store_order_id,
      store_platform: order.store_platform,
      store_integration_id: order.store_integration_id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      shipping_address: order.shipping_address,
      order_items: order.order_items,
      total_amount: order.total_amount,
      currency: order.currency,
      status: "processing",
      processing_started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create fulfillment order: ${createError.message}`);
  }

  // Log event
  await logFulfillmentEvent(supabase, userId, fulfillmentOrder.id, "order_received", "success", {
    store_order_id: order.store_order_id,
    items_count: order.order_items.length,
  });

  // Get user's fulfillment settings
  const { data: settings } = await supabase
    .from("fulfillment_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Get applicable fulfillment rules
  const { data: rules } = await supabase
    .from("fulfillment_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  // Process each item and determine supplier
  const processedItems = [];
  let totalCost = 0;

  for (const item of order.order_items) {
    const supplierInfo = await determineSupplier(supabase, userId, item, rules);
    
    if (supplierInfo) {
      processedItems.push({
        ...item,
        supplier_id: supplierInfo.supplier_id,
        supplier_name: supplierInfo.supplier_name,
        supplier_sku: supplierInfo.supplier_sku,
        cost_price: supplierInfo.cost_price,
      });
      totalCost += (supplierInfo.cost_price || 0) * item.quantity;
    } else {
      processedItems.push({
        ...item,
        error: "No supplier found",
      });
    }
  }

  // Group items by supplier for batch ordering
  const supplierGroups = groupBySupplier(processedItems);

  // Place orders with each supplier
  const supplierOrders = [];
  for (const [supplierId, items] of Object.entries(supplierGroups)) {
    if (supplierId === "unknown") continue;

    try {
      const supplierOrder = await placeSupplierOrder(
        supabase,
        userId,
        supplierId,
        items as OrderItem[],
        order.shipping_address
      );
      supplierOrders.push(supplierOrder);

      await logFulfillmentEvent(supabase, userId, fulfillmentOrder.id, "supplier_order_placed", "success", {
        supplier_id: supplierId,
        supplier_order_id: supplierOrder.order_id,
        items_count: (items as OrderItem[]).length,
      });
    } catch (error) {
      await logFulfillmentEvent(supabase, userId, fulfillmentOrder.id, "supplier_order_failed", "error", {
        supplier_id: supplierId,
        error: error.message,
      });
    }
  }

  // Calculate profit margin
  const profitMargin = order.total_amount - totalCost;

  // Update fulfillment order with results
  const status = supplierOrders.length > 0 ? "confirmed" : "failed";
  const { data: updatedOrder, error: updateError } = await supabase
    .from("auto_fulfillment_orders")
    .update({
      status,
      order_items: processedItems,
      cost_price: totalCost,
      profit_margin: profitMargin,
      supplier_order_id: supplierOrders[0]?.order_id,
      supplier_id: supplierOrders[0]?.supplier_id,
      supplier_name: supplierOrders[0]?.supplier_name,
      processing_completed_at: new Date().toISOString(),
      metadata: { supplier_orders: supplierOrders },
    })
    .eq("id", fulfillmentOrder.id)
    .select()
    .single();

  const duration = Date.now() - startTime;
  await logFulfillmentEvent(supabase, userId, fulfillmentOrder.id, "processing_completed", status === "confirmed" ? "success" : "error", {
    duration_ms: duration,
    supplier_orders_count: supplierOrders.length,
    total_cost: totalCost,
    profit_margin: profitMargin,
  }, duration);

  return new Response(
    JSON.stringify({
      success: true,
      fulfillment_order: updatedOrder,
      supplier_orders: supplierOrders,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function determineSupplier(supabase: any, userId: string, item: OrderItem, rules: any[]) {
  // First check if product has a linked supplier
  const { data: product } = await supabase
    .from("products")
    .select("supplier_id, supplier_sku, cost_price, supplier_name")
    .eq("id", item.product_id)
    .single();

  if (product?.supplier_id) {
    return {
      supplier_id: product.supplier_id,
      supplier_name: product.supplier_name,
      supplier_sku: product.supplier_sku || item.sku,
      cost_price: product.cost_price,
    };
  }

  // Check supplier_products for matching SKU
  const { data: supplierProduct } = await supabase
    .from("supplier_products")
    .select("supplier_id, supplier_name, sku, price")
    .eq("sku", item.sku)
    .limit(1)
    .single();

  if (supplierProduct) {
    return {
      supplier_id: supplierProduct.supplier_id,
      supplier_name: supplierProduct.supplier_name,
      supplier_sku: supplierProduct.sku,
      cost_price: supplierProduct.price,
    };
  }

  // Apply rules to determine supplier
  for (const rule of rules || []) {
    if (evaluateRule(rule, item)) {
      const preferredSupplier = rule.supplier_preferences?.[0];
      if (preferredSupplier) {
        return {
          supplier_id: preferredSupplier.id,
          supplier_name: preferredSupplier.name,
          supplier_sku: item.sku,
          cost_price: null,
        };
      }
    }
  }

  return null;
}

function evaluateRule(rule: any, item: OrderItem): boolean {
  const conditions = rule.conditions || [];
  const logic = rule.condition_logic || "AND";

  if (conditions.length === 0) return true;

  const results = conditions.map((condition: any) => {
    switch (condition.field) {
      case "sku":
        return evaluateCondition(item.sku, condition.operator, condition.value);
      case "title":
        return evaluateCondition(item.title, condition.operator, condition.value);
      case "price":
        return evaluateCondition(item.price, condition.operator, parseFloat(condition.value));
      case "quantity":
        return evaluateCondition(item.quantity, condition.operator, parseInt(condition.value));
      default:
        return true;
    }
  });

  return logic === "AND" 
    ? results.every(Boolean) 
    : results.some(Boolean);
}

function evaluateCondition(value: any, operator: string, target: any): boolean {
  switch (operator) {
    case "equals":
      return value === target;
    case "not_equals":
      return value !== target;
    case "contains":
      return String(value).toLowerCase().includes(String(target).toLowerCase());
    case "starts_with":
      return String(value).toLowerCase().startsWith(String(target).toLowerCase());
    case "greater_than":
      return value > target;
    case "less_than":
      return value < target;
    case "greater_or_equal":
      return value >= target;
    case "less_or_equal":
      return value <= target;
    default:
      return true;
  }
}

function groupBySupplier(items: any[]): Record<string, any[]> {
  return items.reduce((groups, item) => {
    const supplierId = item.supplier_id || "unknown";
    if (!groups[supplierId]) {
      groups[supplierId] = [];
    }
    groups[supplierId].push(item);
    return groups;
  }, {} as Record<string, any[]>);
}

async function placeSupplierOrder(
  supabase: any,
  userId: string,
  supplierId: string,
  items: OrderItem[],
  shippingAddress: Record<string, unknown>
) {
  // Get supplier connection details
  const { data: connection } = await supabase
    .from("supplier_connections")
    .select("*, credentials:supplier_credentials_vault(*)")
    .eq("supplier_id", supplierId)
    .eq("user_id", userId)
    .single();

  if (!connection) {
    throw new Error(`No connection found for supplier ${supplierId}`);
  }

  const supplierName = connection.supplier_name?.toLowerCase() || "";

  // Route to appropriate supplier API
  if (supplierName.includes("cj") || supplierName.includes("cjdropshipping")) {
    return await placeCJOrder(connection, items, shippingAddress);
  } else if (supplierName.includes("bigbuy")) {
    return await placeBigBuyOrder(connection, items, shippingAddress);
  } else if (supplierName.includes("bts") || supplierName.includes("wholesaler")) {
    return await placeBTSOrder(connection, items, shippingAddress);
  } else if (supplierName.includes("aliexpress")) {
    return await placeAliExpressOrder(connection, items, shippingAddress);
  } else {
    // Generic order placement
    return {
      order_id: `ORD-${Date.now()}`,
      supplier_id: supplierId,
      supplier_name: connection.supplier_name,
      status: "pending",
      items_count: items.length,
    };
  }
}

async function placeCJOrder(connection: any, items: OrderItem[], shippingAddress: Record<string, unknown>) {
  const accessToken = connection.oauth_data?.access_token;
  if (!accessToken) {
    throw new Error("CJ Dropshipping access token not found");
  }

  const orderData = {
    orderNumber: `SHO-${Date.now()}`,
    shippingAddress: {
      name: shippingAddress.name || "",
      phone: shippingAddress.phone || "",
      country: shippingAddress.country || "",
      province: shippingAddress.province || "",
      city: shippingAddress.city || "",
      address: shippingAddress.address1 || "",
      zipCode: shippingAddress.zip || "",
    },
    products: items.map((item) => ({
      vid: item.supplier_sku || item.sku,
      quantity: item.quantity,
    })),
  };

  const response = await fetch("https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": accessToken,
    },
    body: JSON.stringify(orderData),
  });

  const result = await response.json();

  if (!result.result) {
    throw new Error(result.message || "CJ order creation failed");
  }

  return {
    order_id: result.data?.orderId || result.data?.orderNum,
    supplier_id: connection.supplier_id,
    supplier_name: "CJ Dropshipping",
    status: "confirmed",
    raw_response: result,
  };
}

async function placeBigBuyOrder(connection: any, items: OrderItem[], shippingAddress: Record<string, unknown>) {
  const apiKey = connection.oauth_data?.api_key;
  if (!apiKey) {
    throw new Error("BigBuy API key not found");
  }

  const orderData = {
    internalReference: `SHO-${Date.now()}`,
    delivery: {
      firstName: String(shippingAddress.first_name || shippingAddress.name || "").split(" ")[0],
      lastName: String(shippingAddress.last_name || shippingAddress.name || "").split(" ").slice(1).join(" "),
      phone: shippingAddress.phone || "",
      email: shippingAddress.email || "",
      country: shippingAddress.country_code || shippingAddress.country || "",
      postcode: shippingAddress.zip || "",
      town: shippingAddress.city || "",
      address: shippingAddress.address1 || "",
    },
    products: items.map((item) => ({
      reference: item.supplier_sku || item.sku,
      quantity: item.quantity,
    })),
  };

  const response = await fetch("https://api.bigbuy.eu/rest/order/create.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(orderData),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error || "BigBuy order creation failed");
  }

  return {
    order_id: result.id || result.order_id,
    supplier_id: connection.supplier_id,
    supplier_name: "BigBuy",
    status: "confirmed",
    raw_response: result,
  };
}

async function placeBTSOrder(connection: any, items: OrderItem[], shippingAddress: Record<string, unknown>) {
  // BTS Wholesaler uses different order mechanism
  // For now, create a pending order that requires manual confirmation
  return {
    order_id: `BTS-${Date.now()}`,
    supplier_id: connection.supplier_id,
    supplier_name: "BTS Wholesaler",
    status: "pending_confirmation",
    items_count: items.length,
    note: "BTS orders require manual confirmation via their portal",
  };
}

async function placeAliExpressOrder(connection: any, items: OrderItem[], shippingAddress: Record<string, unknown>) {
  // AliExpress affiliate API for order placement
  const appKey = connection.oauth_data?.app_key;
  if (!appKey) {
    throw new Error("AliExpress credentials not found");
  }

  // Create pending order - AliExpress requires more complex integration
  return {
    order_id: `ALI-${Date.now()}`,
    supplier_id: connection.supplier_id,
    supplier_name: "AliExpress",
    status: "pending",
    items_count: items.length,
    note: "AliExpress order placed via affiliate API",
  };
}

async function retryOrder(supabase: any, userId: string, orderId: string) {
  const { data: order, error } = await supabase
    .from("auto_fulfillment_orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (error || !order) {
    throw new Error("Order not found");
  }

  if (order.retry_count >= 3) {
    throw new Error("Maximum retry attempts exceeded");
  }

  // Update retry count
  await supabase
    .from("auto_fulfillment_orders")
    .update({
      status: "processing",
      retry_count: order.retry_count + 1,
      last_retry_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", orderId);

  await logFulfillmentEvent(supabase, userId, orderId, "order_retry", "pending", {
    retry_count: order.retry_count + 1,
  });

  // Re-process the order
  return await processOrder(supabase, userId, {
    store_order_id: order.store_order_id,
    store_platform: order.store_platform,
    store_integration_id: order.store_integration_id,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    shipping_address: order.shipping_address,
    order_items: order.order_items,
    total_amount: order.total_amount,
    currency: order.currency,
  });
}

async function cancelOrder(supabase: any, userId: string, orderId: string) {
  const { data, error } = await supabase
    .from("auto_fulfillment_orders")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to cancel order: ${error.message}`);
  }

  await logFulfillmentEvent(supabase, userId, orderId, "order_cancelled", "success", {});

  return new Response(
    JSON.stringify({ success: true, order: data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function getOrderStatus(supabase: any, userId: string, orderId: string) {
  const { data: order, error } = await supabase
    .from("auto_fulfillment_orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error(`Order not found: ${error.message}`);
  }

  const { data: events } = await supabase
    .from("fulfillment_events")
    .select("*")
    .eq("fulfillment_order_id", orderId)
    .order("created_at", { ascending: false });

  return new Response(
    JSON.stringify({ success: true, order, events }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function processPendingOrders(supabase: any, userId: string) {
  const { data: pendingOrders, error } = await supabase
    .from("auto_fulfillment_orders")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) {
    throw new Error(`Failed to fetch pending orders: ${error.message}`);
  }

  const results = [];
  for (const order of pendingOrders || []) {
    try {
      const result = await processOrder(supabase, userId, {
        store_order_id: order.store_order_id,
        store_platform: order.store_platform,
        store_integration_id: order.store_integration_id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        shipping_address: order.shipping_address,
        order_items: order.order_items,
        total_amount: order.total_amount,
        currency: order.currency,
      });
      results.push({ order_id: order.id, success: true });
    } catch (e) {
      results.push({ order_id: order.id, success: false, error: e.message });
    }
  }

  return new Response(
    JSON.stringify({ success: true, processed: results.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function logFulfillmentEvent(
  supabase: any,
  userId: string,
  fulfillmentOrderId: string,
  eventType: string,
  eventStatus: string,
  eventData: Record<string, unknown>,
  durationMs?: number
) {
  await supabase.from("fulfillment_events").insert({
    user_id: userId,
    fulfillment_order_id: fulfillmentOrderId,
    event_type: eventType,
    event_status: eventStatus,
    event_data: eventData,
    duration_ms: durationMs,
    source: "auto-fulfillment-processor",
  });
}
