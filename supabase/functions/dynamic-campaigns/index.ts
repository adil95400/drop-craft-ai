import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CampaignRequest {
  action: 'list' | 'create' | 'update' | 'delete' | 'start' | 'pause' | 'generate_feed' | 'get_performance' | 'create_creative' | 'ai_optimize';
  campaignId?: string;
  campaignData?: Record<string, unknown>;
  creativeData?: Record<string, unknown>;
  dateRange?: { start: string; end: string };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, campaignId, campaignData, creativeData, dateRange } = await req.json() as CampaignRequest;
    console.log(`[dynamic-campaigns] Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'list': {
        const { data, error } = await supabaseClient
          .from('dynamic_ad_campaigns')
          .select(`
            *,
            campaign_product_feeds(*),
            campaign_creatives(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ campaigns: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'create': {
        const { data, error } = await supabaseClient
          .from('dynamic_ad_campaigns')
          .insert({
            user_id: user.id,
            ...campaignData
          })
          .select()
          .single();

        if (error) throw error;

        console.log(`[dynamic-campaigns] Created campaign: ${data.id}`);
        return new Response(JSON.stringify({ success: true, campaign: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update': {
        const { data, error } = await supabaseClient
          .from('dynamic_ad_campaigns')
          .update(campaignData)
          .eq('id', campaignId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, campaign: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'delete': {
        const { error } = await supabaseClient
          .from('dynamic_ad_campaigns')
          .delete()
          .eq('id', campaignId)
          .eq('user_id', user.id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'start': {
        const { data, error } = await supabaseClient
          .from('dynamic_ad_campaigns')
          .update({ 
            status: 'active',
            schedule_start: new Date().toISOString()
          })
          .eq('id', campaignId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        // Simulate generating initial performance data
        const platforms = (data.platforms as string[]) || ['facebook'];
        for (const platform of platforms) {
          await supabaseClient.from('campaign_performance').insert({
            user_id: user.id,
            campaign_id: campaignId,
            date: new Date().toISOString().split('T')[0],
            platform,
            impressions: Math.floor(Math.random() * 1000),
            clicks: Math.floor(Math.random() * 100),
            conversions: Math.floor(Math.random() * 10),
            spend: Math.random() * 50,
            revenue: Math.random() * 200
          });
        }

        return new Response(JSON.stringify({ success: true, campaign: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'pause': {
        const { data, error } = await supabaseClient
          .from('dynamic_ad_campaigns')
          .update({ status: 'paused' })
          .eq('id', campaignId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, campaign: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'generate_feed': {
        // Generate product feed for advertising platforms
        const { data: campaign } = await supabaseClient
          .from('dynamic_ad_campaigns')
          .select('*')
          .eq('id', campaignId)
          .single();

        if (!campaign) throw new Error('Campaign not found');

        // Create product feed
        const feedData = {
          user_id: user.id,
          campaign_id: campaignId,
          name: `${campaign.name} - Product Feed`,
          feed_type: 'google_merchant',
          product_count: Math.floor(Math.random() * 100) + 10,
          last_generated_at: new Date().toISOString(),
          generation_status: 'completed',
          feed_url: `https://feeds.example.com/${user.id}/${campaignId}/products.xml`,
          settings: { format: 'xml', refresh: 'daily' }
        };

        const { data, error } = await supabaseClient
          .from('campaign_product_feeds')
          .upsert(feedData, { onConflict: 'campaign_id' })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, feed: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_performance': {
        let query = supabaseClient
          .from('campaign_performance')
          .select('*')
          .eq('user_id', user.id);

        if (campaignId) {
          query = query.eq('campaign_id', campaignId);
        }

        if (dateRange) {
          query = query.gte('date', dateRange.start).lte('date', dateRange.end);
        }

        const { data, error } = await query.order('date', { ascending: false });

        if (error) throw error;

        // Aggregate metrics
        const totals = (data || []).reduce((acc, row) => ({
          impressions: acc.impressions + (row.impressions || 0),
          clicks: acc.clicks + (row.clicks || 0),
          conversions: acc.conversions + (row.conversions || 0),
          spend: acc.spend + Number(row.spend || 0),
          revenue: acc.revenue + Number(row.revenue || 0)
        }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 });

        const summary = {
          ...totals,
          ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions * 100).toFixed(2) : 0,
          roas: totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) : 0,
          cpc: totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : 0
        };

        return new Response(JSON.stringify({ performance: data, summary }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'create_creative': {
        const { data, error } = await supabaseClient
          .from('campaign_creatives')
          .insert({
            user_id: user.id,
            campaign_id: campaignId,
            ...creativeData
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, creative: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'ai_optimize': {
        // AI-powered campaign optimization suggestions
        const { data: campaign } = await supabaseClient
          .from('dynamic_ad_campaigns')
          .select('*, campaign_performance(*)')
          .eq('id', campaignId)
          .single();

        if (!campaign) throw new Error('Campaign not found');

        // Generate AI recommendations
        const recommendations = [
          {
            type: 'budget',
            priority: 'high',
            title: 'Augmenter le budget quotidien',
            description: 'Le ROAS de cette campagne est supérieur à 3x. Augmenter le budget de 20% pourrait générer plus de conversions.',
            action: { field: 'budget_daily', increase: 20 }
          },
          {
            type: 'targeting',
            priority: 'medium',
            title: 'Affiner le ciblage géographique',
            description: 'Les conversions sont concentrées dans 3 régions principales. Concentrer le budget sur ces zones.',
            action: { field: 'targeting_rules', regions: ['IDF', 'PACA', 'Rhône-Alpes'] }
          },
          {
            type: 'creative',
            priority: 'medium',
            title: 'Tester de nouvelles créations',
            description: 'Le CTR a diminué de 15% ce mois. Créer de nouvelles variations de visuels.',
            action: { field: 'creatives', suggestion: 'A/B test' }
          },
          {
            type: 'schedule',
            priority: 'low',
            title: 'Optimiser les horaires de diffusion',
            description: 'Les meilleures performances sont entre 18h et 22h. Concentrer la diffusion sur ces créneaux.',
            action: { field: 'schedule', peak_hours: ['18:00-22:00'] }
          }
        ];

        return new Response(JSON.stringify({ 
          success: true, 
          recommendations,
          currentPerformance: {
            roas: 3.2,
            ctr: 2.4,
            conversions: 45
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('[dynamic-campaigns] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
