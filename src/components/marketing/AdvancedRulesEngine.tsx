import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Trash2,
  Copy,
  ArrowRight,
  Zap,
  Clock,
  Mail,
  MessageSquare,
  Tag,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit,
  Eye,
  MoreVertical,
  Sparkles,
  Filter,
  Target
} from 'lucide-react'
import { toast } from 'sonner'

interface AutomationRule {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'draft'
  trigger: RuleTrigger
  conditions: RuleCondition[]
  actions: RuleAction[]
  stats: RuleStats
  createdAt: string
  lastTriggered?: string
}

interface RuleTrigger {
  type: 'event' | 'schedule' | 'condition'
  event?: string
  schedule?: string
  description: string
}

interface RuleCondition {
  id: string
  field: string
  operator: string
  value: string | number | boolean
  connector?: 'AND' | 'OR'
}

interface RuleAction {
  id: string
  type: string
  config: Record<string, any>
  delay?: number
}

interface RuleStats {
  totalExecutions: number
  successRate: number
  lastWeekExecutions: number
  revenue: number
}

const triggerTypes = [
  { id: 'cart_abandoned', label: 'Panier abandonné', icon: ShoppingCart },
  { id: 'order_placed', label: 'Commande passée', icon: Package },
  { id: 'product_viewed', label: 'Produit vu', icon: Eye },
  { id: 'customer_signup', label: 'Inscription client', icon: Users },
  { id: 'price_change', label: 'Changement de prix', icon: DollarSign },
  { id: 'stock_low', label: 'Stock faible', icon: AlertTriangle },
  { id: 'schedule', label: 'Planification', icon: Clock },
  { id: 'cross_sell_opportunity', label: 'Opportunité cross-sell', icon: Sparkles },
  { id: 'upsell_opportunity', label: 'Opportunité upsell', icon: Target },
  { id: 'product_category_match', label: 'Catégorie similaire', icon: Tag },
  { id: 'purchase_history', label: 'Historique achat', icon: ShoppingCart }
]

const actionTypes = [
  { id: 'send_email', label: 'Envoyer email', icon: Mail },
  { id: 'send_sms', label: 'Envoyer SMS', icon: MessageSquare },
  { id: 'apply_discount', label: 'Appliquer remise', icon: Tag },
  { id: 'update_price', label: 'Modifier prix', icon: DollarSign },
  { id: 'add_tag', label: 'Ajouter tag', icon: Tag },
  { id: 'notify_team', label: 'Notifier équipe', icon: Users },
  { id: 'create_task', label: 'Créer tâche', icon: CheckCircle2 },
  { id: 'recommend_products', label: 'Recommander produits', icon: Sparkles },
  { id: 'show_popup', label: 'Afficher popup', icon: Eye },
  { id: 'add_to_bundle', label: 'Ajouter au bundle', icon: Package }
]

const mockRules: AutomationRule[] = [
  {
    id: '1',
    name: 'Récupération panier abandonné',
    description: 'Envoie un email de rappel 1h après abandon du panier avec une remise de 10%',
    status: 'active',
    trigger: {
      type: 'event',
      event: 'cart_abandoned',
      description: 'Panier abandonné depuis plus de 1 heure'
    },
    conditions: [
      { id: '1', field: 'cart_value', operator: '>=', value: 50 },
      { id: '2', field: 'customer_type', operator: '=', value: 'returning', connector: 'AND' }
    ],
    actions: [
      { id: '1', type: 'send_email', config: { template: 'cart_reminder', includeDiscount: true }, delay: 3600 },
      { id: '2', type: 'apply_discount', config: { type: 'percentage', value: 10, expiry: 24 }, delay: 0 }
    ],
    stats: { totalExecutions: 1250, successRate: 32.5, lastWeekExecutions: 156, revenue: 4850 },
    createdAt: '2024-01-01',
    lastTriggered: '2024-01-21T14:30:00'
  },
  {
    id: '2',
    name: 'Bienvenue nouveau client',
    description: 'Séquence d\'onboarding avec email de bienvenue et code promo premier achat',
    status: 'active',
    trigger: {
      type: 'event',
      event: 'customer_signup',
      description: 'Nouveau compte créé'
    },
    conditions: [
      { id: '1', field: 'email_verified', operator: '=', value: 'true' }
    ],
    actions: [
      { id: '1', type: 'send_email', config: { template: 'welcome' }, delay: 0 },
      { id: '2', type: 'apply_discount', config: { type: 'percentage', value: 15, code: 'WELCOME15' }, delay: 0 },
      { id: '3', type: 'add_tag', config: { tag: 'new_customer' }, delay: 0 }
    ],
    stats: { totalExecutions: 3420, successRate: 95.2, lastWeekExecutions: 234, revenue: 12500 },
    createdAt: '2023-12-15',
    lastTriggered: '2024-01-21T16:45:00'
  },
  {
    id: '3',
    name: 'Alerte stock critique',
    description: 'Notification équipe et réapprovisionnement automatique si stock < 10',
    status: 'active',
    trigger: {
      type: 'condition',
      description: 'Stock produit < seuil minimum'
    },
    conditions: [
      { id: '1', field: 'stock_quantity', operator: '<', value: 10 },
      { id: '2', field: 'product_status', operator: '=', value: 'active', connector: 'AND' }
    ],
    actions: [
      { id: '1', type: 'notify_team', config: { channel: 'slack', message: 'Stock critique détecté' }, delay: 0 },
      { id: '2', type: 'create_task', config: { type: 'restock', priority: 'high' }, delay: 0 }
    ],
    stats: { totalExecutions: 89, successRate: 100, lastWeekExecutions: 12, revenue: 0 },
    createdAt: '2024-01-10',
    lastTriggered: '2024-01-21T09:15:00'
  },
  {
    id: '4',
    name: 'Cross-sell accessoires tech',
    description: 'Recommande automatiquement des accessoires compatibles après achat d\'un produit tech',
    status: 'active',
    trigger: {
      type: 'event',
      event: 'cross_sell_opportunity',
      description: 'Achat produit catégorie Électronique'
    },
    conditions: [
      { id: '1', field: 'product_category', operator: '=', value: 'electronics' },
      { id: '2', field: 'order_value', operator: '>=', value: 100, connector: 'AND' },
      { id: '3', field: 'has_accessories', operator: '=', value: true, connector: 'AND' }
    ],
    actions: [
      { id: '1', type: 'recommend_products', config: { strategy: 'compatible_accessories', limit: 4, useAI: true }, delay: 0 },
      { id: '2', type: 'send_email', config: { template: 'cross_sell_accessories', personalized: true }, delay: 86400 },
      { id: '3', type: 'show_popup', config: { type: 'recommendation', position: 'bottom-right', delay: 5 }, delay: 0 }
    ],
    stats: { totalExecutions: 567, successRate: 28.4, lastWeekExecutions: 78, revenue: 3420 },
    createdAt: '2024-01-05',
    lastTriggered: '2024-01-21T11:30:00'
  },
  {
    id: '5',
    name: 'Upsell version premium',
    description: 'Propose une version premium ou un bundle amélioré pour les produits consultés',
    status: 'active',
    trigger: {
      type: 'event',
      event: 'upsell_opportunity',
      description: 'Client consulte un produit avec version premium disponible'
    },
    conditions: [
      { id: '1', field: 'has_premium_variant', operator: '=', value: true },
      { id: '2', field: 'customer_lifetime_value', operator: '>=', value: 200, connector: 'AND' },
      { id: '3', field: 'price_difference', operator: '<=', value: 50, connector: 'AND' }
    ],
    actions: [
      { id: '1', type: 'show_popup', config: { type: 'upsell_comparison', showSavings: true }, delay: 10 },
      { id: '2', type: 'apply_discount', config: { type: 'percentage', value: 5, target: 'premium_variant' }, delay: 0 },
      { id: '3', type: 'add_tag', config: { tag: 'upsell_candidate' }, delay: 0 }
    ],
    stats: { totalExecutions: 892, successRate: 18.7, lastWeekExecutions: 134, revenue: 5680 },
    createdAt: '2024-01-08',
    lastTriggered: '2024-01-21T15:22:00'
  },
  {
    id: '6',
    name: 'Cross-sell post-achat intelligent',
    description: 'Recommande des produits complémentaires 3 jours après achat basé sur l\'IA',
    status: 'active',
    trigger: {
      type: 'schedule',
      schedule: '3 days after order',
      description: '3 jours après commande livrée'
    },
    conditions: [
      { id: '1', field: 'order_status', operator: '=', value: 'delivered' },
      { id: '2', field: 'customer_satisfaction', operator: '>=', value: 4, connector: 'AND' }
    ],
    actions: [
      { id: '1', type: 'recommend_products', config: { strategy: 'ai_complementary', model: 'collaborative_filtering', limit: 6 }, delay: 0 },
      { id: '2', type: 'send_email', config: { template: 'post_purchase_recommendations', useAI: true, personalization: 'high' }, delay: 0 },
      { id: '3', type: 'apply_discount', config: { type: 'percentage', value: 10, code: 'THANKS10', expiry: 7 }, delay: 0 }
    ],
    stats: { totalExecutions: 1456, successRate: 24.3, lastWeekExecutions: 189, revenue: 8920 },
    createdAt: '2024-01-12',
    lastTriggered: '2024-01-21T08:00:00'
  },
  {
    id: '7',
    name: 'Bundle dynamique par catégorie',
    description: 'Crée et propose des bundles automatiques basés sur les achats fréquents',
    status: 'active',
    trigger: {
      type: 'event',
      event: 'product_category_match',
      description: 'Client ajoute un produit d\'une catégorie avec bundles disponibles'
    },
    conditions: [
      { id: '1', field: 'category_has_bundles', operator: '=', value: true },
      { id: '2', field: 'cart_items', operator: '>=', value: 2, connector: 'AND' }
    ],
    actions: [
      { id: '1', type: 'add_to_bundle', config: { strategy: 'frequently_bought_together', maxItems: 4 }, delay: 0 },
      { id: '2', type: 'apply_discount', config: { type: 'bundle_percentage', value: 15 }, delay: 0 },
      { id: '3', type: 'show_popup', config: { type: 'bundle_offer', savings: true, countdown: true }, delay: 3 }
    ],
    stats: { totalExecutions: 678, successRate: 35.2, lastWeekExecutions: 92, revenue: 6750 },
    createdAt: '2024-01-15',
    lastTriggered: '2024-01-21T14:45:00'
  },
  {
    id: '8',
    name: 'Repricing concurrentiel',
    description: 'Ajuste automatiquement les prix si un concurrent est moins cher',
    status: 'paused',
    trigger: {
      type: 'event',
      event: 'competitor_price_change',
      description: 'Prix concurrent détecté inférieur'
    },
    conditions: [
      { id: '1', field: 'price_difference', operator: '>', value: 5 },
      { id: '2', field: 'margin', operator: '>=', value: 15, connector: 'AND' }
    ],
    actions: [
      { id: '1', type: 'update_price', config: { strategy: 'match_competitor', margin_floor: 10 }, delay: 0 },
      { id: '2', type: 'notify_team', config: { message: 'Prix ajusté automatiquement' }, delay: 0 }
    ],
    stats: { totalExecutions: 234, successRate: 87.3, lastWeekExecutions: 0, revenue: 2100 },
    createdAt: '2024-01-05'
  },
  {
    id: '9',
    name: 'Cross-sell basé sur historique',
    description: 'Recommandations personnalisées basées sur l\'historique d\'achat du client',
    status: 'draft',
    trigger: {
      type: 'event',
      event: 'purchase_history',
      description: 'Client avec historique d\'achat > 3 commandes'
    },
    conditions: [
      { id: '1', field: 'order_count', operator: '>=', value: 3 },
      { id: '2', field: 'days_since_last_order', operator: '>=', value: 30, connector: 'AND' }
    ],
    actions: [
      { id: '1', type: 'recommend_products', config: { strategy: 'purchase_history_analysis', useAI: true }, delay: 0 },
      { id: '2', type: 'send_email', config: { template: 'personalized_recommendations' }, delay: 0 }
    ],
    stats: { totalExecutions: 0, successRate: 0, lastWeekExecutions: 0, revenue: 0 },
    createdAt: '2024-01-20'
  }
]

export function AdvancedRulesEngine() {
  const [rules, setRules] = useState<AutomationRule[]>(mockRules)
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newRule, setNewRule] = useState({
    name: '',
    triggerType: '',
    description: ''
  })

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => {
      if (r.id === ruleId) {
        const newStatus = r.status === 'active' ? 'paused' : 'active'
        toast.success(`Règle ${newStatus === 'active' ? 'activée' : 'mise en pause'}`)
        return { ...r, status: newStatus as 'active' | 'paused' }
      }
      return r
    }))
  }

  const handleDuplicateRule = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (rule) {
      const newRule: AutomationRule = {
        ...rule,
        id: Date.now().toString(),
        name: `${rule.name} (copie)`,
        status: 'draft',
        stats: { totalExecutions: 0, successRate: 0, lastWeekExecutions: 0, revenue: 0 },
        createdAt: new Date().toISOString().split('T')[0]
      }
      setRules(prev => [newRule, ...prev])
      toast.success('Règle dupliquée')
    }
  }

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId))
    toast.success('Règle supprimée')
  }

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.triggerType) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    const trigger = triggerTypes.find(t => t.id === newRule.triggerType)
    const rule: AutomationRule = {
      id: Date.now().toString(),
      name: newRule.name,
      description: newRule.description || 'Nouvelle règle d\'automatisation',
      status: 'draft',
      trigger: {
        type: 'event',
        event: newRule.triggerType,
        description: trigger?.label || ''
      },
      conditions: [],
      actions: [],
      stats: { totalExecutions: 0, successRate: 0, lastWeekExecutions: 0, revenue: 0 },
      createdAt: new Date().toISOString().split('T')[0]
    }

    setRules(prev => [rule, ...prev])
    setIsCreating(false)
    setNewRule({ name: '', triggerType: '', description: '' })
    toast.success('Règle créée, configurez les conditions et actions')
  }

  const getStatusBadge = (status: AutomationRule['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500">Actif</Badge>
      case 'paused':
        return <Badge className="bg-yellow-500/10 text-yellow-500">En pause</Badge>
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>
    }
  }

  const getTriggerIcon = (event?: string) => {
    const trigger = triggerTypes.find(t => t.id === event)
    return trigger?.icon || Zap
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" />
            Moteur de Règles Avancé
          </h2>
          <p className="text-muted-foreground">
            Automatisez vos actions marketing avec des règles conditionnelles
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Règles actives</p>
                <p className="text-2xl font-bold">{rules.filter(r => r.status === 'active').length}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exécutions (7j)</p>
                <p className="text-2xl font-bold">{rules.reduce((acc, r) => acc + r.stats.lastWeekExecutions, 0)}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux succès moyen</p>
                <p className="text-2xl font-bold">
                  {(rules.filter(r => r.stats.totalExecutions > 0).reduce((acc, r) => acc + r.stats.successRate, 0) / 
                   rules.filter(r => r.stats.totalExecutions > 0).length || 0).toFixed(1)}%
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenu généré</p>
                <p className="text-2xl font-bold">{rules.reduce((acc, r) => acc + r.stats.revenue, 0).toLocaleString()}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Rule Modal */}
      {isCreating && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Créer une nouvelle règle</CardTitle>
            <CardDescription>Définissez le déclencheur et les paramètres de base</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom de la règle</Label>
                <Input 
                  placeholder="Ex: Récupération panier abandonné"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Déclencheur</Label>
                <Select value={newRule.triggerType} onValueChange={(v) => setNewRule(prev => ({ ...prev, triggerType: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un déclencheur" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map(trigger => {
                      const Icon = trigger.icon
                      return (
                        <SelectItem key={trigger.id} value={trigger.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {trigger.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (optionnel)</Label>
              <Input 
                placeholder="Décrivez ce que fait cette règle"
                value={newRule.description}
                onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreating(false)}>Annuler</Button>
              <Button onClick={handleCreateRule}>Créer la règle</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Toutes ({rules.length})</TabsTrigger>
          <TabsTrigger value="active">Actives ({rules.filter(r => r.status === 'active').length})</TabsTrigger>
          <TabsTrigger value="paused">En pause ({rules.filter(r => r.status === 'paused').length})</TabsTrigger>
          <TabsTrigger value="draft">Brouillons ({rules.filter(r => r.status === 'draft').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {rules.map(rule => {
            const TriggerIcon = getTriggerIcon(rule.trigger.event)
            return (
              <Card key={rule.id} className={rule.status === 'active' ? 'border-green-500/30' : ''}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Rule Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <TriggerIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{rule.name}</h3>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                      </div>
                      
                      {/* Rule Flow Preview */}
                      <div className="flex items-center gap-2 flex-wrap mt-3">
                        <Badge variant="outline" className="bg-blue-500/10">
                          <Zap className="h-3 w-3 mr-1" />
                          {rule.trigger.description}
                        </Badge>
                        {rule.conditions.length > 0 && (
                          <>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline" className="bg-purple-500/10">
                              <Filter className="h-3 w-3 mr-1" />
                              {rule.conditions.length} condition{rule.conditions.length > 1 ? 's' : ''}
                            </Badge>
                          </>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="bg-green-500/10">
                          <Target className="h-3 w-3 mr-1" />
                          {rule.actions.length} action{rule.actions.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Exécutions</p>
                        <p className="font-semibold">{rule.stats.totalExecutions.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Succès</p>
                        <p className={`font-semibold ${rule.stats.successRate >= 80 ? 'text-green-500' : rule.stats.successRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {rule.stats.successRate}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Revenu</p>
                        <p className="font-semibold text-green-500">{rule.stats.revenue.toLocaleString()}€</p>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-2">
                        {getStatusBadge(rule.status)}
                        <Switch 
                          checked={rule.status === 'active'}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                        />
                        <Button size="icon" variant="ghost" onClick={() => setSelectedRule(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDuplicateRule(rule.id)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteRule(rule.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {rule.lastTriggered && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Dernière exécution: {new Date(rule.lastTriggered).toLocaleString('fr-FR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="active" className="space-y-4 mt-4">
          {rules.filter(r => r.status === 'active').map(rule => (
            <Card key={rule.id} className="border-green-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{rule.name}</h3>
                  <Badge className="bg-green-500/10 text-green-500">Actif</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="paused" className="space-y-4 mt-4">
          {rules.filter(r => r.status === 'paused').map(rule => (
            <Card key={rule.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{rule.name}</h3>
                  <Button size="sm" onClick={() => handleToggleRule(rule.id)}>
                    <Play className="h-4 w-4 mr-1" />
                    Réactiver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4 mt-4">
          {rules.filter(r => r.status === 'draft').map(rule => (
            <Card key={rule.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{rule.name}</h3>
                  <Button size="sm" onClick={() => setSelectedRule(rule)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Configurer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Available Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions disponibles</CardTitle>
          <CardDescription>Actions que vous pouvez automatiser dans vos règles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {actionTypes.map(action => {
              const Icon = action.icon
              return (
                <div 
                  key={action.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer text-center"
                >
                  <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium">{action.label}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
