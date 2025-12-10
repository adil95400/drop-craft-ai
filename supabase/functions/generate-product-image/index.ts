// GÉNÉRATION D'IMAGES PRODUITS VIA IA
// Edge function pour générer des images de produits avec Lovable AI
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
    const { productId, productName, productDescription, style } = await req.json();

    if (!productId || !productName) {
      return new Response(
        JSON.stringify({ error: "productId et productName requis" }),
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

    // Créer le prompt pour la génération d'image
    const imageStyle = style || "professional product photography";
    const prompt = `Create a high-quality ${imageStyle} image of: ${productName}. ${productDescription ? `Description: ${productDescription}.` : ''} The image should be clean, well-lit, on a white or neutral background, suitable for e-commerce. Professional product shot, studio lighting, 4K quality.`;

    console.log(`🎨 Génération d'image pour: ${productName}`);

    // Appel à Lovable AI pour la génération d'image
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes dépassée, réessayez plus tard" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants pour la génération d'images" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("❌ Erreur Lovable AI:", response.status, errorText);
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    
    // Extraire l'URL de l'image générée
    let imageUrl = null;
    
    // Le modèle d'image retourne généralement l'URL dans le content
    if (data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      
      // Chercher une URL d'image dans la réponse
      const urlMatch = content.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(jpg|jpeg|png|webp|gif)/i);
      if (urlMatch) {
        imageUrl = urlMatch[0];
      }
    }

    // Si on a une image, mettre à jour le produit
    if (imageUrl) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Mettre à jour le produit avec l'image
      const { error: updateError } = await supabase
        .from("products")
        .update({ 
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", productId);

      if (updateError) {
        console.error("❌ Erreur mise à jour produit:", updateError);
      } else {
        console.log(`✅ Image générée et sauvegardée pour: ${productName}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl,
          productId,
          message: "Image générée avec succès"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: retourner un placeholder si pas d'image générée
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Impossible de générer l'image",
        productId
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erreur génération image:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erreur inconnue" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
