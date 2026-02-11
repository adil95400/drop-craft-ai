/**
 * Pre-Import Rules Engine - Conditional logic for margins, stock, categories
 * AutoDS-level automation before products enter the catalog
 */
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Shield, Plus, Trash2, Settings, Zap, Filter, 
  DollarSign, Package, Tag, ArrowRight, CheckCircle, 
  AlertTriangle, Clock, Edit, Copy, ToggleLeft
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PreImportRule {
  id: string
  name: string
  condition: {
    field: 'price' | 'stock' | 'category' | 'title' | 'margin'
    operator: 'gt' | 'lt' | 'eq' | 'contains' | 'not_contains'
    value: string
  }
  action: {
    type: 'set_margin' | 'set_category' | 'skip' | 'flag_review' | 'auto_publish' | 'set_price_multiplier'
    value: string
  }
  isActive: boolean
  priority: number
  matchCount: number
  lastTriggered: string | null
}

const defaultRules: PreImportRule[] = [
  {
    id: '1', name: 'Marge minimale 30%', 
    condition: { field: 'margin', operator: 'lt', value: '30' },
    action: { type: 'set_margin', value: '30' },
    isActive: true, priority: 1, matchCount: 234, lastTriggered: 'Il y a 2h'
  },
  {
    id: '2', name: 'Stock minimum 5 unités',
    condition: { field: 'stock', operator: 'lt', value: '5' },
    action: { type: 'skip', value: '' },
    isActive: true, priority: 2, matchCount: 89, lastTriggered: 'Il y a 30min'
  },
  {
    id: '3', name: 'Auto-catégorie Électronique',
    condition: { field: 'title', operator: 'contains', value: 'wireless,bluetooth,usb' },
    action: { type: 'set_category', value: 'Électronique' },
    isActive: true, priority: 3, matchCount: 156, lastTriggered: 'Il y a 1h'
  },
  {
    id: '4', name: 'Prix > 500€ → Revue manuelle',
    condition: { field: 'price', operator: 'gt', value: '500' },
    action: { type: 'flag_review', value: 'high_value' },
    isActive: true, priority: 4, matchCount: 23, lastTriggered: 'Il y a 5h'
  },
  {
    id: '5', name: 'Multiplicateur prix x2.5',
    condition: { field: 'category', operator: 'eq', value: 'Accessoires' },
    action: { type: 'set_price_multiplier', value: '2.5' },
    isActive: false, priority: 5, matchCount: 67, lastTriggered: null
  },
]

const conditionLabels: Record<string, string> = {
  price: 'Prix', stock: 'Stock', category: 'Catégorie', title: 'Titre', margin: 'Marge',
  gt: 'supérieur à', lt: 'inférieur à', eq: 'égal à', contains: 'contient', not_contains: 'ne contient pas'
}

const actionLabels: Record<string, string> = {
  set_margin: 'Définir marge', set_category: 'Assigner catégorie', skip: 'Ignorer le produit',
  flag_review: 'Marquer pour revue', auto_publish: 'Publier automatiquement', set_price_multiplier: 'Multiplicateur prix'
}

export default function PreImportRulesPage() {
  const { toast } = useToast()
  const [rules, setRules] = useState<PreImportRule[]>(defaultRules)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newRule, setNewRule] = useState({
    name: '',
    conditionField: 'price' as PreImportRule['condition']['field'],
    conditionOperator: 'gt' as PreImportRule['condition']['operator'],
    conditionValue: '',
    actionType: 'set_margin' as PreImportRule['action']['type'],
    actionValue: '',
  })

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r))
    toast({ title: 'Règle mise à jour' })
  }

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id))
    toast({ title: 'Règle supprimée', variant: 'destructive' })
  }

  const duplicateRule = (rule: PreImportRule) => {
    const copy: PreImportRule = {
      ...rule, id: Date.now().toString(),
      name: `${rule.name} (copie)`, isActive: false, matchCount: 0, lastTriggered: null
    }
    setRules(prev => [...prev, copy])
    toast({ title: 'Règle dupliquée' })
  }

  const createRule = () => {
    const rule: PreImportRule = {
      id: Date.now().toString(),
      name: newRule.name || 'Nouvelle règle',
      condition: { field: newRule.conditionField, operator: newRule.conditionOperator, value: newRule.conditionValue },
      action: { type: newRule.actionType, value: newRule.actionValue },
      isActive: true, priority: rules.length + 1, matchCount: 0, lastTriggered: null
    }
    setRules(prev => [...prev, rule])
    setShowCreateDialog(false)
    setNewRule({ name: '', conditionField: 'price', conditionOperator: 'gt', conditionValue: '', actionType: 'set_margin', actionValue: '' })
    toast({ title: 'Règle créée', description: `"${rule.name}" sera appliquée aux prochains imports.` })
  }

  const activeRules = rules.filter(r => r.isActive).length
  const totalMatches = rules.reduce((s, r) => s + r.matchCount, 0)

  return (
    <ChannablePageWrapper
      title="Règles Pré-Import"
      description="Définissez des règles automatiques appliquées avant l'entrée des produits dans votre catalogue."
      heroImage="import"
      badge={{ label: 'Automation', icon: Shield }}
      actions={
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nouvelle règle</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer une règle pré-import</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom de la règle</Label>
                <Input placeholder="Ex: Marge minimale 25%" value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <div className="flex gap-2">
                  <Select value={newRule.conditionField} onValueChange={v => setNewRule(p => ({ ...p, conditionField: v as any }))}>
                    <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Prix</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="margin">Marge</SelectItem>
                      <SelectItem value="category">Catégorie</SelectItem>
                      <SelectItem value="title">Titre</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newRule.conditionOperator} onValueChange={v => setNewRule(p => ({ ...p, conditionOperator: v as any }))}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gt">supérieur à</SelectItem>
                      <SelectItem value="lt">inférieur à</SelectItem>
                      <SelectItem value="eq">égal à</SelectItem>
                      <SelectItem value="contains">contient</SelectItem>
                      <SelectItem value="not_contains">ne contient pas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Valeur" value={newRule.conditionValue} onChange={e => setNewRule(p => ({ ...p, conditionValue: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <div className="flex gap-2">
                  <Select value={newRule.actionType} onValueChange={v => setNewRule(p => ({ ...p, actionType: v as any }))}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set_margin">Définir marge</SelectItem>
                      <SelectItem value="set_category">Assigner catégorie</SelectItem>
                      <SelectItem value="skip">Ignorer le produit</SelectItem>
                      <SelectItem value="flag_review">Marquer pour revue</SelectItem>
                      <SelectItem value="auto_publish">Publier auto</SelectItem>
                      <SelectItem value="set_price_multiplier">Multiplicateur prix</SelectItem>
                    </SelectContent>
                  </Select>
                  {newRule.actionType !== 'skip' && (
                    <Input placeholder="Valeur" value={newRule.actionValue} onChange={e => setNewRule(p => ({ ...p, actionValue: e.target.value }))} />
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
              <Button onClick={createRule}>Créer la règle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Filter className="h-4 w-4" /> Règles actives
            </div>
            <div className="text-2xl font-bold">{activeRules}/{rules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle className="h-4 w-4" /> Produits filtrés
            </div>
            <div className="text-2xl font-bold text-primary">{totalMatches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Package className="h-4 w-4" /> Ignorés
            </div>
            <div className="text-2xl font-bold text-destructive">89</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Zap className="h-4 w-4" /> Auto-catégorisés
            </div>
            <div className="text-2xl font-bold text-green-600">156</div>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map(rule => (
          <Card key={rule.id} className={!rule.isActive ? 'opacity-60' : ''}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{rule.name}</h3>
                    <Badge variant="outline" className="text-xs shrink-0">P{rule.priority}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {conditionLabels[rule.condition.field]} {conditionLabels[rule.condition.operator]} {rule.condition.value}
                    </Badge>
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    <Badge className="text-xs">
                      {actionLabels[rule.action.type]} {rule.action.value && `→ ${rule.action.value}`}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{rule.matchCount} correspondances</span>
                    {rule.lastTriggered && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{rule.lastTriggered}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => duplicateRule(rule)}><Copy className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteRule(rule.id)}><Trash2 className="h-4 w-4" /></Button>
                  <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ChannablePageWrapper>
  )
}
