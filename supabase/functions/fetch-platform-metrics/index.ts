/**
 * Fetch Platform Metrics — SECURED (JWT-first, RLS-enforced)
 * No longer trusts userId from body — derives from JWT
 */
import { requireAuth, handlePreflight, successResponse, errorResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { platform, startDate, endDate } = await req.json()

    if (!platform || !startDate || !endDate) {
      return errorResponse('platform, startDate, endDate required', corsHeaders, 400)
    }

    console.log(`[fetch-platform-metrics] user=${userId}, platform=${platform}`)

    // RLS-scoped: get integration
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('platform', platform)
      .eq('is_active', true)
      .single()

    if (intError || !integration) {
      return successResponse({
        success: false,
        error: 'Integration not found or inactive',
        metrics: [],
        totals: null,
      }, corsHeaders)
    }

    // Fetch stored metrics (RLS-scoped)
    const { data: storedMetrics } = await supabase
      .from('platform_performance_metrics')
      .select('*')
      .eq('platform', platform)
      .gte('metric_date', startDate)
      .lte('metric_date', endDate)
      .order('metric_date', { ascending: true })

    const metrics = (storedMetrics || []).map((m: any) => ({
      total_sales: m.total_sales || 0,
      total_revenue: m.total_revenue || 0,
      total_orders: m.total_orders || 0,
      total_fees: m.total_fees || 0,
      total_profit: m.total_profit || 0,
      avg_order_value: m.avg_order_value || 0,
      conversion_rate: m.conversion_rate || 0,
      active_listings: m.active_listings || 0,
      views: m.views || 0,
      clicks: m.clicks || 0,
      impressions: m.impressions || 0,
      ctr: m.ctr || 0,
      roas: m.roas || 0,
    }))

    // Calculate totals
    let totals = null
    if (metrics.length > 0) {
      const sum = metrics.reduce((acc: any, m: any) => ({
        totalRevenue: acc.totalRevenue + m.total_revenue,
        totalOrders: acc.totalOrders + m.total_orders,
        totalProfit: acc.totalProfit + m.total_profit,
        totalFees: acc.totalFees + m.total_fees,
      }), { totalRevenue: 0, totalOrders: 0, totalProfit: 0, totalFees: 0 })

      totals = {
        totalRevenue: Math.round(sum.totalRevenue * 100) / 100,
        totalOrders: sum.totalOrders,
        totalProfit: Math.round(sum.totalProfit * 100) / 100,
        totalFees: Math.round(sum.totalFees * 100) / 100,
      }
    }

    return successResponse({
      success: true,
      metrics,
      totals,
      source: metrics.length > 0 ? 'stored' : 'no_data',
    }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[fetch-platform-metrics] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
