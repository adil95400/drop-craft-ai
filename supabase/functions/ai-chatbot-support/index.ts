/**
 * AI Chatbot Support — Streaming via Unified AI Client
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { getSecureCorsHeaders, isAllowedOrigin } from '../_shared/secure-cors.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';
import { callOpenAI } from '../_shared/ai-client.ts';

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin');
    if (!origin || !isAllowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) throw new Error('Authentication required');
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims) throw new Error('Invalid or expired token');
    const userId = data.claims.sub;

    const rateLimitResult = await checkRateLimit(user.id, 'ai_chatbot', 30, 1);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: 'Limite de requêtes atteinte.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sanitizedMessages = messages.slice(-20).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: typeof msg.content === 'string' ? msg.content.substring(0, 4000) : ''
    }));

    const systemPrompt = `Tu es l'assistant IA expert de Drop Craft AI, la plateforme de dropshipping la plus avancée.

🎯 TON RÔLE: Expert dropshipping et e-commerce
📦 FONCTIONNALITÉS: Import auto, IA optimisation, sync multi-marketplace, scoring IA, automatisations marketing, gestion stock
💡 CONSEILS: Marges 2-3x, SEO avec IA, emails relance panier, fournisseurs livraison rapide
⚡ SUPPORT: Vérifier credentials API, logs, sync manuelle, cache
💎 UPSELL: Gratuit→Pro (IA avancée), Pro→Ultra (illimité)

Réponds en français, concis, actionnable et empathique.`;

    const response = await callOpenAI(
      [{ role: 'system', content: systemPrompt }, ...sanitizedMessages],
      { module: 'chat', stream: true }
    );

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    const status = (error as any).status || (error.message?.includes('Authentication') ? 401 : 500);
    if (status === 429) {
      return new Response(JSON.stringify({ error: 'Trop de requêtes. Réessayez.' }), {
        status: 429, headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status, headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
