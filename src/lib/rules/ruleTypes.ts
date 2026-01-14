/**
 * RULE ENGINE TYPES
 * Types pour le moteur de règles d'optimisation catalogue (niveau Channable)
 */

// ============= FIELD TYPES =============

export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'date'

export type RuleFieldType = FieldType

// ============= OPERATORS =============

export type Operator =
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

// ============= ACTION TYPES =============

export type ActionType =
  | 'set_value'
  | 'replace_text'
  | 'append_text'
  | 'prepend_text'
  | 'remove_text'
  | 'uppercase'
  | 'lowercase'
  | 'capitalize'
  | 'round_number'
  | 'add_value'
  | 'subtract_value'
  | 'multiply_value'
  | 'divide_value'
  | 'exclude_product'
  | 'include_product'
  | 'set_category'
  | 'combine_fields'
  | 'split_field'
  | 'extract_number'
  | 'truncate'

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

// ============= PRODUCT FIELDS =============

export interface ProductField {
  id: string
  label: string
  type: FieldType
  required?: boolean
}

export const PRODUCT_FIELDS: ProductField[] = [
  { id: 'title', label: 'Titre', type: 'string', required: true },
  { id: 'name', label: 'Nom du produit', type: 'string' },
  { id: 'description', label: 'Description', type: 'string' },
  { id: 'short_description', label: 'Description courte', type: 'string' },
  { id: 'price', label: 'Prix', type: 'number', required: true },
  { id: 'sale_price', label: 'Prix promo', type: 'number' },
  { id: 'cost_price', label: 'Prix d\'achat', type: 'number' },
  { id: 'compare_at_price', label: 'Prix barré', type: 'number' },
  { id: 'sku', label: 'SKU', type: 'string' },
  { id: 'barcode', label: 'Code-barres', type: 'string' },
  { id: 'brand', label: 'Marque', type: 'string' },
  { id: 'category', label: 'Catégorie', type: 'string' },
  { id: 'stock_quantity', label: 'Stock', type: 'number' },
  { id: 'weight', label: 'Poids', type: 'number' },
  { id: 'color', label: 'Couleur', type: 'string' },
  { id: 'size', label: 'Taille', type: 'string' },
  { id: 'material', label: 'Matière', type: 'string' },
  { id: 'image_url', label: 'Image principale', type: 'string' },
  { id: 'status', label: 'Statut', type: 'string' },
  { id: 'tags', label: 'Tags', type: 'array' },
  { id: 'vendor', label: 'Vendeur', type: 'string' },
  { id: 'google_product_category', label: 'Catégorie Google', type: 'string' },
  { id: 'seo_title', label: 'Titre SEO', type: 'string' },
  { id: 'seo_description', label: 'Description SEO', type: 'string' },
]

// ============= OPERATORS BY FIELD TYPE =============

export const OPERATORS_BY_TYPE: Record<FieldType, Array<{ value: Operator; label: string }>> = {
  string: [
    { value: 'equals', label: 'Est égal à' },
    { value: 'not_equals', label: 'N\'est pas égal à' },
    { value: 'contains', label: 'Contient' },
    { value: 'not_contains', label: 'Ne contient pas' },
    { value: 'starts_with', label: 'Commence par' },
    { value: 'ends_with', label: 'Finit par' },
    { value: 'is_empty', label: 'Est vide' },
    { value: 'is_not_empty', label: 'N\'est pas vide' },
    { value: 'matches_regex', label: 'Correspond à (regex)' },
    { value: 'in_list', label: 'Est dans la liste' },
    { value: 'not_in_list', label: 'N\'est pas dans la liste' },
  ],
  number: [
    { value: 'equals', label: 'Est égal à' },
    { value: 'not_equals', label: 'N\'est pas égal à' },
    { value: 'greater_than', label: 'Supérieur à' },
    { value: 'less_than', label: 'Inférieur à' },
    { value: 'greater_or_equal', label: 'Supérieur ou égal à' },
    { value: 'less_or_equal', label: 'Inférieur ou égal à' },
    { value: 'is_empty', label: 'Est vide' },
    { value: 'is_not_empty', label: 'N\'est pas vide' },
  ],
  boolean: [
    { value: 'equals', label: 'Est égal à' },
    { value: 'not_equals', label: 'N\'est pas égal à' },
  ],
  array: [
    { value: 'contains', label: 'Contient' },
    { value: 'not_contains', label: 'Ne contient pas' },
    { value: 'is_empty', label: 'Est vide' },
    { value: 'is_not_empty', label: 'N\'est pas vide' },
  ],
  date: [
    { value: 'equals', label: 'Est égal à' },
    { value: 'greater_than', label: 'Après' },
    { value: 'less_than', label: 'Avant' },
    { value: 'is_empty', label: 'N\'est pas défini' },
    { value: 'is_not_empty', label: 'Est défini' },
  ],
}

// ============= ACTIONS BY FIELD TYPE =============

export const ACTIONS_BY_TYPE: Record<FieldType, Array<{ value: ActionType; label: string; description: string }>> = {
  string: [
    { value: 'set_value', label: 'Définir la valeur', description: 'Remplace la valeur par une nouvelle' },
    { value: 'append_text', label: 'Ajouter à la fin', description: 'Ajoute du texte après la valeur' },
    { value: 'prepend_text', label: 'Ajouter au début', description: 'Ajoute du texte avant la valeur' },
    { value: 'replace_text', label: 'Remplacer du texte', description: 'Recherche et remplace du texte' },
    { value: 'remove_text', label: 'Supprimer du texte', description: 'Supprime une portion de texte' },
    { value: 'uppercase', label: 'Majuscules', description: 'Convertit en majuscules' },
    { value: 'lowercase', label: 'Minuscules', description: 'Convertit en minuscules' },
    { value: 'capitalize', label: 'Capitaliser', description: 'Met la première lettre en majuscule' },
    { value: 'truncate', label: 'Tronquer', description: 'Limite la longueur du texte' },
    { value: 'combine_fields', label: 'Combiner des champs', description: 'Fusionne plusieurs champs' },
  ],
  number: [
    { value: 'set_value', label: 'Définir la valeur', description: 'Remplace la valeur par une nouvelle' },
    { value: 'add_value', label: 'Ajouter', description: 'Ajoute une valeur au nombre' },
    { value: 'subtract_value', label: 'Soustraire', description: 'Soustrait une valeur du nombre' },
    { value: 'multiply_value', label: 'Multiplier', description: 'Multiplie par un facteur' },
    { value: 'divide_value', label: 'Diviser', description: 'Divise par un facteur' },
    { value: 'round_number', label: 'Arrondir', description: 'Arrondit à X décimales' },
    { value: 'extract_number', label: 'Extraire nombre', description: 'Extrait le nombre d\'un texte' },
  ],
  boolean: [
    { value: 'set_value', label: 'Définir la valeur', description: 'Définit vrai ou faux' },
  ],
  array: [
    { value: 'set_value', label: 'Définir la valeur', description: 'Remplace le tableau' },
    { value: 'append_text', label: 'Ajouter un élément', description: 'Ajoute un élément au tableau' },
    { value: 'remove_text', label: 'Supprimer un élément', description: 'Supprime un élément du tableau' },
  ],
  date: [
    { value: 'set_value', label: 'Définir la date', description: 'Définit une date' },
  ],
}

// ============= GLOBAL ACTIONS =============

export const GLOBAL_ACTIONS: Array<{ value: ActionType; label: string; description: string }> = [
  { value: 'exclude_product', label: 'Exclure le produit', description: 'Exclut le produit du feed' },
  { value: 'include_product', label: 'Inclure le produit', description: 'Inclut le produit dans le feed' },
  { value: 'set_category', label: 'Définir la catégorie', description: 'Définit la catégorie Google' },
]

// ============= RULE CONDITION (Channable-style) =============

export interface RuleCondition {
  id: string
  field: string
  operator: Operator
  value: string | number | boolean | string[]
  caseSensitive?: boolean
}

// ============= RULE ACTION (Channable-style) =============

export interface RuleAction {
  id: string
  type: ActionType
  targetField: string
  value?: string | number | boolean
  options?: {
    pattern?: string
    flags?: string
    sourceField?: string
    fields?: string[]
    separator?: string
    index?: number
  }
}

// ============= FEED RULE (Main type for Channable-style rules) =============

export interface FeedRule {
  id: string
  name: string
  description?: string
  isActive: boolean
  priority: number
  conditionLogic: 'AND' | 'OR'
  conditions: RuleCondition[]
  actions: RuleAction[]
  appliedCount?: number
  lastAppliedAt?: string
  createdAt: string
  updatedAt: string
}

// ============= PRODUCT RULE (Alternative type) =============

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