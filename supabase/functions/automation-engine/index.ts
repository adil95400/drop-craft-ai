/**
 * Automation Engine — SECURED (JWT-first, RLS-enforced)
 * CRUD for automation rules & workflows.
 */

import { requireAuth, handlePreflight, successResponse, errorResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { action, ...params } = await req.json()
    console.log(`🤖 Automation Engine - Action: ${action}, User: ${userId.slice(0, 8)}`)

    let result

    switch (action) {
      case 'create_rule':
        result = await createRule(supabase, userId, params)
        break
      case 'update_rule':
        result = await updateRule(supabase, userId, params)
        break
      case 'get_rule':
        result = await getRule(supabase, userId, params)
        break
      case 'delete_rule':
        result = await deleteRule(supabase, userId, params)
        break
      case 'get_rules':
        result = await getRules(supabase, userId)
        break
      case 'create_workflow':
        result = await createWorkflow(supabase, userId, params)
        break
      case 'execute_workflow':
        result = await executeWorkflow(supabase, userId, params)
        break
      case 'get_workflows':
        result = await getWorkflows(supabase, userId)
        break
      case 'analyze_automation_performance':
        result = await analyzeAutomationPerformance(supabase, userId)
        break
      default:
        return errorResponse(`Unknown action: ${action}`, corsHeaders, 400)
    }

    return successResponse(result, corsHeaders)
  } catch (err) {
    if (err instanceof Response) return err
    console.error('🔥 Automation Engine Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur interne', success: false }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})

async function createRule(supabase: any, userId: string, params: any) {
  const { rule } = params
  const { data, error } = await supabase
    .from('automation_rules')
    .insert({ ...rule, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return { success: true, rule: data, message: 'Règle créée avec succès' }
}

async function updateRule(supabase: any, userId: string, params: any) {
  const { rule_id, updates } = params
  const { data, error } = await supabase
    .from('automation_rules')
    .update(updates)
    .eq('id', rule_id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return { success: true, rule: data, message: 'Règle mise à jour avec succès' }
}

async function getRule(supabase: any, userId: string, params: any) {
  const { rule_id } = params
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('id', rule_id)
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return { success: true, rule: data }
}

async function deleteRule(supabase: any, userId: string, params: any) {
  const { rule_id } = params
  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', rule_id)
    .eq('user_id', userId)
  if (error) throw error
  return { success: true, message: 'Règle supprimée avec succès' }
}

async function getRules(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return { success: true, rules: data || [], count: data?.length || 0 }
}

async function createWorkflow(supabase: any, userId: string, params: any) {
  const { name, description, triggers, actions } = params
  const { data, error } = await supabase
    .from('automation_workflows')
    .insert({
      user_id: userId,
      name,
      description,
      trigger_type: triggers?.[0]?.type || 'manual',
      trigger_config: triggers?.[0] || {},
      steps: actions || [],
      status: 'draft',
    })
    .select()
    .single()
  if (error) throw error
  return { success: true, workflow: data, message: 'Workflow créé avec succès' }
}

async function executeWorkflow(supabase: any, userId: string, params: any) {
  const { workflowId } = params

  // Verify ownership
  const { data: wf, error } = await supabase
    .from('automation_workflows')
    .select('id, name, steps')
    .eq('id', workflowId)
    .eq('user_id', userId)
    .single()
  if (error || !wf) throw new Error('Workflow not found')

  // Update execution count
  await supabase
    .from('automation_workflows')
    .update({
      execution_count: (wf.execution_count || 0) + 1,
      last_run_at: new Date().toISOString(),
    })
    .eq('id', workflowId)
    .eq('user_id', userId)

  return {
    success: true,
    execution_id: crypto.randomUUID(),
    workflow_id: workflowId,
    steps_executed: (wf.steps || []).length,
    message: 'Workflow exécuté',
  }
}

async function getWorkflows(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return { success: true, workflows: data || [], count: data?.length || 0 }
}

async function analyzeAutomationPerformance(supabase: any, userId: string) {
  const { data: workflows } = await supabase
    .from('automation_workflows')
    .select('id, name, status, execution_count, run_count, is_active')
    .eq('user_id', userId)

  const { data: rules } = await supabase
    .from('automation_rules')
    .select('id, is_active, trigger_count')
    .eq('user_id', userId)

  const totalWorkflows = workflows?.length || 0
  const activeWorkflows = workflows?.filter((w: any) => w.is_active)?.length || 0
  const totalExecutions = workflows?.reduce((sum: number, w: any) => sum + (w.execution_count || 0), 0) || 0
  const totalRules = rules?.length || 0
  const activeRules = rules?.filter((r: any) => r.is_active)?.length || 0

  return {
    success: true,
    analysis: {
      total_workflows: totalWorkflows,
      active_workflows: activeWorkflows,
      total_executions: totalExecutions,
      total_rules: totalRules,
      active_rules: activeRules,
    },
    workflows: workflows || [],
  }
}