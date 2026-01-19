import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const { metric_type, time_range = '24h' } = await req.json()

    let metrics = {}

    switch (metric_type) {
      case 'performance':
        metrics = await collectPerformanceMetrics(supabaseClient, time_range)
        break
      case 'resources':
        metrics = await collectResourceMetrics(supabaseClient)
        break
      case 'api':
        metrics = await collectAPIMetrics(supabaseClient, time_range)
        break
      case 'database':
        metrics = await collectDatabaseMetrics(supabaseClient)
        break
      case 'all':
        metrics = {
          performance: await collectPerformanceMetrics(supabaseClient, time_range),
          resources: await collectResourceMetrics(supabaseClient),
          api: await collectAPIMetrics(supabaseClient, time_range),
          database: await collectDatabaseMetrics(supabaseClient)
        }
        break
      default:
        throw new Error('Invalid metric type')
    }

    return new Response(
      JSON.stringify({
        success: true,
        metric_type,
        time_range,
        timestamp: new Date().toISOString(),
        data: metrics
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Metrics collection error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function collectPerformanceMetrics(client: any, timeRange: string) {
  try {
    const startTime = getTimeRangeStart(timeRange)
    
    const { data: apiLogs } = await client
      .from('api_logs')
      .select('response_time_ms, status_code, created_at')
      .gte('created_at', startTime)
      .order('created_at', { ascending: false })
      .limit(1000)

    const logs = apiLogs || []
    const avgResponseTime = logs.length 
      ? logs.reduce((sum: number, log: any) => sum + (log.response_time_ms || 0), 0) / logs.length
      : 0

    const errorCount = logs.filter((log: any) => log.status_code >= 400).length
    const errorRate = logs.length > 0 ? (errorCount / logs.length) * 100 : 0

    return {
      avg_response_time: Math.round(avgResponseTime),
      total_requests: logs.length,
      error_count: errorCount,
      error_rate: errorRate.toFixed(2),
      throughput: Math.round(logs.length / 60) // requests per minute
    }
  } catch (error) {
    console.error('Error collecting performance metrics:', error)
    return {
      avg_response_time: null,
      total_requests: 0,
      error_count: 0,
      error_rate: '0.00',
      throughput: 0
    }
  }
}

async function collectResourceMetrics(client: any) {
  // Resource metrics require external infrastructure monitoring
  // Return null values to indicate unavailable metrics
  return {
    cpu_usage: null,
    memory_usage: null,
    disk_usage: null,
    network_bandwidth: null,
    note: 'Infrastructure metrics require external monitoring integration (e.g., Prometheus, Datadog)'
  }
}

async function collectAPIMetrics(client: any, timeRange: string) {
  try {
    const startTime = getTimeRangeStart(timeRange)
    
    const { data: apiLogs } = await client
      .from('api_logs')
      .select('endpoint, response_time_ms, status_code')
      .gte('created_at', startTime)
      .limit(1000)

    const logs = apiLogs || []
    
    // Group by endpoint
    const endpointStats = logs.reduce((acc: any, log: any) => {
      const endpoint = log.endpoint || 'unknown'
      if (!acc[endpoint]) {
        acc[endpoint] = {
          count: 0,
          total_time: 0,
          errors: 0
        }
      }
      acc[endpoint].count++
      acc[endpoint].total_time += log.response_time_ms || 0
      if (log.status_code >= 400) {
        acc[endpoint].errors++
      }
      return acc
    }, {})

    const topEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]: [string, any]) => ({
        endpoint,
        calls: stats.count,
        avg_response_time: stats.count > 0 ? Math.round(stats.total_time / stats.count) : 0,
        errors: stats.errors,
        error_rate: stats.count > 0 ? ((stats.errors / stats.count) * 100).toFixed(2) : '0.00'
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10)

    return {
      top_endpoints: topEndpoints,
      total_api_calls: logs.length
    }
  } catch (error) {
    console.error('Error collecting API metrics:', error)
    return {
      top_endpoints: [],
      total_api_calls: 0
    }
  }
}

async function collectDatabaseMetrics(client: any) {
  try {
    // Get real counts from database
    const [productsResult, ordersResult, customersResult] = await Promise.all([
      client.from('products').select('id', { count: 'exact', head: true }),
      client.from('orders').select('id', { count: 'exact', head: true }),
      client.from('customers').select('id', { count: 'exact', head: true })
    ])

    return {
      total_products: productsResult.count || 0,
      total_orders: ordersResult.count || 0,
      total_customers: customersResult.count || 0,
      avg_query_time: null, // Requires pg_stat_statements
      cache_hit_rate: null  // Requires pg_stat_bgwriter
    }
  } catch (error) {
    console.error('Error collecting database metrics:', error)
    return {
      total_products: 0,
      total_orders: 0,
      total_customers: 0,
      avg_query_time: null,
      cache_hit_rate: null
    }
  }
}

function getTimeRangeStart(timeRange: string): string {
  const now = new Date()
  const hours = parseInt(timeRange.replace('h', '')) || 24
  now.setHours(now.getHours() - hours)
  return now.toISOString()
}
