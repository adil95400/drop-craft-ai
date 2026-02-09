import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { supplierId, threshold = 10 } = await req.json();

    // Get all products from supplier
    const { data: products, error: productsError } = await supabase
      .from("supplier_products")
      .select("*")
      .eq("user_id", user.id)
      .eq("supplier_id", supplierId);

    if (productsError) throw productsError;

    const alerts: any[] = [];
    const outOfStock: any[] = [];
    const lowStock: any[] = [];
    let checkedCount = 0;

    for (const product of products || []) {
      checkedCount++;

      if (product.stock_quantity === 0) {
        outOfStock.push({
          sku: product.sku,
          name: product.name,
          stock: 0,
          lastChecked: product.last_synced_at,
        });

        await supabase.from("supplier_notifications").insert({
          user_id: user.id,
          supplier_id: supplierId,
          notification_type: "out_of_stock",
          severity: "high",
          title: `Rupture de stock: ${product.name}`,
          message: `${product.name} (${product.sku}) est en rupture de stock`,
          data: { product_id: product.id, sku: product.sku, stock: 0 },
        });

        alerts.push({ type: "out_of_stock", severity: "high", product });
      } else if (product.stock_quantity <= threshold) {
        lowStock.push({
          sku: product.sku,
          name: product.name,
          stock: product.stock_quantity,
          threshold,
          lastChecked: product.last_synced_at,
        });

        await supabase.from("supplier_notifications").insert({
          user_id: user.id,
          supplier_id: supplierId,
          notification_type: "low_stock",
          severity: "medium",
          title: `Stock bas: ${product.name}`,
          message: `${product.name} (${product.sku}) n'a plus que ${product.stock_quantity} unités`,
          data: { product_id: product.id, sku: product.sku, stock: product.stock_quantity, threshold },
        });

        alerts.push({ type: "low_stock", severity: "medium", product });
      }
    }

    // Check alternatives for OOS products
    const alternatives: any[] = [];
    for (const outItem of outOfStock) {
      const { data: mappings } = await supabase
        .from("product_supplier_mapping")
        .select("*, supplier:supplier_id(*)")
        .eq("user_id", user.id)
        .eq("product_sku", outItem.sku)
        .eq("is_active", true)
        .gt("stock_quantity", 0)
        .order("priority", { ascending: true });

      if (mappings && mappings.length > 0) {
        alternatives.push({
          sku: outItem.sku,
          name: outItem.name,
          alternativeSuppliers: mappings.map((m: any) => ({
            supplierId: m.supplier_id,
            supplierName: m.supplier?.name || "Unknown",
            stock: m.stock_quantity,
            price: m.supplier_price,
          })),
        });
      }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "stock_monitoring",
      entity_type: "supplier",
      entity_id: supplierId,
      description: `Vérifié ${checkedCount} produits: ${outOfStock.length} ruptures, ${lowStock.length} stocks bas`,
      details: { checked: checkedCount, out_of_stock: outOfStock.length, low_stock: lowStock.length, threshold },
    });

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          totalChecked: checkedCount,
          outOfStock: outOfStock.length,
          lowStock: lowStock.length,
          alertsCreated: alerts.length,
        },
        outOfStock,
        lowStock,
        alternatives,
        alerts: alerts.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Stock monitoring error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
