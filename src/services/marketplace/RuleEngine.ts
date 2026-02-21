/**
 * Moteur de règles simplifié pour la marketplace
 * Version utilisant automation_rules existant
 */

import { fromTable } from '@/integrations/supabase/typedClient'

interface ProductRule {
  id: string
  user_id: string
  name: string
  description?: string
  trigger_type: string
  action_type: string
  trigger_config?: Record<string, unknown>
  action_config?: Record<string, unknown>
  is_active: boolean
  priority?: number
  created_at: string
  updated_at: string
}

type UnifiedProduct = {
  id: string
  name: string
  description?: string
  price?: number
  stock?: number
  tags?: string[]
  [key: string]: unknown
}

export interface RuleCondition {
  field: string
  operator: 'eq' | 'ne' | 'lt' | 'gt' | 'contains' | 'empty' | 'not_empty'
  value?: string | number | boolean
}

export interface RuleAction {
  type: 'set_field' | 'add_tag' | 'exclude' | 'generate_ai'
  field?: string
  value?: string | number | boolean
}

export class MarketplaceRuleEngine {
  async evaluateProduct(product: UnifiedProduct, userId: string): Promise<{
    shouldExclude: boolean
    modifications: Record<string, unknown>
    appliedRules: string[]
  }> {
    const { data: rules, error } = await fromTable('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('trigger_count', { ascending: true })

    if (error) throw error

    let shouldExclude = false
    const modifications: Record<string, unknown> = {}
    const appliedRules: string[] = []

    for (const rule of rules || []) {
      const conditionGroup = rule.trigger_config as Record<string, unknown> | undefined
      const actionConfig = rule.action_config as Record<string, unknown> | undefined
      const actions = ((actionConfig?.actions || []) as RuleAction[])

      if (this.evaluateConditions(product, conditionGroup)) {
        appliedRules.push(rule.id)

        for (const action of actions) {
          if (action.type === 'exclude') {
            shouldExclude = true
          } else if (action.type === 'set_field' && action.field) {
            modifications[action.field] = action.value
          } else if (action.type === 'add_tag' && action.value) {
            const currentTags = product.tags || []
            modifications.tags = [...currentTags, action.value]
          }
        }
      }
    }

    return { shouldExclude, modifications, appliedRules }
  }

  private evaluateConditions(product: UnifiedProduct, conditionGroup: Record<string, unknown> | undefined): boolean {
    if (!conditionGroup?.conditions) return true

    const conditions = conditionGroup.conditions as RuleCondition[]
    const logic = (conditionGroup.logic as string) || 'AND'

    const results = conditions.map(cond => this.evaluateCondition(product, cond))

    if (logic === 'AND') {
      return results.every(r => r)
    } else {
      return results.some(r => r)
    }
  }

  private evaluateCondition(product: UnifiedProduct, condition: RuleCondition): boolean {
    const fieldValue = product[condition.field]

    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value
      case 'ne':
        return fieldValue !== condition.value
      case 'lt':
        return Number(fieldValue) < Number(condition.value)
      case 'gt':
        return Number(fieldValue) > Number(condition.value)
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
      case 'empty':
        return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0)
      case 'not_empty':
        return !!fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0)
      default:
        return false
    }
  }

  async createRule(userId: string, rule: {
    name: string
    description?: string
    channel?: string
    priority: number
    condition_group: Record<string, unknown>
    actions: RuleAction[]
  }): Promise<string> {
    const { data, error } = await fromTable('automation_rules')
      .insert({
        user_id: userId,
        name: rule.name,
        description: rule.description,
        trigger_type: 'product_rule',
        action_type: 'modify_product',
        is_active: true,
        trigger_config: rule.condition_group,
        action_config: { actions: rule.actions },
        trigger_count: 0,
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  async listRules(userId: string): Promise<ProductRule[]> {
    const { data, error } = await fromTable('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('trigger_type', 'product_rule')
      .order('trigger_count', { ascending: true })

    if (error) throw error
    return (data || []).map((rule: Record<string, unknown>) => ({
      id: rule.id as string,
      user_id: rule.user_id as string,
      name: rule.name as string,
      description: rule.description as string | undefined,
      trigger_type: rule.trigger_type as string,
      action_type: rule.action_type as string,
      trigger_config: rule.trigger_config as Record<string, unknown> | undefined,
      action_config: rule.action_config as Record<string, unknown> | undefined,
      is_active: rule.is_active as boolean,
      priority: rule.trigger_count as number | undefined,
      created_at: rule.created_at as string,
      updated_at: rule.updated_at as string
    }))
  }

  async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    const { error } = await fromTable('automation_rules')
      .update({ is_active: enabled })
      .eq('id', ruleId)

    if (error) throw error
  }

  async deleteRule(ruleId: string): Promise<void> {
    const { error } = await fromTable('automation_rules')
      .delete()
      .eq('id', ruleId)

    if (error) throw error
  }
}

export const marketplaceRuleEngine = new MarketplaceRuleEngine()
