import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  title: string;
  description: string;
  category?: string;
  price?: number;
  images?: string[];
  brand?: string;
  gtin?: string;
  sku?: string;
}

interface OptimizationResult {
  productId: string;
  originalTitle: string;
  optimizedTitle?: string;
  originalDescription: string;
  optimizedDescription?: string;
  score: number;
  issues: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    suggestion: string;
  }>;
  suggestions: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, products, feedType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`[feed-optimization-ai] Action: ${action}, Products: ${products?.length || 0}`);

    if (action === 'analyze') {
      // Analyze products for optimization opportunities
      const results = await analyzeProducts(products, feedType, LOVABLE_API_KEY);
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'optimize') {
      // Optimize product content with AI
      const results = await optimizeProducts(products, feedType, LOVABLE_API_KEY);
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'recommendations') {
      // Get AI recommendations for feed improvement
      const recommendations = await getRecommendations(products, feedType, LOVABLE_API_KEY);
      return new Response(JSON.stringify({ recommendations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[feed-optimization-ai] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeProducts(products: Product[], feedType: string, apiKey: string): Promise<OptimizationResult[]> {
  const results: OptimizationResult[] = [];

  for (const product of products.slice(0, 10)) { // Limit to 10 for performance
    const issues: OptimizationResult['issues'] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Title analysis
    if (!product.title || product.title.length < 20) {
      issues.push({
        type: 'title_short',
        severity: 'high',
        message: 'Titre trop court',
        suggestion: 'Ajoutez plus de détails: marque, caractéristiques, taille, couleur'
      });
      score -= 20;
    } else if (product.title.length > 150) {
      issues.push({
        type: 'title_long',
        severity: 'medium',
        message: 'Titre trop long',
        suggestion: 'Gardez les informations essentielles dans les 150 premiers caractères'
      });
      score -= 10;
    }

    // Description analysis
    if (!product.description || product.description.length < 50) {
      issues.push({
        type: 'description_short',
        severity: 'high',
        message: 'Description manquante ou trop courte',
        suggestion: 'Ajoutez une description détaillée avec caractéristiques et avantages'
      });
      score -= 25;
    }

    // Category analysis
    if (!product.category) {
      issues.push({
        type: 'category_missing',
        severity: 'high',
        message: 'Catégorie manquante',
        suggestion: 'Ajoutez une catégorie Google Shopping valide'
      });
      score -= 15;
    }

    // Images analysis
    if (!product.images || product.images.length === 0) {
      issues.push({
        type: 'images_missing',
        severity: 'high',
        message: 'Aucune image produit',
        suggestion: 'Ajoutez au moins une image de haute qualité'
      });
      score -= 20;
    }

    // GTIN analysis
    if (!product.gtin) {
      issues.push({
        type: 'gtin_missing',
        severity: 'medium',
        message: 'GTIN/EAN manquant',
        suggestion: 'Ajoutez le code-barres pour améliorer la visibilité'
      });
      score -= 10;
    }

    // Brand analysis
    if (!product.brand) {
      issues.push({
        type: 'brand_missing',
        severity: 'medium',
        message: 'Marque manquante',
        suggestion: 'Ajoutez la marque du produit'
      });
      score -= 5;
    }

    results.push({
      productId: product.id,
      originalTitle: product.title || '',
      originalDescription: product.description || '',
      score: Math.max(0, score),
      issues,
      suggestions
    });
  }

  return results;
}

async function optimizeProducts(products: Product[], feedType: string, apiKey: string): Promise<OptimizationResult[]> {
  const results: OptimizationResult[] = [];

  for (const product of products.slice(0, 5)) { // Limit for API calls
    try {
      const prompt = `Tu es un expert en optimisation de flux produits e-commerce pour ${feedType || 'Google Shopping'}.

Produit actuel:
- Titre: ${product.title || 'Non défini'}
- Description: ${product.description || 'Non définie'}
- Catégorie: ${product.category || 'Non définie'}
- Marque: ${product.brand || 'Non définie'}

Optimise ce produit pour maximiser sa visibilité et son taux de conversion.
Réponds en JSON avec ce format exact:
{
  "optimizedTitle": "titre optimisé (max 150 caractères, incluant marque et caractéristiques clés)",
  "optimizedDescription": "description optimisée (500-1000 caractères, avantages et caractéristiques)",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5-nano",
          messages: [
            { role: "system", content: "Tu es un expert SEO e-commerce. Réponds uniquement en JSON valide." },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        console.error(`AI API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      
      // Parse JSON from response
      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch {
        parsed = {};
      }

      results.push({
        productId: product.id,
        originalTitle: product.title || '',
        optimizedTitle: parsed.optimizedTitle,
        originalDescription: product.description || '',
        optimizedDescription: parsed.optimizedDescription,
        score: 85,
        issues: [],
        suggestions: parsed.suggestions || []
      });

    } catch (err) {
      console.error(`Error optimizing product ${product.id}:`, err);
    }
  }

  return results;
}

async function getRecommendations(products: Product[], feedType: string, apiKey: string) {
  const stats = {
    total: products.length,
    missingTitle: products.filter(p => !p.title || p.title.length < 20).length,
    missingDescription: products.filter(p => !p.description || p.description.length < 50).length,
    missingCategory: products.filter(p => !p.category).length,
    missingImages: products.filter(p => !p.images || p.images.length === 0).length,
    missingGtin: products.filter(p => !p.gtin).length,
  };

  const prompt = `Analyse ces statistiques de flux produits e-commerce et donne 5 recommandations prioritaires:

Stats du flux (${feedType || 'Google Shopping'}):
- Total produits: ${stats.total}
- Titres courts/manquants: ${stats.missingTitle} (${Math.round(stats.missingTitle/stats.total*100)}%)
- Descriptions courtes/manquantes: ${stats.missingDescription} (${Math.round(stats.missingDescription/stats.total*100)}%)
- Catégories manquantes: ${stats.missingCategory} (${Math.round(stats.missingCategory/stats.total*100)}%)
- Images manquantes: ${stats.missingImages} (${Math.round(stats.missingImages/stats.total*100)}%)
- GTIN manquants: ${stats.missingGtin} (${Math.round(stats.missingGtin/stats.total*100)}%)

Réponds en JSON:
{
  "recommendations": [
    {"priority": 1, "title": "...", "description": "...", "impact": "high|medium|low", "affectedProducts": 0},
    ...
  ],
  "overallScore": 0-100,
  "summary": "résumé court"
}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-nano",
        messages: [
          { role: "system", content: "Tu es un expert en optimisation de flux e-commerce. Réponds en JSON valide." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { recommendations: [], overallScore: 50, summary: 'Analyse non disponible' };

  } catch (err) {
    console.error('Error getting recommendations:', err);
    return {
      recommendations: [
        { priority: 1, title: 'Compléter les descriptions', description: 'Ajoutez des descriptions détaillées', impact: 'high', affectedProducts: stats.missingDescription },
        { priority: 2, title: 'Ajouter les catégories', description: 'Mappez vers Google Shopping', impact: 'high', affectedProducts: stats.missingCategory },
        { priority: 3, title: 'Optimiser les titres', description: 'Incluez marque et caractéristiques', impact: 'medium', affectedProducts: stats.missingTitle },
      ],
      overallScore: Math.round((1 - (stats.missingDescription + stats.missingCategory) / (stats.total * 2)) * 100),
      summary: 'Analyse basée sur les statistiques'
    };
  }
}
