/**
 * RuleBuilder - Modal de création/édition de règles optimisé
 */
import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  ProductRule, ProductRuleCondition, ProductRuleAction, RuleOperator, 
  RuleActionType, RuleChannel, RulePriority, RULE_TEMPLATES 
} from '@/lib/rules/ruleTypes'
import { 
  Plus, Trash2, Save, Sparkles, ChevronRight, Eye, 
  Package, Zap, Settings, FileText, AlertCircle, CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

const ACTION_TYPES: { value: RuleActionType; label: string; icon: string; category: string }[] = [
  { value: 'set_field', label: 'Définir valeur', icon: '✏️', category: 'Texte' },
  { value: 'append_text', label: 'Ajouter texte', icon: '➕', category: 'Texte' },
  { value: 'prepend_text', label: 'Préfixer texte', icon: '⬆️', category: 'Texte' },
  { value: 'replace_text', label: 'Remplacer texte', icon: '🔄', category: 'Texte' },
  { value: 'uppercase', label: 'Majuscules', icon: 'A', category: 'Texte' },
  { value: 'lowercase', label: 'Minuscules', icon: 'a', category: 'Texte' },
  { value: 'trim', label: 'Supprimer espaces', icon: '✂️', category: 'Texte' },
  { value: 'multiply', label: 'Multiplier', icon: '✖️', category: 'Prix' },
  { value: 'add', label: 'Ajouter', icon: '➕', category: 'Prix' },
  { value: 'round', label: 'Arrondir', icon: '🔢', category: 'Prix' },
  { value: 'add_tag', label: 'Ajouter tag', icon: '🏷️', category: 'Tags' },
  { value: 'generate_ai', label: 'Générer avec IA', icon: '🤖', category: 'IA' },
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
]

const CHANNELS: { value: RuleChannel; label: string; color: string }[] = [
  { value: 'global', label: 'Global', color: 'bg-slate-500' },
  { value: 'google', label: 'Google Shopping', color: 'bg-blue-500' },
  { value: 'meta', label: 'Meta/Facebook', color: 'bg-indigo-500' },
  { value: 'tiktok', label: 'TikTok', color: 'bg-pink-500' },
  { value: 'amazon', label: 'Amazon', color: 'bg-orange-500' },
  { value: 'shopify', label: 'Shopify', color: 'bg-green-500' },
]

// Fallback products for preview when no real data available
const FALLBACK_PRODUCTS = [
  { id: '1', name: 'Produit exemple 1', price: 29.99, stock_quantity: 10, category: 'Général', brand: 'N/A' },
  { id: '2', name: 'Produit exemple 2', price: 49.99, stock_quantity: 5, category: 'Général', brand: 'N/A' },
]

export function RuleBuilder({ rule, open, onOpenChange, onSave }: RuleBuilderProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('config')

  // Fetch real products for preview
  const { data: realProducts } = useQuery({
    queryKey: ['rule-preview-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, stock_quantity, category, brand')
        .limit(10)
      return (data || []).map(p => ({
        id: p.id,
        name: p.name || '',
        price: p.price || 0,
        stock_quantity: p.stock_quantity || 0,
        category: p.category || '',
        brand: p.brand || ''
      }))
    }
  })
  const previewProducts = realProducts && realProducts.length > 0 ? realProducts : FALLBACK_PRODUCTS
  
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
  const [showPreview, setShowPreview] = useState(false)

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
    } else {
      // Reset pour nouvelle règle
      setName('')
      setDescription('')
      setEnabled(true)
      setPriority(3)
      setChannel('global')
      setConditions([])
      setConditionLogic('AND')
      setActions([])
    }
    setActiveTab('config')
    setShowPreview(false)
  }, [rule, open])

  // Calculer les produits qui matchent les conditions
  const matchingProducts = useMemo(() => {
    if (conditions.length === 0) return previewProducts;
    
    return previewProducts.filter(product => {
      const results = conditions.map(condition => {
        const fieldValue = (product as any)[condition.field];
        const condValue = condition.value;
        
        switch (condition.operator) {
          case 'eq': return fieldValue == condValue;
          case 'ne': return fieldValue != condValue;
          case 'gt': return Number(fieldValue) > Number(condValue);
          case 'lt': return Number(fieldValue) < Number(condValue);
          case 'contains': return String(fieldValue).toLowerCase().includes(String(condValue).toLowerCase());
          case 'length_gt': return String(fieldValue).length > Number(condValue);
          case 'length_lt': return String(fieldValue).length < Number(condValue);
          default: return true;
        }
      });
      
      return conditionLogic === 'AND' 
        ? results.every(r => r)
        : results.some(r => r);
    });
  }, [conditions, conditionLogic, previewProducts]);

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
      setActiveTab('conditions')
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

  const isValid = name.trim() && conditions.length > 0 && actions.length > 0

  const getChannelInfo = (ch: RuleChannel) => CHANNELS.find(c => c.value === ch)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                {rule ? 'Éditer la règle' : 'Nouvelle règle'}
                {enabled && (
                  <Badge className="bg-emerald-500 text-white">Active</Badge>
                )}
              </DialogTitle>
              {name && (
                <p className="text-sm text-muted-foreground mt-1">{name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className={cn(showPreview && "bg-primary/10")}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <div className={cn(
            "flex-1 overflow-hidden transition-all",
            showPreview ? "w-2/3" : "w-full"
          )}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mx-6 mt-4 grid grid-cols-4 bg-muted/50">
                <TabsTrigger value="templates" className="gap-1.5">
                  <FileText className="h-4 w-4" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="config" className="gap-1.5">
                  <Settings className="h-4 w-4" />
                  Config
                </TabsTrigger>
                <TabsTrigger value="conditions" className="gap-1.5 relative">
                  <Zap className="h-4 w-4" />
                  Conditions
                  {conditions.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                      {conditions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-1.5 relative">
                  <Package className="h-4 w-4" />
                  Actions
                  {actions.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                      {actions.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 px-6 py-4">
                <TabsContent value="templates" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Démarrez rapidement avec un template pré-configuré
                  </p>
                  <div className="grid gap-3">
                    {RULE_TEMPLATES.map((template, index) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                          onClick={() => applyTemplate(template.id)}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{template.name}</h4>
                                <Badge variant="outline" className="text-xs">{template.category}</Badge>
                                <Badge 
                                  variant="secondary" 
                                  className={cn("text-white text-xs", getChannelInfo(template.channel)?.color)}
                                >
                                  {template.channel}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="config" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Nom de la règle *</Label>
                      <Input 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Raccourcir titres > 140 caractères"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez l'objectif de cette règle..."
                        className="min-h-[80px] resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Priorité</Label>
                        <Select value={priority.toString()} onValueChange={(v) => setPriority(parseInt(v) as RulePriority)}>
                          <SelectTrigger className="h-11">
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
                        <Label className="text-sm font-medium">Canal</Label>
                        <Select value={channel} onValueChange={(v) => setChannel(v as RuleChannel)}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CHANNELS.map(ch => (
                              <SelectItem key={ch.value} value={ch.value}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", ch.color)} />
                                  {ch.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Statut</Label>
                        <div className="flex items-center gap-3 h-11 px-3 rounded-md border bg-background">
                          <Switch checked={enabled} onCheckedChange={setEnabled} />
                          <span className="text-sm">{enabled ? 'Active' : 'Désactivée'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="conditions" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium">Logique:</Label>
                      <div className="flex rounded-lg border p-1 bg-muted/30">
                        <Button 
                          variant={conditionLogic === 'AND' ? 'default' : 'ghost'}
                          size="sm"
                          className="h-7 px-3"
                          onClick={() => setConditionLogic('AND')}
                        >
                          ET (toutes)
                        </Button>
                        <Button 
                          variant={conditionLogic === 'OR' ? 'default' : 'ghost'}
                          size="sm"
                          className="h-7 px-3"
                          onClick={() => setConditionLogic('OR')}
                        >
                          OU (une)
                        </Button>
                      </div>
                    </div>
                    <Button onClick={addCondition} size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Condition
                    </Button>
                  </div>

                  <AnimatePresence mode="popLayout">
                    <div className="space-y-3">
                      {conditions.map((condition, idx) => (
                        <motion.div
                          key={condition.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          layout
                        >
                          <Card className="border-border/50">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                {idx > 0 && (
                                  <Badge variant="outline" className="shrink-0 font-mono">
                                    {conditionLogic}
                                  </Badge>
                                )}
                                <Select 
                                  value={condition.field} 
                                  onValueChange={(v) => updateCondition(condition.id, { field: v })}
                                >
                                  <SelectTrigger className="w-36">
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
                                  <SelectTrigger className="w-36">
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
                                  className="shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeCondition(condition.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>

                  {conditions.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg"
                    >
                      <Zap className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Aucune condition définie</p>
                      <p className="text-sm">Cliquez sur "+ Condition" pour commencer</p>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="mt-0 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Actions à exécuter quand les conditions sont remplies
                    </p>
                    <Button onClick={addAction} size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Action
                    </Button>
                  </div>

                  <AnimatePresence mode="popLayout">
                    <div className="space-y-3">
                      {actions.map((action, idx) => (
                        <motion.div
                          key={action.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          layout
                        >
                          <Card className="border-border/50">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Badge variant="secondary" className="shrink-0 mt-2">{idx + 1}</Badge>
                                
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center gap-3">
                                    <Select 
                                      value={action.type} 
                                      onValueChange={(v) => updateAction(action.id, { type: v as RuleActionType })}
                                    >
                                      <SelectTrigger className="w-44">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {ACTION_TYPES.map(at => (
                                          <SelectItem key={at.value} value={at.value}>
                                            <span className="mr-2">{at.icon}</span> {at.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    <span className="text-muted-foreground text-sm">sur</span>

                                    <Select 
                                      value={action.field} 
                                      onValueChange={(v) => updateAction(action.id, { field: v })}
                                    >
                                      <SelectTrigger className="w-36">
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
                                      <Label className="flex items-center gap-1.5 text-sm">
                                        <Sparkles className="h-4 w-4 text-purple-500" />
                                        Prompt IA
                                      </Label>
                                      <Textarea 
                                        value={action.aiPrompt || ''}
                                        onChange={(e) => updateAction(action.id, { aiPrompt: e.target.value })}
                                        placeholder="Décrivez ce que l'IA doit générer..."
                                        className="min-h-[80px]"
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
                                  className="shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeAction(action.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>

                  {actions.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg"
                    >
                      <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Aucune action définie</p>
                      <p className="text-sm">Cliquez sur "+ Action" pour ajouter</p>
                    </motion.div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Preview panel */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '33%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l bg-muted/30 overflow-hidden"
              >
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Produits affectés
                    </h3>
                    <Badge variant="secondary">
                      {matchingProducts.length}/{previewProducts.length}
                    </Badge>
                  </div>
                  
                  <ScrollArea className="flex-1">
                    <div className="space-y-2">
                      {previewProducts.map(product => {
                        const matches = matchingProducts.some(p => p.id === product.id);
                        return (
                          <Card 
                            key={product.id} 
                            className={cn(
                              "transition-all",
                              matches 
                                ? "border-emerald-500/50 bg-emerald-500/5" 
                                : "opacity-50"
                            )}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                {matches ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {product.price}€ • Stock: {product.stock_quantity}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  <Separator className="my-4" />
                  
                  <div className="text-xs text-muted-foreground text-center">
                    Preview basée sur des données exemple
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {!isValid && (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>
                    {!name.trim() ? "Nom requis" : 
                     conditions.length === 0 ? "Ajoutez des conditions" : 
                     "Ajoutez des actions"}
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={!isValid} className="gap-2">
                <Save className="h-4 w-4" />
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
