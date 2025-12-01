import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AnalyticsQuery {
  startDate: string
  endDate: string
  groupBy?: 'day' | 'week' | 'month'
  marketplace?: string
  productId?: string
}

/**
 * Track and analyze conversion metrics across products and marketplaces
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, ...params } = await req.json()

    console.log('Analytics action:', action, 'user:', user.id)

    switch (action) {
      case 'get_conversion_metrics': {
        const query = params as AnalyticsQuery
        
        // Get orders in date range
        let ordersQuery = supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', query.startDate)
          .lte('created_at', query.endDate)

        if (query.marketplace) {
          ordersQuery = ordersQuery.eq('marketplace', query.marketplace)
        }

        const { data: orders, error: ordersError } = await ordersQuery
        if (ordersError) throw ordersError

        // Get product views (from analytics events if available)
        const { data: views } = await supabase
          .from('product_analytics')
          .select('product_id, views, unique_visitors')
          .eq('user_id', user.id)
          .gte('date', query.startDate)
          .lte('date', query.endDate)

        // Calculate metrics
        const totalOrders = orders?.length || 0
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
        const totalViews = views?.reduce((sum, v) => sum + (v.views || 0), 0) || 0
        const conversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0

        // Group by product
        const productMetrics = new Map()
        
        for (const order of orders || []) {
          const items = order.line_items || []
          for (const item of items) {
            const productId = item.product_id
            if (!productMetrics.has(productId)) {
              productMetrics.set(productId, {
                product_id: productId,
                product_name: item.name,
                orders: 0,
                revenue: 0,
                quantity_sold: 0
              })
            }
            const metrics = productMetrics.get(productId)
            metrics.orders += 1
            metrics.revenue += item.price * item.quantity
            metrics.quantity_sold += item.quantity
          }
        }

        // Add views to product metrics
        for (const view of views || []) {
          if (productMetrics.has(view.product_id)) {
            const metrics = productMetrics.get(view.product_id)
            metrics.views = view.views
            metrics.conversion_rate = metrics.orders > 0 ? (metrics.orders / view.views) * 100 : 0
          }
        }

        const topProducts = Array.from(productMetrics.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)

        // Group by marketplace
        const marketplaceMetrics = orders?.reduce((acc, order) => {
          const marketplace = order.marketplace || 'unknown'
          if (!acc[marketplace]) {
            acc[marketplace] = { orders: 0, revenue: 0 }
          }
          acc[marketplace].orders += 1
          acc[marketplace].revenue += order.total_amount || 0
          return acc
        }, {} as Record<string, { orders: number; revenue: number }>) || {}

        // Time series data
        const timeSeriesData = orders?.reduce((acc, order) => {
          const date = new Date(order.created_at).toISOString().split('T')[0]
          if (!acc[date]) {
            acc[date] = { date, orders: 0, revenue: 0 }
          }
          acc[date].orders += 1
          acc[date].revenue += order.total_amount || 0
          return acc
        }, {} as Record<string, { date: string; orders: number; revenue: number }>) || {}

        return new Response(
          JSON.stringify({
            success: true,
            metrics: {
              overview: {
                total_orders: totalOrders,
                total_revenue: totalRevenue,
                total_views: totalViews,
                conversion_rate: conversionRate,
                average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0
              },
              top_products: topProducts,
              by_marketplace: marketplaceMetrics,
              time_series: Object.values(timeSeriesData)
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'track_product_view': {
        const { productId, marketplace, source } = params

        // Update or insert product analytics
        const today = new Date().toISOString().split('T')[0]
        
        const { data: existing } = await supabase
          .from('product_analytics')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .eq('date', today)
          .single()

        if (existing) {
          await supabase
            .from('product_analytics')
            .update({ 
              views: existing.views + 1,
              unique_visitors: existing.unique_visitors + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('product_analytics')
            .insert({
              user_id: user.id,
              product_id: productId,
              date: today,
              views: 1,
              unique_visitors: 1,
              marketplace,
              source
            })
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_product_performance': {
        const { productId, days = 30 } = params
        
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Get analytics data
        const { data: analytics } = await supabase
          .from('product_analytics')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: true })

        // Get orders for this product
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())

        const productOrders = orders?.filter(order => 
          order.line_items?.some((item: any) => item.product_id === productId)
        ) || []

        const totalViews = analytics?.reduce((sum, a) => sum + (a.views || 0), 0) || 0
        const totalOrders = productOrders.length
        const totalRevenue = productOrders.reduce((sum, o) => {
          const items = o.line_items?.filter((i: any) => i.product_id === productId) || []
          return sum + items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0)
        }, 0)

        return new Response(
          JSON.stringify({
            success: true,
            performance: {
              product_id: productId,
              period_days: days,
              total_views: totalViews,
              total_orders: totalOrders,
              total_revenue: totalRevenue,
              conversion_rate: totalViews > 0 ? (totalOrders / totalViews) * 100 : 0,
              daily_analytics: analytics || []
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Analytics error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
