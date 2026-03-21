import { createClient } from "npm:@supabase/supabase-js@2"
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'

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
  const corsHeaders = getSecureCorsHeaders(req)
  if (req.method === "OPTIONS") {
    return handleCorsPreflightSecure(req)
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RLS-scoped client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const { supplierId, thresholdPercent = 5 } = await req.json();

    // Get current products with prices (RLS-scoped to user)
    const { data: currentProducts, error: productsError } = await supabase
      .from("products")
      .select("id, title, sku, price, cost_price, supplier_id")
      .eq("user_id", userId);

    if (productsError) throw productsError;

    // Get price history for comparison
    const { data: priceHistory } = await supabase
      .from("price_history")
      .select("product_id, old_price, new_price, changed_at")
      .order("changed_at", { ascending: false })
      .limit(500);

    const changes: PriceChange[] = [];

    for (const product of currentProducts || []) {
      const history = (priceHistory || []).find(
        (h: any) => h.product_id === product.id
      );
      if (history && product.price !== history.new_price) {
        const changePercent =
          ((product.price - history.new_price) / history.new_price) * 100;
        if (Math.abs(changePercent) >= thresholdPercent) {
          changes.push({
            productId: product.id,
            sku: product.sku || "",
            name: product.title || "",
            oldPrice: history.new_price,
            newPrice: product.price,
            changePercent: Math.round(changePercent * 100) / 100,
            changeType: changePercent > 0 ? "increase" : "decrease",
          });
        }
      }
    }

    // Sort by absolute change
    changes.sort(
      (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
    );

    return new Response(
      JSON.stringify({
        success: true,
        totalProducts: currentProducts?.length || 0,
        changesDetected: changes.length,
        threshold: thresholdPercent,
        changes: changes.slice(0, 50),
        analyzedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[price-change-monitor] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
