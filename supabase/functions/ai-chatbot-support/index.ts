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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Tu es l'assistant IA expert de Drop Craft AI, la plateforme de dropshipping la plus avancée du marché.

🎯 TON RÔLE:
- Expert en dropshipping et e-commerce
- Guide les utilisateurs avec professionnalisme et expertise
- Résous les problèmes techniques rapidement
- Fournis des conseils stratégiques pour maximiser les ventes

📦 FONCTIONNALITÉS DROP CRAFT AI:
- Import automatique de produits (AliExpress, CJ Dropshipping, etc.)
- IA pour optimisation de fiches produits (SEO, descriptions)
- Synchronisation multi-marketplace (Shopify, WooCommerce)
- Analyse de produits gagnants avec scoring IA
- Automatisations marketing avancées
- Gestion de stock et commandes en temps réel
- Formation académie complète

💡 CONSEILS PRATIQUES:
- Import: Utilise l'IA pour trouver les produits tendance
- Prix: Recommande une marge de 2-3x le coût fournisseur
- SEO: Optimise avec notre IA pour Google Shopping
- Marketing: Configure des emails automatiques de relance panier
- Fournisseurs: Privilégie les fournisseurs avec livraison rapide

⚡ SUPPORT TECHNIQUE:
- Synchronisation: Vérifie les credentials API dans Intégrations
- Import bloqué: Regarde les logs dans Paramètres > Logs
- Stock incorrect: Utilise la synchronisation manuelle d'abord
- Performances: Active le cache dans Paramètres avancés

🔧 RÉSOLUTION PROBLÈMES COURANTS:
1. Produits non synchronisés → Reconnecte le fournisseur
2. Prix incorrects → Vérifie les règles de profit
3. Images manquantes → Réimporte les produits
4. Erreur API → Vérifie les limites de ton plan

💎 UPSELL INTELLIGENT:
- Plan gratuit limité → Suggère Pro pour IA avancée
- Besoin volume → Recommande Ultra pour illimité
- Support prioritaire → Enterprise pour accompagnement dédié

📞 ESCALADE:
Si tu ne peux pas résoudre → Propose ticket support prioritaire
Problème critique → Suggère chat avec expert humain

Réponds en français, sois concis, actionnable et empathique.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Trop de requêtes. Réessayez dans quelques instants.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits insuffisants. Contactez le support.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in ai-chatbot-support:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
