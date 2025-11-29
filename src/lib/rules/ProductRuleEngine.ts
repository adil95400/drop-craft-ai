/**
 * PRODUCT RULE ENGINE
 * Moteur d'exécution des règles d'optimisation catalogue
 * Niveau Channable : conditions complexes, actions multiples, priorités
 */

import { UnifiedProduct } from '@/services/ProductsUnifiedService'
import {
  ProductRule,
  ProductRuleCondition,
  ProductRuleConditionGroup,
  ProductRuleAction,
  RuleExecutionResult,
  RuleOperator
} from './ruleTypes'

export class ProductRuleEngine {
  /**
   * Évalue si un produit correspond aux conditions d'une règle
   */
  static evaluateRule(product: UnifiedProduct, rule: ProductRule): boolean {
    if (!rule.enabled) return false
    return this.evaluateConditionGroup(product, rule.conditionGroup)
  }

  /**
   * Évalue un groupe de conditions (avec logique AND/OR)
   */
  static evaluateConditionGroup(
    product: UnifiedProduct,
    group: ProductRuleConditionGroup
  ): boolean {
    const { logic, conditions, groups } = group

    // Évaluer les conditions du groupe
    const conditionResults = conditions.map(condition =>
      this.evaluateCondition(product, condition)
    )

    // Évaluer les sous-groupes récursivement
    const groupResults = (groups || []).map(subGroup =>
      this.evaluateConditionGroup(product, subGroup)
    )

    const allResults = [...conditionResults, ...groupResults]

    if (logic === 'AND') {
      return allResults.every(result => result === true)
    } else {
      return allResults.some(result => result === true)
    }
  }

  /**
   * Évalue une condition individuelle
   */
  static evaluateCondition(
    product: UnifiedProduct,
    condition: ProductRuleCondition
  ): boolean {
    const { field, operator, value, caseSensitive = false } = condition
    const productValue = this.getFieldValue(product, field)

    switch (operator) {
      case 'eq':
        return this.compareValues(productValue, value, caseSensitive, 'eq')
      case 'ne':
        return this.compareValues(productValue, value, caseSensitive, 'ne')
      case 'lt':
        return Number(productValue) < Number(value)
      case 'le':
        return Number(productValue) <= Number(value)
      case 'gt':
        return Number(productValue) > Number(value)
      case 'ge':
        return Number(productValue) >= Number(value)
      case 'contains':
        return this.stringContains(productValue, value, caseSensitive)
      case 'not_contains':
        return !this.stringContains(productValue, value, caseSensitive)
      case 'starts_with':
        return this.stringStartsWith(productValue, value, caseSensitive)
      case 'ends_with':
        return this.stringEndsWith(productValue, value, caseSensitive)
      case 'empty':
        return !productValue || productValue === '' || (Array.isArray(productValue) && productValue.length === 0)
      case 'not_empty':
        return !!productValue && productValue !== '' && (!Array.isArray(productValue) || productValue.length > 0)
      case 'in':
        return Array.isArray(value) && value.includes(productValue)
      case 'not_in':
        return Array.isArray(value) && !value.includes(productValue)
      case 'regex':
        return new RegExp(value).test(String(productValue))
      case 'length_lt':
        return String(productValue).length < Number(value)
      case 'length_gt':
        return String(productValue).length > Number(value)
      case 'length_eq':
        return String(productValue).length === Number(value)
      default:
        console.warn(`Unknown operator: ${operator}`)
        return false
    }
  }

  /**
   * Applique une règle à un produit
   */
  static async applyRule(
    product: UnifiedProduct,
    rule: ProductRule,
    options: { aiService?: any; dryRun?: boolean } = {}
  ): Promise<RuleExecutionResult> {
    const startTime = Date.now()
    const appliedActions: RuleExecutionResult['appliedActions'] = []

    try {
      // Vérifier si la règle s'applique
      if (!this.evaluateRule(product, rule)) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          success: false,
          productId: product.id,
          appliedActions: [],
          error: 'Conditions not met',
          executionTime: Date.now() - startTime
        }
      }

      let modifiedProduct = { ...product }

      // Appliquer chaque action
      for (const action of rule.actions) {
        try {
          const before = this.getFieldValue(modifiedProduct, action.field)
          const result = await this.applyAction(modifiedProduct, action, options)

          if (result.success) {
            modifiedProduct = result.product
            appliedActions.push({
              action,
              before,
              after: this.getFieldValue(modifiedProduct, action.field),
              success: true
            })
          } else {
            appliedActions.push({
              action,
              before,
              after: before,
              success: false,
              error: result.error
            })

            if (rule.stopOnError) {
              break
            }
          }
        } catch (actionError) {
          appliedActions.push({
            action,
            before: this.getFieldValue(modifiedProduct, action.field),
            after: this.getFieldValue(modifiedProduct, action.field),
            success: false,
            error: actionError instanceof Error ? actionError.message : 'Unknown error'
          })

          if (rule.stopOnError) {
            break
          }
        }
      }

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        success: true,
        productId: product.id,
        appliedActions,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        success: false,
        productId: product.id,
        appliedActions,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      }
    }
  }

  /**
   * Applique une action spécifique
   */
  static async applyAction(
    product: UnifiedProduct,
    action: ProductRuleAction,
    options: { aiService?: any; dryRun?: boolean } = {}
  ): Promise<{ success: boolean; product: UnifiedProduct; error?: string }> {
    const modified = { ...product }

    try {
      switch (action.type) {
        case 'set_field':
          this.setFieldValue(modified, action.field, action.value)
          break

        case 'append_text':
          const currentAppend = String(this.getFieldValue(modified, action.field) || '')
          this.setFieldValue(modified, action.field, currentAppend + action.value)
          break

        case 'prepend_text':
          const currentPrepend = String(this.getFieldValue(modified, action.field) || '')
          this.setFieldValue(modified, action.field, action.value + currentPrepend)
          break

        case 'replace_text':
          const currentReplace = String(this.getFieldValue(modified, action.field) || '')
          const replaced = currentReplace.replace(
            new RegExp(action.options?.pattern || '', action.options?.flags || 'g'),
            action.value
          )
          this.setFieldValue(modified, action.field, replaced)
          break

        case 'remove_text':
          const currentRemove = String(this.getFieldValue(modified, action.field) || '')
          const removed = currentRemove.replace(new RegExp(action.value, 'g'), '')
          this.setFieldValue(modified, action.field, removed)
          break

        case 'uppercase':
          const upperValue = String(this.getFieldValue(modified, action.field) || '').toUpperCase()
          this.setFieldValue(modified, action.field, upperValue)
          break

        case 'lowercase':
          const lowerValue = String(this.getFieldValue(modified, action.field) || '').toLowerCase()
          this.setFieldValue(modified, action.field, lowerValue)
          break

        case 'capitalize':
          const capValue = String(this.getFieldValue(modified, action.field) || '')
          this.setFieldValue(modified, action.field, capValue.charAt(0).toUpperCase() + capValue.slice(1).toLowerCase())
          break

        case 'trim':
          const trimValue = String(this.getFieldValue(modified, action.field) || '').trim()
          this.setFieldValue(modified, action.field, trimValue)
          break

        case 'multiply':
          const multiplyValue = Number(this.getFieldValue(modified, action.field) || 0) * Number(action.value)
          this.setFieldValue(modified, action.field, multiplyValue)
          break

        case 'add':
          const addValue = Number(this.getFieldValue(modified, action.field) || 0) + Number(action.value)
          this.setFieldValue(modified, action.field, addValue)
          break

        case 'subtract':
          const subtractValue = Number(this.getFieldValue(modified, action.field) || 0) - Number(action.value)
          this.setFieldValue(modified, action.field, subtractValue)
          break

        case 'round':
          const roundValue = Math.round(Number(this.getFieldValue(modified, action.field) || 0) * 100) / 100
          this.setFieldValue(modified, action.field, roundValue)
          break

        case 'add_tag':
          const currentTags = this.getFieldValue(modified, action.field) || []
          const tagsArray = Array.isArray(currentTags) ? currentTags : []
          if (!tagsArray.includes(action.value)) {
            this.setFieldValue(modified, action.field, [...tagsArray, action.value])
          }
          break

        case 'remove_tag':
          const tagsToFilter = this.getFieldValue(modified, action.field) || []
          const filteredTags = Array.isArray(tagsToFilter) ? tagsToFilter.filter(t => t !== action.value) : []
          this.setFieldValue(modified, action.field, filteredTags)
          break

        case 'copy_field':
          if (action.sourceField) {
            const sourceValue = this.getFieldValue(modified, action.sourceField)
            this.setFieldValue(modified, action.field, sourceValue)
          }
          break

        case 'template':
          if (action.template) {
            const rendered = this.renderTemplate(action.template, modified)
            this.setFieldValue(modified, action.field, rendered)
          }
          break

        case 'generate_ai':
          if (options.aiService && action.aiPrompt) {
            try {
              const aiResult = await options.aiService.generateField(modified, action.field, action.aiPrompt)
              this.setFieldValue(modified, action.field, aiResult)
            } catch (aiError) {
              return {
                success: false,
                product: modified,
                error: `AI generation failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`
              }
            }
          } else {
            return { success: false, product: modified, error: 'AI service not available' }
          }
          break

        case 'execute_function':
          if (action.functionName) {
            // Appel de fonctions custom (à implémenter selon les besoins)
            const customValue = await this.executeCustomFunction(modified, action.functionName, action.options || {})
            this.setFieldValue(modified, action.field, customValue)
          }
          break

        default:
          return { success: false, product: modified, error: `Unknown action type: ${action.type}` }
      }

      return { success: true, product: modified }
    } catch (error) {
      return {
        success: false,
        product: modified,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Applique plusieurs règles à un produit (par priorité)
   */
  static async applyRules(
    product: UnifiedProduct,
    rules: ProductRule[],
    options: { aiService?: any; dryRun?: boolean } = {}
  ): Promise<{ product: UnifiedProduct; results: RuleExecutionResult[] }> {
    // Trier par priorité (1 = highest)
    const sortedRules = [...rules].sort((a, b) => a.priority - b.priority)

    let currentProduct = { ...product }
    const results: RuleExecutionResult[] = []

    for (const rule of sortedRules) {
      const result = await this.applyRule(currentProduct, rule, options)
      results.push(result)

      if (result.success && result.appliedActions.some(a => a.success)) {
        // Mettre à jour le produit pour la règle suivante
        currentProduct = { ...currentProduct }
        for (const appliedAction of result.appliedActions) {
          if (appliedAction.success) {
            this.setFieldValue(currentProduct, appliedAction.action.field, appliedAction.after)
          }
        }
      }
    }

    return { product: currentProduct, results }
  }

  /**
   * Utilitaires privés
   */
  private static getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private static setFieldValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  private static compareValues(a: any, b: any, caseSensitive: boolean, operator: 'eq' | 'ne'): boolean {
    const normalize = (val: any) => {
      if (typeof val === 'string' && !caseSensitive) {
        return val.toLowerCase()
      }
      return val
    }
    return operator === 'eq' ? normalize(a) === normalize(b) : normalize(a) !== normalize(b)
  }

  private static stringContains(str: any, search: string, caseSensitive: boolean): boolean {
    const s = String(str)
    return caseSensitive ? s.includes(search) : s.toLowerCase().includes(search.toLowerCase())
  }

  private static stringStartsWith(str: any, search: string, caseSensitive: boolean): boolean {
    const s = String(str)
    return caseSensitive ? s.startsWith(search) : s.toLowerCase().startsWith(search.toLowerCase())
  }

  private static stringEndsWith(str: any, search: string, caseSensitive: boolean): boolean {
    const s = String(str)
    return caseSensitive ? s.endsWith(search) : s.toLowerCase().endsWith(search.toLowerCase())
  }

  private static renderTemplate(template: string, data: any): string {
    return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
      const value = this.getFieldValue(data, path.trim())
      return value !== undefined ? String(value) : match
    })
  }

  private static async executeCustomFunction(product: UnifiedProduct, functionName: string, options: Record<string, any>): Promise<any> {
    // Implémentation des fonctions custom
    switch (functionName) {
      case 'roundToPsychologicalPrice':
        const price = product.price
        const ending = options.ending || 0.99
        return Math.floor(price) + ending

      default:
        throw new Error(`Unknown function: ${functionName}`)
    }
  }
}