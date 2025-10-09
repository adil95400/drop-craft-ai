import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RuleEngineRequest {
  userId: string
  productId: string
  currentPrice: number
  costPrice: number
  category?: string
  applyRules?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, productId, currentPrice, costPrice, category, applyRules = false } = await req.json() as RuleEngineRequest

    console.log(`Evaluating pricing rules for product ${productId}`)

    // Récupérer les règles actives de l'utilisateur
    const { data: rules, error: rulesError } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (rulesError) throw rulesError

    let suggestedPrice = currentPrice
    const appliedRules = []
    const ruleResults = []

    for (const rule of rules || []) {
      let ruleApplies = false
      let newPrice = suggestedPrice

      // Évaluer les conditions de la règle
      const conditions = rule.conditions as any
      const actions = rule.actions as any

      switch (rule.rule_type) {
        case 'markup':
          // Règle de marge fixe
          if (conditions.min_margin_percent) {
            const currentMargin = ((suggestedPrice - costPrice) / suggestedPrice) * 100
            if (currentMargin < conditions.min_margin_percent) {
              newPrice = costPrice / (1 - conditions.min_margin_percent / 100)
              ruleApplies = true
            }
          }
          if (conditions.fixed_markup && actions.markup_value) {
            newPrice = costPrice * (1 + actions.markup_value / 100)
            ruleApplies = true
          }
          break

        case 'competitor':
          // Règle basée sur la concurrence
          if (actions.position === 'below_average') {
            // Récupérer prix concurrent moyen
            const { data: competitors } = await supabase
              .from('competitor_prices')
              .select('competitor_price')
              .eq('product_id', productId)
              .eq('user_id', userId)

            if (competitors && competitors.length > 0) {
              const avgPrice = competitors.reduce((sum, c) => sum + c.competitor_price, 0) / competitors.length
              newPrice = avgPrice * (1 - (actions.discount_percent || 5) / 100)
              ruleApplies = true
            }
          }
          break

        case 'volume':
          // Règle basée sur le volume
          if (conditions.min_quantity && actions.discount_percent) {
            // Cette règle s'appliquerait lors d'une commande
            ruleResults.push({
              rule_id: rule.id,
              rule_name: rule.rule_name,
              type: 'volume_discount',
              message: `Remise de ${actions.discount_percent}% pour commandes ≥ ${conditions.min_quantity} unités`,
              discount_price: suggestedPrice * (1 - actions.discount_percent / 100)
            })
          }
          break

        case 'time_based':
          // Règle temporelle
          const now = new Date()
          const hour = now.getHours()
          const dayOfWeek = now.getDay()

          if (conditions.time_range) {
            const [startHour, endHour] = conditions.time_range
            if (hour >= startHour && hour < endHour) {
              if (actions.adjustment_percent) {
                newPrice = suggestedPrice * (1 + actions.adjustment_percent / 100)
                ruleApplies = true
              }
            }
          }

          if (conditions.days_of_week && conditions.days_of_week.includes(dayOfWeek)) {
            if (actions.adjustment_percent) {
              newPrice = suggestedPrice * (1 + actions.adjustment_percent / 100)
              ruleApplies = true
            }
          }
          break

        case 'custom':
          // Règle personnalisée avec formule
          if (actions.formula) {
            try {
              // Évaluation sécurisée de formule simple
              const formula = actions.formula
                .replace(/cost/g, costPrice.toString())
                .replace(/current/g, currentPrice.toString())
              
              // Pour la sécurité, on limite aux opérations mathématiques de base
              if (/^[\d\s\+\-\*\/\.\(\)]+$/.test(formula)) {
                newPrice = eval(formula)
                ruleApplies = true
              }
            } catch (e) {
              console.error('Error evaluating custom formula:', e)
            }
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

    // Si demandé, appliquer le nouveau prix
    if (applyRules && appliedRules.length > 0) {
      const { error: updateError } = await supabase
        .from('imported_products')
        .update({ 
          price: suggestedPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error applying price:', updateError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        product_id: productId,
        original_price: currentPrice,
        suggested_price: Math.round(suggestedPrice * 100) / 100,
        price_change: Math.round((suggestedPrice - currentPrice) * 100) / 100,
        price_change_percent: currentPrice > 0 ? Math.round(((suggestedPrice - currentPrice) / currentPrice * 100) * 100) / 100 : 0,
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