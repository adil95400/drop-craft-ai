import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrendPrediction {
  product_name: string
  current_trend_score: number
  predicted_30d: number
  predicted_60d: number
  predicted_90d: number
  trend_direction: 'rising' | 'peak' | 'declining' | 'stable'
  momentum: 'slow' | 'moderate' | 'fast' | 'viral'
  seasonality: string | null
  confidence: number
  recommendations: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { product_name, hashtags = [] } = await req.json()

    // Récupérer les données historiques des tendances
    const { data: trendData } = await supabaseClient
      .from('social_trends')
      .select('*')
      .in('hashtag', hashtags)
      .order('created_at', { ascending: false })
      .limit(30)

    // Récupérer les produits viraux similaires
    const { data: viralProducts } = await supabaseClient
      .from('viral_products')
      .select('*')
      .overlaps('hashtags', hashtags)
      .order('viral_score', { ascending: false })
      .limit(50)

    // Calcul du score de tendance actuel
    const avgTrendScore = trendData?.reduce((sum, t) => sum + (t.trend_score || 0), 0) / (trendData?.length || 1)
    const avgEngagementRate = viralProducts?.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / (viralProducts?.length || 1)
    
    // Calcul de la croissance
    const recentTrends = trendData?.slice(0, 7) || []
    const oldTrends = trendData?.slice(7, 14) || []
    const recentAvg = recentTrends.reduce((sum, t) => sum + (t.trend_score || 0), 0) / (recentTrends.length || 1)
    const oldAvg = oldTrends.reduce((sum, t) => sum + (t.trend_score || 0), 0) / (oldTrends.length || 1)
    const growthRate = oldAvg > 0 ? ((recentAvg - oldAvg) / oldAvg) * 100 : 0

    // Prédictions (algorithme simplifié - en prod utiliser ML/OpenAI)
    const currentScore = avgTrendScore
    let predicted30d = currentScore + (growthRate * 0.3)
    let predicted60d = predicted30d + (growthRate * 0.25)
    let predicted90d = predicted60d + (growthRate * 0.2)

    // Ajuster avec facteurs de saturation
    predicted30d = Math.max(0, Math.min(100, predicted30d))
    predicted60d = Math.max(0, Math.min(100, predicted60d))
    predicted90d = Math.max(0, Math.min(100, predicted90d))

    // Déterminer la direction de tendance
    let trend_direction: 'rising' | 'peak' | 'declining' | 'stable' = 'stable'
    if (growthRate > 10) trend_direction = 'rising'
    else if (growthRate < -10) trend_direction = 'declining'
    else if (currentScore > 80) trend_direction = 'peak'

    // Déterminer le momentum
    let momentum: 'slow' | 'moderate' | 'fast' | 'viral' = 'moderate'
    if (growthRate > 50) momentum = 'viral'
    else if (growthRate > 25) momentum = 'fast'
    else if (growthRate < 5) momentum = 'slow'

    // Détection saisonnalité (simplifié)
    const currentMonth = new Date().getMonth()
    let seasonality = null
    if (hashtags.some(h => ['christmas', 'noel', 'gift'].some(k => h.toLowerCase().includes(k)))) {
      seasonality = 'winter_holidays'
    } else if (hashtags.some(h => ['summer', 'beach', 'vacation'].some(k => h.toLowerCase().includes(k)))) {
      seasonality = 'summer'
    }

    // Recommandations
    const recommendations: string[] = []
    if (trend_direction === 'rising' && currentScore < 60) {
      recommendations.push('🟢 Excellent timing! Le produit est en début de tendance avec faible saturation.')
      recommendations.push('📈 Lancer rapidement avant saturation du marché')
    } else if (trend_direction === 'peak') {
      recommendations.push('🟡 Tendance au pic - forte concurrence attendue')
      recommendations.push('💡 Focus sur différenciation et publicité agressive')
    } else if (trend_direction === 'declining') {
      recommendations.push('🔴 Tendance en déclin - évaluer la viabilité')
      recommendations.push('⚠️ Considérer des alternatives ou niches connexes')
    }

    if (momentum === 'viral') {
      recommendations.push('🔥 Momentum viral détecté - opportunité exceptionnelle!')
    }

    if (seasonality) {
      recommendations.push(`📅 Produit saisonnier (${seasonality}) - planifier stocks en conséquence`)
    }

    const prediction: TrendPrediction = {
      product_name,
      current_trend_score: Math.round(currentScore),
      predicted_30d: Math.round(predicted30d),
      predicted_60d: Math.round(predicted60d),
      predicted_90d: Math.round(predicted90d),
      trend_direction,
      momentum,
      seasonality,
      confidence: Math.min(95, Math.round(60 + (viralProducts?.length || 0) * 0.5)),
      recommendations
    }

    return new Response(
      JSON.stringify({
        success: true,
        prediction
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in ai-trend-predictor:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
