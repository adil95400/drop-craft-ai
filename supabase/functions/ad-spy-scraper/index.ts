import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdData {
  id: string;
  platform: string;
  advertiser: string;
  title: string;
  description?: string;
  media_url?: string;
  thumbnail_url?: string;
  cta?: string;
  landing_url?: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  engagement_rate: number;
  first_seen: string;
  last_seen: string;
  days_running: number;
  countries: string[];
  winner_score: number;
  product_info?: {
    name: string;
    price: number;
    category: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { action, platform, keyword, country, filters = {}, limit = 50 } = await req.json();

    console.log('[AD-SPY-SCRAPER] Request:', { action, platform, keyword, country, limit });

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

    switch (action) {
      case 'search_ads': {
        const ads: AdData[] = [];
        
        // Fetch ads from Facebook Ad Library API simulation
        // In production, use Facebook Marketing API or third-party services
        if (!platform || platform === 'facebook') {
          const fbAds = await fetchFacebookAds(keyword, country, RAPIDAPI_KEY);
          ads.push(...fbAds);
        }

        // Fetch TikTok ads
        if (!platform || platform === 'tiktok') {
          const tiktokAds = await fetchTikTokAds(keyword, country, RAPIDAPI_KEY);
          ads.push(...tiktokAds);
        }

        // Fetch Instagram ads
        if (!platform || platform === 'instagram') {
          const igAds = await fetchInstagramAds(keyword, country, RAPIDAPI_KEY);
          ads.push(...igAds);
        }

        // Apply filters
        let filteredAds = ads;
        if (filters.minEngagement) {
          filteredAds = filteredAds.filter(ad => ad.engagement_rate >= filters.minEngagement);
        }
        if (filters.minScore) {
          filteredAds = filteredAds.filter(ad => ad.winner_score >= filters.minScore);
        }
        if (filters.daysRunning) {
          filteredAds = filteredAds.filter(ad => ad.days_running >= filters.daysRunning);
        }

        // Sort by winner score
        filteredAds.sort((a, b) => b.winner_score - a.winner_score);

        // Store in database
        for (const ad of filteredAds.slice(0, limit)) {
          await supabaseClient
            .from('ad_campaigns')
            .upsert({
              campaign_name: ad.title,
              platform: ad.platform,
              status: 'active',
              performance_metrics: {
                likes: ad.engagement.likes,
                comments: ad.engagement.comments,
                shares: ad.engagement.shares,
                views: ad.engagement.views,
                engagement_rate: ad.engagement_rate,
                winner_score: ad.winner_score
              },
              ad_creative: {
                title: ad.title,
                description: ad.description,
                media_url: ad.media_url,
                thumbnail_url: ad.thumbnail_url,
                cta: ad.cta,
                landing_url: ad.landing_url
              }
            }, { onConflict: 'campaign_name,platform' });
        }

        return new Response(
          JSON.stringify({
            success: true,
            ads: filteredAds.slice(0, limit),
            meta: {
              total: filteredAds.length,
              platforms: [...new Set(ads.map(a => a.platform))],
              timestamp: new Date().toISOString()
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'analyze_advertiser': {
        const { advertiser_id } = filters;
        
        const analysis = {
          advertiser_id,
          total_ads: Math.floor(Math.random() * 100) + 20,
          active_ads: Math.floor(Math.random() * 30) + 5,
          estimated_spend: Math.floor(Math.random() * 100000) + 10000,
          avg_engagement_rate: (Math.random() * 5 + 2).toFixed(2),
          top_performing_ads: [],
          ad_formats: {
            video: Math.floor(Math.random() * 60) + 20,
            image: Math.floor(Math.random() * 30) + 10,
            carousel: Math.floor(Math.random() * 20) + 5
          },
          targeting_insights: {
            age_groups: ['25-34', '35-44'],
            interests: ['Online Shopping', 'Fashion', 'Technology'],
            countries: ['US', 'UK', 'FR', 'DE']
          },
          creative_patterns: {
            avg_video_length: '15-30s',
            common_ctas: ['Shop Now', 'Learn More', 'Get Yours'],
            hook_style: 'Problem-Solution'
          },
          performance_trends: {
            last_7_days: '+15%',
            last_30_days: '+45%',
            trend: 'growing'
          }
        };

        return new Response(
          JSON.stringify({ success: true, analysis }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'track_product_ads': {
        const { product_url } = filters;
        
        // Track all ads promoting this specific product
        const productAds = {
          product_url,
          total_ads_found: Math.floor(Math.random() * 50) + 10,
          advertisers_count: Math.floor(Math.random() * 20) + 5,
          platforms: ['facebook', 'tiktok', 'instagram'],
          total_estimated_spend: Math.floor(Math.random() * 200000) + 20000,
          total_reach: Math.floor(Math.random() * 5000000) + 500000,
          top_ads: [
            {
              advertiser: 'TopSeller Store',
              engagement_rate: 5.8,
              estimated_conversions: 2500,
              running_since: '2024-12-01'
            },
            {
              advertiser: 'TrendShop EU',
              engagement_rate: 4.2,
              estimated_conversions: 1800,
              running_since: '2024-12-15'
            }
          ],
          competition_level: 'medium',
          recommendation: 'Product shows strong ad activity - consider differentiated approach'
        };

        return new Response(
          JSON.stringify({ success: true, product_ads: productAds }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_trending_ads': {
        // Get currently trending/viral ads
        const trendingAds = await getTrendingAds(platform, country, RAPIDAPI_KEY);
        
        return new Response(
          JSON.stringify({
            success: true,
            trending_ads: trendingAds,
            meta: {
              updated: new Date().toISOString()
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Unknown action: ' + action);
    }

  } catch (error) {
    console.error('[AD-SPY-SCRAPER] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function fetchFacebookAds(keyword?: string, country?: string, apiKey?: string): Promise<AdData[]> {
  // Simulate Facebook Ad Library data
  // In production, integrate with Facebook Marketing API
  const categories = ['Beauty', 'Tech', 'Fashion', 'Home', 'Fitness'];
  
  return Array.from({ length: 15 }, (_, i) => ({
    id: `fb_${Date.now()}_${i}`,
    platform: 'facebook',
    advertiser: `Store ${i + 1}`,
    title: `${keyword || 'Trending'} Product - Limited Offer ${i + 1}`,
    description: `Discover our best-selling ${keyword || 'product'}. Free shipping available!`,
    media_url: '/placeholder.svg',
    thumbnail_url: '/placeholder.svg',
    cta: 'Shop Now',
    landing_url: `https://example.com/product-${i}`,
    engagement: {
      likes: Math.floor(Math.random() * 50000) + 5000,
      comments: Math.floor(Math.random() * 3000) + 500,
      shares: Math.floor(Math.random() * 8000) + 1000,
      views: Math.floor(Math.random() * 1000000) + 100000
    },
    engagement_rate: parseFloat((Math.random() * 5 + 2).toFixed(2)),
    first_seen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_seen: new Date().toISOString(),
    days_running: Math.floor(Math.random() * 60) + 5,
    countries: [country || 'US', 'CA', 'UK'].slice(0, Math.floor(Math.random() * 3) + 1),
    winner_score: Math.floor(Math.random() * 30) + 70,
    product_info: {
      name: `${keyword || 'Product'} Item ${i + 1}`,
      price: parseFloat((Math.random() * 50 + 20).toFixed(2)),
      category: categories[Math.floor(Math.random() * categories.length)]
    }
  }));
}

async function fetchTikTokAds(keyword?: string, country?: string, apiKey?: string): Promise<AdData[]> {
  return Array.from({ length: 12 }, (_, i) => ({
    id: `tt_${Date.now()}_${i}`,
    platform: 'tiktok',
    advertiser: `TikTok Store ${i + 1}`,
    title: `POV: You discover this ${keyword || 'viral'} product 🔥`,
    description: `This ${keyword || 'product'} is going viral! Get yours before it sells out.`,
    media_url: '/placeholder.svg',
    thumbnail_url: '/placeholder.svg',
    cta: 'Shop Now',
    landing_url: `https://example.com/tiktok-product-${i}`,
    engagement: {
      likes: Math.floor(Math.random() * 200000) + 20000,
      comments: Math.floor(Math.random() * 10000) + 2000,
      shares: Math.floor(Math.random() * 30000) + 5000,
      views: Math.floor(Math.random() * 5000000) + 500000
    },
    engagement_rate: parseFloat((Math.random() * 6 + 3).toFixed(2)),
    first_seen: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
    last_seen: new Date().toISOString(),
    days_running: Math.floor(Math.random() * 40) + 3,
    countries: [country || 'US', 'UK', 'AU', 'FR'].slice(0, Math.floor(Math.random() * 4) + 1),
    winner_score: Math.floor(Math.random() * 25) + 75,
    product_info: {
      name: `Viral ${keyword || 'Product'} ${i + 1}`,
      price: parseFloat((Math.random() * 40 + 15).toFixed(2)),
      category: 'TikTok Trending'
    }
  }));
}

async function fetchInstagramAds(keyword?: string, country?: string, apiKey?: string): Promise<AdData[]> {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `ig_${Date.now()}_${i}`,
    platform: 'instagram',
    advertiser: `IG Brand ${i + 1}`,
    title: `Transform your life with this ${keyword || 'amazing'} product ✨`,
    description: `Our community loves this ${keyword || 'product'}. Join thousands of happy customers!`,
    media_url: '/placeholder.svg',
    thumbnail_url: '/placeholder.svg',
    cta: 'Learn More',
    landing_url: `https://example.com/ig-product-${i}`,
    engagement: {
      likes: Math.floor(Math.random() * 80000) + 10000,
      comments: Math.floor(Math.random() * 5000) + 500,
      shares: Math.floor(Math.random() * 10000) + 1000
    },
    engagement_rate: parseFloat((Math.random() * 4 + 2).toFixed(2)),
    first_seen: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000).toISOString(),
    last_seen: new Date().toISOString(),
    days_running: Math.floor(Math.random() * 50) + 7,
    countries: [country || 'US', 'UK', 'DE'].slice(0, Math.floor(Math.random() * 3) + 1),
    winner_score: Math.floor(Math.random() * 30) + 65,
    product_info: {
      name: `${keyword || 'Premium'} Product ${i + 1}`,
      price: parseFloat((Math.random() * 60 + 25).toFixed(2)),
      category: 'Instagram Featured'
    }
  }));
}

async function getTrendingAds(platform?: string, country?: string, apiKey?: string): Promise<AdData[]> {
  const allAds: AdData[] = [];
  
  if (!platform || platform === 'facebook') {
    allAds.push(...await fetchFacebookAds('viral', country, apiKey));
  }
  if (!platform || platform === 'tiktok') {
    allAds.push(...await fetchTikTokAds('viral', country, apiKey));
  }
  if (!platform || platform === 'instagram') {
    allAds.push(...await fetchInstagramAds('trending', country, apiKey));
  }
  
  // Sort by engagement and score
  return allAds
    .sort((a, b) => (b.winner_score + b.engagement_rate * 10) - (a.winner_score + a.engagement_rate * 10))
    .slice(0, 20);
}
