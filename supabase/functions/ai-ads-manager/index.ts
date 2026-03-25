import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateJSON } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdsManagerRequest {
  action: 'create_campaign' | 'optimize_campaign' | 'cross_platform_roi' | 'audience_suggest' | 'creative_generate';
  platform?: 'facebook' | 'google' | 'tiktok' | 'instagram';
  campaign_id?: string;
  campaign_config?: {
    name: string;
    platform: string;
    objective: 'traffic' | 'conversions' | 'awareness' | 'engagement' | 'sales';
    budget_daily: number;
    budget_total?: number;
    duration_days?: number;
    target_audience?: Record<string, unknown>;
    product_ids?: string[];
  };
  product_ids?: string[];
  date_range?: { from: string; to: string };
}

async function requireAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing authorization header');
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return { user, supabase };
}

async function callAI(systemPrompt: string, userPrompt: string) {
  return generateJSON(systemPrompt, userPrompt, { module: 'marketing', temperature: 0.4, enableCache: true });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, supabase } = await requireAuth(req);
    const body: AdsManagerRequest = await req.json();

    let result: Record<string, unknown>;

    switch (body.action) {
      case 'create_campaign': {
        const config = body.campaign_config!;

        // Get products for ad creatives
        let productsContext = '';
        if (config.product_ids?.length) {
          const { data: products } = await supabase
            .from('products')
            .select('id, title, description, price, image_url, category')
            .eq('user_id', user.id)
            .in('id', config.product_ids)
            .limit(10);
          productsContext = JSON.stringify(products || []);
        }

        const aiResult = await callAI(
          `You are a digital advertising strategist. Create a complete ad campaign plan.
           Return JSON: {
             "campaign": { "name", "objective", "platform", "budget_daily", "budget_total", "duration_days", "estimated_reach", "estimated_clicks", "estimated_cpc", "estimated_conversions" },
             "ad_sets": [{ "name", "targeting": { "age_range", "genders", "interests": string[], "locations": string[], "behaviors": string[] }, "budget_allocation_percent": number, "placement": string[] }],
             "ad_creatives": [{ "headline", "primary_text", "description", "call_to_action", "format": "image"|"video"|"carousel" }],
             "schedule": { "start_time", "end_time", "day_parting": string[] },
             "kpi_targets": { "cpc", "ctr_percent", "roas", "cpa" }
           }`,
          `Platform: ${config.platform}. Objective: ${config.objective}. Daily budget: ${config.budget_daily}€. Duration: ${config.duration_days || 30} days. Products: ${productsContext || 'general store'}.`
        );

        // Store campaign in DB
        const { data: campaign, error } = await supabase
          .from('ad_campaigns')
          .insert({
            user_id: user.id,
            name: config.name,
            platform: config.platform,
            budget: config.budget_total || config.budget_daily * (config.duration_days || 30),
            status: 'draft',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + (config.duration_days || 30) * 86400000).toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        result = { action: 'create_campaign', campaign_id: campaign.id, ...aiResult };
        break;
      }

      case 'optimize_campaign': {
        // Get campaign performance data
        const { data: campaign } = await supabase
          .from('ad_campaigns')
          .select('*')
          .eq('id', body.campaign_id!)
          .eq('user_id', user.id)
          .single();

        if (!campaign) throw new Error('Campaign not found');

        const aiResult = await callAI(
          `You are an ad campaign optimization expert. Analyze performance and suggest improvements.
           Return JSON: {
             "performance_score": number (0-100),
             "status": "healthy"|"underperforming"|"critical",
             "optimizations": [{ "type": "budget"|"targeting"|"creative"|"bidding"|"schedule", "action": string, "expected_improvement_percent": number, "priority": "high"|"medium"|"low", "implementation": string }],
             "budget_reallocation": { "increase_spend": boolean, "suggested_daily_budget": number, "reason": string },
             "a_b_test_suggestions": [{ "element", "variant_a", "variant_b", "hypothesis" }],
             "scaling_ready": boolean,
             "scaling_recommendations": string[]
           }`,
          `Campaign: ${JSON.stringify(campaign)}. CTR: ${campaign.ctr || 0}%, CPC: ${campaign.cpc || 0}€, ROAS: ${campaign.roas || 0}, Spend: ${campaign.spend || 0}€, Conversions: ${campaign.conversions || 0}.`
        );

        result = { action: 'optimize_campaign', campaign_id: campaign.id, ...aiResult };
        break;
      }

      case 'cross_platform_roi': {
        // Get all campaigns across platforms
        const { data: campaigns } = await supabase
          .from('ad_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        // Get ad accounts
        const { data: accounts } = await supabase
          .from('ad_accounts')
          .select('*')
          .eq('user_id', user.id);

        const aiResult = await callAI(
          `You are a cross-platform advertising analyst. Analyze ROI across all platforms.
           Return JSON: {
             "overall_roi": number,
             "total_spend": number,
             "total_revenue": number,
             "platform_breakdown": [{ "platform", "spend", "revenue", "roi", "roas", "cpa", "best_performing_campaign": string, "recommendation": string }],
             "budget_reallocation": [{ "from_platform", "to_platform", "amount", "expected_roi_improvement_percent" }],
             "top_performers": [{ "campaign_name", "platform", "roas", "why": string }],
             "underperformers": [{ "campaign_name", "platform", "issue", "fix": string }],
             "monthly_trend": { "direction": "up"|"down"|"stable", "change_percent": number },
             "recommendations": string[]
           }`,
          `Campaigns: ${JSON.stringify(campaigns || [])}. Ad accounts: ${JSON.stringify(accounts || [])}.`
        );

        result = { action: 'cross_platform_roi', ...aiResult };
        break;
      }

      case 'audience_suggest': {
        // Get product data for audience targeting
        let productsContext = '';
        if (body.product_ids?.length) {
          const { data: products } = await supabase
            .from('products')
            .select('title, description, price, category, tags')
            .eq('user_id', user.id)
            .in('id', body.product_ids)
            .limit(10);
          productsContext = JSON.stringify(products || []);
        }

        // Get existing customer data for lookalike basis
        const { data: customers } = await supabase
          .from('customers')
          .select('country, city, total_orders, total_spent, lifetime_value')
          .eq('user_id', user.id)
          .order('lifetime_value', { ascending: false })
          .limit(50);

        const aiResult = await callAI(
          `You are an audience targeting specialist. Suggest optimal audiences for ad campaigns.
           Return JSON: {
             "audiences": [{
               "name": string,
               "platform": "facebook"|"google"|"tiktok",
               "type": "interest"|"lookalike"|"custom"|"retargeting",
               "targeting": { "age_min": number, "age_max": number, "genders": string[], "interests": string[], "behaviors": string[], "locations": string[] },
               "estimated_size": string,
               "estimated_cpc": number,
               "confidence": number,
               "best_for": string
             }],
             "lookalike_recommendations": [{ "source", "similarity_percent": number, "expected_performance": string }],
             "exclusion_audiences": string[],
             "retargeting_windows": [{ "window_days": number, "audience_type": string, "priority": string }]
           }`,
          `Platform: ${body.platform || 'all'}. Products: ${productsContext || 'general e-commerce'}. Top customers: ${JSON.stringify(customers || [])}.`
        );

        result = { action: 'audience_suggest', ...aiResult };
        break;
      }

      case 'creative_generate': {
        // Get products for creatives
        const { data: products } = await supabase
          .from('products')
          .select('title, description, price, image_url, category')
          .eq('user_id', user.id)
          .in('id', body.product_ids || [])
          .limit(5);

        const aiResult = await callAI(
          `You are a creative ad copywriter. Generate compelling ad creatives for multiple platforms.
           Return JSON: {
             "creatives": [{
               "platform": "facebook"|"google"|"tiktok"|"instagram",
               "format": "single_image"|"carousel"|"video_script"|"story",
               "headline": string (max 40 chars),
               "primary_text": string (max 125 chars),
               "description": string,
               "call_to_action": string,
               "hook": string,
               "emotional_trigger": string,
               "urgency_element": string | null,
               "hashtags": string[]
             }],
             "a_b_variants": [{ "element_changed", "variant_a", "variant_b" }],
             "video_script": { "hook_3s": string, "problem_5s": string, "solution_10s": string, "cta_3s": string, "total_duration_seconds": number },
             "copy_angles": [{ "angle", "target_emotion", "example_headline" }]
           }`,
          `Products: ${JSON.stringify(products || [])}. Platform: ${body.platform || 'all'}. Generate creatives optimized for each platform.`
        );

        result = { action: 'creative_generate', ...aiResult };
        break;
      }

      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
