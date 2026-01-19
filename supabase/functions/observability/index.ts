import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetricData {
  metric_name: string
  value: number
  tags?: Record<string, string>
  timestamp?: string
}

interface AlertRule {
  name: string
  metric_name: string
  condition: 'gt' | 'lt' | 'eq'
  threshold: number
  duration_minutes: number
  notification_channels: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { pathname } = new URL(req.url)
    const method = req.method

    console.log(`Observability API - ${method} ${pathname} - User: ${user.id}`)

    // GET /observability/metrics - Get real metrics from database
    if (method === 'GET' && pathname === '/observability/metrics') {
      const url = new URL(req.url)
      const timeRange = url.searchParams.get('range') || '24h'
      const hours = parseInt(timeRange.replace('h', '')) || 24
      const startTime = new Date()
      startTime.setHours(startTime.getHours() - hours)

      // Fetch real metrics from database
      const [ordersResult, productsResult, apiLogsResult, activeAlertsResult] = await Promise.all([
        supabase.from('orders').select('id, total_amount, created_at').gte('created_at', startTime.toISOString()),
        supabase.from('products').select('id').eq('user_id', user.id),
        supabase.from('api_logs').select('response_time_ms, status_code').gte('created_at', startTime.toISOString()).limit(500),
        supabase.from('active_alerts').select('id').eq('user_id', user.id).eq('status', 'active')
      ])

      const orders = ordersResult.data || []
      const products = productsResult.data || []
      const apiLogs = apiLogsResult.data || []
      const activeAlerts = activeAlertsResult.data || []

      // Calculate real metrics
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      const avgResponseTime = apiLogs.length > 0 
        ? apiLogs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / apiLogs.length 
        : 0
      const errorCount = apiLogs.filter(l => l.status_code >= 400).length
      const errorRate = apiLogs.length > 0 ? (errorCount / apiLogs.length) * 100 : 0

      const metrics = {
        system: {
          cpu_usage: null, // Infrastructure metrics require external monitoring integration
          memory_usage: null,
          disk_usage: null,
          network_io: null
        },
        application: {
          active_alerts: activeAlerts.length,
          requests_count: apiLogs.length,
          error_rate: errorRate.toFixed(2),
          avg_response_time_ms: Math.round(avgResponseTime)
        },
        business: {
          orders_count: orders.length,
          revenue: totalRevenue,
          products_count: products.length,
          conversion_rate: null // Requires analytics tracking
        },
        database: {
          connections: null, // Requires pg_stat_activity access
          total_products: products.length,
          total_orders: orders.length
        }
      }

      return new Response(
        JSON.stringify({ metrics, timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /observability/metrics - Store custom metric
    if (method === 'POST' && pathname === '/observability/metrics') {
      const body: MetricData = await req.json()

      const { error } = await supabase
        .from('monitoring_metrics')
        .insert({
          user_id: user.id,
          metric_name: body.metric_name,
          value: body.value,
          tags: body.tags || {},
          timestamp: body.timestamp || new Date().toISOString()
        })

      if (error) {
        console.error('Error storing metric:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to store metric' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /observability/alerts - Get alert rules and active alerts
    if (method === 'GET' && pathname === '/observability/alerts') {
      const { data: alertRules, error: rulesError } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('user_id', user.id)

      const { data: activeAlerts, error: alertsError } = await supabase
        .from('active_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (rulesError || alertsError) {
        console.error('Error fetching alerts:', { rulesError, alertsError })
        return new Response(
          JSON.stringify({ 
            alert_rules: [],
            active_alerts: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          alert_rules: alertRules || [],
          active_alerts: activeAlerts || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /observability/alerts - Create alert rule
    if (method === 'POST' && pathname === '/observability/alerts') {
      const body: AlertRule = await req.json()

      const { data: alertRule, error } = await supabase
        .from('alert_rules')
        .insert({
          user_id: user.id,
          name: body.name,
          metric_name: body.metric_name,
          condition: body.condition,
          threshold: body.threshold,
          duration_minutes: body.duration_minutes,
          notification_channels: body.notification_channels,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating alert rule:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create alert rule' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Alert rule created:', alertRule.id)
      return new Response(
        JSON.stringify({ alert_rule: alertRule }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /observability/logs - Get system logs
    if (method === 'GET' && pathname === '/observability/logs') {
      const url = new URL(req.url)
      const level = url.searchParams.get('level') || 'all'
      const limit = parseInt(url.searchParams.get('limit') || '100')

      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (level !== 'all') {
        query = query.eq('severity', level)
      }

      const { data: logs, error } = await query

      if (error) {
        console.error('Error fetching logs:', error)
        return new Response(
          JSON.stringify({ logs: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ logs: logs || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /observability/health - Real system health check
    if (method === 'GET' && pathname === '/observability/health') {
      const startTime = Date.now()
      
      // Test database connectivity
      const { error: dbError } = await supabase.from('products').select('id').limit(1)
      const dbResponseTime = Date.now() - startTime

      // Get recent error count
      const { data: recentErrors } = await supabase
        .from('api_logs')
        .select('id')
        .gte('status_code', 400)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())

      const healthStatus = {
        overall_status: dbError ? 'degraded' : 'healthy',
        services: {
          database: { 
            status: dbError ? 'unhealthy' : 'healthy', 
            response_time_ms: dbResponseTime,
            error: dbError?.message || null
          },
          api: { 
            status: 'healthy', 
            recent_errors: recentErrors?.length || 0
          }
        },
        checked_at: new Date().toISOString()
      }

      return new Response(
        JSON.stringify({ health: healthStatus }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Observability API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
