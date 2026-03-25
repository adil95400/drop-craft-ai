/**
 * AI Performance Intelligence — Phase 5.3
 * System monitoring analysis, bottleneck detection, scaling recommendations
 */
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'
import { generateJSON } from '../_shared/ai-client.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const ctx = await requireAuth(req)
    const body = await req.json()
    const { action, ...params } = body

    switch (action) {
      case 'system_health': return handleSystemHealth(ctx, params)
      case 'bottleneck_detection': return handleBottleneckDetection(ctx, params)
      case 'scaling_recommendations': return handleScalingRecommendations(ctx, params)
      case 'performance_forecast': return handlePerformanceForecast(ctx, params)
      default:
        return errorResponse(`Unknown action: ${action}`, ctx.corsHeaders)
    }
  } catch (e) {
    if (e instanceof Response) return e
    console.error('Performance Intelligence error:', e)
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function callAI(systemPrompt: string, userPrompt: string) {
  return generateJSON(systemPrompt, userPrompt, { module: 'automation', temperature: 0.3, enableCache: true })
}

async function handleSystemHealth(ctx: any, params: any) {
  const { data: apiLogs } = await ctx.supabase
    .from('api_logs')
    .select('endpoint, method, status_code, response_time_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: alerts } = await ctx.supabase
    .from('active_alerts')
    .select('alert_type, severity, title, status, created_at')
    .eq('status', 'active')
    .limit(50)

  const { data: apiAnalytics } = await ctx.supabase
    .from('api_analytics')
    .select('endpoint, total_requests, failed_requests, avg_response_time_ms, date')
    .order('date', { ascending: false })
    .limit(30)

  const result = await callAI(
    `You are a system performance analyst. Assess overall system health. Return JSON:
    { "health_score": number (0-100),
      "status": "healthy"|"degraded"|"critical",
      "components": [{ "name": string, "status": "ok"|"warning"|"error", "metrics": {...}, "issues": [...] }],
      "error_analysis": { "error_rate": number, "top_errors": [{ "endpoint": string, "count": number, "pattern": string }] },
      "latency_analysis": { "p50": number, "p95": number, "p99": number, "slow_endpoints": [...] },
      "recommendations": [{ "priority": "critical"|"high"|"medium", "action": string, "reason": string }] }`,
    `API logs: ${JSON.stringify(apiLogs?.slice(0, 100) || [])}.
    Active alerts: ${JSON.stringify(alerts || [])}.
    API analytics: ${JSON.stringify(apiAnalytics || [])}.`
  )

  return successResponse({ health: result }, ctx.corsHeaders)
}

async function handleBottleneckDetection(ctx: any, params: any) {
  const { data: apiLogs } = await ctx.supabase
    .from('api_logs')
    .select('endpoint, response_time_ms, status_code, created_at')
    .order('response_time_ms', { ascending: false })
    .limit(100)

  const { data: gatewayLogs } = await ctx.supabase
    .from('gateway_logs')
    .select('endpoint, method, status_code, latency_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const result = await callAI(
    `You are a performance bottleneck analyst. Identify system bottlenecks. Return JSON:
    { "bottlenecks": [{ "location": string, "type": "database"|"api"|"network"|"computation"|"memory",
        "severity": "critical"|"high"|"medium"|"low", "impact": string, "evidence": [...],
        "fix": { "short_term": string, "long_term": string, "estimated_improvement": string } }],
      "dependency_map": { "critical_paths": [...], "single_points_of_failure": [...] },
      "optimization_priority": [{ "rank": number, "action": string, "effort": string, "impact": string }] }`,
    `Slow API calls: ${JSON.stringify(apiLogs || [])}.
    Gateway logs: ${JSON.stringify(gatewayLogs?.slice(0, 50) || [])}.`
  )

  return successResponse({ bottlenecks: result }, ctx.corsHeaders)
}

async function handleScalingRecommendations(ctx: any, params: any) {
  const { current_load, growth_rate } = params

  const { data: analytics } = await ctx.supabase
    .from('api_analytics')
    .select('total_requests, failed_requests, avg_response_time_ms, date')
    .order('date', { ascending: false })
    .limit(60)

  const { data: products } = await ctx.supabase
    .from('products').select('id', { count: 'exact', head: true })

  const { data: orders } = await ctx.supabase
    .from('orders').select('id', { count: 'exact', head: true })

  const result = await callAI(
    `You are a cloud infrastructure scaling advisor. Provide scaling recommendations. Return JSON:
    { "current_capacity": { "requests_per_minute": number, "data_volume": string, "utilization": number },
      "projections": [{ "timeframe": string, "estimated_load": number, "capacity_needed": string }],
      "scaling_plan": { "immediate": [{ "action": string, "type": "vertical"|"horizontal"|"optimization", "cost_impact": string }],
        "short_term": [...], "long_term": [...] },
      "cost_optimization": [{ "area": string, "current_cost": string, "optimized_cost": string, "savings": string }],
      "architecture_suggestions": [...] }`,
    `Current load: ${JSON.stringify(current_load || 'unknown')}.
    Growth rate: ${growth_rate || 'moderate'}.
    API traffic history: ${JSON.stringify(analytics || [])}.
    Data scale: products=${products?.length || 0}, orders=${orders?.length || 0}.`
  )

  return successResponse({ scaling: result }, ctx.corsHeaders)
}

async function handlePerformanceForecast(ctx: any, params: any) {
  const { horizon = '30d' } = params

  const { data: analytics } = await ctx.supabase
    .from('api_analytics')
    .select('*')
    .order('date', { ascending: false })
    .limit(90)

  const result = await callAI(
    `You are a performance forecasting engine. Predict future performance metrics. Return JSON:
    { "forecast": { "horizon": string,
        "metrics": [{ "name": string, "current": number, "predicted": number, "trend": "improving"|"stable"|"degrading",
          "confidence": number }] },
      "capacity_alerts": [{ "metric": string, "threshold_date": string, "action_needed": string }],
      "performance_budget": { "target_p95_latency": number, "target_error_rate": number, "target_uptime": number },
      "optimization_roadmap": [{ "week": number, "focus": string, "actions": [...], "expected_gain": string }] }`,
    `Horizon: ${horizon}. Historical analytics: ${JSON.stringify(analytics || [])}.`
  )

  return successResponse({ forecast: result }, ctx.corsHeaders)
}
