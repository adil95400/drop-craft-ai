import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PriceChange {
  productId: string;
  sku: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  changeType: "increase" | "decrease";
}

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

    const { supplierId, thresholdPercent = 5 } = await req.json();

    // Get current products with prices
    const { data: currentProducts, error: productsError } = await supabase
      .from("supplier_products")
      .select("id, external_product_id, name, sku, price, supplier_id")
      .eq("user_id", user.id)
      .eq("supplier_id", supplierId);

    if (productsError) throw productsError;

    const priceChanges: PriceChange[] = [];
    const significantChanges: PriceChange[] = [];

    for (const product of currentProducts || []) {
      const { data: priceHistory } = await supabase
        .from("price_history")
        .select("price, created_at")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false })
        .limit(2);

      if (priceHistory && priceHistory.length >= 2) {
        const currentPrice = priceHistory[0].price;
        const previousPrice = priceHistory[1].price;

        if (currentPrice !== previousPrice) {
          const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
          const changeType = currentPrice > previousPrice ? "increase" : "decrease";

          const change: PriceChange = {
            productId: product.id,
            sku: product.sku || "",
            name: product.name,
            oldPrice: previousPrice,
            newPrice: currentPrice,
            changePercent: Math.abs(changePercent),
            changeType,
          };

          priceChanges.push(change);

          if (Math.abs(changePercent) >= thresholdPercent) {
            significantChanges.push(change);

            await supabase.from("notifications").insert({
              user_id: user.id,
              type: "price_change",
              title: `Changement de prix: ${product.name}`,
              message: `Prix ${changeType === "increase" ? "augmenté" : "diminué"} de ${Math.abs(changePercent).toFixed(1)}% (${previousPrice}€ → ${currentPrice}€)`,
              severity: Math.abs(changePercent) >= 10 ? "high" : "medium",
              metadata: { change },
            });
          }
        }
      }
    }

    const summary = {
      totalProducts: currentProducts?.length || 0,
      priceChanges: priceChanges.length,
      significantChanges: significantChanges.length,
      averageChange: priceChanges.length > 0
        ? priceChanges.reduce((sum, c) => sum + c.changePercent, 0) / priceChanges.length
        : 0,
    };

    return new Response(
      JSON.stringify({ success: true, summary, priceChanges, significantChanges }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Price monitoring error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
