import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  ProductRule, ProductRuleCondition, ProductRuleAction, RuleOperator, 
  RuleActionType, RuleChannel, RulePriority, RULE_TEMPLATES 
} from '@/lib/rules/ruleTypes'
import { Plus, Trash2, Play, Save, Sparkles, Copy, ChevronRight } from 'lucide-react'

interface RuleBuilderProps {
  rule?: ProductRule
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (rule: Partial<ProductRule>) => void
}

const OPERATORS: { value: RuleOperator; label: string; types: string[] }[] = [
  { value: 'eq', label: 'Égal à', types: ['string', 'number'] },
  { value: 'ne', label: 'Différent de', types: ['string', 'number'] },
  { value: 'gt', label: 'Supérieur à', types: ['number'] },
  { value: 'ge', label: 'Supérieur ou égal', types: ['number'] },
  { value: 'lt', label: 'Inférieur à', types: ['number'] },
  { value: 'le', label: 'Inférieur ou égal', types: ['number'] },
  { value: 'contains', label: 'Contient', types: ['string'] },
  { value: 'not_contains', label: 'Ne contient pas', types: ['string'] },
  { value: 'starts_with', label: 'Commence par', types: ['string'] },
  { value: 'ends_with', label: 'Finit par', types: ['string'] },
  { value: 'empty', label: 'Est vide', types: ['string', 'array'] },
  { value: 'not_empty', label: 'N\'est pas vide', types: ['string', 'array'] },
  { value: 'length_gt', label: 'Longueur >', types: ['string'] },
  { value: 'length_lt', label: 'Longueur <', types: ['string'] },
]

const ACTION_TYPES: { value: RuleActionType; label: string; icon: string }[] = [
  { value: 'set_field', label: 'Définir valeur', icon: '✏️' },
  { value: 'append_text', label: 'Ajouter texte', icon: '➕' },
  { value: 'prepend_text', label: 'Préfixer texte', icon: '⬆️' },
  { value: 'replace_text', label: 'Remplacer texte', icon: '🔄' },
  { value: 'uppercase', label: 'Majuscules', icon: 'A' },
  { value: 'lowercase', label: 'Minuscules', icon: 'a' },
  { value: 'trim', label: 'Supprimer espaces', icon: '✂️' },
  { value: 'multiply', label: 'Multiplier', icon: '✖️' },
  { value: 'add', label: 'Ajouter', icon: '➕' },
  { value: 'round', label: 'Arrondir', icon: '🔢' },
  { value: 'add_tag', label: 'Ajouter tag', icon: '🏷️' },
  { value: 'generate_ai', label: 'Générer avec IA', icon: '🤖' },
]

const PRODUCT_FIELDS = [
  { value: 'name', label: 'Nom du produit', type: 'string' },
  { value: 'description', label: 'Description', type: 'string' },
  { value: 'price', label: 'Prix', type: 'number' },
  { value: 'compare_at_price', label: 'Prix barré', type: 'number' },
  { value: 'stock_quantity', label: 'Stock', type: 'number' },
  { value: 'category', label: 'Catégorie', type: 'string' },
  { value: 'brand', label: 'Marque', type: 'string' },
  { value: 'sku', label: 'SKU', type: 'string' },
  { value: 'tags', label: 'Tags', type: 'array' },
  { value: 'audit_score_global', label: 'Score Audit', type: 'number' },
]

export function RuleBuilder({ rule, open, onOpenChange, onSave }: RuleBuilderProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('config')
  
  const [name, setName] = useState(rule?.name || '')
  const [description, setDescription] = useState(rule?.description || '')
  const [enabled, setEnabled] = useState(rule?.enabled ?? true)
  const [priority, setPriority] = useState<RulePriority>(rule?.priority || 3)
  const [channel, setChannel] = useState<RuleChannel>(rule?.channel || 'global')
  
  const [conditions, setConditions] = useState<ProductRuleCondition[]>(
    rule?.conditionGroup?.conditions || []
  )
  const [conditionLogic, setConditionLogic] = useState<'AND' | 'OR'>(
    rule?.conditionGroup?.logic || 'AND'
  )
  
  const [actions, setActions] = useState<ProductRuleAction[]>(rule?.actions || [])

  useEffect(() => {
    if (rule) {
      setName(rule.name)
      setDescription(rule.description || '')
      setEnabled(rule.enabled)
      setPriority(rule.priority)
      setChannel(rule.channel)
      setConditions(rule.conditionGroup?.conditions || [])
      setConditionLogic(rule.conditionGroup?.logic || 'AND')
      setActions(rule.actions || [])
    }
  }, [rule])

  const addCondition = () => {
    setConditions([...conditions, {
      id: Date.now().toString(),
      field: 'name',
      operator: 'contains',
      value: ''
    }])
  }

  const updateCondition = (id: string, updates: Partial<ProductRuleCondition>) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id))
  }

  const addAction = () => {
    setActions([...actions, {
      id: Date.now().toString(),
      type: 'set_field',
      field: 'name',
      value: ''
    }])
  }

  const updateAction = (id: string, updates: Partial<ProductRuleAction>) => {
    setActions(actions.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  const removeAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id))
  }

  const applyTemplate = (templateId: string) => {
    const template = RULE_TEMPLATES.find(t => t.id === templateId)
    if (template?.rule) {
      setName(template.rule.name || '')
      setPriority(template.rule.priority || 3)
      setChannel(template.rule.channel || 'global')
      if (template.rule.conditionGroup) {
        setConditions(template.rule.conditionGroup.conditions || [])
        setConditionLogic(template.rule.conditionGroup.logic || 'AND')
      }
      if (template.rule.actions) {
        setActions(template.rule.actions)
      }
      toast({ title: "Template appliqué", description: template.name })
    }
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Nom requis", variant: "destructive" })
      return
    }
    if (conditions.length === 0) {
      toast({ title: "Au moins une condition requise", variant: "destructive" })
      return
    }
    if (actions.length === 0) {
      toast({ title: "Au moins une action requise", variant: "destructive" })
      return
    }

    const ruleData: Partial<ProductRule> = {
      id: rule?.id || Date.now().toString(),
      name,
      description,
      enabled,
      priority,
      channel,
      conditionGroup: {
        logic: conditionLogic,
        conditions
      },
      actions,
      updatedAt: new Date().toISOString(),
      createdAt: rule?.createdAt || new Date().toISOString()
    }

    onSave(ruleData)
    toast({ title: "Règle enregistrée" })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {rule ? 'Éditer la règle' : 'Nouvelle règle'}
            {enabled && <Badge className="bg-green-500">Active</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Démarrez rapidement avec un template pré-configuré
            </p>
            <div className="grid gap-3">
              {RULE_TEMPLATES.map((template) => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => applyTemplate(template.id)}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{template.category}</Badge>
                        <Badge variant="secondary">{template.channel}</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Nom de la règle *</Label>
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Raccourcir titres > 140 caractères"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez l'objectif de cette règle..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Priorité</Label>
                  <Select value={priority.toString()} onValueChange={(v) => setPriority(parseInt(v) as RulePriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Très haute</SelectItem>
                      <SelectItem value="2">2 - Haute</SelectItem>
                      <SelectItem value="3">3 - Normale</SelectItem>
                      <SelectItem value="4">4 - Basse</SelectItem>
                      <SelectItem value="5">5 - Très basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select value={channel} onValueChange={(v) => setChannel(v as RuleChannel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="google">Google Shopping</SelectItem>
                      <SelectItem value="meta">Meta/Facebook</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="shopify">Shopify</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Statut</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch checked={enabled} onCheckedChange={setEnabled} />
                    <span className="text-sm">{enabled ? 'Active' : 'Désactivée'}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="conditions" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Logique:</Label>
                <Select value={conditionLogic} onValueChange={(v) => setConditionLogic(v as 'AND' | 'OR')}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">ET</SelectItem>
                    <SelectItem value="OR">OU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addCondition} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Condition
              </Button>
            </div>

            <div className="space-y-3">
              {conditions.map((condition, idx) => (
                <Card key={condition.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {idx > 0 && (
                        <Badge variant="outline" className="shrink-0">{conditionLogic}</Badge>
                      )}
                      <Select 
                        value={condition.field} 
                        onValueChange={(v) => updateCondition(condition.id, { field: v })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_FIELDS.map(f => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select 
                        value={condition.operator} 
                        onValueChange={(v) => updateCondition(condition.id, { operator: v as RuleOperator })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map(op => (
                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {!['empty', 'not_empty'].includes(condition.operator) && (
                        <Input 
                          className="flex-1"
                          value={condition.value || ''}
                          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                          placeholder="Valeur..."
                        />
                      )}

                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeCondition(condition.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {conditions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Aucune condition. Cliquez sur "+ Condition" pour commencer.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={addAction} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Action
              </Button>
            </div>

            <div className="space-y-3">
              {actions.map((action, idx) => (
                <Card key={action.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="shrink-0">{idx + 1}</Badge>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Select 
                            value={action.type} 
                            onValueChange={(v) => updateAction(action.id, { type: v as RuleActionType })}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ACTION_TYPES.map(at => (
                                <SelectItem key={at.value} value={at.value}>
                                  {at.icon} {at.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <span className="text-muted-foreground">sur</span>

                          <Select 
                            value={action.field} 
                            onValueChange={(v) => updateAction(action.id, { field: v })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRODUCT_FIELDS.map(f => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {action.type === 'generate_ai' ? (
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              <Sparkles className="h-4 w-4 text-purple-500" />
                              Prompt IA
                            </Label>
                            <Textarea 
                              value={action.aiPrompt || ''}
                              onChange={(e) => updateAction(action.id, { aiPrompt: e.target.value })}
                              placeholder="Décrivez ce que l'IA doit générer..."
                            />
                          </div>
                        ) : ['set_field', 'append_text', 'prepend_text', 'replace_text', 'add_tag', 'multiply', 'add'].includes(action.type) && (
                          <Input 
                            value={action.value || ''}
                            onChange={(e) => updateAction(action.id, { value: e.target.value })}
                            placeholder="Valeur..."
                          />
                        )}
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeAction(action.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {actions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Aucune action. Cliquez sur "+ Action" pour ajouter.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
