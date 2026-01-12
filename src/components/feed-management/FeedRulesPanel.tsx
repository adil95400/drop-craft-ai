import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, Trash2, GripVertical, Play, Pause, Copy,
  ArrowRight, AlertCircle, Settings, Zap, Filter, Edit2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedRule {
  id: string
  name: string
  description?: string
  type: 'filter' | 'transform' | 'map' | 'combine' | 'split'
  conditions: RuleCondition[]
  actions: RuleAction[]
  isActive: boolean
  order: number
  affectedProducts?: number
}

interface RuleCondition {
  field: string
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater' | 'less' | 'empty' | 'not_empty' | 'regex'
  value: string
}

interface RuleAction {
  type: 'set' | 'append' | 'prepend' | 'replace' | 'remove' | 'combine' | 'split' | 'exclude'
  targetField: string
  value?: string
  sourceField?: string
}

const AVAILABLE_FIELDS = [
  { value: 'title', label: 'Titre' },
  { value: 'description', label: 'Description' },
  { value: 'price', label: 'Prix' },
  { value: 'sale_price', label: 'Prix promo' },
  { value: 'brand', label: 'Marque' },
  { value: 'category', label: 'Catégorie' },
  { value: 'gtin', label: 'GTIN/EAN' },
  { value: 'mpn', label: 'MPN' },
  { value: 'availability', label: 'Disponibilité' },
  { value: 'condition', label: 'État' },
  { value: 'color', label: 'Couleur' },
  { value: 'size', label: 'Taille' },
  { value: 'image_link', label: 'Image principale' },
  { value: 'shipping', label: 'Livraison' },
]

const OPERATORS = [
  { value: 'equals', label: 'est égal à' },
  { value: 'contains', label: 'contient' },
  { value: 'starts_with', label: 'commence par' },
  { value: 'ends_with', label: 'se termine par' },
  { value: 'greater', label: 'supérieur à' },
  { value: 'less', label: 'inférieur à' },
  { value: 'empty', label: 'est vide' },
  { value: 'not_empty', label: 'n\'est pas vide' },
  { value: 'regex', label: 'correspond au regex' },
]

const ACTION_TYPES = [
  { value: 'set', label: 'Définir la valeur' },
  { value: 'append', label: 'Ajouter à la fin' },
  { value: 'prepend', label: 'Ajouter au début' },
  { value: 'replace', label: 'Remplacer' },
  { value: 'combine', label: 'Combiner des champs' },
  { value: 'exclude', label: 'Exclure du flux' },
]

interface FeedRulesPanelProps {
  channelId: string
  rules?: FeedRule[]
  onAddRule?: () => void
  onEditRule?: (ruleId: string) => void
  onDeleteRule?: (ruleId: string) => void
  onToggleRule?: (ruleId: string, active: boolean) => void
  onReorderRules?: (rules: FeedRule[]) => void
}

const MOCK_RULES: FeedRule[] = [
  {
    id: '1',
    name: 'Optimiser les titres',
    description: 'Ajoute la marque au début du titre',
    type: 'transform',
    conditions: [
      { field: 'brand', operator: 'not_empty', value: '' }
    ],
    actions: [
      { type: 'prepend', targetField: 'title', sourceField: 'brand', value: ' - ' }
    ],
    isActive: true,
    order: 1,
    affectedProducts: 1247
  },
  {
    id: '2',
    name: 'Exclure rupture de stock',
    description: 'Retire les produits indisponibles du flux',
    type: 'filter',
    conditions: [
      { field: 'availability', operator: 'equals', value: 'out_of_stock' }
    ],
    actions: [
      { type: 'exclude', targetField: '', value: '' }
    ],
    isActive: true,
    order: 2,
    affectedProducts: 89
  },
  {
    id: '3',
    name: 'Prix minimum shipping',
    description: 'Ajoute livraison gratuite si prix > 50€',
    type: 'transform',
    conditions: [
      { field: 'price', operator: 'greater', value: '50' }
    ],
    actions: [
      { type: 'set', targetField: 'shipping', value: 'FR::0.00 EUR' }
    ],
    isActive: false,
    order: 3,
    affectedProducts: 456
  },
  {
    id: '4',
    name: 'Catégorisation Google',
    description: 'Mappe les catégories vers Google Product Category',
    type: 'map',
    conditions: [],
    actions: [
      { type: 'set', targetField: 'google_product_category', value: 'mapped' }
    ],
    isActive: true,
    order: 4,
    affectedProducts: 2341
  },
]

export function FeedRulesPanel({ 
  channelId, 
  rules = MOCK_RULES,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onToggleRule,
}: FeedRulesPanelProps) {
  const [expandedRule, setExpandedRule] = useState<string | null>(null)

  const getRuleTypeIcon = (type: FeedRule['type']) => {
    switch (type) {
      case 'filter': return <Filter className="h-4 w-4" />
      case 'transform': return <Zap className="h-4 w-4" />
      case 'map': return <ArrowRight className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getRuleTypeBadge = (type: FeedRule['type']) => {
    switch (type) {
      case 'filter':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">Filtre</Badge>
      case 'transform':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30">Transformation</Badge>
      case 'map':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/30">Mapping</Badge>
      case 'combine':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">Combinaison</Badge>
      case 'split':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">Division</Badge>
      default:
        return <Badge variant="outline">Règle</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Règles de flux</h3>
          <p className="text-sm text-muted-foreground">
            Configurez des règles IF/THEN pour optimiser vos produits
          </p>
        </div>
        <Button onClick={onAddRule}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        {rules.map((rule, index) => (
          <Card 
            key={rule.id} 
            className={cn(
              "transition-all",
              !rule.isActive && "opacity-60",
              expandedRule === rule.id && "border-primary"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Drag Handle */}
                <div className="cursor-grab text-muted-foreground hover:text-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Order Number */}
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>

                {/* Rule Icon & Type */}
                <div className="flex items-center gap-2">
                  {getRuleTypeIcon(rule.type)}
                  {getRuleTypeBadge(rule.type)}
                </div>

                {/* Rule Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{rule.name}</h4>
                    {rule.affectedProducts !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({rule.affectedProducts.toLocaleString()} produits)
                      </span>
                    )}
                  </div>
                  {rule.description && (
                    <p className="text-sm text-muted-foreground truncate">{rule.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={rule.isActive}
                    onCheckedChange={(checked) => onToggleRule?.(rule.id, checked)}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDeleteRule?.(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Rule Details */}
              {expandedRule === rule.id && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Conditions */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">IF</span>
                      Conditions
                    </h5>
                    {rule.conditions.length > 0 ? (
                      <div className="space-y-2 pl-4">
                        {rule.conditions.map((condition, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                            <Badge variant="outline">{AVAILABLE_FIELDS.find(f => f.value === condition.field)?.label || condition.field}</Badge>
                            <span className="text-muted-foreground">{OPERATORS.find(o => o.value === condition.operator)?.label}</span>
                            {condition.value && <Badge>{condition.value}</Badge>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground pl-4">Toujours appliquer (pas de conditions)</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-700 rounded text-xs">THEN</span>
                      Actions
                    </h5>
                    <div className="space-y-2 pl-4">
                      {rule.actions.map((action, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                          <Badge variant="secondary">{ACTION_TYPES.find(a => a.value === action.type)?.label}</Badge>
                          {action.targetField && (
                            <>
                              <ArrowRight className="h-3 w-3" />
                              <Badge variant="outline">{AVAILABLE_FIELDS.find(f => f.value === action.targetField)?.label || action.targetField}</Badge>
                            </>
                          )}
                          {action.value && <span className="text-muted-foreground">: "{action.value}"</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => onEditRule?.(rule.id)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Modifier la règle
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {rules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune règle configurée</h3>
            <p className="text-muted-foreground mb-4">
              Créez des règles IF/THEN pour optimiser automatiquement vos produits
            </p>
            <Button onClick={onAddRule}>
              <Plus className="h-4 w-4 mr-2" />
              Créer ma première règle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
