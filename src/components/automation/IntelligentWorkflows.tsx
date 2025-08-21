import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Calendar,
  Clock,
  Target,
  Zap,
  Brain,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface WorkflowTrigger {
  type: 'schedule' | 'import' | 'stock_level' | 'price_change' | 'manual'
  config: Record<string, any>
}

interface WorkflowAction {
  type: 'optimize_seo' | 'update_prices' | 'send_notification' | 'categorize' | 'generate_content'
  config: Record<string, any>
}

interface AutomationWorkflow {
  id: string
  name: string
  description: string
  enabled: boolean
  trigger: WorkflowTrigger
  actions: WorkflowAction[]
  lastRun?: Date
  nextRun?: Date
  totalRuns: number
  successRate: number
}

export const IntelligentWorkflows = () => {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([
    {
      id: 'daily-optimization',
      name: 'Optimisation Quotidienne',
      description: 'Optimise automatiquement les produits chaque jour à 02:00',
      enabled: true,
      trigger: {
        type: 'schedule',
        config: { cron: '0 2 * * *', timezone: 'Europe/Paris' }
      },
      actions: [
        { type: 'optimize_seo', config: { regenerateTitle: true, updateKeywords: true } },
        { type: 'update_prices', config: { strategy: 'competitive', margin: 0.15 } }
      ],
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000),
      totalRuns: 45,
      successRate: 98
    },
    {
      id: 'new-import-processing',
      name: 'Traitement Nouveaux Imports',
      description: 'Traite automatiquement les nouveaux produits importés',
      enabled: true,
      trigger: {
        type: 'import',
        config: { minProducts: 1 }
      },
      actions: [
        { type: 'categorize', config: { aiConfidence: 0.8 } },
        { type: 'generate_content', config: { generateDescription: true, generateSEO: true } },
        { type: 'send_notification', config: { type: 'email', template: 'new_import' } }
      ],
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
      totalRuns: 12,
      successRate: 100
    },
    {
      id: 'stock-alerts',
      name: 'Alertes Stock Bas',
      description: 'Surveille les niveaux de stock et envoie des alertes',
      enabled: true,
      trigger: {
        type: 'stock_level',
        config: { threshold: 10 }
      },
      actions: [
        { type: 'send_notification', config: { type: 'slack', urgency: 'high' } },
        { type: 'update_prices', config: { strategy: 'increase', percentage: 5 } }
      ],
      lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000),
      totalRuns: 8,
      successRate: 87
    }
  ])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    triggerType: 'schedule' as const,
    actionTypes: [] as string[]
  })

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows(workflows.map(workflow =>
      workflow.id === workflowId
        ? { ...workflow, enabled: !workflow.enabled }
        : workflow
    ))

    const workflow = workflows.find(w => w.id === workflowId)
    toast.success(`Workflow "${workflow?.name}" ${workflow?.enabled ? 'désactivé' : 'activé'}`)
  }

  const runWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId)
    if (!workflow) return

    toast.info(`Exécution du workflow "${workflow.name}"...`)
    
    // Simuler l'exécution
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setWorkflows(workflows.map(w =>
      w.id === workflowId
        ? { ...w, lastRun: new Date(), totalRuns: w.totalRuns + 1 }
        : w
    ))

    toast.success(`Workflow "${workflow.name}" exécuté avec succès !`)
  }

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'schedule': return <Calendar className="w-4 h-4" />
      case 'import': return <Plus className="w-4 h-4" />
      case 'stock_level': return <TrendingUp className="w-4 h-4" />
      case 'price_change': return <Target className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (enabled: boolean, successRate: number) => {
    if (!enabled) return 'secondary'
    if (successRate >= 95) return 'default'
    if (successRate >= 80) return 'default'
    return 'destructive'
  }

  const formatNextRun = (date?: Date) => {
    if (!date) return 'Non programmé'
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diff < 0) return 'En retard'
    if (hours < 1) return `Dans ${minutes}min`
    if (hours < 24) return `Dans ${hours}h ${minutes}min`
    return date.toLocaleDateString('fr-FR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="w-6 h-6" />
            Workflows Intelligents
          </h2>
          <p className="text-gray-600 mt-1">
            Automatisez vos processus avec des workflows intelligents
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau Workflow
        </Button>
      </div>

      {/* Workflows existants */}
      <div className="grid grid-cols-1 gap-4">
        {workflows.map(workflow => (
          <Card key={workflow.id} className={`${workflow.enabled ? 'border-green-200 bg-green-50/30' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${workflow.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Workflow className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <p className="text-sm text-gray-600">{workflow.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={workflow.enabled}
                    onCheckedChange={() => toggleWorkflow(workflow.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runWorkflow(workflow.id)}
                    disabled={!workflow.enabled}
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Exécuter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">DÉCLENCHEUR</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getTriggerIcon(workflow.trigger.type)}
                    <span className="text-sm font-medium">
                      {workflow.trigger.type === 'schedule' && 'Planifié'}
                      {workflow.trigger.type === 'import' && 'Nouveau import'}
                      {workflow.trigger.type === 'stock_level' && 'Niveau de stock'}
                      {workflow.trigger.type === 'price_change' && 'Changement prix'}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">ACTIONS</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {workflow.actions.map((action, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {action.type.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">PROCHAINE EXÉCUTION</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{formatNextRun(workflow.nextRun)}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">PERFORMANCE</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getStatusColor(workflow.enabled, workflow.successRate)}>
                      {workflow.successRate}% ({workflow.totalRuns} runs)
                    </Badge>
                  </div>
                </div>
              </div>

              {workflow.lastRun && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  Dernière exécution : {workflow.lastRun.toLocaleDateString('fr-FR')} à {workflow.lastRun.toLocaleTimeString('fr-FR')}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Créer un Nouveau Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom du workflow</Label>
                <Input
                  id="name"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Mon workflow automatique"
                />
              </div>

              <div>
                <Label htmlFor="trigger">Type de déclencheur</Label>
                <Select value={newWorkflow.triggerType} onValueChange={(value: any) => setNewWorkflow(prev => ({ ...prev, triggerType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule">Planifié</SelectItem>
                    <SelectItem value="import">Nouveau import</SelectItem>
                    <SelectItem value="stock_level">Niveau de stock</SelectItem>
                    <SelectItem value="price_change">Changement de prix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez ce que fait ce workflow..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={() => setShowCreateForm(false)} variant="outline">
                Annuler
              </Button>
              <Button
                onClick={() => {
                  toast.success('Workflow créé avec succès !')
                  setShowCreateForm(false)
                  setNewWorkflow({ name: '', description: '', triggerType: 'schedule', actionTypes: [] })
                }}
                disabled={!newWorkflow.name || !newWorkflow.description}
              >
                Créer le Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métriques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Workflows Actifs</p>
                <p className="text-2xl font-bold">{workflows.filter(w => w.enabled).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Exécutions Totales</p>
                <p className="text-2xl font-bold">{workflows.reduce((sum, w) => sum + w.totalRuns, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taux de Réussite</p>
                <p className="text-2xl font-bold">
                  {Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}