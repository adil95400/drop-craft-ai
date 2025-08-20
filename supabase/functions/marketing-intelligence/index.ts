import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error('Invalid auth token');
    }

    console.log(`Marketing Intelligence action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'create_campaign':
        return await createCampaign(user.id, data);
      
      case 'launch_campaign':
        return await launchCampaign(user.id, data);
      
      case 'analyze_performance':
        return await analyzeCampaignPerformance(user.id, data);
      
      case 'create_segment':
        return await createAudienceSegment(user.id, data);
      
      case 'generate_ad_copy':
        return await generateAdCopy(user.id, data);
      
      case 'optimize_campaign':
        return await optimizeCampaign(user.id, data);
      
      case 'get_insights':
        return await getMarketingInsights(user.id);
      
      case 'export_report':
        return await exportReport(user.id, data);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in marketing intelligence function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function createCampaign(userId: string, data: any) {
  const {
    name,
    description,
    type, // email, ads, social, retargeting
    budget_total,
    target_audience,
    content,
    scheduled_at
  } = data;

  if (!name || !type) {
    throw new Error('Campaign name and type are required');
  }

  console.log(`Creating ${type} campaign: ${name}`);

  // Create campaign in database
  const { data: campaign, error } = await supabase
    .from('marketing_campaigns')
    .insert({
      user_id: userId,
      name,
      description,
      type,
      budget_total,
      target_audience: target_audience || {},
      content: content || {},
      scheduled_at,
      status: scheduled_at ? 'scheduled' : 'draft',
      settings: {
        auto_optimize: true,
        track_opens: type === 'email',
        track_clicks: true,
        frequency_cap: type === 'ads' ? 3 : null,
        bid_strategy: type === 'ads' ? 'maximize_conversions' : null
      },
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        cpc: 0,
        ctr: 0,
        conversion_rate: 0
      }
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }

  // If it's an AI-powered campaign, generate optimized content
  if (data.use_ai && openAIApiKey) {
    const aiContent = await generateCampaignContent(type, target_audience, content);
    
    // Update campaign with AI-generated content
    await supabase
      .from('marketing_campaigns')
      .update({
        content: { ...content, ...aiContent }
      })
      .eq('id', campaign.id);
    
    campaign.content = { ...content, ...aiContent };
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      campaign
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateCampaignContent(campaignType: string, targetAudience: any, baseContent: any) {
  if (!openAIApiKey) {
    return {};
  }

  const prompt = `Create optimized marketing content for a ${campaignType} campaign:

Target Audience: ${JSON.stringify(targetAudience)}
Base Content: ${JSON.stringify(baseContent)}

Generate:
1. Compelling headline (under 60 characters)
2. Primary text/description (engaging, action-oriented)
3. Call-to-action buttons (3 variations)
4. Subject line (for email campaigns)
5. Hashtags (for social campaigns)

Make it conversion-focused for French e-commerce market.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'You are an expert digital marketing copywriter specializing in French e-commerce campaigns.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 600,
      }),
    });

    const aiResult = await response.json();
    const generatedContent = aiResult.choices[0].message.content;

    // Parse generated content (simplified extraction)
    const headlineMatch = generatedContent.match(/(?:headline|titre)[:\s]*(.+?)(?:\n|$)/i);
    const headline = headlineMatch ? headlineMatch[1].trim() : '';

    const ctaMatch = generatedContent.match(/call-to-action[:\s]*(.+?)(?:\n|$)/i);
    const cta = ctaMatch ? ctaMatch[1].trim() : 'Découvrir maintenant';

    const subjectMatch = generatedContent.match(/subject line[:\s]*(.+?)(?:\n|$)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : '';

    return {
      ai_generated: true,
      headline,
      cta,
      subject_line: subject,
      full_content: generatedContent
    };
  } catch (error) {
    console.error('Error generating AI content:', error);
    return {};
  }
}

async function launchCampaign(userId: string, data: any) {
  const { campaign_id } = data;

  if (!campaign_id) {
    throw new Error('Campaign ID is required');
  }

  // Get campaign
  const { data: campaign, error: fetchError } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', campaign_id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status === 'active') {
    throw new Error('Campaign is already active');
  }

  console.log(`Launching campaign: ${campaign.name}`);

  // Update campaign status
  const { error: updateError } = await supabase
    .from('marketing_campaigns')
    .update({
      status: 'active',
      started_at: new Date().toISOString()
    })
    .eq('id', campaign_id);

  if (updateError) {
    console.error('Error launching campaign:', updateError);
    throw updateError;
  }

  // Simulate initial campaign setup and delivery
  setTimeout(async () => {
    // Simulate some initial metrics after campaign launch
    const initialMetrics = generateInitialMetrics(campaign.type, campaign.budget_total);
    
    await supabase
      .from('marketing_campaigns')
      .update({
        metrics: initialMetrics,
        budget_spent: initialMetrics.spend
      })
      .eq('id', campaign_id);
    
    console.log(`Initial metrics updated for campaign: ${campaign.name}`);
  }, 5000);

  return new Response(
    JSON.stringify({ 
      success: true, 
      campaign_id,
      message: `Campaign "${campaign.name}" launched successfully`,
      estimated_reach: calculateEstimatedReach(campaign)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function generateInitialMetrics(campaignType: string, budget: number) {
  const baseMultiplier = campaignType === 'email' ? 100 : campaignType === 'social' ? 50 : 25;
  
  const impressions = Math.floor(Math.random() * 1000 * baseMultiplier) + (100 * baseMultiplier);
  const clicks = Math.floor(impressions * (0.02 + Math.random() * 0.08)); // 2-10% CTR
  const conversions = Math.floor(clicks * (0.05 + Math.random() * 0.15)); // 5-20% conversion rate
  const spend = budget ? Math.min(budget * 0.1, Math.random() * 100 + 10) : 0;
  
  return {
    impressions,
    clicks,
    conversions,
    spend,
    cpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0,
    ctr: Math.round((clicks / impressions) * 10000) / 100,
    conversion_rate: clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0,
    roas: spend > 0 ? Math.round((conversions * 25 / spend) * 100) / 100 : 0 // Assuming 25€ average order value
  };
}

function calculateEstimatedReach(campaign: any) {
  let baseReach = 1000;
  
  switch (campaign.type) {
    case 'email':
      baseReach = 5000;
      break;
    case 'social':
      baseReach = 15000;
      break;
    case 'ads':
      baseReach = campaign.budget_total ? campaign.budget_total * 100 : 10000;
      break;
    case 'retargeting':
      baseReach = 2000;
      break;
  }
  
  return Math.floor(baseReach * (0.8 + Math.random() * 0.4)); // +/- 20% variation
}

async function analyzeCampaignPerformance(userId: string, data: any) {
  const { campaign_id, period = '7d' } = data;

  if (!campaign_id) {
    throw new Error('Campaign ID is required');
  }

  const { data: campaign, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', campaign_id)
    .eq('user_id', userId)
    .single();

  if (error || !campaign) {
    throw new Error('Campaign not found');
  }

  console.log(`Analyzing performance for campaign: ${campaign.name}`);

  // Simulate performance data over time
  const performanceData = generatePerformanceTimeSeries(campaign, period);
  const insights = await generatePerformanceInsights(campaign, performanceData);

  return new Response(
    JSON.stringify({ 
      success: true, 
      campaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status
      },
      performance: performanceData,
      insights,
      recommendations: insights.recommendations
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function generatePerformanceTimeSeries(campaign: any, period: string) {
  const days = period === '30d' ? 30 : period === '14d' ? 14 : 7;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dayData = {
      date: date.toISOString().split('T')[0],
      impressions: Math.floor(Math.random() * 2000) + 500,
      clicks: Math.floor(Math.random() * 100) + 20,
      conversions: Math.floor(Math.random() * 10) + 2,
      spend: Math.round((Math.random() * 50 + 10) * 100) / 100
    };
    
    dayData.ctr = Math.round((dayData.clicks / dayData.impressions) * 10000) / 100;
    dayData.conversion_rate = Math.round((dayData.conversions / dayData.clicks) * 10000) / 100;
    dayData.cpc = Math.round((dayData.spend / dayData.clicks) * 100) / 100;
    
    data.push(dayData);
  }
  
  return data;
}

async function generatePerformanceInsights(campaign: any, performanceData: any[]) {
  const totalImpressions = performanceData.reduce((sum, d) => sum + d.impressions, 0);
  const totalClicks = performanceData.reduce((sum, d) => sum + d.clicks, 0);
  const totalConversions = performanceData.reduce((sum, d) => sum + d.conversions, 0);
  const totalSpend = performanceData.reduce((sum, d) => sum + d.spend, 0);
  
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  
  const recommendations = [];
  
  if (avgCTR < 2) {
    recommendations.push({
      type: 'ctr_improvement',
      priority: 'high',
      message: 'Le taux de clic est faible. Testez de nouvelles créatives ou améliorez votre ciblage.',
      impact: 'Peut augmenter le CTR de 20-40%'
    });
  }
  
  if (avgConversionRate < 5) {
    recommendations.push({
      type: 'conversion_optimization',
      priority: 'medium',
      message: 'Le taux de conversion peut être amélioré. Optimisez votre page de destination.',
      impact: 'Peut augmenter les conversions de 15-30%'
    });
  }
  
  if (avgCPC > 2) {
    recommendations.push({
      type: 'cost_optimization',
      priority: 'medium',
      message: 'Le coût par clic est élevé. Affinez votre ciblage ou ajustez vos enchères.',
      impact: 'Peut réduire le CPC de 10-25%'
    });
  }
  
  return {
    summary: {
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_conversions: totalConversions,
      total_spend: Math.round(totalSpend * 100) / 100,
      avg_ctr: Math.round(avgCTR * 100) / 100,
      avg_conversion_rate: Math.round(avgConversionRate * 100) / 100,
      avg_cpc: Math.round(avgCPC * 100) / 100,
      roas: totalSpend > 0 ? Math.round((totalConversions * 25 / totalSpend) * 100) / 100 : 0
    },
    trends: {
      ctr_trend: calculateTrend(performanceData.map(d => d.ctr)),
      conversion_trend: calculateTrend(performanceData.map(d => d.conversion_rate)),
      spend_trend: calculateTrend(performanceData.map(d => d.spend))
    },
    recommendations
  };
}

function calculateTrend(values: number[]) {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
  
  const change = (secondAvg - firstAvg) / firstAvg;
  
  if (change > 0.1) return 'rising';
  if (change < -0.1) return 'declining';
  return 'stable';
}

async function createAudienceSegment(userId: string, data: any) {
  const { name, description, criteria } = data;

  if (!name || !criteria) {
    throw new Error('Segment name and criteria are required');
  }

  console.log(`Creating audience segment: ${name}`);

  // Simulate audience size calculation
  const estimatedCount = Math.floor(Math.random() * 5000) + 100;

  const { data: segment, error } = await supabase
    .from('marketing_segments')
    .insert({
      user_id: userId,
      name,
      description,
      criteria,
      contact_count: estimatedCount
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating segment:', error);
    throw error;
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      segment: {
        ...segment,
        estimated_reach: estimatedCount,
        growth_rate: Math.round((Math.random() * 20 - 5) * 100) / 100 // -5% to +15%
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateAdCopy(userId: string, data: any) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const { product, target_audience, platform, tone = 'professional' } = data;

  if (!product || !platform) {
    throw new Error('Product and platform are required');
  }

  console.log(`Generating ad copy for ${platform} platform`);

  const prompt = `Create compelling ad copy for ${platform} advertising:

Product: ${JSON.stringify(product)}
Target Audience: ${JSON.stringify(target_audience)}
Tone: ${tone}
Platform: ${platform}

Generate multiple variations including:
1. Headlines (3-5 variations, optimized for ${platform})
2. Primary text/descriptions (engaging and conversion-focused)
3. Call-to-action buttons (3 variations)
4. Display URL suggestions

Focus on French market and e-commerce best practices.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: 'You are an expert advertising copywriter specializing in French digital marketing and e-commerce.' },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 800,
    }),
  });

  const aiResult = await response.json();
  const generatedCopy = aiResult.choices[0].message.content;

  // Save generated content
  const { data: savedContent } = await supabase
    .from('generated_content')
    .insert({
      user_id: userId,
      content_type: 'ad_copy',
      target_keyword: product.name || 'product',
      generated_content: generatedCopy,
      ai_model: 'gpt-5-mini-2025-08-07',
      tokens_used: aiResult.usage?.total_tokens || 0
    })
    .select()
    .single();

  return new Response(
    JSON.stringify({ 
      success: true, 
      ad_copy: generatedCopy,
      platform,
      variations: parseAdVariations(generatedCopy),
      content_id: savedContent?.id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function parseAdVariations(content: string) {
  // Simple parsing of generated variations
  const headlines = [];
  const descriptions = [];
  const ctas = [];

  const lines = content.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('headline') || trimmed.toLowerCase().includes('titre')) {
      currentSection = 'headlines';
    } else if (trimmed.toLowerCase().includes('description') || trimmed.toLowerCase().includes('text')) {
      currentSection = 'descriptions';
    } else if (trimmed.toLowerCase().includes('call-to-action') || trimmed.toLowerCase().includes('cta')) {
      currentSection = 'ctas';
    } else if (trimmed.match(/^\d+\./)) {
      const text = trimmed.replace(/^\d+\.\s*/, '');
      if (currentSection === 'headlines') headlines.push(text);
      else if (currentSection === 'descriptions') descriptions.push(text);
      else if (currentSection === 'ctas') ctas.push(text);
    }
  }

  return {
    headlines: headlines.length > 0 ? headlines : ['Titre optimisé par IA'],
    descriptions: descriptions.length > 0 ? descriptions : ['Description générée par IA'],
    ctas: ctas.length > 0 ? ctas : ['Découvrir maintenant', 'Acheter maintenant', 'En savoir plus']
  };
}

async function optimizeCampaign(userId: string, data: any) {
  const { campaign_id, optimization_goals = ['conversions'] } = data;

  if (!campaign_id) {
    throw new Error('Campaign ID is required');
  }

  const { data: campaign, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('id', campaign_id)
    .eq('user_id', userId)
    .single();

  if (error || !campaign) {
    throw new Error('Campaign not found');
  }

  console.log(`Optimizing campaign: ${campaign.name}`);

  // Simulate AI-powered optimization
  const optimizations = {
    audience_refinements: [
      'Exclusion des audiences avec faible engagement',
      'Expansion vers des lookalike audiences performantes',
      'Ajustement des paramètres démographiques'
    ],
    bid_adjustments: [
      'Augmentation des enchères sur les créneaux performants',
      'Réduction des enchères sur les placements sous-performants',
      'Optimisation pour les conversions plutôt que les clics'
    ],
    creative_recommendations: [
      'Test de nouvelles créatives basées sur les meilleures performances',
      'Rotation automatique des annonces',
      'Adaptation du message selon l\'audience'
    ],
    budget_reallocation: {
      recommended_daily_budget: Math.round(campaign.budget_total * 0.15),
      high_performing_segments: ['Mobile 25-34 ans', 'Desktop 35-44 ans'],
      suggested_increase: '+25%'
    }
  };

  // Update campaign with optimization flags
  await supabase
    .from('marketing_campaigns')
    .update({
      settings: {
        ...campaign.settings,
        last_optimized: new Date().toISOString(),
        optimization_applied: true,
        optimization_goals
      }
    })
    .eq('id', campaign_id);

  return new Response(
    JSON.stringify({ 
      success: true, 
      campaign_id,
      optimizations,
      estimated_improvement: {
        ctr_increase: '+15-25%',
        conversion_rate_increase: '+10-20%',
        cost_reduction: '-10-15%'
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getMarketingInsights(userId: string) {
  // Get campaigns
  const { data: campaigns, error: campaignsError } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (campaignsError) {
    console.error('Error fetching campaigns:', campaignsError);
    throw campaignsError;
  }

  // Get segments
  const { data: segments, error: segmentsError } = await supabase
    .from('marketing_segments')
    .select('*')
    .eq('user_id', userId);

  if (segmentsError) {
    console.error('Error fetching segments:', segmentsError);
    throw segmentsError;
  }

  const insights = {
    campaigns: {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      total_budget: campaigns.reduce((sum, c) => sum + (c.budget_total || 0), 0),
      total_spent: campaigns.reduce((sum, c) => sum + (c.budget_spent || 0), 0),
      avg_roas: calculateAverageROAS(campaigns),
      best_performing: campaigns
        .filter(c => c.metrics?.roas > 0)
        .sort((a, b) => (b.metrics?.roas || 0) - (a.metrics?.roas || 0))
        .slice(0, 3)
    },
    segments: {
      total: segments.length,
      total_contacts: segments.reduce((sum, s) => sum + (s.contact_count || 0), 0),
      avg_growth_rate: segments.reduce((sum, s) => sum + (Math.random() * 10), 0) / segments.length || 0
    },
    recommendations: [
      {
        type: 'budget_optimization',
        priority: 'high',
        message: 'Réallouer 20% du budget vers les campagnes les plus performantes',
        potential_impact: '+30% ROI'
      },
      {
        type: 'audience_expansion',
        priority: 'medium',
        message: 'Créer des lookalike audiences basées sur vos meilleurs clients',
        potential_impact: '+25% portée qualifiée'
      }
    ]
  };

  return new Response(
    JSON.stringify({ 
      success: true, 
      insights
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function calculateAverageROAS(campaigns: any[]) {
  const campaignsWithROAS = campaigns.filter(c => c.metrics?.roas > 0);
  if (campaignsWithROAS.length === 0) return 0;
  
  const totalROAS = campaignsWithROAS.reduce((sum, c) => sum + (c.metrics?.roas || 0), 0);
  return Math.round((totalROAS / campaignsWithROAS.length) * 100) / 100;
}

async function exportReport(userId: string, data: any) {
  const { report_type = 'campaign_performance', period = '30d', format = 'json' } = data;

  console.log(`Exporting ${report_type} report for period: ${period}`);

  // Get campaign data
  const { data: campaigns } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('user_id', userId);

  const reportData = {
    report_type,
    period,
    generated_at: new Date().toISOString(),
    summary: {
      total_campaigns: campaigns?.length || 0,
      active_campaigns: campaigns?.filter(c => c.status === 'active').length || 0,
      total_budget: campaigns?.reduce((sum, c) => sum + (c.budget_total || 0), 0) || 0,
      total_spent: campaigns?.reduce((sum, c) => sum + (c.budget_spent || 0), 0) || 0
    },
    campaigns: campaigns?.map(c => ({
      name: c.name,
      type: c.type,
      status: c.status,
      budget: c.budget_total,
      spent: c.budget_spent,
      metrics: c.metrics || {}
    })) || []
  };

  return new Response(
    JSON.stringify({ 
      success: true, 
      report: reportData,
      download_url: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reportData, null, 2))}`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}