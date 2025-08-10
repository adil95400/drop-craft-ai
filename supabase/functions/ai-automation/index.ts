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
      campaignType,
      targetAudience,
      products,
      businessGoals,
      budget,
      timeframe = '1 month'
    } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = `Tu es un expert en marketing digital et automatisation, spécialisé dans la création de campagnes e-commerce performantes et de séquences d'emails automatisées.`;
    
    let userPrompt = '';

    switch (campaignType) {
      case 'email_sequence':
        userPrompt = `Crée une séquence d'emails automatisée pour:
        
        Audience cible: ${JSON.stringify(targetAudience)}
        Produits: ${JSON.stringify(products)}
        Objectifs: ${businessGoals}
        Budget: ${budget}€
        Durée: ${timeframe}
        
        Fournis:
        1. Séquence complète de 7 emails avec timing optimal
        2. Objets d'emails accrocheurs
        3. Contenu personnalisé par segment
        4. CTA optimisés pour chaque email
        5. Métriques de suivi recommandées
        6. Tests A/B suggérés`;
        break;

      case 'social_media':
        userPrompt = `Crée une stratégie de médias sociaux pour:
        
        Audience: ${JSON.stringify(targetAudience)}
        Produits: ${JSON.stringify(products)}
        Objectifs: ${businessGoals}
        Budget: ${budget}€
        Période: ${timeframe}
        
        Fournis:
        1. Stratégie par plateforme (Instagram, Facebook, TikTok)
        2. Calendrier de publication sur 4 semaines
        3. Types de contenu optimisés
        4. Hashtags et mots-clés ciblés
        5. Campagnes publicitaires recommandées
        6. KPI et métriques de suivi`;
        break;

      case 'retargeting':
        userPrompt = `Crée une stratégie de retargeting pour:
        
        Segments d'audience: ${JSON.stringify(targetAudience)}
        Produits à promouvoir: ${JSON.stringify(products)}
        Objectifs: ${businessGoals}
        Budget: ${budget}€
        
        Fournis:
        1. Segments de retargeting prioritaires
        2. Messages personnalisés par segment
        3. Séquence de remarketing multi-touchpoints
        4. Créatifs publicitaires suggérés
        5. Enchères et budgets optimisés
        6. Landing pages recommandées`;
        break;

      case 'loyalty_program':
        userPrompt = `Conçois un programme de fidélité pour:
        
        Base client: ${JSON.stringify(targetAudience)}
        Catalogue: ${JSON.stringify(products)}
        Objectifs: ${businessGoals}
        Budget: ${budget}€
        
        Fournis:
        1. Structure du programme de points
        2. Niveaux de fidélité et avantages
        3. Mécaniques d'engagement
        4. Communications automatisées
        5. Récompenses et incentives
        6. ROI et métriques de succès`;
        break;

      case 'content_marketing':
        userPrompt = `Développe une stratégie de content marketing pour:
        
        Audience: ${JSON.stringify(targetAudience)}
        Produits/Services: ${JSON.stringify(products)}
        Objectifs: ${businessGoals}
        Budget: ${budget}€
        Période: ${timeframe}
        
        Fournis:
        1. Calendrier éditorial sur 1 mois
        2. Types de contenu par plateforme
        3. Sujets et angles d'approche
        4. SEO et mots-clés intégrés
        5. Distribution multicanale
        6. Métriques de performance`;
        break;

      default:
        throw new Error(`Campaign type '${campaignType}' not supported`);
    }

    // Generate main campaign strategy
    const strategyResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
        max_tokens: 3000,
      }),
    });

    const strategyData = await strategyResponse.json();
    const strategy = strategyData.choices[0].message.content;

    // Generate automation workflows
    const automationPrompt = `Basé sur cette stratégie marketing: ${strategy}

    Crée des workflows d'automatisation spécifiques avec:
    1. Triggers et conditions précises
    2. Actions automatisées détaillées  
    3. Timing et fréquences optimaux
    4. Personnalisation dynamique
    5. Tests et optimisations continues
    6. Intégrations techniques nécessaires`;

    const automationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un expert en marketing automation et CRM. Crée des workflows techniques précis et actionnables.' 
          },
          { role: 'user', content: automationPrompt }
        ],
        temperature: 0.6,
        max_tokens: 2500,
      }),
    });

    const automationData = await automationResponse.json();
    const automationWorkflows = automationData.choices[0].message.content;

    return new Response(JSON.stringify({ 
      strategy,
      automationWorkflows,
      campaignType,
      targetAudience,
      budget,
      timeframe,
      generatedAt: new Date().toISOString(),
      usage: {
        strategyTokens: strategyData.usage,
        automationTokens: automationData.usage
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-automation function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process AI automation request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});