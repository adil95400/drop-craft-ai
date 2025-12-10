// OPTIMISATION PRODUIT VIA IA
// Génère titres, descriptions et prix optimisés
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, optimizations } = await req.json();

    if (!productId) {
      return new Response(
        JSON.stringify({ error: "productId requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer le produit
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      return new Response(
        JSON.stringify({ error: "Produit non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🚀 Optimisation du produit: ${product.name}`);

    // Préparer le prompt pour l'optimisation
    const prompt = `Tu es un expert en e-commerce et copywriting. Optimise ce produit pour maximiser les ventes.

Produit actuel:
- Nom: ${product.name}
- Description: ${product.description || 'Aucune description'}
- Prix: ${product.price}€
- Catégorie: ${product.category || 'Non catégorisé'}

Génère une version optimisée avec:
1. Un titre accrocheur et SEO-friendly (max 60 caractères)
2. Une description persuasive (150-300 caractères) avec bénéfices clés
3. 5 mots-clés pertinents pour le SEO
4. Un prix suggéré si pertinent

Réponds UNIQUEMENT en JSON avec ce format exact:
{
  "title": "nouveau titre optimisé",
  "description": "nouvelle description persuasive",
  "seo_keywords": ["mot1", "mot2", "mot3", "mot4", "mot5"],
  "suggested_price": null ou nombre,
  "improvements": ["amélioration 1", "amélioration 2"]
}`;

    // Appel à Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Tu es un assistant e-commerce expert. Réponds uniquement en JSON valide." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes dépassée" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("Réponse IA vide");
    }

    // Parser la réponse JSON
    let optimization;
    try {
      // Extraire le JSON de la réponse (peut être entouré de ```json)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        optimization = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON non trouvé dans la réponse");
      }
    } catch (parseError) {
      console.error("Erreur parsing JSON:", parseError);
      throw new Error("Réponse IA invalide");
    }

    // Mettre à jour le produit
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (optimization.title) {
      updates.name = optimization.title;
    }
    if (optimization.description) {
      updates.description = optimization.description;
    }
    if (optimization.seo_keywords) {
      updates.tags = optimization.seo_keywords.join(", ");
    }

    const { error: updateError } = await supabase
      .from("products")
      .update(updates)
      .eq("id", productId);

    if (updateError) {
      console.error("❌ Erreur mise à jour:", updateError);
      throw new Error("Erreur lors de la sauvegarde");
    }

    console.log(`✅ Produit optimisé: ${product.name} -> ${optimization.title}`);

    return new Response(
      JSON.stringify({
        success: true,
        productId,
        original: {
          name: product.name,
          description: product.description
        },
        optimized: optimization,
        message: "Produit optimisé avec succès"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erreur optimisation:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erreur inconnue" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
