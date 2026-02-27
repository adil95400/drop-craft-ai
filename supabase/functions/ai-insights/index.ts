/**
 * AI Insights - Secure Edge Function
 * SECURITY: JWT authentication + rate limiting + input validation
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from '../_shared/cors.ts';
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts';
import { parseJsonValidated, z } from '../_shared/validators.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';

const BodySchema = z.object({
  analysisType: z.enum([
    'sales_trends', 
    'customer_behavior', 
    'inventory_optimization', 
    'conversion_optimization', 
    'fraud_detection'
  ]),
  data: z.record(z.any()).optional().default({}),
  timeRange: z.string().max(20).optional().default('30d'),
  metrics: z.array(z.string().max(50)).max(20).optional().default(['sales', 'conversion', 'traffic'])
});

serve(
  withErrorHandler(async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // SECURITY: Authenticate user via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ValidationError('Authorization required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new ValidationError('Invalid authentication');
    }
    
    const userId = userData.user.id;
    console.log(`[AI-INSIGHTS] User ${userId} requesting analysis`);

    // SECURITY: Rate limiting - 10 AI insights requests per hour
    const rateLimitOk = await checkRateLimit(
      supabase,
      `ai_insights:${userId}`,
      10,
      3600000
    );
    if (!rateLimitOk) {
      throw new ValidationError('Rate limit exceeded. Please try again later.');
    }

    // Validate input
    const { analysisType, data, timeRange, metrics } = await parseJsonValidated(req, BodySchema);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI service not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    // Sanitize data to prevent injection - remove any very long strings
    const sanitizedData = JSON.stringify(data).slice(0, 10000);

    switch (analysisType) {
      case 'sales_trends':
        systemPrompt = `Tu es un analyste commercial expert en e-commerce, spécialisé dans l'analyse de données de vente et l'identification de tendances.`;
        userPrompt = `Analyse les tendances de vente sur ${timeRange}:
        
        Données: ${sanitizedData}
        
        Fournis:
        1. Tendances principales identifiées
        2. Produits en croissance vs déclin
        3. Saisonnalité détectée
        4. Prédictions pour les prochaines périodes
        5. Recommandations d'actions commerciales`;
        break;

      case 'customer_behavior':
        systemPrompt = `Tu es un expert en analyse comportementale client et en CRM, spécialisé dans l'e-commerce.`;
        userPrompt = `Analyse le comportement client:
        
        Données: ${sanitizedData}
        
        Fournis:
        1. Profils types de clients identifiés
        2. Parcours d'achat principaux
        3. Points de friction détectés
        4. Opportunités d'amélioration UX
        5. Stratégies de rétention personnalisées`;
        break;

      case 'inventory_optimization':
        systemPrompt = `Tu es un expert en gestion des stocks et supply chain pour l'e-commerce.`;
        userPrompt = `Optimise la gestion des stocks:
        
        Données: ${sanitizedData}
        
        Fournis:
        1. Niveaux de stock optimaux par produit
        2. Alertes de réapprovisionnement
        3. Produits en surstockage
        4. Prédictions de demande
        5. Stratégies de liquidation`;
        break;

      case 'conversion_optimization':
        systemPrompt = `Tu es un expert en optimisation de conversion e-commerce (CRO).`;
        userPrompt = `Analyse et optimise les conversions:
        
        Données: ${sanitizedData}
        
        Fournis:
        1. Analyse des taux de conversion par segment
        2. Goulots d'étranglement identifiés
        3. Recommandations d'amélioration UX
        4. Tests A/B suggérés
        5. Estimation d'impact sur le CA`;
        break;

      case 'fraud_detection':
        systemPrompt = `Tu es un expert en détection de fraudes e-commerce et en cybersécurité.`;
        userPrompt = `Analyse les risques de fraude:
        
        Données: ${sanitizedData}
        
        Fournis:
        1. Score de risque par transaction
        2. Patterns de fraude détectés
        3. Recommandations de sécurité
        4. Règles de prévention suggérées
        5. Plan d'action préventif`;
        break;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new ValidationError('Rate limit exceeded. Please try again later.');
      }
      throw new Error('AI service unavailable');
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices[0].message.content;

    // Generate actionable insights
    const insightsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un consultant e-commerce expert. Transforme cette analyse en recommandations concrètes et priorisées avec des indicateurs de ROI estimés.' 
          },
          { 
            role: 'user', 
            content: `Basé sur cette analyse: ${analysis.slice(0, 3000)}\n\nCrée des recommandations SMART avec priorités et ROI estimé.` 
          }
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    const insightsData = await insightsResponse.json();
    const actionableInsights = insightsData.choices?.[0]?.message?.content || '';

    console.log(`[AI-INSIGHTS] Analysis complete for user ${userId}`);

    return new Response(JSON.stringify({ 
      analysis,
      actionableInsights,
      analysisType,
      timeRange,
      metrics,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }, corsHeaders)
);
