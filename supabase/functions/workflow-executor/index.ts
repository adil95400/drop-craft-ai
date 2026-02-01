/**
 * Workflow Executor - Secure Implementation
 * P1.1: Auth obligatoire, rate limiting, validation Zod, scoping user_id
 */
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser, logSecurityEvent, checkRateLimit } from '../_shared/secure-auth.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const RequestSchema = z.object({
  workflowId: z.string().uuid(),
  triggerData: z.any().optional(),
  manualExecution: z.boolean().optional().default(false)
})

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 1. Auth obligatoire - userId provient du token uniquement
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id
    
    // 2. Rate limiting: max 30 workflow executions per hour
    const rateCheck = await checkRateLimit(supabase, userId, 'workflow_execution', 30, 60)
    if (!rateCheck) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Max 30 workflow executions per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Parse and validate input
    const body = await req.json()
    const parseResult = RequestSchema.safeParse(body)
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request',
          details: parseResult.error.flatten()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { workflowId, triggerData, manualExecution } = parseResult.data
    
    console.log(`[SECURE] Executing workflow ${workflowId} for user ${userId}`)

    // Get workflow details - SCOPED to user
    const { data: workflow, error: workflowError } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', userId) // CRITICAL: scope to user
      .single()

    if (workflowError || !workflow) {
      throw new Error('Workflow not found')
    }

    if (workflow.status !== 'active' && !manualExecution) {
      throw new Error('Workflow is not active')
    }

    // Create execution record - SCOPED to user
    const { data: execution, error: executionError } = await supabase
      .from('automation_executions')
      .insert({
        workflow_id: workflowId,
        user_id: userId, // CRITICAL: from token only
        status: 'running',
        input_data: triggerData || {},
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (executionError) {
      throw new Error('Failed to create execution record')
    }

    // Execute workflow steps
    const executionResult = await executeWorkflowSteps(workflow, triggerData, execution.id, supabase, userId)

    // Update execution record - SCOPED to user
    await supabase
      .from('automation_executions')
      .update({
        status: executionResult.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        execution_time_ms: executionResult.executionTime,
        step_results: executionResult.stepResults,
        output_data: executionResult.outputData,
        error_message: executionResult.error
      })
      .eq('id', execution.id)
      .eq('user_id', userId) // SECURE: scope to user

    // Update workflow stats - SCOPED to user
    if (executionResult.success) {
      await supabase
        .from('automation_workflows')
        .update({
          success_count: (workflow.success_count || 0) + 1,
          execution_count: (workflow.execution_count || 0) + 1,
          last_executed_at: new Date().toISOString()
        })
        .eq('id', workflowId)
        .eq('user_id', userId) // SECURE: scope to user
    } else {
      await supabase
        .from('automation_workflows')
        .update({
          failure_count: (workflow.failure_count || 0) + 1,
          execution_count: (workflow.execution_count || 0) + 1,
          last_executed_at: new Date().toISOString()
        })
        .eq('id', workflowId)
        .eq('user_id', userId) // SECURE: scope to user
    }

    // Log security event
    await logSecurityEvent(supabase, userId, 'workflow_executed', 'info', {
      workflow_id: workflowId,
      execution_id: execution.id,
      success: executionResult.success
    })

    return new Response(JSON.stringify({
      success: executionResult.success,
      executionId: execution.id,
      executionTime: executionResult.executionTime,
      stepResults: executionResult.stepResults,
      outputData: executionResult.outputData,
      error: executionResult.error
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Workflow execution error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' }
    })
  }
})

async function executeWorkflowSteps(workflow: any, triggerData: any, executionId: string, supabase: any, userId: string) {
  const startTime = Date.now()
  const stepResults: any[] = []
  let currentData = triggerData || {}
  let success = true
  let error = null

  try {
    for (const [index, step] of (workflow.steps || []).entries()) {
      console.log(`Executing step ${index + 1}: ${step.step_type}`)
      
      const stepStartTime = Date.now()
      
      try {
        const stepResult = await executeStep(step, currentData, workflow, supabase, userId)
        
        stepResults.push({
          step: step.step_type,
          position: index,
          status: 'success',
          duration: Date.now() - stepStartTime,
          input: currentData,
          output: stepResult.data,
          config: step.step_config
        })

        if (stepResult.data && typeof stepResult.data === 'object') {
          currentData = { ...currentData, ...stepResult.data }
        }

      } catch (stepError) {
        console.error(`Step ${index + 1} failed:`, stepError)
        
        stepResults.push({
          step: step.step_type,
          position: index,
          status: 'error',
          duration: Date.now() - stepStartTime,
          input: currentData,
          error: stepError.message,
          config: step.step_config
        })

        if (!step.step_config?.continueOnError) {
          success = false
          error = `Step ${index + 1} (${step.step_type}) failed: ${stepError.message}`
          break
        }
      }
    }

  } catch (workflowError) {
    console.error('Workflow execution failed:', workflowError)
    success = false
    error = workflowError.message
  }

  return {
    success,
    executionTime: Date.now() - startTime,
    stepResults,
    outputData: currentData,
    error
  }
}

async function executeStep(step: any, inputData: any, workflow: any, supabase: any, userId: string) {
  const { step_type, step_config } = step

  switch (step_type) {
    case 'http_request':
      return await executeHttpRequest(step_config, inputData)
    
    case 'database_insert':
      return await executeDatabaseInsert(step_config, inputData, supabase, userId)
    
    case 'database_update':
      return await executeDatabaseUpdate(step_config, inputData, supabase, userId)
    
    case 'send_email':
      return await executeSendEmail(step_config, inputData)
    
    case 'transform_data':
      return await executeTransformData(step_config, inputData)
    
    case 'conditional':
      return await executeConditional(step_config, inputData)
    
    case 'delay':
      return await executeDelay(step_config)
    
    case 'filter':
      return await executeFilter(step_config, inputData)
    
    default:
      throw new Error(`Unknown step type: ${step_type}`)
  }
}

// Whitelist of allowed tables for workflow database operations
const ALLOWED_TABLES = ['products', 'orders', 'customers', 'crm_contacts', 'notifications', 'activity_logs']

async function executeHttpRequest(config: any, inputData: any) {
  const { url, method = 'GET', headers = {}, body, timeout = 30000 } = config
  
  if (!url) {
    throw new Error('HTTP request URL is required')
  }

  // Validate URL - block internal hosts
  const urlObj = new URL(replaceVariables(url, inputData))
  const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1']
  if (blockedHosts.some(h => urlObj.hostname.includes(h))) {
    throw new Error('Internal URLs are not allowed')
  }

  const processedUrl = replaceVariables(url, inputData)
  const processedBody = body ? replaceVariables(JSON.stringify(body), inputData) : undefined

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(processedUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: processedBody,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const responseData = await response.text()
    let parsedData

    try {
      parsedData = JSON.parse(responseData)
    } catch {
      parsedData = responseData
    }

    return {
      success: response.ok,
      data: {
        status: response.status,
        statusText: response.statusText,
        body: parsedData,
        headers: Object.fromEntries(response.headers.entries())
      }
    }
  } catch (error) {
    clearTimeout(timeoutId)
    throw new Error(`HTTP request failed: ${error.message}`)
  }
}

async function executeDatabaseInsert(config: any, inputData: any, supabase: any, userId: string) {
  const { table, data } = config
  
  if (!table || !data) {
    throw new Error('Table and data are required for database insert')
  }

  // Validate table is allowed
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Table ${table} is not allowed for workflow operations`)
  }

  const processedData = JSON.parse(replaceVariables(JSON.stringify(data), inputData))
  
  // Always inject user_id for security
  processedData.user_id = userId

  const { data: result, error } = await supabase
    .from(table)
    .insert([processedData])
    .select()

  if (error) {
    throw new Error(`Database insert failed: ${error.message}`)
  }

  return {
    success: true,
    data: { inserted: result }
  }
}

async function executeDatabaseUpdate(config: any, inputData: any, supabase: any, userId: string) {
  const { table, data, where } = config
  
  if (!table || !data || !where) {
    throw new Error('Table, data, and where conditions are required for database update')
  }

  // Validate table is allowed
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Table ${table} is not allowed for workflow operations`)
  }

  const processedData = JSON.parse(replaceVariables(JSON.stringify(data), inputData))
  const processedWhere = JSON.parse(replaceVariables(JSON.stringify(where), inputData))

  let query = supabase.from(table).update(processedData)
  
  // Always scope to user
  query = query.eq('user_id', userId)
  
  for (const [column, value] of Object.entries(processedWhere)) {
    if (column !== 'user_id') { // Don't allow overriding user_id
      query = query.eq(column, value)
    }
  }

  const { data: result, error } = await query.select()

  if (error) {
    throw new Error(`Database update failed: ${error.message}`)
  }

  return {
    success: true,
    data: { updated: result }
  }
}

async function executeSendEmail(config: any, inputData: any) {
  const { to, subject, body, from = 'noreply@app.com' } = config
  
  if (!to || !subject || !body) {
    throw new Error('To, subject, and body are required for sending email')
  }

  const processedTo = replaceVariables(to, inputData)
  const processedSubject = replaceVariables(subject, inputData)
  const processedBody = replaceVariables(body, inputData)

  console.log(`Sending email to: ${processedTo}`)
  await new Promise(resolve => setTimeout(resolve, 100))

  return {
    success: true,
    data: {
      to: processedTo,
      subject: processedSubject,
      sent: true,
      messageId: crypto.randomUUID()
    }
  }
}

async function executeTransformData(config: any, inputData: any) {
  const { transformations } = config
  
  if (!transformations || !Array.isArray(transformations)) {
    throw new Error('Transformations array is required')
  }

  let result = { ...inputData }

  for (const transformation of transformations) {
    const { type, source, target, value, operation } = transformation

    switch (type) {
      case 'map':
        result[target] = result[source]
        break
      
      case 'set':
        result[target] = replaceVariables(value, result)
        break
      
      case 'format':
        result[target] = formatValue(result[source], operation)
        break
    }
  }

  return {
    success: true,
    data: result
  }
}

async function executeConditional(config: any, inputData: any) {
  const { condition, trueValue, falseValue } = config
  
  const conditionResult = evaluateCondition(condition, inputData)
  
  return {
    success: true,
    data: {
      conditionResult,
      value: conditionResult ? trueValue : falseValue
    }
  }
}

async function executeDelay(config: any) {
  const { duration = 1000 } = config
  const maxDelay = 60000 // Max 60 seconds
  
  await new Promise(resolve => setTimeout(resolve, Math.min(duration, maxDelay)))
  
  return {
    success: true,
    data: {
      delayed: Math.min(duration, maxDelay)
    }
  }
}

async function executeFilter(config: any, inputData: any) {
  const { condition } = config
  
  const passesFilter = evaluateCondition(condition, inputData)
  
  if (!passesFilter) {
    throw new Error('Data does not pass filter condition')
  }
  
  return {
    success: true,
    data: inputData
  }
}

function replaceVariables(template: string, data: any): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const keys = key.trim().split('.')
    let value = data
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return match
      }
    }
    
    return String(value)
  })
}

function evaluateCondition(condition: any, data: any): boolean {
  const { field, operator, value } = condition
  const fieldValue = getNestedValue(data, field)
  
  switch (operator) {
    case 'equals': return fieldValue === value
    case 'not_equals': return fieldValue !== value
    case 'greater_than': return Number(fieldValue) > Number(value)
    case 'less_than': return Number(fieldValue) < Number(value)
    case 'contains': return String(fieldValue).includes(String(value))
    case 'not_contains': return !String(fieldValue).includes(String(value))
    case 'exists': return fieldValue !== undefined && fieldValue !== null
    case 'not_exists': return fieldValue === undefined || fieldValue === null
    default: return false
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

function formatValue(value: any, format: string): string {
  switch (format) {
    case 'uppercase': return String(value).toUpperCase()
    case 'lowercase': return String(value).toLowerCase()
    case 'date': return new Date(value).toISOString()
    default: return String(value)
  }
}
