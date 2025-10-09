import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, platform, data } = await req.json();

    let result;
    switch (action) {
      case 'connect':
        result = await connectPlatform(supabaseClient, user.id, platform, data);
        break;
      case 'sync_campaigns':
        result = await syncCampaigns(supabaseClient, user.id, platform);
        break;
      case 'create_campaign':
        result = await createCampaign(supabaseClient, user.id, platform, data);
        break;
      case 'update_campaign':
        result = await updateCampaign(supabaseClient, user.id, platform, data);
        break;
      case 'get_performance':
        result = await getPerformance(supabaseClient, user.id, platform, data.campaignId);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ads-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function connectPlatform(supabase: any, userId: string, platform: string, data: any) {
  const { error } = await supabase
    .from('ads_platform_connections')
    .upsert({
      user_id: userId,
      platform,
      account_id: data.accountId,
      account_name: data.accountName,
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
      token_expires_at: data.tokenExpiresAt,
      is_active: true,
      sync_status: 'connected',
      last_sync_at: new Date().toISOString(),
      metadata: data.metadata || {}
    });

  if (error) throw error;

  return {
    success: true,
    message: `Successfully connected to ${platform}`,
    platform,
  };
}

async function syncCampaigns(supabase: any, userId: string, platform: string) {
  // Simulate syncing campaigns from the platform
  const mockCampaigns = [
    {
      user_id: userId,
      campaign_name: `${platform} Campaign 1`,
      platform,
      campaign_type: 'conversion',
      status: 'active',
      budget_total: 1000,
      budget_spent: 450,
      budget_daily: 50,
      external_campaign_id: `${platform}_${Math.random().toString(36).substr(2, 9)}`,
      performance_metrics: {
        impressions: 15000,
        clicks: 750,
        conversions: 45,
        ctr: 5.0,
        cpc: 0.60,
        roas: 3.2
      }
    },
    {
      user_id: userId,
      campaign_name: `${platform} Campaign 2`,
      platform,
      campaign_type: 'traffic',
      status: 'active',
      budget_total: 500,
      budget_spent: 200,
      budget_daily: 25,
      external_campaign_id: `${platform}_${Math.random().toString(36).substr(2, 9)}`,
      performance_metrics: {
        impressions: 8000,
        clicks: 400,
        conversions: 20,
        ctr: 5.0,
        cpc: 0.50,
        roas: 2.5
      }
    }
  ];

  const { error } = await supabase
    .from('ad_campaigns')
    .upsert(mockCampaigns, { onConflict: 'external_campaign_id' });

  if (error) throw error;

  // Update last sync time
  await supabase
    .from('ads_platform_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('platform', platform);

  return {
    success: true,
    message: `Synced ${mockCampaigns.length} campaigns from ${platform}`,
    campaignsCount: mockCampaigns.length
  };
}

async function createCampaign(supabase: any, userId: string, platform: string, data: any) {
  const campaignData = {
    user_id: userId,
    campaign_name: data.campaignName,
    platform,
    campaign_type: data.campaignType,
    status: 'active',
    budget_total: data.budgetTotal,
    budget_daily: data.budgetDaily,
    target_audience: data.targetAudience,
    ad_creative: data.adCreative,
    ai_generated: data.aiGenerated || false,
    ab_test_config: data.abTestConfig || {},
    external_campaign_id: `${platform}_${Math.random().toString(36).substr(2, 9)}`,
    started_at: new Date().toISOString()
  };

  const { data: campaign, error } = await supabase
    .from('ad_campaigns')
    .insert(campaignData)
    .select()
    .single();

  if (error) throw error;

  // Create A/B test variants if configured
  if (data.abTestVariants && data.abTestVariants.length > 0) {
    const variants = data.abTestVariants.map((variant: any) => ({
      user_id: userId,
      campaign_id: campaign.id,
      variant_name: variant.name,
      ad_creative: variant.adCreative,
      traffic_allocation: variant.trafficAllocation
    }));

    await supabase.from('ab_test_variants').insert(variants);
  }

  return {
    success: true,
    message: 'Campaign created successfully',
    campaign
  };
}

async function updateCampaign(supabase: any, userId: string, platform: string, data: any) {
  const { error } = await supabase
    .from('ad_campaigns')
    .update({
      status: data.status,
      budget_daily: data.budgetDaily,
      performance_metrics: data.performanceMetrics
    })
    .eq('id', data.campaignId)
    .eq('user_id', userId);

  if (error) throw error;

  return {
    success: true,
    message: 'Campaign updated successfully'
  };
}

async function getPerformance(supabase: any, userId: string, platform: string, campaignId: string) {
  const { data: campaign, error } = await supabase
    .from('ad_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  // Simulate real-time performance data
  const performance = {
    ...campaign.performance_metrics,
    lastUpdated: new Date().toISOString(),
    trend: {
      impressions: '+12%',
      clicks: '+8%',
      conversions: '+15%'
    }
  };

  return {
    success: true,
    performance,
    campaign
  };
}
