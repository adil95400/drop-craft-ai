import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit, 
  Play, 
  Pause,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Loader2,
  Zap,
  RefreshCw
} from 'lucide-react'
import { usePricingRules } from '@/hooks/usePricingRules'
import { PageLoading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'

const RULE_TYPES: Record<string, { label: string; icon: typeof TrendingUp; color: string }> = {
  margin_based: { label: 'Basé sur la marge', icon: TrendingUp, color: 'text-green-600' },
  competitor_based: { label: 'Concurrentiel', icon: BarChart3, color: 'text-blue-600' },
  cost_plus: { label: 'Coût + marge', icon: DollarSign, color: 'text-purple-600' },
  stock_based: { label: 'Basé sur le stock', icon: TrendingDown, color: 'text-orange-600' },
  time_based: { label: 'Temporel', icon: Settings, color: 'text-pink-600' }
}

export function RepricingDashboard() {
  const { 
    rules, 
    stats, 
    isLoading, 
    createRule, 
    updateRule, 
    deleteRule, 
    applyRule,
    applyAllRules,
    isApplying 
  } = usePricingRules()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  if (isLoading) {
    return <PageLoading text="Chargement des règles de prix..." />
  }

  const activeRules = rules.filter(r => r.is_active)
  const inactiveRules = rules.filter(r => !r.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Repricing Dynamique</h2>
          <p className="text-muted-foreground">Automatisez vos ajustements de prix intelligemment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => applyAllRules()} disabled={isApplying}>
            {isApplying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Appliquer toutes
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle règle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer une règle de prix</DialogTitle>
                <DialogDescription>
                  Définissez les conditions et actions pour ajuster automatiquement vos prix
                </DialogDescription>
              </DialogHeader>
              <CreateRuleForm 
                onSubmit={(data) => {
                  createRule(data, {
                    onSuccess: () => setIsCreateOpen(false)
                  })
                }}
                isSubmitting={false}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Règles</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRules}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeRules}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modifications récentes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentChanges}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs actifs</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Actives ({activeRules.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactives ({inactiveRules.length})</TabsTrigger>
          <TabsTrigger value="all">Toutes ({rules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <RulesList 
            rules={activeRules} 
            onToggle={(id, is_active) => updateRule({ id, is_active })}
            onDelete={deleteRule}
            onApply={(id) => applyRule({ rule_id: id, apply_to_all: true })}
            isApplying={isApplying}
          />
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <RulesList 
            rules={inactiveRules} 
            onToggle={(id, is_active) => updateRule({ id, is_active })}
            onDelete={deleteRule}
            onApply={(id) => applyRule({ rule_id: id, apply_to_all: true })}
            isApplying={isApplying}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <RulesList 
            rules={rules} 
            onToggle={(id, is_active) => updateRule({ id, is_active })}
            onDelete={deleteRule}
            onApply={(id) => applyRule({ rule_id: id, apply_to_all: true })}
            isApplying={isApplying}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RulesList({ 
  rules, 
  onToggle, 
  onDelete,
  onApply,
  isApplying
}: { 
  rules: any[]
  onToggle: (id: string, is_active: boolean) => void
  onDelete: (id: string) => void
  onApply: (id: string) => void
  isApplying: boolean
}) {
  if (rules.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <EmptyState
            icon={DollarSign}
            title="Aucune règle"
            description="Créez votre première règle de repricing pour automatiser vos prix"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => {
        const typeConfig = RULE_TYPES[rule.rule_type] || RULE_TYPES.margin_based
        const TypeIcon = typeConfig.icon

        return (
          <Card key={rule.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center ${typeConfig.color}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{rule.name}</span>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{typeConfig.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rule.description || `Priorité: ${rule.priority} • ${rule.products_affected || 0} produits • ${rule.execution_count || 0} exécutions`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {rule.target_margin && (
                    <div className="text-right">
                      <p className="text-sm font-medium">Marge cible</p>
                      <p className="text-lg font-bold text-green-600">{rule.target_margin}%</p>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onApply(rule.id)}
                    disabled={isApplying}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Appliquer
                  </Button>

                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) => onToggle(rule.id, checked)}
                  />

                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      if (confirm('Supprimer cette règle ?')) {
                        onDelete(rule.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function CreateRuleForm({ 
  onSubmit, 
  isSubmitting 
}: { 
  onSubmit: (data: any) => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'margin_based',
    conditions: {},
    actions: {},
    is_active: true,
    priority: 0,
    min_price: null as number | null,
    max_price: null as number | null,
    target_margin: null as number | null
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.rule_type) return

    onSubmit({
      name: formData.name,
      description: formData.description || null,
      rule_type: formData.rule_type,
      conditions: formData.conditions,
      actions: formData.actions,
      min_price: formData.min_price,
      max_price: formData.max_price,
      target_margin: formData.target_margin,
      is_active: formData.is_active,
      priority: formData.priority
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom de la règle *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Marge minimum 20%"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rule_type">Type de règle</Label>
          <Select 
            value={formData.rule_type} 
            onValueChange={(v) => setFormData({ ...formData, rule_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RULE_TYPES).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description optionnelle..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target_margin">Marge cible (%)</Label>
          <Input
            id="target_margin"
            type="number"
            step="0.1"
            value={formData.target_margin ?? ''}
            onChange={(e) => setFormData({ ...formData, target_margin: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_price">Prix minimum (€)</Label>
          <Input
            id="min_price"
            type="number"
            step="0.01"
            value={formData.min_price ?? ''}
            onChange={(e) => setFormData({ ...formData, min_price: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_price">Prix maximum (€)</Label>
          <Input
            id="max_price"
            type="number"
            step="0.01"
            value={formData.max_price ?? ''}
            onChange={(e) => setFormData({ ...formData, max_price: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="9999"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priorité (plus élevée = appliquée en premier)</Label>
        <Input
          id="priority"
          type="number"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="submit" disabled={isSubmitting || !formData.name}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Créer la règle
        </Button>
      </div>
    </form>
  )
}
