/**
 * AI Automation Engine - Secured Implementation
 * P0.1: JWT authentication required (not from body)
 * P0.4: Secure CORS with allowlist
 * P0.6: Rate limiting per user
 */
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getSecureCorsHeaders, handleCorsPreflightSecure, isAllowedOrigin } from '../_shared/secure-cors.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';
import { z } from 'https://esm.sh/zod@3.22.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Input validation schema
const InputSchema = z.object({
  ruleId: z.string().uuid('Invalid rule ID'),
  inputData: z.record(z.unknown()).optional().default({})
});

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
    // P0.1: Authenticate via JWT - userId from token, NOT from body
    const { user } = await authenticateUser(req);
    const userId = user.id;
    
    // P0.6: Rate limiting
    const rateLimitResult = await checkRateLimit(userId, 'ai_automation', 20, 60);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const parseResult = InputSchema.safeParse(body);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input',
          details: parseResult.error.issues.slice(0, 3).map(i => i.message)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { ruleId, inputData } = parseResult.data;
    
    // Use service role for DB operations but scope to user
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('AI Automation Engine - Processing rule:', { ruleId, userId: userId.slice(0, 8) });

    // P0.1 FIX: Fetch rule with user_id filter - only user's own rules
    const { data: rule, error: ruleError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('user_id', userId) // CRITICAL: User scoping
      .single();

    if (ruleError || !rule) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rule not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze data with AI
    const aiAnalysis = await analyzeAutomationData(rule, inputData);

    // Generate decisions
    const decisions = await generateAutomationDecisions(rule, inputData, aiAnalysis);

    // Execute actions - pass userId for scoping
    const results = await executeAutomationActions(supabase, decisions, userId);

    // Update rule performance
    await updateRulePerformance(supabase, ruleId, userId, results);

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
    const status = error.message?.includes('Authentication') ? 401 : 500;
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status,
      headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeAutomationData(rule: any, inputData: any) {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    console.warn('LOVABLE_API_KEY not configured, using fallback analysis');
    return {
      shouldTrigger: false,
      confidence: 0,
      riskLevel: 'high',
      recommendations: ['AI service not configured'],
      reasoning: 'Fallback mode - AI not available'
    };
  }
  
  const prompt = `
Analysez les données suivantes pour la règle d'automatisation "${rule.name}" de type "${rule.trigger_type}":

Conditions de déclenchement: ${JSON.stringify(rule.trigger_config || {})}
Données d'entrée: ${JSON.stringify(inputData)}

Analysez:
1. Si les conditions sont remplies
2. La probabilité de succès des actions
3. Les risques potentiels
4. Les recommandations d'optimisation

Répondez en JSON avec: shouldTrigger, confidence, riskLevel, recommendations, reasoning
`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un expert en automatisation e-commerce et intelligence artificielle. Analyse les données et fournis des recommandations précises en JSON.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
  } catch (e) {
    console.error('AI analysis error:', e);
    return {
      shouldTrigger: false,
      confidence: 0,
      riskLevel: 'high',
      recommendations: ['Erreur d\'analyse IA'],
      reasoning: 'Analysis failed'
    };
  }
}

async function generateAutomationDecisions(rule: any, inputData: any, analysis: any) {
  if (!analysis.shouldTrigger) {
    return [];
  }

  const decisions = [];
  const actions = rule.action_config?.actions || rule.actions || [];

  for (const action of actions) {
    decisions.push({
      ruleId: rule.id,
      actionType: action.type,
      parameters: action.parameters,
      confidence: analysis.confidence,
      riskLevel: analysis.riskLevel,
      reasoning: analysis.reasoning,
      status: 'pending'
    });
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

      // Log the decision - scoped to user
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

  // P0.1 FIX: Always scope to user
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('price, title')
    .eq('id', productId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !product) {
    return { success: false, message: 'Product not found or access denied' };
  }

  const oldPrice = product.price;

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

  // P0.1 FIX: Always scope to user
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock_quantity, title')
    .eq('id', productId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !product) {
    return { success: false, message: 'Product not found or access denied' };
  }

  const oldStock = product.stock_quantity || 0;
  const newStock = Math.max(0, oldStock + quantityChange);

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

async function updateRulePerformance(supabase: any, ruleId: string, userId: string, results: any[]) {
  const successCount = results.filter(r => r.result.success).length;
  
  // P0.1 FIX: Always scope to user
  const { data: rule } = await supabase
    .from('automation_rules')
    .select('trigger_count')
    .eq('id', ruleId)
    .eq('user_id', userId)
    .single();

  const newCount = (rule?.trigger_count || 0) + 1;

  await supabase
    .from('automation_rules')
    .update({
      trigger_count: newCount,
      last_triggered_at: new Date().toISOString()
    })
    .eq('id', ruleId)
    .eq('user_id', userId);
}
