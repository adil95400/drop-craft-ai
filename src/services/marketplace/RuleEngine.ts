/**
 * Moteur de règles simplifié pour la marketplace
 * Version utilisant product_rules existant
 */

import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type ProductRule = Database['public']['Tables']['product_rules']['Row']
type UnifiedProduct = {
  id: string
  name: string
  description?: string
  price?: number
  stock?: number
  [key: string]: any
}

export interface RuleCondition {
  field: string
  operator: 'eq' | 'ne' | 'lt' | 'gt' | 'contains' | 'empty' | 'not_empty'
  value?: any
}

export interface RuleAction {
  type: 'set_field' | 'add_tag' | 'exclude' | 'generate_ai'
  field?: string
  value?: any
}

export class MarketplaceRuleEngine {
  /**
   * Évalue toutes les règles actives pour un produit
   */
  async evaluateProduct(product: UnifiedProduct, userId: string): Promise<{
    shouldExclude: boolean
    modifications: Record<string, any>
    appliedRules: string[]
  }> {
    // Récupérer les règles actives
    const { data: rules, error } = await supabase
      .from('product_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true)
      .order('priority', { ascending: true })

    if (error) throw error

    let shouldExclude = false
    const modifications: Record<string, any> = {}
    const appliedRules: string[] = []

    for (const rule of rules || []) {
      const conditionGroup = rule.condition_group as any
      const actions = rule.actions as any[]

      // Évaluer les conditions
      if (this.evaluateConditions(product, conditionGroup)) {
        appliedRules.push(rule.id)

        // Appliquer les actions
        for (const action of actions || []) {
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

  /**
   * Évalue un groupe de conditions
   */
  private evaluateConditions(product: UnifiedProduct, conditionGroup: any): boolean {
    if (!conditionGroup?.conditions) return true

    const conditions = conditionGroup.conditions as RuleCondition[]
    const logic = conditionGroup.logic || 'AND'

    const results = conditions.map(cond => this.evaluateCondition(product, cond))

    if (logic === 'AND') {
      return results.every(r => r)
    } else {
      return results.some(r => r)
    }
  }

  /**
   * Évalue une condition individuelle
   */
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

  /**
   * Crée une nouvelle règle
   */
  async createRule(userId: string, rule: {
    name: string
    description?: string
    channel?: string
    priority: number
    condition_group: any
    actions: any[]
  }): Promise<string> {
    const { data, error } = await supabase
      .from('product_rules')
      .insert({
        user_id: userId,
        name: rule.name,
        description: rule.description,
        channel: rule.channel || 'all',
        priority: rule.priority,
        enabled: true,
        condition_group: rule.condition_group,
        actions: rule.actions,
        execution_count: 0,
        success_count: 0,
        error_count: 0
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  /**
   * Liste toutes les règles d'un utilisateur
   */
  async listRules(userId: string): Promise<ProductRule[]> {
    const { data, error } = await supabase
      .from('product_rules')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Active/désactive une règle
   */
  async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('product_rules')
      .update({ enabled })
      .eq('id', ruleId)

    if (error) throw error
  }

  /**
   * Supprime une règle
   */
  async deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('product_rules')
      .delete()
      .eq('id', ruleId)

    if (error) throw error
  }
}

export const marketplaceRuleEngine = new MarketplaceRuleEngine()
