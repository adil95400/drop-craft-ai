import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    let userId = "";
    let productIds: string[] = [];
    let action = "full_optimization";
    let batchSize = 10;

    if (body.userId && body.productIds && body.action) {
      userId = body.userId;
      productIds = body.productIds;
      action = body.action;
      batchSize = body.batchSize || 10;
    } else if (body.filter_criteria && body.enrichment_types) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Missing authorization");
      const token = authHeader.replace("Bearer ", "");
      const tmpClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      );
      const { data: { user }, error: ue } = await tmpClient.auth.getUser(token);
      if (ue || !user) throw new Error("Invalid session");

      userId = user.id;
      productIds = body.filter_criteria?.product_ids || [];
      const types: string[] = body.enrichment_types || [];
      if (types.includes("full")) action = "full_optimization";
      else if (types.includes("seo")) action = "generate_seo";
      else if (types.includes("description")) action = "rewrite_descriptions";
      else if (types.includes("title")) action = "rewrite_titles";
      else if (types.includes("attributes")) action = "complete_attributes";
      else if (types.includes("pricing")) action = "optimize_pricing";
      else action = "full_optimization";
      batchSize = body.limit || 10;
    } else {
      throw new Error("Missing required parameters");
    }

    if (!userId || productIds.length === 0) {
      throw new Error("userId and productIds are required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const results: { productId: string; success: boolean; error?: string }[] = [];

    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);

      for (const pid of batch) {
        try {
          const { data: product } = await supabase
            .from("products")
            .select("*")
            .eq("id", pid)
            .eq("user_id", userId)
            .single();

          let imported = null;
          if (!product) {
            const { data } = await supabase
              .from("imported_products")
              .select("*")
              .eq("id", pid)
              .eq("user_id", userId)
              .single();
            imported = data;
          }

          const current = product || imported;
          if (!current) continue;

          let updates: Record<string, unknown> = {};

          switch (action) {
            case "rewrite_titles":
              updates.name = optimizeTitle(current);
              break;
            case "rewrite_descriptions":
              updates.description = optimizeDesc(current);
              break;
            case "complete_attributes":
              updates = { category: current.category || "General", tags: current.tags || ["nouveau"] };
              break;
            case "generate_seo":
              updates.seo_title = (current.name || "Produit").substring(0, 60);
              updates.seo_description = `Achetez ${current.name || "ce produit"} au meilleur prix.`.substring(0, 160);
              break;
            case "fix_spelling":
              updates.name = (current.name || "").replace(/\s+/g, " ").trim();
              updates.description = (current.description || "").replace(/\s+/g, " ").trim();
              break;
            case "optimize_images":
              updates.image_alt = `${current.name || "Produit"} - ${current.category || ""}`;
              break;
            case "optimize_pricing": {
              const cost = current.cost_price || (current.price || 0) * 0.6;
              updates.price = Math.round(cost * 1.4 * 100) / 100;
              break;
            }
            case "full_optimization":
              updates = {
                name: optimizeTitle(current),
                description: optimizeDesc(current),
                seo_title: (current.name || "Produit").substring(0, 60),
                seo_description: `Achetez ${current.name || "ce produit"} au meilleur prix.`.substring(0, 160),
              };
              break;
          }

          if (Object.keys(updates).length > 0) {
            const table = product ? "products" : "imported_products";
            await supabase
              .from(table)
              .update({ ...updates, updated_at: new Date().toISOString() })
              .eq("id", pid)
              .eq("user_id", userId);
            results.push({ productId: pid, success: true });
          }
        } catch (e) {
          results.push({ productId: pid, success: false, error: (e as Error).message });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.filter((r) => r.success).length, failed: results.filter((r) => !r.success).length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});

function optimizeTitle(p: Record<string, unknown>): string {
  const t = (p.name as string) || "Produit";
  return t.length < 30 ? `${t} - Haute Qualite` : t;
}

function optimizeDesc(p: Record<string, unknown>): string {
  const n = (p.name as string) || "ce produit";
  return `Decouvrez ${n}, un produit de qualite superieure. Design elegant, livraison rapide, garantie satisfaction.`;
}
