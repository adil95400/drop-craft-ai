/**
 * AI Insights — Unified AI Client with retry + cache
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts';
import { parseJsonValidated, z } from '../_shared/validators.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';
import { callOpenAI } from '../_shared/ai-client.ts';

const BodySchema = z.object({
  analysisType: z.enum(['sales_trends', 'customer_behavior', 'inventory_optimization', 'conversion_optimization', 'fraud_detection']),
  data: z.record(z.any()).optional().default({}),
  timeRange: z.string().max(20).optional().default('30d'),
  metrics: z.array(z.string().max(50)).max(20).optional().default(['sales', 'conversion', 'traffic'])
});

serve(
  withErrorHandler(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) throw new ValidationError('Authorization required');
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new ValidationError('Invalid authentication');
    const userId = userData.user.id;

    const rateLimitOk = await checkRateLimit(supabase, `ai_insights:${userId}`, 10, 3600000);
    if (!rateLimitOk) throw new ValidationError('Rate limit exceeded.');

    const { analysisType, data, timeRange, metrics } = await parseJsonValidated(req, BodySchema);
    const sanitizedData = JSON.stringify(data).slice(0, 10000);

    const prompts: Record<string, { system: string; user: string }> = {
      sales_trends: {
        system: 'Tu es un analyste commercial expert en e-commerce.',
        user: `Analyse les tendances de vente sur ${timeRange}:\nDonnées: ${sanitizedData}\n\nFournis: tendances principales, produits croissance/déclin, saisonnalité, prédictions, recommandations.`
      },
      customer_behavior: {
        system: 'Tu es un expert en analyse comportementale client CRM e-commerce.',
        user: `Analyse le comportement client:\nDonnées: ${sanitizedData}\n\nFournis: profils types, parcours achat, points friction, opportunités UX, stratégies rétention.`
      },
      inventory_optimization: {
        system: 'Tu es un expert en gestion des stocks et supply chain e-commerce.',
        user: `Optimise la gestion des stocks:\nDonnées: ${sanitizedData}\n\nFournis: niveaux optimaux, alertes réapprovisionnement, surstockage, prédictions demande, stratégies liquidation.`
      },
      conversion_optimization: {
        system: 'Tu es un expert en optimisation de conversion e-commerce (CRO).',
        user: `Analyse et optimise les conversions:\nDonnées: ${sanitizedData}\n\nFournis: taux par segment, goulots, recommandations UX, tests A/B, estimation impact CA.`
      },
      fraud_detection: {
        system: 'Tu es un expert en détection de fraudes e-commerce.',
        user: `Analyse les risques de fraude:\nDonnées: ${sanitizedData}\n\nFournis: score risque, patterns fraude, recommandations sécurité, règles prévention, plan préventif.`
      }
    };

    const p = prompts[analysisType];

    // First call: main analysis
    const analysisResult = await callOpenAI(
      [{ role: 'system', content: p.system }, { role: 'user', content: p.user }],
      { module: 'automation', temperature: 0.3, maxTokens: 3000, enableCache: true }
    );
    const analysis = analysisResult.choices[0].message.content;

    // Second call: actionable insights
    const insightsResult = await callOpenAI(
      [
        { role: 'system', content: 'Tu es un consultant e-commerce expert. Transforme cette analyse en recommandations SMART avec priorités et ROI estimé.' },
        { role: 'user', content: `Basé sur: ${analysis.slice(0, 3000)}\n\nCrée des recommandations priorisées.` }
      ],
      { module: 'automation', temperature: 0.5, maxTokens: 2000 }
    );
    const actionableInsights = insightsResult.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({
      analysis, actionableInsights, analysisType, timeRange, metrics,
      generatedAt: new Date().toISOString()
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }, corsHeaders)
);
