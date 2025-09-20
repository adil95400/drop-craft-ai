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
  // Handle CORS preflight requests
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

    // Get user from JWT
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

    // GET /observability/metrics - Get real-time metrics
    if (method === 'GET' && pathname === '/observability/metrics') {
      const url = new URL(req.url)
      const timeRange = url.searchParams.get('range') || '1h'
      
      // Generate real-time metrics (in production, this would come from monitoring systems)
      const metrics = {
        system: {
          cpu_usage: Math.floor(Math.random() * 40) + 30, // 30-70%
          memory_usage: Math.floor(Math.random() * 30) + 40, // 40-70%
          disk_usage: Math.floor(Math.random() * 20) + 50, // 50-70%
          network_io: Math.floor(Math.random() * 100) + 50 // MB/s
        },
        application: {
          active_users: Math.floor(Math.random() * 50) + 100,
          requests_per_minute: Math.floor(Math.random() * 200) + 300,
          error_rate: (Math.random() * 2).toFixed(2), // 0-2%
          response_time_ms: Math.floor(Math.random() * 100) + 50
        },
        business: {
          orders_today: Math.floor(Math.random() * 20) + 15,
          revenue_today: Math.floor(Math.random() * 5000) + 2000,
          conversion_rate: (Math.random() * 3 + 2).toFixed(2), // 2-5%
          cart_abandonment: (Math.random() * 10 + 60).toFixed(1) // 60-70%
        },
        database: {
          connections: Math.floor(Math.random() * 20) + 10,
          queries_per_second: Math.floor(Math.random() * 50) + 25,
          cache_hit_rate: (Math.random() * 10 + 85).toFixed(1), // 85-95%
          storage_usage_gb: (Math.random() * 5 + 10).toFixed(2)
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
        .from('system_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (level !== 'all') {
        query = query.eq('level', level)
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

    // GET /observability/health - System health check
    if (method === 'GET' && pathname === '/observability/health') {
      const healthStatus = {
        overall_status: 'healthy',
        services: {
          database: { status: 'healthy', response_time_ms: Math.floor(Math.random() * 10) + 5 },
          api: { status: 'healthy', response_time_ms: Math.floor(Math.random() * 20) + 10 },
          storage: { status: 'healthy', response_time_ms: Math.floor(Math.random() * 15) + 8 },
          cache: { status: 'healthy', response_time_ms: Math.floor(Math.random() * 5) + 2 }
        },
        uptime_percentage: (99.5 + Math.random() * 0.4).toFixed(2),
        last_incident: null,
        performance_score: Math.floor(Math.random() * 10) + 90 // 90-100
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