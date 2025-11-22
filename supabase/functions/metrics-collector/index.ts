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
        metrics = await collectResourceMetrics(supabaseClient, time_range)
        break
      case 'api':
        metrics = await collectAPIMetrics(supabaseClient, time_range)
        break
      case 'database':
        metrics = await collectDatabaseMetrics(supabaseClient, time_range)
        break
      case 'all':
        metrics = {
          performance: await collectPerformanceMetrics(supabaseClient, time_range),
          resources: await collectResourceMetrics(supabaseClient, time_range),
          api: await collectAPIMetrics(supabaseClient, time_range),
          database: await collectDatabaseMetrics(supabaseClient, time_range)
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
    const { data: apiLogs } = await client
      .from('api_logs')
      .select('response_time_ms, status_code, created_at')
      .gte('created_at', getTimeRangeStart(timeRange))
      .order('created_at', { ascending: false })
      .limit(1000)

    const avgResponseTime = apiLogs?.length 
      ? apiLogs.reduce((sum: number, log: any) => sum + (log.response_time_ms || 0), 0) / apiLogs.length
      : 0

    const errorRate = apiLogs?.length
      ? (apiLogs.filter((log: any) => log.status_code >= 400).length / apiLogs.length) * 100
      : 0

    return {
      avg_response_time: Math.round(avgResponseTime),
      total_requests: apiLogs?.length || 0,
      error_rate: errorRate.toFixed(2),
      throughput: Math.round((apiLogs?.length || 0) / 60) // requests per minute
    }
  } catch (error) {
    console.error('Error collecting performance metrics:', error)
    return {}
  }
}

async function collectResourceMetrics(client: any, timeRange: string) {
  // Simulated resource metrics - in production, integrate with infrastructure monitoring
  return {
    cpu_usage: Math.floor(Math.random() * 30) + 40, // 40-70%
    memory_usage: Math.floor(Math.random() * 20) + 60, // 60-80%
    disk_usage: Math.floor(Math.random() * 10) + 50, // 50-60%
    network_bandwidth: Math.floor(Math.random() * 500) + 500 // 500-1000 Mbps
  }
}

async function collectAPIMetrics(client: any, timeRange: string) {
  try {
    const { data: apiLogs } = await client
      .from('api_logs')
      .select('endpoint, response_time_ms, status_code')
      .gte('created_at', getTimeRangeStart(timeRange))
      .limit(1000)

    // Group by endpoint
    const endpointStats = apiLogs?.reduce((acc: any, log: any) => {
      if (!acc[log.endpoint]) {
        acc[log.endpoint] = {
          count: 0,
          total_time: 0,
          errors: 0
        }
      }
      acc[log.endpoint].count++
      acc[log.endpoint].total_time += log.response_time_ms || 0
      if (log.status_code >= 400) {
        acc[log.endpoint].errors++
      }
      return acc
    }, {})

    const topEndpoints = Object.entries(endpointStats || {})
      .map(([endpoint, stats]: [string, any]) => ({
        endpoint,
        calls: stats.count,
        avg_response_time: Math.round(stats.total_time / stats.count),
        errors: stats.errors,
        error_rate: ((stats.errors / stats.count) * 100).toFixed(2)
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10)

    return {
      top_endpoints: topEndpoints,
      total_api_calls: apiLogs?.length || 0
    }
  } catch (error) {
    console.error('Error collecting API metrics:', error)
    return {}
  }
}

async function collectDatabaseMetrics(client: any, timeRange: string) {
  try {
    // Get database statistics
    const { data: products } = await client.from('products').select('count')
    const { data: orders } = await client.from('orders').select('count')
    const { data: customers } = await client.from('customers').select('count')

    return {
      total_products: products?.[0]?.count || 0,
      total_orders: orders?.[0]?.count || 0,
      total_customers: customers?.[0]?.count || 0,
      avg_query_time: Math.floor(Math.random() * 20) + 10, // 10-30ms simulated
      cache_hit_rate: Math.floor(Math.random() * 5) + 93 // 93-98% simulated
    }
  } catch (error) {
    console.error('Error collecting database metrics:', error)
    return {}
  }
}

function getTimeRangeStart(timeRange: string): string {
  const now = new Date()
  const hours = parseInt(timeRange.replace('h', ''))
  now.setHours(now.getHours() - hours)
  return now.toISOString()
}
