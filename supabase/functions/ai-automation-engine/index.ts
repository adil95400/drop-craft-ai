import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { ruleId, inputData, userId } = await req.json();

    console.log('AI Automation Engine - Processing rule:', { ruleId, userId });

    // Récupérer la règle d'automatisation
    const { data: rule, error: ruleError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('user_id', userId)
      .single();

    if (ruleError || !rule) {
      throw new Error('Rule not found');
    }

    // Analyser les données avec l'IA
    const aiAnalysis = await analyzeAutomationData(rule, inputData);

    // Déterminer les actions à prendre
    const decisions = await generateAutomationDecisions(rule, inputData, aiAnalysis);

    // Exécuter les actions si appropriées
    const results = await executeAutomationActions(supabase, decisions, userId);

    // Mettre à jour les métriques de performance
    await updateRulePerformance(supabase, ruleId, results);

    return new Response(JSON.stringify({
      success: true,
      analysis: aiAnalysis,
      decisions: decisions,
      results: results,
      executedActions: results.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI automation engine:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeAutomationData(rule: any, inputData: any) {
  const prompt = `
Analysez les données suivantes pour la règle d'automatisation "${rule.name}" de type "${rule.rule_type}":

Conditions de déclenchement: ${JSON.stringify(rule.trigger_conditions)}
Conditions IA: ${JSON.stringify(rule.ai_conditions)}
Données d'entrée: ${JSON.stringify(inputData)}

Analysez:
1. Si les conditions sont remplies
2. La probabilité de succès des actions
3. Les risques potentiels
4. Les recommandations d'optimisation

Répondez en JSON avec: shouldTrigger, confidence, riskLevel, recommendations, reasoning
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [
        { 
          role: 'system', 
          content: 'Tu es un expert en automatisation e-commerce et intelligence artificielle. Analyse les données et fournis des recommandations précises en JSON.' 
        },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 1000,
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    return {
      shouldTrigger: false,
      confidence: 0,
      riskLevel: 'high',
      recommendations: ['Erreur d\'analyse IA'],
      reasoning: content
    };
  }
}

async function generateAutomationDecisions(rule: any, inputData: any, analysis: any) {
  if (!analysis.shouldTrigger) {
    return [];
  }

  const decisions = [];

  // Générer des décisions basées sur le type de règle
  for (const action of rule.actions) {
    const decision = {
      ruleId: rule.id,
      actionType: action.type,
      parameters: action.parameters,
      confidence: analysis.confidence,
      riskLevel: analysis.riskLevel,
      reasoning: analysis.reasoning,
      status: 'pending'
    };

    decisions.push(decision);
  }

  return decisions;
}

async function executeAutomationActions(supabase: any, decisions: any[], userId: string) {
  const results = [];

  for (const decision of decisions) {
    try {
      let result = { success: false, message: 'Not implemented' };

      switch (decision.actionType) {
        case 'update_price':
          result = await updateProductPrice(supabase, decision, userId);
          break;
        case 'adjust_inventory':
          result = await adjustInventoryLevel(supabase, decision, userId);
          break;
        case 'send_notification':
          result = await sendAutomationNotification(supabase, decision, userId);
          break;
        case 'create_campaign':
          result = await createMarketingCampaign(supabase, decision, userId);
          break;
      }

      // Enregistrer la décision
      await supabase.from('automated_decisions').insert({
        user_id: userId,
        decision_type: decision.actionType,
        entity_type: 'automation',
        decision_title: `Automation: ${decision.actionType}`,
        ai_reasoning: decision.reasoning,
        confidence_level: decision.confidence,
        status: result.success ? 'executed' : 'failed',
        executed_at: new Date().toISOString(),
        actual_outcome: result
      });

      results.push({ decision, result });

    } catch (error) {
      console.error('Error executing action:', error);
      results.push({ decision, result: { success: false, error: error.message } });
    }
  }

  return results;
}

async function updateProductPrice(supabase: any, decision: any, userId: string) {
  // Exemple d'action de mise à jour de prix
  return { success: true, message: 'Price update simulated', action: 'price_update' };
}

async function adjustInventoryLevel(supabase: any, decision: any, userId: string) {
  // Exemple d'action d'ajustement de stock
  return { success: true, message: 'Inventory adjustment simulated', action: 'inventory_adjustment' };
}

async function sendAutomationNotification(supabase: any, decision: any, userId: string) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title: 'Automation Alert',
    message: `Automated action executed: ${decision.actionType}`,
    type: 'automation'
  });

  return { success: !error, message: error ? error.message : 'Notification sent' };
}

async function createMarketingCampaign(supabase: any, decision: any, userId: string) {
  // Exemple de création de campagne marketing
  return { success: true, message: 'Marketing campaign creation simulated', action: 'campaign_creation' };
}

async function updateRulePerformance(supabase: any, ruleId: string, results: any[]) {
  const successRate = results.filter(r => r.result.success).length / results.length * 100;
  
  await supabase
    .from('automation_rules')
    .update({
      execution_count: supabase.raw('execution_count + 1'),
      success_rate: successRate,
      last_executed_at: new Date().toISOString(),
      performance_metrics: { lastResults: results }
    })
    .eq('id', ruleId);
}