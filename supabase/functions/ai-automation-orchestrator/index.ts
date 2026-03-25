/**
 * AI Automation Orchestrator — Phase 5.2
 * Migrated to shared ai-client.ts with retry + cache
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
      case 'design_workflow': return handleDesignWorkflow(ctx, params)
      case 'optimize_workflow': return handleOptimizeWorkflow(ctx, params)
      case 'diagnose_failures': return handleDiagnoseFailures(ctx, params)
      case 'suggest_automations': return handleSuggestAutomations(ctx, params)
      default:
        return errorResponse(`Unknown action: ${action}`, ctx.corsHeaders)
    }
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error('Automation Orchestrator error:', e)

    // Surface 429/402 to client
    if (e.status === 429 || e.status === 402) {
      return new Response(JSON.stringify({ success: false, error: e.message }), {
        status: e.status, headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function callAI(systemPrompt: string, userPrompt: string) {
  return generateJSON(systemPrompt, userPrompt, {
    module: 'automation',
    temperature: 0.3,
    enableCache: true,
  })
}

async function handleDesignWorkflow(ctx: any, params: any) {
  const { goal, triggers, constraints } = params

  const { data: existingWorkflows } = await ctx.supabase
    .from('automation_workflows')
    .select('name, trigger_type, action_type, status, execution_count')
    .limit(20)

  const result = await callAI(
    `You are an automation architect. Design a complete workflow based on the user's goal. Return JSON:
    { "workflow": { "name": string, "description": string, "trigger": { "type": string, "config": {...} },
        "steps": [{ "id": string, "name": string, "type": "action"|"condition"|"delay"|"loop",
          "config": {...}, "on_success": string|null, "on_failure": string|null, "retry_policy": {...} }],
        "error_handling": { "strategy": "retry"|"skip"|"abort", "max_retries": number, "fallback_action": string },
        "estimated_execution_time": string },
      "dependencies": [...],
      "potential_issues": [...],
      "optimization_tips": [...] }`,
    `Goal: ${goal}. Triggers: ${JSON.stringify(triggers || [])}. Constraints: ${JSON.stringify(constraints || {})}.
    Existing workflows: ${JSON.stringify(existingWorkflows || [])}.`
  )

  return successResponse({ workflow_design: result }, ctx.corsHeaders)
}

async function handleOptimizeWorkflow(ctx: any, params: any) {
  const { workflow_id } = params

  const { data: workflow } = await ctx.supabase
    .from('automation_workflows')
    .select('*')
    .eq('id', workflow_id)
    .single()

  if (!workflow) return errorResponse('Workflow not found', ctx.corsHeaders, 404)

  const result = await callAI(
    `You are a workflow optimization expert. Analyze and optimize the workflow. Return JSON:
    { "current_assessment": { "efficiency_score": number, "bottlenecks": [...], "redundancies": [...] },
      "optimizations": [{ "type": "parallel"|"cache"|"batch"|"eliminate"|"reorder", "description": string,
        "impact": "high"|"medium"|"low", "before": {...}, "after": {...} }],
      "optimized_steps": [...],
      "expected_improvement": { "speed": string, "reliability": string, "cost": string } }`,
    `Workflow: ${JSON.stringify(workflow)}.`
  )

  return successResponse({ optimization: result }, ctx.corsHeaders)
}

async function handleDiagnoseFailures(ctx: any, params: any) {
  const { workflow_id, time_range = '7d' } = params

  const { data: workflow } = await ctx.supabase
    .from('automation_workflows')
    .select('*')
    .eq('id', workflow_id)
    .single()

  const { data: logs } = await ctx.supabase
    .from('activity_logs')
    .select('action, description, details, severity, created_at')
    .eq('entity_type', 'workflow')
    .eq('entity_id', workflow_id)
    .order('created_at', { ascending: false })
    .limit(50)

  const result = await callAI(
    `You are a workflow diagnostics expert. Analyze failures and provide root cause analysis. Return JSON:
    { "diagnosis": { "failure_rate": number, "common_errors": [{ "error": string, "frequency": number, "root_cause": string }],
        "failure_patterns": [{ "pattern": string, "trigger": string, "correlation": string }] },
      "fixes": [{ "issue": string, "fix": string, "priority": "critical"|"high"|"medium"|"low", "implementation": string }],
      "preventive_measures": [...],
      "monitoring_recommendations": [...] }`,
    `Workflow: ${JSON.stringify(workflow || {})}.
    Recent logs: ${JSON.stringify(logs || [])}.
    Time range: ${time_range}.`
  )

  return successResponse({ diagnosis: result }, ctx.corsHeaders)
}

async function handleSuggestAutomations(ctx: any, params: any) {
  const { data: products } = await ctx.supabase
    .from('products').select('id, title, status, stock_quantity, price').limit(50)

  const { data: orders } = await ctx.supabase
    .from('orders').select('status, total_amount, created_at').limit(100)

  const { data: existingWorkflows } = await ctx.supabase
    .from('automation_workflows').select('name, trigger_type, is_active').limit(20)

  const result = await callAI(
    `You are an automation consultant. Analyze the user's business operations and suggest valuable automations. Return JSON:
    { "suggestions": [{ "name": string, "description": string, "category": "inventory"|"orders"|"marketing"|"pricing"|"customer_service",
        "trigger": string, "actions": [...], "expected_benefit": string, "complexity": "simple"|"moderate"|"complex",
        "roi_estimate": string, "priority": number }],
      "quick_wins": [{ "name": string, "setup_time": string, "impact": string }],
      "advanced_automations": [{ "name": string, "description": string, "requirements": [...] }] }`,
    `Products: ${JSON.stringify(products?.slice(0, 30) || [])}.
    Orders: ${JSON.stringify(orders?.slice(0, 50) || [])}.
    Existing automations: ${JSON.stringify(existingWorkflows || [])}.`
  )

  return successResponse({ suggestions: result }, ctx.corsHeaders)
}
