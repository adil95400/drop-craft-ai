import { supabase } from '@/integrations/supabase/client'
import type {
  ProductRule,
  RuleCondition,
  RuleConditionGroup,
  RuleAction,
  RuleExecutionLog,
  RuleOperator,
  RuleLogic
} from '@/types/marketplace-rules'

/**
 * Moteur de règles avancé pour la transformation de produits
 * Comparable à Channable - supporte conditions complexes, règles imbriquées, templates
 */
export class ProductRuleEngine {
  /**
   * Évalue une condition individuelle
   */
  private evaluateCondition(
    condition: RuleCondition,
    productData: Record<string, any>
  ): boolean {
    const fieldValue = this.getFieldValue(productData, condition.field)
    const { operator, value, case_sensitive } = condition

    // Normalisation pour case insensitive
    const normalizeString = (str: any): string => {
      if (typeof str !== 'string') return String(str || '')
      return case_sensitive ? str : str.toLowerCase()
    }

    const normalizedField = normalizeString(fieldValue)
    const normalizedValue = typeof value === 'string' ? normalizeString(value) : value

    switch (operator) {
      case 'equals':
        return normalizedField === normalizedValue

      case 'not_equals':
        return normalizedField !== normalizedValue

      case 'contains':
        return normalizedField.includes(normalizedValue as string)

      case 'not_contains':
        return !normalizedField.includes(normalizedValue as string)

      case 'starts_with':
        return normalizedField.startsWith(normalizedValue as string)

      case 'ends_with':
        return normalizedField.endsWith(normalizedValue as string)

      case 'greater_than':
        return Number(fieldValue) > Number(value)

      case 'less_than':
        return Number(fieldValue) < Number(value)

      case 'greater_or_equal':
        return Number(fieldValue) >= Number(value)

      case 'less_or_equal':
        return Number(fieldValue) <= Number(value)

      case 'is_empty':
        return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0)

      case 'is_not_empty':
        return !!fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0)

      case 'in_list':
        const list = Array.isArray(value) ? value : String(value).split(',').map(v => v.trim())
        return list.some(item => normalizeString(item) === normalizedField)

      case 'not_in_list':
        const notInList = Array.isArray(value) ? value : String(value).split(',').map(v => v.trim())
        return !notInList.some(item => normalizeString(item) === normalizedField)

      case 'matches_regex':
        try {
          const regex = new RegExp(value as string, case_sensitive ? '' : 'i')
          return regex.test(fieldValue)
        } catch {
          return false
        }

      default:
        return false
    }
  }

  /**
   * Évalue un groupe de conditions avec logique AND/OR
   */
  private evaluateConditionGroup(
    group: RuleConditionGroup,
    productData: Record<string, any>
  ): boolean {
    const { logic, conditions, nested_groups } = group

    // Évalue les conditions du groupe
    const conditionResults = conditions.map(condition =>
      this.evaluateCondition(condition, productData)
    )

    // Évalue les sous-groupes imbriqués
    const nestedResults = nested_groups?.map(nestedGroup =>
      this.evaluateConditionGroup(nestedGroup, productData)
    ) || []

    const allResults = [...conditionResults, ...nestedResults]

    // Applique la logique AND/OR
    return logic === 'AND' 
      ? allResults.every(result => result)
      : allResults.some(result => result)
  }

  /**
   * Évalue si un produit correspond aux conditions d'une règle
   */
  evaluateRule(rule: ProductRule, productData: Record<string, any>): boolean {
    if (!rule.enabled) return false

    const { condition_groups, root_logic } = rule

    // Évalue chaque groupe de conditions
    const groupResults = condition_groups.map(group =>
      this.evaluateConditionGroup(group, productData)
    )

    // Applique la logique root (AND/OR entre groupes)
    return root_logic === 'AND'
      ? groupResults.every(result => result)
      : groupResults.some(result => result)
  }

  /**
   * Applique les actions d'une règle sur un produit
   */
  applyRuleActions(
    rule: ProductRule,
    productData: Record<string, any>
  ): Record<string, any> {
    let modifiedData = { ...productData }

    for (const action of rule.actions) {
      modifiedData = this.applyAction(action, modifiedData, productData)
    }

    return modifiedData
  }

  /**
   * Applique une action individuelle
   */
  private applyAction(
    action: RuleAction,
    currentData: Record<string, any>,
    originalData: Record<string, any>
  ): Record<string, any> {
    const { type, target_field, value, template } = action

    switch (type) {
      case 'set_field':
        if (target_field) {
          currentData[target_field] = this.processTemplate(template || String(value), originalData)
        }
        break

      case 'append_text':
        if (target_field) {
          const currentValue = String(currentData[target_field] || '')
          const appendValue = this.processTemplate(template || String(value), originalData)
          currentData[target_field] = currentValue + appendValue
        }
        break

      case 'prepend_text':
        if (target_field) {
          const currentValue = String(currentData[target_field] || '')
          const prependValue = this.processTemplate(template || String(value), originalData)
          currentData[target_field] = prependValue + currentValue
        }
        break

      case 'replace_text':
        if (target_field && action.options?.find && action.options?.replace) {
          const currentValue = String(currentData[target_field] || '')
          const find = action.options.find
          const replace = this.processTemplate(action.options.replace, originalData)
          currentData[target_field] = currentValue.replace(new RegExp(find, 'g'), replace)
        }
        break

      case 'add_tag':
        if (!currentData.tags) currentData.tags = []
        const newTag = this.processTemplate(template || String(value), originalData)
        if (!currentData.tags.includes(newTag)) {
          currentData.tags.push(newTag)
        }
        break

      case 'remove_tag':
        if (currentData.tags) {
          const tagToRemove = this.processTemplate(template || String(value), originalData)
          currentData.tags = currentData.tags.filter((tag: string) => tag !== tagToRemove)
        }
        break

      case 'set_category':
        currentData.category = this.processTemplate(template || String(value), originalData)
        break

      case 'apply_margin':
        if (currentData.supplier_price && value) {
          const marginPercent = Number(value) / 100
          currentData.price = currentData.supplier_price * (1 + marginPercent)
        }
        break

      case 'set_price':
        currentData.price = Number(value)
        break

      case 'exclude_product':
        currentData._excluded = true
        currentData._exclusion_reason = `Règle: ${action.options?.reason || 'Critères non respectés'}`
        break

      case 'include_product':
        currentData._excluded = false
        delete currentData._exclusion_reason
        break

      case 'transform_template':
        // Transformation complexe avec template
        if (target_field && template) {
          currentData[target_field] = this.processTemplate(template, originalData)
        }
        break
    }

    return currentData
  }

  /**
   * Traite un template avec variables (ex: "{{brand}} - {{title}}")
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, field) => {
      return String(data[field] || match)
    })
  }

  /**
   * Récupère la valeur d'un champ (support notation pointée: "supplier.price")
   */
  private getFieldValue(data: Record<string, any>, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], data)
  }

  /**
   * Exécute toutes les règles sur un produit
   */
  async executeRulesOnProduct(
    productId: string,
    productData: Record<string, any>,
    marketplace?: string
  ): Promise<{
    modifiedData: Record<string, any>
    appliedRules: string[]
    logs: RuleExecutionLog[]
  }> {
    // Récupère les règles de l'utilisateur (triées par priorité)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: rules, error } = await supabase
      .from('product_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('enabled', true)
      .order('priority', { ascending: true })

    if (error) throw error

    let modifiedData = { ...productData }
    const appliedRules: string[] = []
    const logs: RuleExecutionLog[] = []

    for (const rule of rules || []) {
      // Filtre par marketplace si spécifié
      if (marketplace && rule.target_marketplaces && !rule.target_marketplaces.includes(marketplace)) {
        continue
      }

      const beforeData = { ...modifiedData }
      const conditionsMatched = this.evaluateRule(rule, modifiedData)

      if (conditionsMatched) {
        modifiedData = this.applyRuleActions(rule, modifiedData)
        appliedRules.push(rule.id)

        // Log l'exécution
        logs.push({
          id: crypto.randomUUID(),
          rule_id: rule.id,
          product_id: productId,
          marketplace: marketplace || 'all',
          executed_at: new Date().toISOString(),
          success: true,
          conditions_matched: true,
          actions_applied: rule.actions.map(a => a.type),
          before_data: beforeData,
          after_data: modifiedData
        })
      }
    }

    return { modifiedData, appliedRules, logs }
  }

  /**
   * Sauvegarde les logs d'exécution
   */
  async saveExecutionLogs(logs: RuleExecutionLog[]): Promise<void> {
    if (logs.length === 0) return

    const { error } = await supabase
      .from('rule_execution_logs')
      .insert(logs)

    if (error) {
      console.error('Error saving execution logs:', error)
    }
  }
}

export const productRuleEngine = new ProductRuleEngine()
