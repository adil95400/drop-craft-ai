import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Zap, Settings, Play, Pause, BarChart3, Clock, CheckCircle,
  AlertTriangle, Mail, RefreshCw, Package, DollarSign, 
  Users, ArrowRight, Plus, Edit, Trash2, Activity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { orderAutomationService, type AutomationRule, type AutomationAction, type OrderAutomationJob } from '@/services/OrderAutomationService'

export function OrderAutomationCenter() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [jobs, setJobs] = useState<OrderAutomationJob[]>([])
  const [stats, setStats] = useState({
    total_rules: 0,
    active_rules: 0,
    jobs_completed_today: 0,
    success_rate: 0,
    time_saved_hours: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAutomationData()
  }, [])

  const loadAutomationData = async () => {
    try {
      setLoading(true)
      const [rulesData, jobsData, statsData] = await Promise.all([
        orderAutomationService.getAutomationRules(),
        orderAutomationService.getAutomationJobs(),
        orderAutomationService.getAutomationStats()
      ])

      setRules(rulesData)
      setJobs(jobsData)
      setStats(statsData)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'automatisation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await orderAutomationService.toggleAutomationRule(ruleId, isActive)
      await loadAutomationData()
      toast({
        title: "Règle mise à jour",
        description: `Automatisation ${isActive ? 'activée' : 'désactivée'}`
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la règle",
        variant: "destructive"
      })
    }
  }

  const getTriggerLabel = (triggerType: string) => {
    const labels = {
      'order_placed': 'Commande placée',
      'stock_low': 'Stock faible',
      'payment_received': 'Paiement reçu',
      'shipping_delay': 'Retard de livraison'
    }
    return labels[triggerType as keyof typeof labels] || triggerType
  }

  const getActionIcon = (actionType: string) => {
    const icons = {
      'send_email': Mail,
      'update_stock': Package,
      'notify_supplier': Users,
      'create_support_ticket': AlertTriangle,
      'apply_discount': DollarSign,
      'auto_refund': RefreshCw
    }
    return icons[actionType as keyof typeof icons] || Settings
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success bg-success/10'
      case 'processing': return 'text-info bg-info/10'
      case 'failed': return 'text-destructive bg-destructive/10'
      default: return 'text-warning bg-warning/10'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Centre d'Automatisation</h2>
          <p className="text-muted-foreground">
            Automatisation 24/7 des commandes et processus métier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadAutomationData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Règle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <CreateAutomationRuleDialog 
                onSuccess={() => {
                  setShowCreateDialog(false)
                  loadAutomationData()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-info" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Règles Totales</p>
                <p className="text-2xl font-bold">{stats.total_rules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-success" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Règles Actives</p>
                <p className="text-2xl font-bold">{stats.active_rules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-primary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Jobs Aujourd'hui</p>
                <p className="text-2xl font-bold">{stats.jobs_completed_today}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-success" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Taux de Réussite</p>
                <p className="text-2xl font-bold">{stats.success_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-warning" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Temps Économisé</p>
                <p className="text-2xl font-bold">{stats.time_saved_hours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Règles d'Automatisation</TabsTrigger>
          <TabsTrigger value="jobs">Jobs en Cours</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <AutomationRuleCard 
                key={rule.id}
                rule={rule}
                onToggle={handleToggleRule}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jobs d'Automatisation Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs.slice(0, 10).map((job) => (
                  <JobStatusCard key={job.id} job={job} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance des Règles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rules.slice(0, 5).map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {rule.execution_count} exécutions
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={rule.success_rate} className="w-20" />
                        <span className="text-sm font-medium">{rule.success_rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Types d'Actions Populaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: 'send_email', count: 245, percentage: 45 },
                    { type: 'update_stock', count: 189, percentage: 35 },
                    { type: 'notify_supplier', count: 78, percentage: 15 },
                    { type: 'auto_refund', count: 32, percentage: 5 }
                  ].map((action) => {
                    const Icon = getActionIcon(action.type)
                    return (
                      <div key={action.type} className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{action.type}</span>
                            <span className="text-sm text-muted-foreground">{action.count}</span>
                          </div>
                          <Progress value={action.percentage} className="h-2 mt-1" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AutomationRuleCard({ 
  rule, 
  onToggle 
}: { 
  rule: AutomationRule
  onToggle: (id: string, active: boolean) => void 
}) {
  const getTriggerLabel = (triggerType: string) => {
    const labels = {
      'order_placed': 'Commande placée',
      'stock_low': 'Stock faible', 
      'payment_received': 'Paiement reçu',
      'shipping_delay': 'Retard de livraison'
    }
    return labels[triggerType as keyof typeof labels] || triggerType
  }

  const getActionIcon = (actionType: string) => {
    const icons = {
      'send_email': Mail,
      'update_stock': Package,
      'notify_supplier': Users,
      'create_support_ticket': AlertTriangle,
      'apply_discount': DollarSign,
      'auto_refund': RefreshCw
    }
    return icons[actionType as keyof typeof icons] || Settings
  }

  return (
    <Card className={`border-l-4 ${rule.is_active ? 'border-l-success' : 'border-l-border'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{rule.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Déclencheur: {getTriggerLabel(rule.trigger_type)}
            </p>
          </div>
          <Switch
            checked={rule.is_active}
            onCheckedChange={(checked) => onToggle(rule.id, checked)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Actions */}
        <div>
          <p className="text-sm font-medium mb-2">Actions ({rule.actions.length})</p>
          <div className="flex flex-wrap gap-2">
            {rule.actions.slice(0, 3).map((action, index) => {
              const Icon = getActionIcon(action.type)
              return (
                <Badge key={index} variant="outline" className="flex items-center">
                  <Icon className="h-3 w-3 mr-1" />
                  {action.type}
                </Badge>
              )
            })}
            {rule.actions.length > 3 && (
              <Badge variant="outline">+{rule.actions.length - 3}</Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Exécutions</p>
            <p className="font-bold text-lg">{rule.execution_count}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Taux de réussite</p>
            <p className="font-bold text-lg">{rule.success_rate}%</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-1" />
              Stats
            </Button>
          </div>
          {rule.last_executed_at && (
            <p className="text-xs text-muted-foreground">
              Dernière exécution: {new Date(rule.last_executed_at).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function JobStatusCard({ job }: { job: OrderAutomationJob }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success bg-success/10'
      case 'processing': return 'text-info bg-info/10'
      case 'failed': return 'text-destructive bg-destructive/10'
      default: return 'text-warning bg-warning/10'
    }
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        <Badge className={getStatusColor(job.status)}>
          {job.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
          {job.status === 'processing' && <Clock className="h-3 w-3 mr-1" />}
          {job.status === 'failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
          {job.status}
        </Badge>
        <div>
          <p className="font-medium">Job #{job.id.slice(0, 8)}</p>
          <p className="text-sm text-muted-foreground">
            Commande: {job.order_id.slice(0, 8)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">
          {job.actions_executed}/{job.total_actions} actions
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(job.scheduled_at).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

function CreateAutomationRuleDialog({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'order_placed',
    conditions: {},
    actions: [] as AutomationAction[],
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || formData.actions.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      await orderAutomationService.createAutomationRule(formData)
      toast({
        title: "Règle créée",
        description: "La règle d'automatisation a été créée avec succès"
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la règle",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, {
        type: 'send_email',
        config: {},
        delay_minutes: 0
      }]
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Créer une Règle d'Automatisation</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nom de la règle</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Envoi email confirmation commande"
          />
        </div>

        <div>
          <Label htmlFor="trigger">Déclencheur</Label>
          <Select 
            value={formData.trigger_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order_placed">Commande placée</SelectItem>
              <SelectItem value="stock_low">Stock faible</SelectItem>
              <SelectItem value="payment_received">Paiement reçu</SelectItem>
              <SelectItem value="shipping_delay">Retard de livraison</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Actions ({formData.actions.length})</Label>
            <Button type="button" variant="outline" size="sm" onClick={addAction}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter Action
            </Button>
          </div>
          {formData.actions.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune action configurée</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
          <Label htmlFor="active">Activer la règle immédiatement</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Créer la Règle'}
        </Button>
      </div>
    </form>
  )
}