import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
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

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'system', 
          content: 'Tu es un expert en automatisation e-commerce et intelligence artificielle. Analyse les données et fournis des recommandations précises en JSON.' 
        },
        { role: 'user', content: prompt }
      ],
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
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

  for (const action of rule.actions || []) {
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
  const { productId, newPrice, reason } = decision.parameters || {};
  
  if (!productId || !newPrice) {
    return { success: false, message: 'Missing productId or newPrice in parameters' };
  }

  // Get current price for logging
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('price, title')
    .eq('id', productId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !product) {
    return { success: false, message: 'Product not found' };
  }

  const oldPrice = product.price;

  // Update the price
  const { error: updateError } = await supabase
    .from('products')
    .update({ 
      price: newPrice,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)
    .eq('user_id', userId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  // Log the price change
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'automation_price_update',
    entity_type: 'product',
    entity_id: productId,
    description: `Price updated from ${oldPrice}€ to ${newPrice}€ via automation`,
    details: { oldPrice, newPrice, reason, productTitle: product.title }
  });

  return { 
    success: true, 
    message: `Price updated for ${product.title}: ${oldPrice}€ → ${newPrice}€`,
    action: 'price_update',
    details: { oldPrice, newPrice }
  };
}

async function adjustInventoryLevel(supabase: any, decision: any, userId: string) {
  const { productId, quantityChange, reason } = decision.parameters || {};
  
  if (!productId || quantityChange === undefined) {
    return { success: false, message: 'Missing productId or quantityChange in parameters' };
  }

  // Get current stock
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock_quantity, title')
    .eq('id', productId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !product) {
    return { success: false, message: 'Product not found' };
  }

  const oldStock = product.stock_quantity || 0;
  const newStock = Math.max(0, oldStock + quantityChange);

  // Update stock
  const { error: updateError } = await supabase
    .from('products')
    .update({ 
      stock_quantity: newStock,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)
    .eq('user_id', userId);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  // Log the stock change
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'automation_stock_adjustment',
    entity_type: 'product',
    entity_id: productId,
    description: `Stock adjusted from ${oldStock} to ${newStock} via automation`,
    details: { oldStock, newStock, quantityChange, reason, productTitle: product.title }
  });

  return { 
    success: true, 
    message: `Stock adjusted for ${product.title}: ${oldStock} → ${newStock}`,
    action: 'inventory_adjustment',
    details: { oldStock, newStock, quantityChange }
  };
}

async function sendAutomationNotification(supabase: any, decision: any, userId: string) {
  const { title, message, type } = decision.parameters || {};
  
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title: title || 'Automation Alert',
    message: message || `Automated action executed: ${decision.actionType}`,
    type: type || 'automation'
  });

  return { success: !error, message: error ? error.message : 'Notification sent' };
}

async function createMarketingCampaign(supabase: any, decision: any, userId: string) {
  const { campaignName, campaignType, targetProducts, discount } = decision.parameters || {};
  
  if (!campaignName) {
    return { success: false, message: 'Missing campaignName in parameters' };
  }

  const { data: campaign, error } = await supabase
    .from('automated_campaigns')
    .insert({
      user_id: userId,
      name: campaignName,
      trigger_type: 'ai_automation',
      trigger_config: { source: 'automation_engine', decision: decision.ruleId },
      actions: { 
        type: campaignType || 'discount',
        targetProducts: targetProducts || [],
        discount: discount || 0
      },
      is_active: true
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { 
    success: true, 
    message: `Campaign "${campaignName}" created successfully`,
    action: 'campaign_creation',
    campaignId: campaign?.id
  };
}

async function updateRulePerformance(supabase: any, ruleId: string, results: any[]) {
  const successCount = results.filter(r => r.result.success).length;
  const successRate = results.length > 0 ? (successCount / results.length * 100) : 0;
  
  // Get current execution count
  const { data: rule } = await supabase
    .from('automation_rules')
    .select('trigger_count')
    .eq('id', ruleId)
    .single();

  const newCount = (rule?.trigger_count || 0) + 1;

  await supabase
    .from('automation_rules')
    .update({
      trigger_count: newCount,
      last_triggered_at: new Date().toISOString()
    })
    .eq('id', ruleId);
}
