import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface MetricsRequest {
  userId: string
  platform: string
  startDate: string
  endDate: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, platform, startDate, endDate } = await req.json() as MetricsRequest

    console.log(`Fetching metrics for user ${userId}, platform: ${platform}`)

    // TODO: Récupérer les vraies métriques depuis l'API de la plateforme
    // Pour l'instant, on génère des métriques simulées

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    const metrics = []

    for (let i = 0; i < days; i++) {
      const metricDate = new Date(start)
      metricDate.setDate(start.getDate() + i)
      
      const dateStr = metricDate.toISOString().split('T')[0]
      
      // Générer des métriques réalistes
      const baseSales = 10 + Math.floor(Math.random() * 20)
      const avgPrice = 35 + Math.random() * 50
      const revenue = baseSales * avgPrice
      const fees = revenue * 0.15 // 15% de frais
      const cost = revenue * 0.60 // 60% de coût
      const profit = revenue - fees - cost
      
      metrics.push({
        user_id: userId,
        platform,
        metric_date: dateStr,
        total_sales: baseSales,
        total_revenue: Math.round(revenue * 100) / 100,
        total_orders: baseSales,
        total_fees: Math.round(fees * 100) / 100,
        total_profit: Math.round(profit * 100) / 100,
        avg_order_value: Math.round(avgPrice * 100) / 100,
        conversion_rate: 2.5 + Math.random() * 2,
        active_listings: 50 + Math.floor(Math.random() * 30),
        views: baseSales * (15 + Math.floor(Math.random() * 10)),
        clicks: baseSales * (3 + Math.floor(Math.random() * 2)),
        impressions: baseSales * (50 + Math.floor(Math.random() * 50)),
        ctr: 2 + Math.random() * 3,
        roas: 2.5 + Math.random() * 2,
        additional_metrics: {
          return_rate: Math.random() * 5,
          avg_shipping_time: 2 + Math.floor(Math.random() * 5),
          customer_satisfaction: 4.2 + Math.random() * 0.7
        }
      })
    }

    // Sauvegarder les métriques
    const { error: saveError } = await supabase
      .from('platform_performance_metrics')
      .upsert(metrics, {
        onConflict: 'user_id,platform,metric_date'
      })

    if (saveError) {
      console.error('Error saving metrics:', saveError)
      throw saveError
    }

    // Calculer les totaux
    const totals = metrics.reduce((acc, m) => ({
      totalRevenue: acc.totalRevenue + m.total_revenue,
      totalOrders: acc.totalOrders + m.total_orders,
      totalProfit: acc.totalProfit + m.total_profit,
      totalFees: acc.totalFees + m.total_fees,
      avgConversion: acc.avgConversion + m.conversion_rate,
      avgROAS: acc.avgROAS + m.roas
    }), {
      totalRevenue: 0,
      totalOrders: 0,
      totalProfit: 0,
      totalFees: 0,
      avgConversion: 0,
      avgROAS: 0
    })

    totals.avgConversion /= metrics.length
    totals.avgROAS /= metrics.length

    return new Response(
      JSON.stringify({
        success: true,
        metrics,
        totals: {
          ...totals,
          totalRevenue: Math.round(totals.totalRevenue * 100) / 100,
          totalProfit: Math.round(totals.totalProfit * 100) / 100,
          totalFees: Math.round(totals.totalFees * 100) / 100,
          avgConversion: Math.round(totals.avgConversion * 100) / 100,
          avgROAS: Math.round(totals.avgROAS * 100) / 100
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Fetch metrics error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
