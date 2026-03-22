import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { callOpenAI } from '../_shared/ai-client.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // API key resolved by ai-client.ts (module: seo)
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const { action, ...params } = await req.json();

    let systemPrompt: string;
    let userPrompt: string;

    switch (action) {
      case "keyword_research": {
        const { keyword, language = "fr", market = "ecommerce" } = params;
        systemPrompt = `Tu es un expert SEO e-commerce. Retourne UNIQUEMENT un JSON valide, sans markdown, sans explication.`;
        userPrompt = `Recherche de mots-clés pour "${keyword}" dans le marché ${market} en ${language}.

Retourne un JSON avec cette structure exacte:
{
  "keywords": [
    {
      "keyword": "mot-clé exact",
      "volume": 1200,
      "difficulty": 45,
      "cpc": 1.20,
      "competition": "Low|Medium|High",
      "trend": "up|down|stable",
      "intent": "commercial|informational|transactional|navigational",
      "relatedKeywords": ["variante 1", "variante 2"]
    }
  ]
}

Génère 8-12 mots-clés pertinents incluant:
- Le mot-clé principal et ses variantes
- Des mots-clés longue traîne
- Des mots-clés transactionnels (acheter, prix, pas cher)
- Des mots-clés informationnels (comment, meilleur, guide)
Les volumes et difficultés doivent être réalistes pour le marché ${language}.`;
        break;
      }

      case "generate_content": {
        const { keyword, contentType = "product", language = "fr", tone = "professional", productInfo } = params;
        systemPrompt = `Tu es un rédacteur SEO expert en e-commerce. Retourne UNIQUEMENT un JSON valide, sans markdown.`;
        userPrompt = `Génère du contenu SEO optimisé pour le mot-clé "${keyword}" (type: ${contentType}, langue: ${language}, ton: ${tone}).
${productInfo ? `Contexte produit: ${JSON.stringify(productInfo)}` : ""}

Retourne un JSON avec cette structure exacte:
{
  "title": "Titre SEO optimisé (50-60 caractères)",
  "metaDescription": "Meta description optimisée (150-160 caractères)",
  "h1": "Titre H1 principal",
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4", "mot-clé 5"],
  "content": "Paragraphe de contenu optimisé SEO (200-300 mots) avec le mot-clé intégré naturellement",
  "slug": "url-optimisee-seo",
  "openGraphTitle": "Titre Open Graph",
  "openGraphDescription": "Description OG"
}`;
        break;
      }

      case "analyze_positions": {
        const { keywords, domain } = params;
        systemPrompt = `Tu es un outil d'analyse SEO. Retourne UNIQUEMENT un JSON valide, sans markdown.`;
        userPrompt = `Simule une analyse de positions SEO pour le domaine "${domain || 'mon-site.com'}" sur ces mots-clés: ${JSON.stringify(keywords)}.

Pour chaque mot-clé, retourne un JSON:
{
  "positions": [
    {
      "keyword": "le mot-clé",
      "currentPosition": 15,
      "previousPosition": 18,
      "change": 3,
      "volume": 800,
      "difficulty": 40,
      "url": "/page-classee",
      "trend": "up|down|stable",
      "topCompetitors": ["concurrent1.com", "concurrent2.com"]
    }
  ],
  "summary": {
    "avgPosition": 22,
    "top10Count": 2,
    "top30Count": 5,
    "improving": 3,
    "declining": 1
  }
}

Génère des positions réalistes entre 1 et 100. Les mots-clés longue traîne devraient avoir de meilleures positions.`;
        break;
      }

      case "audit_page": {
        const { url, content } = params;
        systemPrompt = `Tu es un auditeur SEO technique expert. Retourne UNIQUEMENT un JSON valide, sans markdown.`;
        userPrompt = `Analyse SEO de la page "${url}".
${content ? `Contenu fourni: ${content.substring(0, 2000)}` : ""}

Retourne un JSON avec cette structure:
{
  "score": 72,
  "title": { "value": "titre actuel", "score": 80, "length": 55, "issues": ["problème 1"] },
  "metaDescription": { "value": "description", "score": 60, "length": 145, "issues": ["trop courte"] },
  "h1": { "value": "h1 actuel", "score": 90, "issues": [] },
  "images": { "total": 5, "withAlt": 3, "score": 60, "issues": ["2 images sans attribut alt"] },
  "links": { "internal": 12, "external": 3, "broken": 0 },
  "performance": { "loadTime": 2.3, "score": 75, "issues": ["images non optimisées"] },
  "mobile": { "friendly": true, "score": 85 },
  "structuredData": { "present": false, "types": [], "issues": ["Aucune donnée structurée détectée"] },
  "recommendations": [
    { "priority": "high", "category": "content", "message": "Ajoutez des mots-clés dans le titre" },
    { "priority": "medium", "category": "technical", "message": "Ajoutez des données structurées JSON-LD" }
  ]
}`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "{}";
    
    // Clean markdown fences if present
    const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", cleaned.substring(0, 500));
      parsed = { error: "Failed to parse AI response", raw: cleaned.substring(0, 200) };
    }

    return new Response(JSON.stringify({ success: true, data: parsed, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seo-ai-engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
