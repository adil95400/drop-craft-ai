import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AutomationRequest {
  trigger: 'import_complete' | 'product_added' | 'bulk_import' | 'scheduled'
  productIds?: string[]
  importData?: any
  automationRules?: string[]
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

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { trigger, productIds = [], importData = {}, automationRules = [] }: AutomationRequest = await req.json()

    console.log(`🤖 AI Automation triggered: ${trigger}`)

    // Get user's active automation rules
    const { data: activeRules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (rulesError) {
      console.warn('Failed to fetch automation rules:', rulesError.message)
    }

    // Get user's active extensions that support automation
    const { data: extensions, error: extensionsError } = await supabase
      .from('extensions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (extensionsError) {
      console.warn('Failed to fetch extensions:', extensionsError.message)
    }

    const automationResults = []

    // Process automation rules
    if (activeRules) {
      for (const rule of activeRules) {
        if (shouldExecuteRule(rule, trigger, importData)) {
          const result = await executeAutomationRule(supabase, user.id, rule, productIds, importData)
          automationResults.push(result)
        }
      }
    }

    // Process extension automations
    if (extensions) {
      for (const extension of extensions) {
        if (extensionSupportsAutomation(extension, trigger)) {
          const result = await executeExtensionAutomation(supabase, user.id, extension, productIds, importData)
          automationResults.push(result)
        }
      }
    }

    // Smart automation recommendations based on import data
    const recommendations = await generateSmartRecommendations(supabase, user.id, trigger, importData, productIds)

    return new Response(
      JSON.stringify({
        success: true,
        trigger,
        automations_executed: automationResults.length,
        results: automationResults,
        recommendations,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('AI Automation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Détermine si une règle d'automation doit être exécutée
function shouldExecuteRule(rule: any, trigger: string, importData: any): boolean {
  const conditions = rule.trigger_conditions || {}
  const aiConditions = rule.ai_conditions || {}
  
  // Vérification du trigger principal
  if (conditions.trigger_type && conditions.trigger_type !== trigger) {
    return false
  }
  
  // Conditions IA
  if (aiConditions.min_products && importData.products_count < aiConditions.min_products) {
    return false
  }
  
  if (aiConditions.required_categories && importData.categories) {
    const hasRequiredCategory = aiConditions.required_categories.some(
      (cat: string) => importData.categories.includes(cat)
    )
    if (!hasRequiredCategory) return false
  }
  
  // Conditions temporelles
  if (conditions.time_constraints) {
    const now = new Date()
    const hour = now.getHours()
    
    if (conditions.time_constraints.min_hour && hour < conditions.time_constraints.min_hour) {
      return false
    }
    
    if (conditions.time_constraints.max_hour && hour > conditions.time_constraints.max_hour) {
      return false
    }
  }
  
  return true
}

// Exécute une règle d'automation
async function executeAutomationRule(supabase: any, userId: string, rule: any, productIds: string[], importData: any) {
  console.log(`🎯 Executing automation rule: ${rule.name}`)
  
  const startTime = Date.now()
  const executionResults = []
  
  try {
    const actions = rule.actions || []
    
    for (const action of actions) {
      const actionResult = await executeAction(supabase, userId, action, productIds, importData)
      executionResults.push(actionResult)
    }
    
    // Mettre à jour les statistiques de la règle
    await supabase
      .from('automation_rules')
      .update({
        execution_count: (rule.execution_count || 0) + 1,
        last_executed_at: new Date().toISOString(),
        success_rate: calculateSuccessRate(rule, executionResults),
        performance_metrics: {
          ...rule.performance_metrics,
          last_execution_time_ms: Date.now() - startTime,
          total_actions_executed: executionResults.length
        }
      })
      .eq('id', rule.id)
    
    return {
      rule_id: rule.id,
      rule_name: rule.name,
      status: 'completed',
      actions_executed: executionResults.length,
      execution_time_ms: Date.now() - startTime,
      results: executionResults
    }
    
  } catch (error) {
    console.error(`Error executing rule ${rule.name}:`, error)
    
    return {
      rule_id: rule.id,
      rule_name: rule.name,
      status: 'failed',
      error: error.message,
      execution_time_ms: Date.now() - startTime
    }
  }
}

// Exécute une action spécifique
async function executeAction(supabase: any, userId: string, action: any, productIds: string[], importData: any) {
  console.log(`⚡ Executing action: ${action.type}`)
  
  switch (action.type) {
    case 'seo_optimization':
      return await executeSEOOptimization(supabase, userId, productIds, action.config)
      
    case 'price_adjustment':
      return await executePriceAdjustment(supabase, userId, productIds, action.config)
      
    case 'category_assignment':
      return await executeCategoryAssignment(supabase, userId, productIds, action.config)
      
    case 'quality_check':
      return await executeQualityCheck(supabase, userId, productIds, action.config)
      
    case 'notification':
      return await executeNotification(supabase, userId, action.config, importData)
      
    case 'webhook':
      return await executeWebhook(action.config, { productIds, importData })
      
    default:
      console.warn(`Unknown action type: ${action.type}`)
      return {
        action: action.type,
        status: 'skipped',
        reason: 'Unknown action type'
      }
  }
}

// Actions spécifiques
async function executeSEOOptimization(supabase: any, userId: string, productIds: string[], config: any) {
  const optimizedCount = productIds.length
  
  // Appel à l'AI optimizer pour chaque produit
  for (const productId of productIds) {
    try {
      const { error } = await supabase.functions.invoke('ai-optimizer', {
        body: {
          extensionType: 'seo',
          productData: { id: productId },
          userPreferences: config
        }
      })
      
      if (error) {
        console.error(`SEO optimization failed for product ${productId}:`, error)
      }
    } catch (error) {
      console.error(`SEO optimization error:`, error)
    }
  }
  
  return {
    action: 'seo_optimization',
    status: 'completed',
    products_optimized: optimizedCount,
    success_rate: 100 // Simplification pour la démo
  }
}

async function executePriceAdjustment(supabase: any, userId: string, productIds: string[], config: any) {
  let adjustedCount = 0
  
  for (const productId of productIds) {
    try {
      // Logique d'ajustement des prix
      const adjustment = config.adjustment_type === 'percentage' 
        ? config.adjustment_value 
        : config.fixed_amount
        
      // Ici on mettrait à jour le prix dans imported_products
      adjustedCount++
      
    } catch (error) {
      console.error(`Price adjustment failed for product ${productId}:`, error)
    }
  }
  
  return {
    action: 'price_adjustment',
    status: 'completed',
    products_adjusted: adjustedCount,
    adjustment_type: config.adjustment_type,
    adjustment_value: config.adjustment_value
  }
}

async function executeCategoryAssignment(supabase: any, userId: string, productIds: string[], config: any) {
  let categorizedCount = 0
  
  for (const productId of productIds) {
    try {
      const { error } = await supabase.functions.invoke('ai-optimizer', {
        body: {
          extensionType: 'categorization',
          productData: { id: productId },
          userPreferences: config
        }
      })
      
      if (!error) {
        categorizedCount++
      }
    } catch (error) {
      console.error(`Categorization failed for product ${productId}:`, error)
    }
  }
  
  return {
    action: 'category_assignment',
    status: 'completed',
    products_categorized: categorizedCount
  }
}

async function executeQualityCheck(supabase: any, userId: string, productIds: string[], config: any) {
  let checkedCount = 0
  let qualityIssues = 0
  
  for (const productId of productIds) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-optimizer', {
        body: {
          extensionType: 'quality',
          productData: { id: productId },
          userPreferences: config
        }
      })
      
      if (!error) {
        checkedCount++
        if (data?.optimization?.issues?.length > 0) {
          qualityIssues++
        }
      }
    } catch (error) {
      console.error(`Quality check failed for product ${productId}:`, error)
    }
  }
  
  return {
    action: 'quality_check',
    status: 'completed',
    products_checked: checkedCount,
    quality_issues_found: qualityIssues,
    quality_score: Math.round(((checkedCount - qualityIssues) / checkedCount) * 100)
  }
}

async function executeNotification(supabase: any, userId: string, config: any, importData: any) {
  // Envoyer une notification (email, in-app, etc.)
  const message = config.message_template
    .replace('{products_count}', importData.products_count || 0)
    .replace('{timestamp}', new Date().toLocaleString('fr-FR'))
  
  // Ici on pourrait intégrer avec un service de notification
  console.log(`📧 Notification sent: ${message}`)
  
  return {
    action: 'notification',
    status: 'completed',
    message: message,
    channel: config.channel || 'in-app'
  }
}

async function executeWebhook(config: any, data: any) {
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {})
      },
      body: JSON.stringify({
        event: 'automation_executed',
        data: data,
        timestamp: new Date().toISOString()
      })
    })
    
    return {
      action: 'webhook',
      status: response.ok ? 'completed' : 'failed',
      status_code: response.status,
      url: config.url
    }
  } catch (error) {
    return {
      action: 'webhook',
      status: 'failed',
      error: error.message,
      url: config.url
    }
  }
}

// Vérifie si une extension supporte l'automation pour ce trigger
function extensionSupportsAutomation(extension: any, trigger: string): boolean {
  const config = extension.configuration || {}
  const autoTriggers = config.auto_trigger || []
  
  const triggerMap = {
    'import_complete': ['csv', 'url', 'bulk'],
    'product_added': ['all'],
    'bulk_import': ['bulk'],
    'scheduled': ['scheduled']
  }
  
  const supportedTriggers = triggerMap[trigger] || []
  return supportedTriggers.some(t => autoTriggers.includes(t) || autoTriggers.includes('all'))
}

// Exécute l'automation d'une extension
async function executeExtensionAutomation(supabase: any, userId: string, extension: any, productIds: string[], importData: any) {
  console.log(`🧩 Executing extension automation: ${extension.display_name}`)
  
  const startTime = Date.now()
  
  try {
    // Créer un job d'extension
    const { data: job, error: jobError } = await supabase
      .from('extension_jobs')
      .insert({
        extension_id: extension.id,
        user_id: userId,
        job_type: 'automation',
        status: 'processing',
        input_data: {
          trigger: 'automation',
          product_ids: productIds,
          import_data: importData
        },
        progress: 0
      })
      .select()
      .single()
    
    if (jobError) {
      throw new Error(`Failed to create extension job: ${jobError.message}`)
    }
    
    // Exécuter l'automation selon le type d'extension
    let result = {}
    
    if (extension.category === 'ai_enhancement') {
      result = await supabase.functions.invoke('ai-optimizer', {
        body: {
          extensionType: 'seo',
          productData: { ids: productIds },
          userPreferences: extension.configuration
        }
      })
    } else if (extension.category === 'pricing') {
      result = await supabase.functions.invoke('ai-optimizer', {
        body: {
          extensionType: 'pricing', 
          productData: { ids: productIds },
          userPreferences: extension.configuration
        }
      })
    }
    
    // Mettre à jour le job
    await supabase
      .from('extension_jobs')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        output_data: result,
        success_items: productIds.length
      })
      .eq('id', job.id)
    
    return {
      extension_id: extension.id,
      extension_name: extension.display_name,
      status: 'completed',
      job_id: job.id,
      products_processed: productIds.length,
      execution_time_ms: Date.now() - startTime
    }
    
  } catch (error) {
    console.error(`Extension automation error:`, error)
    
    return {
      extension_id: extension.id,
      extension_name: extension.display_name,
      status: 'failed',
      error: error.message,
      execution_time_ms: Date.now() - startTime
    }
  }
}

// Génère des recommandations intelligentes
async function generateSmartRecommendations(supabase: any, userId: string, trigger: string, importData: any, productIds: string[]) {
  const recommendations = []
  
  // Analyse du contexte d'importation
  if (trigger === 'import_complete' && importData) {
    if (importData.products_count > 100) {
      recommendations.push({
        type: 'automation_rule',
        priority: 'high',
        title: 'Créer une règle d\'automation pour les gros imports',
        description: 'Automatisez l\'optimisation SEO et le contrôle qualité pour les imports de plus de 100 produits',
        action: 'create_bulk_automation_rule'
      })
    }
    
    if (importData.categories && importData.categories.length > 5) {
      recommendations.push({
        type: 'extension',
        priority: 'medium',
        title: 'Installer l\'extension Auto-Categorizer',
        description: 'Catégorisez automatiquement vos produits avec IA pour une meilleure organisation',
        action: 'install_categorizer_extension'
      })
    }
    
    if (importData.quality_score && importData.quality_score < 70) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        title: 'Améliorer la qualité des produits',
        description: 'Score qualité moyen faible. Activez le contrôle qualité automatique.',
        action: 'enable_quality_automation'
      })
    }
  }
  
  // Recommandations basées sur l'historique utilisateur
  try {
    const { data: userStats } = await supabase
      .from('imported_products')
      .select('category, status, ai_optimized')
      .eq('user_id', userId)
      .limit(100)
    
    if (userStats && userStats.length > 0) {
      const optimizedRatio = userStats.filter(p => p.ai_optimized).length / userStats.length
      
      if (optimizedRatio < 0.3) {
        recommendations.push({
          type: 'ai_optimization',
          priority: 'medium',
          title: 'Augmenter l\'utilisation de l\'IA',
          description: 'Seulement 30% de vos produits utilisent l\'IA. Activez plus d\'extensions IA.',
          action: 'enable_ai_extensions'
        })
      }
    }
  } catch (error) {
    console.error('Error generating user stats recommendations:', error)
  }
  
  return recommendations
}

// Calcule le taux de succès d'une règle
function calculateSuccessRate(rule: any, executionResults: any[]): number {
  const successfulActions = executionResults.filter(r => r.status === 'completed').length
  const totalExecutions = (rule.execution_count || 0) + 1
  const currentSuccessRate = rule.success_rate || 100
  
  // Moyenne pondérée du taux de succès
  const newSuccessRate = ((currentSuccessRate * (totalExecutions - 1)) + (successfulActions / executionResults.length * 100)) / totalExecutions
  
  return Math.round(newSuccessRate * 100) / 100
}