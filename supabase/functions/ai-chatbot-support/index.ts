/**
 * AI Chatbot Support - Secured Implementation
 * P0.1: JWT authentication required
 * P0.4: Secure CORS with allowlist
 * P0.6: Rate limiting per user
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { getSecureCorsHeaders, handleCorsPreflightSecure, isAllowedOrigin } from '../_shared/secure-cors.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }
  
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }
  
  return { user, supabase };
}

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin');
    if (!origin || !isAllowedOrigin(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // P0.1: Require authentication
    const { user } = await authenticateUser(req);
    
    // P0.6: Rate limiting - 30 requests per minute for chat
    const rateLimitResult = await checkRateLimit(user.id, 'ai_chatbot', 30, 1);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Limite de requêtes atteinte. Réessayez dans quelques instants.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const messages = body.messages;
    
    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize messages - limit length and content
    const sanitizedMessages = messages.slice(-20).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content.substring(0, 4000) : ''
    }));
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY_CHAT') || Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...sanitizedMessages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Trop de requêtes OpenAI. Réessayez dans quelques instants.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in ai-chatbot-support:', error);
    
    const status = error.message?.includes('Authentication') ? 401 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
