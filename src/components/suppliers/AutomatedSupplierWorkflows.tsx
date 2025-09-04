import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Zap,
  Play,
  Pause,
  Settings,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Package,
  DollarSign,
  Bell,
  Mail,
  Webhook,
  Filter,
  ArrowRight,
  Edit
} from 'lucide-react'
import { toast } from 'sonner'

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: {
    type: 'schedule' | 'event' | 'condition'
    config: any
  }
  conditions: Array<{
    field: string
    operator: string
    value: any
  }>
  actions: Array<{
    type: string
    config: any
  }>
  isActive: boolean
  lastExecuted?: Date
  executionCount: number
  successRate: number
  supplierId?: string
  supplierName?: string
}

const mockAutomations: AutomationRule[] = [
  {
    id: '1',
    name: 'Sync Quotidien AliExpress',
    description: 'Synchronise automatiquement les produits AliExpress chaque matin',
    trigger: {
      type: 'schedule',
      config: { cron: '0 9 * * *', timezone: 'Europe/Paris' }
    },
    conditions: [
      { field: 'supplier_status', operator: 'equals', value: 'active' },
      { field: 'last_sync', operator: 'older_than', value: '24h' }
    ],
    actions: [
      { type: 'sync_products', config: { limit: 500, categories: ['electronics'] } },
      { type: 'send_notification', config: { email: true, slack: false } }
    ],
    isActive: true,
    lastExecuted: new Date(Date.now() - 3600000),
    executionCount: 127,
    successRate: 94.5,
    supplierId: 'aliexpress',
    supplierName: 'AliExpress'
  },
  {
    id: '2',
    name: 'Alerte Stock Faible',
    description: 'Notifie quand le stock d\'un produit devient faible chez un fournisseur',
    trigger: {
      type: 'condition',
      config: { check_interval: '1h' }
    },
    conditions: [
      { field: 'stock_quantity', operator: 'less_than', value: 10 },
      { field: 'product_status', operator: 'equals', value: 'active' }
    ],
    actions: [
      { type: 'create_alert', config: { priority: 'high', notify_admin: true } },
      { type: 'webhook', config: { url: 'https://app.example.com/webhooks/low-stock' } }
    ],
    isActive: true,
    lastExecuted: new Date(Date.now() - 1800000),
    executionCount: 43,
    successRate: 100,
    supplierId: 'bigbuy',
    supplierName: 'BigBuy'
  },
  {
    id: '3',
    name: 'Prix Concurrent Dynamique',
    description: 'Met à jour automatiquement les prix basés sur la concurrence',
    trigger: {
      type: 'schedule',
      config: { cron: '0 */4 * * *', timezone: 'Europe/Paris' }
    },
    conditions: [
      { field: 'competitor_price_change', operator: 'greater_than', value: 5 },
      { field: 'profit_margin', operator: 'greater_than', value: 15 }
    ],
    actions: [
      { type: 'update_pricing', config: { strategy: 'competitive', margin_min: 10 } },
      { type: 'log_price_change', config: { track_history: true } }
    ],
    isActive: false,
    lastExecuted: new Date(Date.now() - 86400000),
    executionCount: 89,
    successRate: 87.6,
    supplierId: 'printful',
    supplierName: 'Printful'
  },
  {
    id: '4',
    name: 'Rapport Performance Hebdomadaire',
    description: 'Génère et envoie un rapport de performance des fournisseurs',
    trigger: {
      type: 'schedule',
      config: { cron: '0 10 * * 1', timezone: 'Europe/Paris' }
    },
    conditions: [],
    actions: [
      { type: 'generate_report', config: { type: 'supplier_performance', format: 'pdf' } },
      { type: 'send_email', config: { recipients: ['admin@example.com'], template: 'weekly_report' } }
    ],
    isActive: true,
    lastExecuted: new Date(Date.now() - 518400000),
    executionCount: 12,
    successRate: 100,
    supplierId: null,
    supplierName: 'Tous'
  }
]

const triggerTypes = [
  { value: 'schedule', label: 'Planifié', icon: Clock },
  { value: 'event', label: 'Événement', icon: Zap },
  { value: 'condition', label: 'Condition', icon: Target }
]

const actionTypes = [
  { value: 'sync_products', label: 'Synchroniser Produits', icon: RefreshCw },
  { value: 'update_pricing', label: 'Mettre à Jour Prix', icon: DollarSign },
  { value: 'send_notification', label: 'Envoyer Notification', icon: Bell },
  { value: 'send_email', label: 'Envoyer Email', icon: Mail },
  { value: 'webhook', label: 'Webhook', icon: Webhook },
  { value: 'create_alert', label: 'Créer Alerte', icon: AlertTriangle }
]

export const AutomatedSupplierWorkflows = () => {
  const [automations, setAutomations] = useState<AutomationRule[]>(mockAutomations)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(automation => 
      automation.id === id 
        ? { ...automation, isActive: !automation.isActive }
        : automation
    ))
    
    const automation = automations.find(a => a.id === id)
    toast.success(
      `Automation "${automation?.name}" ${automation?.isActive ? 'désactivée' : 'activée'}`
    )
  }

  const executeAutomation = async (id: string) => {
    const automation = automations.find(a => a.id === id)
    if (!automation) return

    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          setAutomations(prev => prev.map(a => 
            a.id === id 
              ? { ...a, lastExecuted: new Date(), executionCount: a.executionCount + 1 }
              : a
          ))
          resolve('success')
        }, 2000)
      }),
      {
        loading: `Exécution de "${automation.name}"...`,
        success: 'Automation exécutée avec succès',
        error: 'Erreur lors de l\'exécution'
      }
    )
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600'
    if (rate >= 85) return 'text-orange-600'
    return 'text-red-600'
  }

  const getTriggerIcon = (type: string) => {
    const triggerType = triggerTypes.find(t => t.value === type)
    return triggerType ? <triggerType.icon className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const formatLastExecuted = (date?: Date) => {
    if (!date) return 'Jamais'
    const diff = Date.now() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `il y a ${days}j`
    if (hours > 0) return `il y a ${hours}h`
    return 'Récemment'
  }

  const activeAutomations = automations.filter(a => a.isActive).length
  const totalExecutions = automations.reduce((sum, a) => sum + a.executionCount, 0)
  const avgSuccessRate = automations.reduce((sum, a) => sum + a.successRate, 0) / automations.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Workflows Automatisés
          </h2>
          <p className="text-muted-foreground">
            Automatisez vos processus de gestion des fournisseurs
          </p>
        </div>
        
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Play className="w-4 h-4" />
          Nouvelle Automation
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Automations Actives</p>
                <p className="text-2xl font-bold">{activeAutomations}/{automations.length}</p>
              </div>
              <Zap className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exécutions Totales</p>
                <p className="text-2xl font-bold">{totalExecutions}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de Succès Moy.</p>
                <p className={`text-2xl font-bold ${getSuccessRateColor(avgSuccessRate)}`}>
                  {avgSuccessRate.toFixed(1)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temps Économisé</p>
                <p className="text-2xl font-bold">24h</p>
                <p className="text-xs text-green-600">Cette semaine</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        {automations.map((automation) => (
          <Card key={automation.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {getTriggerIcon(automation.trigger.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{automation.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {automation.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {automation.supplierName}
                      </Badge>
                      <Badge className={getStatusColor(automation.isActive)}>
                        {automation.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={automation.isActive}
                    onCheckedChange={() => toggleAutomation(automation.id)}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-sm text-muted-foreground">Dernière Exécution</p>
                  <p className="font-medium">{formatLastExecuted(automation.lastExecuted)}</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-sm text-muted-foreground">Exécutions</p>
                  <p className="font-medium">{automation.executionCount}</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-sm text-muted-foreground">Taux de Succès</p>
                  <p className={`font-medium ${getSuccessRateColor(automation.successRate)}`}>
                    {automation.successRate}%
                  </p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">
                    {triggerTypes.find(t => t.value === automation.trigger.type)?.label}
                  </p>
                </div>
              </div>

              {/* Workflow Preview */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-medium mb-3">Workflow</h4>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {getTriggerIcon(automation.trigger.type)}
                    <span>Trigger</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  
                  {automation.conditions.length > 0 && (
                    <>
                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded">
                        <Filter className="w-3 h-3" />
                        <span>{automation.conditions.length} condition(s)</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </>
                  )}
                  
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded">
                    <Zap className="w-3 h-3" />
                    <span>{automation.actions.length} action(s)</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  {automation.actions.map((action, index) => (
                    <span key={index}>
                      {actionTypes.find(t => t.value === action.type)?.label}
                      {index < automation.actions.length - 1 && ', '}
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingId(automation.id)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => executeAutomation(automation.id)}
                    disabled={!automation.isActive}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Exécuter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create New Automation Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle Automation</CardTitle>
            <CardDescription>
              Créez une nouvelle règle d'automatisation pour vos fournisseurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom de l'automation</Label>
                <Input id="name" placeholder="Ex: Sync quotidien produits" />
              </div>
              <div>
                <Label htmlFor="supplier">Fournisseur</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les fournisseurs</SelectItem>
                    <SelectItem value="aliexpress">AliExpress</SelectItem>
                    <SelectItem value="bigbuy">BigBuy</SelectItem>
                    <SelectItem value="printful">Printful</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Décrivez ce que fait cette automation..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trigger">Type de déclencheur</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un déclencheur" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map(trigger => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        {trigger.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="action">Action principale</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une action" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map(action => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Annuler
              </Button>
              <Button onClick={() => {
                toast.success('Automation créée avec succès')
                setIsCreating(false)
              }}>
                Créer l'Automation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {automations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune Automation</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre première automation pour gagner du temps
            </p>
            <Button onClick={() => setIsCreating(true)}>
              Créer une Automation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}