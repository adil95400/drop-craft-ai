import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RuleEngineRequest {
  action?: string // 'apply_all' for batch mode
  userId?: string
  productId?: string
  currentPrice?: number
  costPrice?: number
  category?: string
  applyRules?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.json() as RuleEngineRequest

    // ── Batch mode: apply_all ──
    if (body.action === 'apply_all') {
      return await handleApplyAll(supabase)
    }

    // ── Single product mode (existing) ──
    const { userId, productId, currentPrice, costPrice, category, applyRules = false } = body

    if (!userId || !productId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId and productId required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Evaluating pricing rules for product ${productId}`)

    const { data: rules, error: rulesError } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (rulesError) throw rulesError

    let suggestedPrice = currentPrice || 0
    const appliedRules: any[] = []
    const ruleResults: any[] = []

    for (const rule of rules || []) {
      let ruleApplies = false
      let newPrice = suggestedPrice
      const conditions = rule.conditions as any
      const actions = rule.actions as any

      switch (rule.rule_type) {
        case 'markup':
          if (conditions?.min_margin_percent && costPrice) {
            const currentMargin = ((suggestedPrice - costPrice) / suggestedPrice) * 100
            if (currentMargin < conditions.min_margin_percent) {
              newPrice = costPrice / (1 - conditions.min_margin_percent / 100)
              ruleApplies = true
            }
          }
          if (conditions?.fixed_markup && actions?.markup_value && costPrice) {
            newPrice = costPrice * (1 + actions.markup_value / 100)
            ruleApplies = true
          }
          break

        case 'competitor':
          if (actions?.position === 'below_average') {
            const { data: competitors } = await supabase
              .from('competitor_prices')
              .select('competitor_price')
              .eq('product_id', productId)
              .eq('user_id', userId)

            if (competitors && competitors.length > 0) {
              const avgPrice = competitors.reduce((sum: number, c: any) => sum + c.competitor_price, 0) / competitors.length
              newPrice = avgPrice * (1 - (actions.discount_percent || 5) / 100)
              ruleApplies = true
            }
          }
          break

        case 'volume':
          if (conditions?.min_quantity && actions?.discount_percent) {
            ruleResults.push({
              rule_id: rule.id,
              rule_name: rule.rule_name,
              type: 'volume_discount',
              message: `Remise de ${actions.discount_percent}% pour commandes ≥ ${conditions.min_quantity} unités`,
              discount_price: suggestedPrice * (1 - actions.discount_percent / 100)
            })
          }
          break

        case 'time_based': {
          const now = new Date()
          const hour = now.getHours()
          const dayOfWeek = now.getDay()
          if (conditions?.time_range) {
            const [startHour, endHour] = conditions.time_range
            if (hour >= startHour && hour < endHour && actions?.adjustment_percent) {
              newPrice = suggestedPrice * (1 + actions.adjustment_percent / 100)
              ruleApplies = true
            }
          }
          if (conditions?.days_of_week?.includes(dayOfWeek) && actions?.adjustment_percent) {
            newPrice = suggestedPrice * (1 + actions.adjustment_percent / 100)
            ruleApplies = true
          }
          break
        }

        case 'custom':
          if (actions?.formula && costPrice) {
            try {
              const formula = actions.formula
                .replace(/cost/g, (costPrice).toString())
                .replace(/current/g, (currentPrice || 0).toString())
              if (/^[\d\s\+\-\*\/\.\(\)]+$/.test(formula)) {
                newPrice = eval(formula)
                ruleApplies = true
              }
            } catch (_e) { /* skip */ }
          }
          break
      }

      if (ruleApplies && newPrice !== suggestedPrice) {
        appliedRules.push({
          rule_id: rule.id,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          old_price: suggestedPrice,
          new_price: newPrice,
          change_percent: ((newPrice - suggestedPrice) / suggestedPrice) * 100
        })
        suggestedPrice = newPrice
      }

      ruleResults.push({
        rule_id: rule.id,
        rule_name: rule.rule_name,
        applied: ruleApplies,
        result: ruleApplies ? newPrice : null
      })
    }

    if (applyRules && appliedRules.length > 0) {
      await supabase
        .from('imported_products')
        .update({ price: suggestedPrice, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('user_id', userId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        product_id: productId,
        original_price: currentPrice,
        suggested_price: Math.round(suggestedPrice * 100) / 100,
        price_change: Math.round((suggestedPrice - (currentPrice || 0)) * 100) / 100,
        price_change_percent: (currentPrice || 0) > 0 ? Math.round(((suggestedPrice - (currentPrice || 0)) / (currentPrice || 0) * 100) * 100) / 100 : 0,
        rules_evaluated: rules?.length || 0,
        rules_applied: appliedRules.length,
        applied_rules: appliedRules,
        all_rules: ruleResults,
        applied: applyRules && appliedRules.length > 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Pricing rules engine error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

/**
 * Batch mode: iterate over all users with active pricing rules,
 * apply rules to their products, log changes to price_change_history.
 */
async function handleApplyAll(supabase: any) {
  console.log('[pricing-rules-engine] Starting apply_all batch')
  const startTime = Date.now()

  // Get all active rules grouped by user
  const { data: rules, error: rulesError } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })

  if (rulesError) throw rulesError
  if (!rules || rules.length === 0) {
    return new Response(
      JSON.stringify({ success: true, message: 'No active rules', products_updated: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Group rules by user_id
  const rulesByUser = new Map<string, any[]>()
  for (const rule of rules) {
    const list = rulesByUser.get(rule.user_id) || []
    list.push(rule)
    rulesByUser.set(rule.user_id, list)
  }

  let totalUpdated = 0
  let totalEvaluated = 0
  let totalErrors = 0

  for (const [userId, userRules] of rulesByUser) {
    try {
      // Fetch user's products with cost_price
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, price, cost_price, category, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .not('cost_price', 'is', null)
        .gt('cost_price', 0)
        .limit(500)

      if (prodError || !products) continue

      for (const product of products) {
        totalEvaluated++
        let newPrice = product.price || 0
        const costPrice = product.cost_price
        let ruleApplied: string | null = null

        for (const rule of userRules) {
          // Check apply_to filter
          if (rule.apply_to === 'category' && rule.apply_filter?.category) {
            if (product.category !== rule.apply_filter.category) continue
          }

          const calculation = rule.calculation as any
          const targetMargin = rule.target_margin

          switch (rule.rule_type) {
            case 'margin':
              if (targetMargin && costPrice > 0) {
                newPrice = costPrice / (1 - targetMargin / 100)
                ruleApplied = rule.name
              }
              break
            case 'markup':
              if (calculation?.markup_percent && costPrice > 0) {
                newPrice = costPrice * (1 + calculation.markup_percent / 100)
                ruleApplied = rule.name
              } else if (rule.conditions?.fixed_markup && rule.actions?.markup_value && costPrice > 0) {
                newPrice = costPrice * (1 + rule.actions.markup_value / 100)
                ruleApplied = rule.name
              }
              break
            case 'fixed':
              if (calculation?.fixed_amount && costPrice > 0) {
                newPrice = costPrice + calculation.fixed_amount
                ruleApplied = rule.name
              }
              break
          }
        }

        // Apply margin protection
        const marginProtection = userRules[0]?.margin_protection ?? 15
        const minAllowed = costPrice / (1 - marginProtection / 100)
        if (newPrice < minAllowed) newPrice = minAllowed

        // Apply rounding
        const roundingStrategy = userRules[0]?.rounding_strategy ?? 'nearest_99'
        newPrice = applyRounding(newPrice, roundingStrategy)

        // Only update if price actually changed
        const roundedNew = Math.round(newPrice * 100) / 100
        const currentPrice = Math.round((product.price || 0) * 100) / 100

        if (roundedNew !== currentPrice && ruleApplied) {
          // Update product price
          await supabase
            .from('products')
            .update({ price: roundedNew, updated_at: new Date().toISOString() })
            .eq('id', product.id)

          // Log to price_change_history
          await supabase
            .from('price_change_history')
            .insert({
              user_id: userId,
              product_id: product.id,
              old_price: currentPrice,
              new_price: roundedNew,
              change_type: 'automatic',
              source: 'pricing_rules_engine',
              reason: `Rule: ${ruleApplied}`,
            })

          totalUpdated++
        }
      }

      // Update execution stats on rules
      for (const rule of userRules) {
        await supabase
          .from('pricing_rules')
          .update({
            execution_count: (rule.execution_count || 0) + 1,
            last_executed_at: new Date().toISOString(),
          })
          .eq('id', rule.id)
      }
    } catch (userError) {
      console.error(`[pricing-rules-engine] Error for user ${userId}:`, userError)
      totalErrors++
    }
  }

  const durationMs = Date.now() - startTime

  // Log activity
  await supabase.from('activity_logs').insert({
    action: 'pricing_batch_apply',
    entity_type: 'pricing',
    description: `Batch pricing: ${totalUpdated} products updated out of ${totalEvaluated} evaluated`,
    source: 'automation',
    severity: totalErrors > 0 ? 'warn' : 'info',
    details: { totalUpdated, totalEvaluated, totalErrors, durationMs, usersProcessed: rulesByUser.size },
  })

  console.log(`[pricing-rules-engine] apply_all done in ${durationMs}ms: ${totalUpdated} updated, ${totalErrors} errors`)

  return new Response(
    JSON.stringify({
      success: true,
      products_evaluated: totalEvaluated,
      products_updated: totalUpdated,
      errors: totalErrors,
      users_processed: rulesByUser.size,
      duration_ms: durationMs,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function applyRounding(price: number, strategy: string): number {
  switch (strategy) {
    case 'nearest_99':
      return Math.floor(price) + 0.99
    case 'nearest_50':
      return Math.round(price * 2) / 2
    case 'round_up':
      return Math.ceil(price)
    case 'none':
    default:
      return Math.round(price * 100) / 100
  }
}
