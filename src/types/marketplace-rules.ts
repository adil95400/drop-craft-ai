// Types pour le moteur de règles avancé (type Channable)

export type RuleOperator = 
  | 'equals' 
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'in_list'
  | 'not_in_list'
  | 'matches_regex'

export type RuleLogic = 'AND' | 'OR'

export type ActionType =
  | 'set_field'
  | 'append_text'
  | 'prepend_text'
  | 'replace_text'
  | 'remove_text'
  | 'add_tag'
  | 'remove_tag'
  | 'set_category'
  | 'apply_margin'
  | 'set_price'
  | 'exclude_product'
  | 'include_product'
  | 'transform_template'

export interface RuleCondition {
  id: string
  field: string // title, description, price, stock, category, tags, etc.
  operator: RuleOperator
  value: string | number | string[]
  case_sensitive?: boolean
}

export interface RuleConditionGroup {
  id: string
  logic: RuleLogic
  conditions: RuleCondition[]
  nested_groups?: RuleConditionGroup[] // Support pour règles imbriquées
}

export interface RuleAction {
  id: string
  type: ActionType
  target_field?: string
  value?: string | number
  template?: string // Pour transformations avec variables: {{title}}, {{price}}, etc.
  options?: Record<string, any>
}

export interface MarketplaceFieldMapping {
  marketplace: string
  required_fields: string[]
  optional_fields: string[]
  field_transformations: Record<string, string> // source_field -> marketplace_field
  validation_rules: Record<string, any>
}

export interface ProductRule {
  id: string
  user_id: string
  name: string
  description?: string
  enabled: boolean
  priority: number // Ordre d'exécution (1 = premier)
  
  // Conditions
  condition_groups: RuleConditionGroup[]
  root_logic: RuleLogic // AND/OR entre les groupes
  
  // Actions
  actions: RuleAction[]
  
  // Ciblage
  target_marketplaces?: string[] // null = toutes
  target_categories?: string[]
  
  // Métadonnées
  execution_count: number
  success_count: number
  last_executed_at?: string
  created_at: string
  updated_at: string
}

export interface RuleExecutionLog {
  id: string
  rule_id: string
  product_id: string
  marketplace: string
  executed_at: string
  success: boolean
  conditions_matched: boolean
  actions_applied: string[]
  before_data: Record<string, any>
  after_data: Record<string, any>
  error?: string
}

export interface RuleTemplate {
  id: string
  name: string
  description: string
  category: 'pricing' | 'content' | 'filtering' | 'categorization' | 'optimization'
  rule: Omit<ProductRule, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'execution_count' | 'success_count'>
  example_use_case: string
}

// Templates de règles prédéfinies
export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'add-brand-to-title',
    name: 'Ajouter la marque au titre',
    description: 'Ajoute le nom de la marque au début du titre si absent',
    category: 'content',
    rule: {
      name: 'Ajouter marque au titre',
      enabled: true,
      priority: 10,
      condition_groups: [{
        id: '1',
        logic: 'AND',
        conditions: [
          {
            id: '1',
            field: 'brand',
            operator: 'is_not_empty',
            value: ''
          },
          {
            id: '2',
            field: 'title',
            operator: 'not_contains',
            value: '{{brand}}'
          }
        ]
      }],
      root_logic: 'AND',
      actions: [{
        id: '1',
        type: 'prepend_text',
        target_field: 'title',
        template: '{{brand}} - '
      }]
    },
    example_use_case: 'Améliore le SEO en ajoutant systématiquement la marque'
  },
  {
    id: 'apply-margin-by-category',
    name: 'Appliquer marge par catégorie',
    description: 'Applique des marges différentes selon la catégorie produit',
    category: 'pricing',
    rule: {
      name: 'Marge 40% sur électronique',
      enabled: true,
      priority: 5,
      condition_groups: [{
        id: '1',
        logic: 'OR',
        conditions: [
          {
            id: '1',
            field: 'category',
            operator: 'contains',
            value: 'électronique'
          },
          {
            id: '2',
            field: 'category',
            operator: 'contains',
            value: 'high-tech'
          }
        ]
      }],
      root_logic: 'AND',
      actions: [{
        id: '1',
        type: 'apply_margin',
        value: 40 // 40% de marge
      }]
    },
    example_use_case: 'Gestion automatique des marges par segment'
  },
  {
    id: 'exclude-low-stock',
    name: 'Exclure produits stock faible',
    description: 'Exclut automatiquement les produits avec stock < 5',
    category: 'filtering',
    rule: {
      name: 'Exclure stock < 5',
      enabled: true,
      priority: 1, // Haute priorité
      condition_groups: [{
        id: '1',
        logic: 'AND',
        conditions: [{
          id: '1',
          field: 'stock',
          operator: 'less_than',
          value: 5
        }]
      }],
      root_logic: 'AND',
      actions: [{
        id: '1',
        type: 'exclude_product'
      }]
    },
    example_use_case: 'Évite les ventes de produits en rupture'
  }
]
