/**
 * RULE ENGINE TYPES
 * Types pour le moteur de règles d'optimisation catalogue (niveau Channable)
 */

export type RuleOperator =
  | 'eq'           // égal
  | 'ne'           // différent
  | 'lt'           // inférieur
  | 'le'           // inférieur ou égal
  | 'gt'           // supérieur
  | 'ge'           // supérieur ou égal
  | 'contains'     // contient (string)
  | 'not_contains' // ne contient pas
  | 'starts_with'  // commence par
  | 'ends_with'    // finit par
  | 'empty'        // vide
  | 'not_empty'    // non vide
  | 'in'           // dans une liste
  | 'not_in'       // pas dans une liste
  | 'regex'        // expression régulière
  | 'length_lt'    // longueur < X
  | 'length_gt'    // longueur > X
  | 'length_eq'    // longueur = X

export type RuleFieldType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'array' 
  | 'date'

export interface ProductRuleCondition {
  id: string
  field: string
  operator: RuleOperator
  value?: any
  fieldType?: RuleFieldType
  caseSensitive?: boolean
}

export type RuleLogic = 'AND' | 'OR'

export interface ProductRuleConditionGroup {
  logic: RuleLogic
  conditions: ProductRuleCondition[]
  groups?: ProductRuleConditionGroup[] // Support de groupes imbriqués
}

export type RuleActionType =
  | 'set_field'          // Définir une valeur
  | 'append_text'        // Ajouter du texte
  | 'prepend_text'       // Préfixer du texte
  | 'replace_text'       // Remplacer du texte
  | 'remove_text'        // Supprimer du texte
  | 'uppercase'          // Convertir en majuscules
  | 'lowercase'          // Convertir en minuscules
  | 'capitalize'         // Capitaliser
  | 'trim'               // Supprimer espaces
  | 'multiply'           // Multiplier (prix)
  | 'add'                // Ajouter (prix, stock)
  | 'subtract'           // Soustraire
  | 'round'              // Arrondir
  | 'add_tag'            // Ajouter un tag
  | 'remove_tag'         // Supprimer un tag
  | 'set_category'       // Changer catégorie
  | 'generate_ai'        // Générer avec IA
  | 'copy_field'         // Copier d'un autre champ
  | 'template'           // Appliquer un template
  | 'execute_function'   // Exécuter une fonction custom

export interface ProductRuleAction {
  id: string
  type: RuleActionType
  field: string
  value?: any
  sourceField?: string      // Pour copy_field
  template?: string         // Pour template (avec variables ${field})
  aiPrompt?: string         // Pour generate_ai
  functionName?: string     // Pour execute_function
  options?: Record<string, any>
}

export type RuleChannel =
  | 'global'
  | 'google'
  | 'meta'
  | 'tiktok'
  | 'amazon'
  | 'shopify'

export type RulePriority = 1 | 2 | 3 | 4 | 5 // 1 = highest

export interface ProductRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  priority: RulePriority
  channel: RuleChannel
  
  // Conditions (peut être simple ou groupée)
  conditionGroup: ProductRuleConditionGroup
  
  // Actions à exécuter
  actions: ProductRuleAction[]
  
  // Métadonnées
  createdAt: string
  updatedAt: string
  createdBy?: string
  
  // Statistiques
  executionCount?: number
  successCount?: number
  errorCount?: number
  lastExecutedAt?: string
  
  // Options
  stopOnError?: boolean        // Arrêter si erreur
  skipIfAlreadyModified?: boolean // Ne pas ré-appliquer
  logChanges?: boolean          // Logger les changements
}

export interface RuleExecutionResult {
  ruleId: string
  ruleName: string
  success: boolean
  productId: string
  appliedActions: Array<{
    action: ProductRuleAction
    before: any
    after: any
    success: boolean
    error?: string
  }>
  error?: string
  executionTime: number // ms
}

export interface RuleTemplate {
  id: string
  name: string
  description: string
  category: string
  channel: RuleChannel
  rule: Partial<ProductRule>
  variables?: Array<{
    name: string
    label: string
    type: 'text' | 'number' | 'select'
    options?: string[]
    default?: any
  }>
}

// Templates pré-configurés type Channable
export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'shorten_long_titles_google',
    name: 'Raccourcir les titres longs (Google)',
    description: 'Si titre > 140 caractères, raccourcir avec IA',
    category: 'SEO',
    channel: 'google',
    rule: {
      name: 'Raccourcir titres > 140 caractères',
      enabled: true,
      priority: 2,
      channel: 'google',
      conditionGroup: {
        logic: 'AND',
        conditions: [
          {
            id: '1',
            field: 'name',
            operator: 'length_gt',
            value: 140
          }
        ]
      },
      actions: [
        {
          id: '1',
          type: 'generate_ai',
          field: 'name',
          aiPrompt: 'Raccourcis ce titre produit à maximum 140 caractères tout en gardant les informations clés'
        }
      ]
    }
  },
  {
    id: 'auto_generate_description',
    name: 'Générer descriptions manquantes',
    description: 'Si description vide, générer avec IA',
    category: 'Contenu',
    channel: 'global',
    rule: {
      name: 'Auto-générer descriptions',
      enabled: true,
      priority: 3,
      channel: 'global',
      conditionGroup: {
        logic: 'OR',
        conditions: [
          {
            id: '1',
            field: 'description',
            operator: 'empty'
          },
          {
            id: '2',
            field: 'description',
            operator: 'length_lt',
            value: 50
          }
        ]
      },
      actions: [
        {
          id: '1',
          type: 'generate_ai',
          field: 'description',
          aiPrompt: 'Génère une description produit riche et SEO-optimisée'
        }
      ]
    }
  },
  {
    id: 'low_stock_tag',
    name: 'Tag "Stock faible"',
    description: 'Ajouter tag si stock < 10',
    category: 'Gestion Stock',
    channel: 'global',
    rule: {
      name: 'Tag stock faible',
      enabled: true,
      priority: 1,
      channel: 'global',
      conditionGroup: {
        logic: 'AND',
        conditions: [
          {
            id: '1',
            field: 'stock_quantity',
            operator: 'lt',
            value: 10
          },
          {
            id: '2',
            field: 'stock_quantity',
            operator: 'gt',
            value: 0
          }
        ]
      },
      actions: [
        {
          id: '1',
          type: 'add_tag',
          field: 'tags',
          value: 'low_stock'
        }
      ]
    }
  },
  {
    id: 'price_round',
    name: 'Arrondir les prix (psychologique)',
    description: 'Prix terminant par .99 pour effet psychologique',
    category: 'Pricing',
    channel: 'global',
    rule: {
      name: 'Prix psychologique .99',
      enabled: true,
      priority: 4,
      channel: 'global',
      conditionGroup: {
        logic: 'AND',
        conditions: [
          {
            id: '1',
            field: 'price',
            operator: 'gt',
            value: 0
          }
        ]
      },
      actions: [
        {
          id: '1',
          type: 'execute_function',
          field: 'price',
          functionName: 'roundToPsychologicalPrice',
          options: { ending: 0.99 }
        }
      ]
    }
  },
  {
    id: 'critical_tag',
    name: 'Tag produits critiques',
    description: 'Tag "critical" si score audit < 40',
    category: 'Qualité',
    channel: 'global',
    rule: {
      name: 'Tag qualité critique',
      enabled: true,
      priority: 1,
      channel: 'global',
      conditionGroup: {
        logic: 'AND',
        conditions: [
          {
            id: '1',
            field: 'audit_score_global',
            operator: 'lt',
            value: 40
          }
        ]
      },
      actions: [
        {
          id: '1',
          type: 'add_tag',
          field: 'tags',
          value: 'quality_critical'
        }
      ]
    }
  }
]