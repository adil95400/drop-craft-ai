// Moteur d'exécution des règles IF/THEN

import type { FeedRule, RuleCondition, RuleAction, Operator, ActionType } from './ruleTypes'

export interface Product {
  [key: string]: any
}

export interface RuleExecutionResult {
  productId: string
  originalProduct: Product
  modifiedProduct: Product
  appliedRules: string[]
  excluded: boolean
  changes: { field: string; before: any; after: any }[]
}

// Évalue une condition sur un produit
function evaluateCondition(product: Product, condition: RuleCondition): boolean {
  const fieldValue = product[condition.field]
  const conditionValue = condition.value

  // Gestion des valeurs dynamiques (ex: {price})
  const resolvedValue = typeof conditionValue === 'string' && conditionValue.startsWith('{') && conditionValue.endsWith('}')
    ? product[conditionValue.slice(1, -1)]
    : conditionValue

  const compareStrings = (a: string, b: string, caseSensitive: boolean) => {
    if (!caseSensitive) {
      return a.toLowerCase() === b.toLowerCase()
    }
    return a === b
  }

  switch (condition.operator) {
    case 'equals':
      if (typeof fieldValue === 'string' && typeof resolvedValue === 'string') {
        return compareStrings(fieldValue, resolvedValue, condition.caseSensitive ?? false)
      }
      return fieldValue === resolvedValue

    case 'not_equals':
      if (typeof fieldValue === 'string' && typeof resolvedValue === 'string') {
        return !compareStrings(fieldValue, resolvedValue, condition.caseSensitive ?? false)
      }
      return fieldValue !== resolvedValue

    case 'contains':
      if (typeof fieldValue === 'string' && typeof resolvedValue === 'string') {
        const a = condition.caseSensitive ? fieldValue : fieldValue.toLowerCase()
        const b = condition.caseSensitive ? resolvedValue : resolvedValue.toLowerCase()
        return a.includes(b)
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(resolvedValue)
      }
      return false

    case 'not_contains':
      if (typeof fieldValue === 'string' && typeof resolvedValue === 'string') {
        const a = condition.caseSensitive ? fieldValue : fieldValue.toLowerCase()
        const b = condition.caseSensitive ? resolvedValue : resolvedValue.toLowerCase()
        return !a.includes(b)
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(resolvedValue)
      }
      return true

    case 'starts_with':
      if (typeof fieldValue === 'string' && typeof resolvedValue === 'string') {
        const a = condition.caseSensitive ? fieldValue : fieldValue.toLowerCase()
        const b = condition.caseSensitive ? resolvedValue : resolvedValue.toLowerCase()
        return a.startsWith(b)
      }
      return false

    case 'ends_with':
      if (typeof fieldValue === 'string' && typeof resolvedValue === 'string') {
        const a = condition.caseSensitive ? fieldValue : fieldValue.toLowerCase()
        const b = condition.caseSensitive ? resolvedValue : resolvedValue.toLowerCase()
        return a.endsWith(b)
      }
      return false

    case 'greater_than':
      return Number(fieldValue) > Number(resolvedValue)

    case 'less_than':
      return Number(fieldValue) < Number(resolvedValue)

    case 'greater_or_equal':
      return Number(fieldValue) >= Number(resolvedValue)

    case 'less_or_equal':
      return Number(fieldValue) <= Number(resolvedValue)

    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || fieldValue === '' || 
        (Array.isArray(fieldValue) && fieldValue.length === 0)

    case 'is_not_empty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '' &&
        (!Array.isArray(fieldValue) || fieldValue.length > 0)

    case 'in_list':
      if (Array.isArray(resolvedValue)) {
        return resolvedValue.includes(fieldValue)
      }
      if (typeof resolvedValue === 'string') {
        const list = resolvedValue.split(',').map(s => s.trim())
        return list.includes(String(fieldValue))
      }
      return false

    case 'not_in_list':
      if (Array.isArray(resolvedValue)) {
        return !resolvedValue.includes(fieldValue)
      }
      if (typeof resolvedValue === 'string') {
        const list = resolvedValue.split(',').map(s => s.trim())
        return !list.includes(String(fieldValue))
      }
      return true

    case 'matches_regex':
      try {
        const regex = new RegExp(String(resolvedValue), condition.caseSensitive ? '' : 'i')
        return regex.test(String(fieldValue))
      } catch {
        return false
      }

    default:
      return false
  }
}

// Évalue toutes les conditions d'une règle
function evaluateRuleConditions(product: Product, rule: FeedRule): boolean {
  if (rule.conditions.length === 0) return true

  if (rule.conditionLogic === 'AND') {
    return rule.conditions.every(condition => evaluateCondition(product, condition))
  } else {
    return rule.conditions.some(condition => evaluateCondition(product, condition))
  }
}

// Résout les variables dynamiques dans une valeur
function resolveValue(value: string | number | undefined, product: Product): string | number {
  if (typeof value !== 'string') return value ?? ''
  
  return value.replace(/\{(\w+)\}/g, (match, fieldName) => {
    return String(product[fieldName] ?? '')
  })
}

// Exécute une action sur un produit
function executeAction(product: Product, action: RuleAction): { product: Product; excluded: boolean; change?: { field: string; before: any; after: any } } {
  const modifiedProduct = { ...product }
  let excluded = false
  let change: { field: string; before: any; after: any } | undefined

  const targetField = action.targetField
  const beforeValue = modifiedProduct[targetField]

  switch (action.type) {
    case 'set_value':
      modifiedProduct[targetField] = resolveValue(action.value as string, product)
      break

    case 'replace_text':
      if (typeof modifiedProduct[targetField] === 'string' && action.options?.pattern) {
        const flags = action.options.flags || 'g'
        const regex = new RegExp(action.options.pattern, flags)
        modifiedProduct[targetField] = modifiedProduct[targetField].replace(regex, String(action.value ?? ''))
      }
      break

    case 'append_text':
      const appendValue = resolveValue(action.value as string, product)
      modifiedProduct[targetField] = String(modifiedProduct[targetField] ?? '') + appendValue
      break

    case 'prepend_text':
      const prependValue = resolveValue(action.value as string, product)
      modifiedProduct[targetField] = prependValue + String(modifiedProduct[targetField] ?? '')
      break

    case 'remove_text':
      if (typeof modifiedProduct[targetField] === 'string') {
        modifiedProduct[targetField] = modifiedProduct[targetField].replace(String(action.value), '')
      }
      break

    case 'uppercase':
      if (typeof modifiedProduct[targetField] === 'string') {
        modifiedProduct[targetField] = modifiedProduct[targetField].toUpperCase()
      }
      break

    case 'lowercase':
      if (typeof modifiedProduct[targetField] === 'string') {
        modifiedProduct[targetField] = modifiedProduct[targetField].toLowerCase()
      }
      break

    case 'capitalize':
      if (typeof modifiedProduct[targetField] === 'string') {
        modifiedProduct[targetField] = modifiedProduct[targetField]
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      }
      break

    case 'round_number':
      const decimals = Number(action.value) || 0
      modifiedProduct[targetField] = Number(Number(modifiedProduct[targetField]).toFixed(decimals))
      break

    case 'add_value':
      const sourceForAdd = action.options?.sourceField ? modifiedProduct[action.options.sourceField] : modifiedProduct[targetField]
      modifiedProduct[targetField] = Number(sourceForAdd) + Number(action.value)
      break

    case 'subtract_value':
      const sourceForSub = action.options?.sourceField ? modifiedProduct[action.options.sourceField] : modifiedProduct[targetField]
      modifiedProduct[targetField] = Number(sourceForSub) - Number(action.value)
      break

    case 'multiply_value':
      const sourceForMul = action.options?.sourceField ? modifiedProduct[action.options.sourceField] : modifiedProduct[targetField]
      modifiedProduct[targetField] = Number(sourceForMul) * Number(action.value)
      break

    case 'divide_value':
      const sourceForDiv = action.options?.sourceField ? modifiedProduct[action.options.sourceField] : modifiedProduct[targetField]
      const divisor = Number(action.value)
      modifiedProduct[targetField] = divisor !== 0 ? Number(sourceForDiv) / divisor : 0
      break

    case 'exclude_product':
      excluded = true
      break

    case 'include_product':
      excluded = false
      break

    case 'set_category':
      modifiedProduct.google_product_category = resolveValue(action.value as string, product)
      break

    case 'combine_fields':
      if (action.options?.fields && Array.isArray(action.options.fields)) {
        const separator = action.options.separator || ' '
        modifiedProduct[targetField] = action.options.fields
          .map((f: string) => modifiedProduct[f] ?? '')
          .filter((v: string) => v !== '')
          .join(separator)
      }
      break

    case 'split_field':
      if (typeof modifiedProduct[targetField] === 'string' && action.options?.separator) {
        const parts = modifiedProduct[targetField].split(action.options.separator)
        const index = action.options.index ?? 0
        modifiedProduct[targetField] = parts[index] ?? ''
      }
      break

    case 'extract_number':
      if (typeof modifiedProduct[targetField] === 'string') {
        const match = modifiedProduct[targetField].match(/[\d.,]+/)
        modifiedProduct[targetField] = match ? parseFloat(match[0].replace(',', '.')) : 0
      }
      break

    case 'truncate':
      if (typeof modifiedProduct[targetField] === 'string') {
        const maxLength = Number(action.value) || 100
        if (modifiedProduct[targetField].length > maxLength) {
          modifiedProduct[targetField] = modifiedProduct[targetField].substring(0, maxLength - 3) + '...'
        }
      }
      break
  }

  const afterValue = modifiedProduct[targetField]
  if (beforeValue !== afterValue) {
    change = { field: targetField, before: beforeValue, after: afterValue }
  }

  return { product: modifiedProduct, excluded, change }
}

// Exécute une règle sur un produit
export function executeRule(product: Product, rule: FeedRule): RuleExecutionResult {
  const result: RuleExecutionResult = {
    productId: product.id || product.sku || 'unknown',
    originalProduct: { ...product },
    modifiedProduct: { ...product },
    appliedRules: [],
    excluded: false,
    changes: []
  }

  // Vérifier si les conditions sont remplies
  if (!evaluateRuleConditions(product, rule)) {
    return result
  }

  // Appliquer toutes les actions
  result.appliedRules.push(rule.id)
  
  for (const action of rule.actions) {
    const actionResult = executeAction(result.modifiedProduct, action)
    result.modifiedProduct = actionResult.product
    
    if (actionResult.excluded) {
      result.excluded = true
    }
    
    if (actionResult.change) {
      result.changes.push(actionResult.change)
    }
  }

  return result
}

// Exécute toutes les règles sur un produit (triées par priorité)
export function executeRules(product: Product, rules: FeedRule[]): RuleExecutionResult {
  // Filtrer les règles actives et trier par priorité
  const activeRules = rules
    .filter(r => r.isActive)
    .sort((a, b) => b.priority - a.priority)

  let currentProduct = { ...product }
  const result: RuleExecutionResult = {
    productId: product.id || product.sku || 'unknown',
    originalProduct: { ...product },
    modifiedProduct: currentProduct,
    appliedRules: [],
    excluded: false,
    changes: []
  }

  for (const rule of activeRules) {
    // Si le produit est exclu, on arrête
    if (result.excluded) break

    const ruleResult = executeRule(currentProduct, rule)
    
    if (ruleResult.appliedRules.length > 0) {
      result.appliedRules.push(...ruleResult.appliedRules)
      result.changes.push(...ruleResult.changes)
      currentProduct = ruleResult.modifiedProduct
      result.modifiedProduct = currentProduct
      
      if (ruleResult.excluded) {
        result.excluded = true
      }
    }
  }

  return result
}

// Exécute les règles sur une liste de produits
export function executeRulesOnProducts(products: Product[], rules: FeedRule[]): {
  results: RuleExecutionResult[]
  includedProducts: Product[]
  excludedProducts: Product[]
  stats: {
    total: number
    modified: number
    excluded: number
    unchanged: number
  }
} {
  const results = products.map(product => executeRules(product, rules))
  
  const includedProducts = results
    .filter(r => !r.excluded)
    .map(r => r.modifiedProduct)
  
  const excludedProducts = results
    .filter(r => r.excluded)
    .map(r => r.originalProduct)
  
  const stats = {
    total: products.length,
    modified: results.filter(r => r.changes.length > 0).length,
    excluded: excludedProducts.length,
    unchanged: results.filter(r => r.changes.length === 0 && !r.excluded).length
  }

  return { results, includedProducts, excludedProducts, stats }
}

// Prévisualise l'application d'une règle sur des produits
export function previewRule(products: Product[], rule: FeedRule, limit = 10): RuleExecutionResult[] {
  return products.slice(0, limit).map(product => executeRule(product, rule))
}
