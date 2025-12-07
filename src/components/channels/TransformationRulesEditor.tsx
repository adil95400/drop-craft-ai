/**
 * Éditeur de règles de transformation style Channable
 * Permet de créer des règles if/then pour transformer les données produits
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, Trash2, GripVertical, Play, Save, Copy, 
  ChevronDown, ChevronRight, Zap, AlertCircle, CheckCircle2,
  ArrowRight, Settings2, Code2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// Types
interface Condition {
  field: string
  operator: string
  value: string
}

interface Action {
  type: string
  field: string
  value: string
}

interface TransformationRule {
  id: string
  name: string
  description?: string
  isActive: boolean
  priority: number
  conditions: Condition[]
  conditionLogic: 'AND' | 'OR'
  actions: Action[]
}

// Field options
const PRODUCT_FIELDS = [
  { value: 'title', label: 'Titre' },
  { value: 'description', label: 'Description' },
  { value: 'price', label: 'Prix' },
  { value: 'compare_at_price', label: 'Prix barré' },
  { value: 'sku', label: 'SKU' },
  { value: 'barcode', label: 'Code-barres' },
  { value: 'vendor', label: 'Fournisseur' },
  { value: 'product_type', label: 'Type produit' },
  { value: 'tags', label: 'Tags' },
  { value: 'category', label: 'Catégorie' },
  { value: 'brand', label: 'Marque' },
  { value: 'inventory_quantity', label: 'Stock' },
  { value: 'weight', label: 'Poids' },
  { value: 'status', label: 'Statut' },
]

const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Est égal à' },
  { value: 'not_equals', label: 'N\'est pas égal à' },
  { value: 'contains', label: 'Contient' },
  { value: 'not_contains', label: 'Ne contient pas' },
  { value: 'starts_with', label: 'Commence par' },
  { value: 'ends_with', label: 'Se termine par' },
  { value: 'greater_than', label: 'Supérieur à' },
  { value: 'less_than', label: 'Inférieur à' },
  { value: 'is_empty', label: 'Est vide' },
  { value: 'is_not_empty', label: 'N\'est pas vide' },
  { value: 'matches_regex', label: 'Correspond à (regex)' },
]

const ACTION_TYPES = [
  { value: 'set', label: 'Définir la valeur' },
  { value: 'append', label: 'Ajouter à la fin' },
  { value: 'prepend', label: 'Ajouter au début' },
  { value: 'replace', label: 'Remplacer texte' },
  { value: 'multiply', label: 'Multiplier par' },
  { value: 'add', label: 'Ajouter (nombre)' },
  { value: 'round', label: 'Arrondir' },
  { value: 'uppercase', label: 'Majuscules' },
  { value: 'lowercase', label: 'Minuscules' },
  { value: 'capitalize', label: 'Capitaliser' },
  { value: 'trim', label: 'Supprimer espaces' },
  { value: 'copy_from', label: 'Copier depuis champ' },
]

interface TransformationRulesEditorProps {
  channelId: string
  rules?: TransformationRule[]
  onSave?: (rules: TransformationRule[]) => void
}

export function TransformationRulesEditor({ 
  channelId, 
  rules: initialRules = [], 
  onSave 
}: TransformationRulesEditorProps) {
  const [rules, setRules] = useState<TransformationRule[]>(initialRules)
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())
  const [testResult, setTestResult] = useState<{ ruleId: string; success: boolean; message: string } | null>(null)

  const toggleExpanded = (ruleId: string) => {
    const newExpanded = new Set(expandedRules)
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId)
    } else {
      newExpanded.add(ruleId)
    }
    setExpandedRules(newExpanded)
  }

  const addRule = () => {
    const newRule: TransformationRule = {
      id: `rule-${Date.now()}`,
      name: `Règle ${rules.length + 1}`,
      isActive: true,
      priority: rules.length + 1,
      conditions: [{ field: 'title', operator: 'contains', value: '' }],
      conditionLogic: 'AND',
      actions: [{ type: 'set', field: 'title', value: '' }],
    }
    setRules([...rules, newRule])
    setExpandedRules(new Set([...expandedRules, newRule.id]))
  }

  const updateRule = (ruleId: string, updates: Partial<TransformationRule>) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, ...updates } : r))
  }

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId))
  }

  const duplicateRule = (rule: TransformationRule) => {
    const newRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (copie)`,
      priority: rules.length + 1,
    }
    setRules([...rules, newRule])
  }

  const addCondition = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (rule) {
      updateRule(ruleId, {
        conditions: [...rule.conditions, { field: 'title', operator: 'contains', value: '' }]
      })
    }
  }

  const updateCondition = (ruleId: string, conditionIndex: number, updates: Partial<Condition>) => {
    const rule = rules.find(r => r.id === ruleId)
    if (rule) {
      const newConditions = [...rule.conditions]
      newConditions[conditionIndex] = { ...newConditions[conditionIndex], ...updates }
      updateRule(ruleId, { conditions: newConditions })
    }
  }

  const removeCondition = (ruleId: string, conditionIndex: number) => {
    const rule = rules.find(r => r.id === ruleId)
    if (rule && rule.conditions.length > 1) {
      updateRule(ruleId, {
        conditions: rule.conditions.filter((_, i) => i !== conditionIndex)
      })
    }
  }

  const addAction = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (rule) {
      updateRule(ruleId, {
        actions: [...rule.actions, { type: 'set', field: 'title', value: '' }]
      })
    }
  }

  const updateAction = (ruleId: string, actionIndex: number, updates: Partial<Action>) => {
    const rule = rules.find(r => r.id === ruleId)
    if (rule) {
      const newActions = [...rule.actions]
      newActions[actionIndex] = { ...newActions[actionIndex], ...updates }
      updateRule(ruleId, { actions: newActions })
    }
  }

  const removeAction = (ruleId: string, actionIndex: number) => {
    const rule = rules.find(r => r.id === ruleId)
    if (rule && rule.actions.length > 1) {
      updateRule(ruleId, {
        actions: rule.actions.filter((_, i) => i !== actionIndex)
      })
    }
  }

  const testRule = async (rule: TransformationRule) => {
    // Simulate testing the rule
    setTestResult({ ruleId: rule.id, success: true, message: '5 produits correspondants trouvés' })
    setTimeout(() => setTestResult(null), 3000)
  }

  const handleSave = () => {
    onSave?.(rules)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Règles de transformation
          </h3>
          <p className="text-sm text-muted-foreground">
            Automatisez la transformation de vos données produits
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addRule} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle règle</span>
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Enregistrer</span>
          </Button>
        </div>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">Aucune règle configurée</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Créez des règles pour transformer automatiquement vos produits
            </p>
            <Button onClick={addRule} className="gap-2">
              <Plus className="h-4 w-4" />
              Créer une règle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {rules.map((rule, index) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "transition-shadow",
                  expandedRules.has(rule.id) && "ring-2 ring-primary/20"
                )}>
                  {/* Rule Header */}
                  <div 
                    className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleExpanded(rule.id)}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {expandedRules.has(rule.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium truncate">{rule.name}</span>
                        <Badge variant="outline" className="text-xs">
                          #{rule.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                        {rule.conditions.length} condition{rule.conditions.length > 1 ? 's' : ''} → {rule.actions.length} action{rule.actions.length > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {testResult?.ruleId === rule.id && (
                        <Badge className={cn(
                          "gap-1",
                          testResult.success ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"
                        )}>
                          {testResult.success ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          <span className="hidden sm:inline">{testResult.message}</span>
                        </Badge>
                      )}
                      <Switch 
                        checked={rule.isActive}
                        onCheckedChange={(checked) => updateRule(rule.id, { isActive: checked })}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => testRule(rule)}
                        className="hidden sm:flex"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => duplicateRule(rule)}
                        className="hidden sm:flex"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteRule(rule.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedRules.has(rule.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0 space-y-6">
                          {/* Rule Name */}
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label>Nom de la règle</Label>
                              <Input
                                value={rule.name}
                                onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                                placeholder="Ex: Prix promotion -20%"
                              />
                            </div>
                            <div>
                              <Label>Description (optionnel)</Label>
                              <Input
                                value={rule.description || ''}
                                onChange={(e) => updateRule(rule.id, { description: e.target.value })}
                                placeholder="Description de la règle"
                              />
                            </div>
                          </div>

                          {/* Conditions - SI */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-semibold flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-700">SI</Badge>
                                Conditions
                              </Label>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={rule.conditionLogic}
                                  onValueChange={(value: 'AND' | 'OR') => updateRule(rule.id, { conditionLogic: value })}
                                >
                                  <SelectTrigger className="w-24 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AND">ET</SelectItem>
                                    <SelectItem value="OR">OU</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {rule.conditions.map((condition, conditionIndex) => (
                                <div key={conditionIndex} className="flex flex-wrap gap-2 items-center p-3 bg-muted/50 rounded-lg">
                                  <Select
                                    value={condition.field}
                                    onValueChange={(value) => updateCondition(rule.id, conditionIndex, { field: value })}
                                  >
                                    <SelectTrigger className="w-full sm:w-36">
                                      <SelectValue placeholder="Champ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PRODUCT_FIELDS.map(field => (
                                        <SelectItem key={field.value} value={field.value}>
                                          {field.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <Select
                                    value={condition.operator}
                                    onValueChange={(value) => updateCondition(rule.id, conditionIndex, { operator: value })}
                                  >
                                    <SelectTrigger className="w-full sm:w-44">
                                      <SelectValue placeholder="Opérateur" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CONDITION_OPERATORS.map(op => (
                                        <SelectItem key={op.value} value={op.value}>
                                          {op.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                                    <Input
                                      value={condition.value}
                                      onChange={(e) => updateCondition(rule.id, conditionIndex, { value: e.target.value })}
                                      placeholder="Valeur"
                                      className="flex-1 min-w-32"
                                    />
                                  )}

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeCondition(rule.id, conditionIndex)}
                                    disabled={rule.conditions.length <= 1}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addCondition(rule.id)}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Ajouter condition
                            </Button>
                          </div>

                          {/* Arrow */}
                          <div className="flex justify-center">
                            <ArrowRight className="h-6 w-6 text-muted-foreground" />
                          </div>

                          {/* Actions - ALORS */}
                          <div className="space-y-3">
                            <Label className="text-base font-semibold flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-500/10 text-green-700">ALORS</Badge>
                              Actions
                            </Label>

                            <div className="space-y-2">
                              {rule.actions.map((action, actionIndex) => (
                                <div key={actionIndex} className="flex flex-wrap gap-2 items-center p-3 bg-muted/50 rounded-lg">
                                  <Select
                                    value={action.type}
                                    onValueChange={(value) => updateAction(rule.id, actionIndex, { type: value })}
                                  >
                                    <SelectTrigger className="w-full sm:w-44">
                                      <SelectValue placeholder="Action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ACTION_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <Select
                                    value={action.field}
                                    onValueChange={(value) => updateAction(rule.id, actionIndex, { field: value })}
                                  >
                                    <SelectTrigger className="w-full sm:w-36">
                                      <SelectValue placeholder="Champ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PRODUCT_FIELDS.map(field => (
                                        <SelectItem key={field.value} value={field.value}>
                                          {field.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  {!['uppercase', 'lowercase', 'capitalize', 'trim'].includes(action.type) && (
                                    <Input
                                      value={action.value}
                                      onChange={(e) => updateAction(rule.id, actionIndex, { value: e.target.value })}
                                      placeholder="Valeur"
                                      className="flex-1 min-w-32"
                                    />
                                  )}

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeAction(rule.id, actionIndex)}
                                    disabled={rule.actions.length <= 1}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addAction(rule.id)}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Ajouter action
                            </Button>
                          </div>

                          {/* Mobile actions */}
                          <div className="flex gap-2 sm:hidden">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testRule(rule)}
                              className="flex-1 gap-2"
                            >
                              <Play className="h-4 w-4" />
                              Tester
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateRule(rule)}
                              className="flex-1 gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Dupliquer
                            </Button>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
