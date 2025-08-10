import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      task, 
      productData, 
      marketData, 
      language = 'fr',
      tone = 'professional',
      length = 'medium' 
    } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (task) {
      case 'product_description':
        systemPrompt = `Tu es un expert en copywriting e-commerce spécialisé dans la création de descriptions produits optimisées pour les conversions. Tu maîtrises parfaitement le SEO et les techniques de persuasion.`;
        userPrompt = `Crée une description produit ${length} en ${language} avec un ton ${tone} pour:
        
        Produit: ${productData.name}
        Prix: ${productData.price}€
        Catégorie: ${productData.category}
        Caractéristiques: ${JSON.stringify(productData.attributes || {})}
        
        La description doit:
        - Mettre en avant les bénéfices clients
        - Être optimisée SEO avec des mots-clés naturels
        - Créer un sentiment d'urgence
        - Inclure des arguments de vente convaincants
        - Être structurée et facile à lire`;
        break;

      case 'seo_optimization':
        systemPrompt = `Tu es un expert SEO spécialisé dans l'optimisation de contenu e-commerce. Tu connais parfaitement les algorithmes de recherche et les meilleures pratiques.`;
        userPrompt = `Optimise le contenu SEO pour:
        
        Produit: ${productData.name}
        Description actuelle: ${productData.description}
        Catégorie: ${productData.category}
        Prix: ${productData.price}€
        
        Fournis:
        1. Un titre SEO optimisé (max 60 caractères)
        2. Une méta description (max 160 caractères)
        3. 5-10 mots-clés principaux
        4. 5 mots-clés longue traîne
        5. Une description optimisée avec intégration naturelle des mots-clés
        
        Langue: ${language}`;
        break;

      case 'price_optimization':
        systemPrompt = `Tu es un expert en pricing e-commerce avec une connaissance approfondie de la psychologie des prix et des stratégies de tarification.`;
        userPrompt = `Analyse et optimise la stratégie de prix pour:
        
        Produit: ${productData.name}
        Prix actuel: ${productData.price}€
        Prix coûtant: ${productData.cost_price}€
        Catégorie: ${productData.category}
        Concurrence: ${JSON.stringify(marketData?.competitors || [])}
        Ventes actuelles: ${productData.sales_count || 0}
        
        Fournis:
        1. Prix optimal recommandé avec justification
        2. 3 stratégies de pricing alternatives
        3. Analyse de la marge et du positionnement
        4. Recommandations pour les promotions
        5. Prix psychologiques (ex: 19.99€ vs 20€)`;
        break;

      case 'market_analysis':
        systemPrompt = `Tu es un analyste marché expert en e-commerce, spécialisé dans l'analyse de tendances et l'identification d'opportunités commerciales.`;
        userPrompt = `Analyse le marché pour:
        
        Produit: ${productData.name}
        Catégorie: ${productData.category}
        Prix: ${productData.price}€
        Données de vente: ${JSON.stringify(marketData?.salesData || {})}
        
        Fournis:
        1. Analyse de la position concurrentielle
        2. Identification des tendances du marché
        3. Opportunités de croissance
        4. Risques et menaces
        5. Recommandations stratégiques
        6. Score de potentiel commercial (1-10)`;
        break;

      case 'category_suggestion':
        systemPrompt = `Tu es un expert en classification produits e-commerce avec une connaissance approfondie des taxonomies commerciales.`;
        userPrompt = `Suggère la meilleure catégorisation pour:
        
        Produit: ${productData.name}
        Description: ${productData.description}
        Attributs: ${JSON.stringify(productData.attributes || {})}
        
        Fournis:
        1. Catégorie principale recommandée
        2. 2-3 sous-catégories pertinentes
        3. Tags de classification
        4. Justification du choix
        5. Catégories alternatives`;
        break;

      default:
        throw new Error(`Task '${task}' not supported`);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      content: aiContent,
      task,
      language,
      usage: data.usage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-optimizer function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process AI optimization request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});