import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Workflow, Plus, Search, MoreVertical, Copy, Trash2, Edit, Play, Pause,
  Loader2, ShoppingCart, Gift, UserPlus, Clock, Mail, MessageSquare,
  GitBranch, Zap, ArrowRight, Settings, BarChart3, Users
} from 'lucide-react'
import { useAutomationFlows, AutomationFlow, AutomationStep } from '@/hooks/useAutomationFlows'
import { useEmailTemplates } from '@/hooks/useEmailTemplates'

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  cart_abandonment: <ShoppingCart className="h-4 w-4" />,
  post_purchase: <Gift className="h-4 w-4" />,
  welcome: <UserPlus className="h-4 w-4" />,
  birthday: <Gift className="h-4 w-4" />,
  inactive: <Clock className="h-4 w-4" />,
  custom: <Settings className="h-4 w-4" />,
  product_view: <Zap className="h-4 w-4" />,
  order_status: <GitBranch className="h-4 w-4" />
}

export function AutomationFlowBuilder() {
  const { flows, stats, isLoading, createFlow, updateFlow, deleteFlow, duplicateFlow, toggleFlowStatus, TRIGGER_LABELS } = useAutomationFlows()
  const { templates } = useEmailTemplates()
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showBuilderDialog, setShowBuilderDialog] = useState(false)
  const [selectedFlow, setSelectedFlow] = useState<AutomationFlow | null>(null)
  const [newFlow, setNewFlow] = useState({
    name: '',
    description: '',
    trigger_type: 'cart_abandonment' as AutomationFlow['trigger_type'],
    trigger_config: {} as Record<string, any>
  })

  const filteredFlows = flows.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = () => {
    if (!newFlow.name || !newFlow.trigger_type) return
    createFlow({
      name: newFlow.name,
      description: newFlow.description,
      trigger_type: newFlow.trigger_type,
      trigger_config: newFlow.trigger_config,
      steps: []
    })
    setShowCreateDialog(false)
    setNewFlow({ name: '', description: '', trigger_type: 'cart_abandonment', trigger_config: {} })
  }

  const handleAddStep = (flowId: string, stepType: AutomationStep['type']) => {
    const flow = flows.find(f => f.id === flowId)
    if (!flow) return

    const newStep: AutomationStep = {
      id: crypto.randomUUID(),
      type: stepType,
      name: stepType === 'email' ? 'Envoyer un email' : 
            stepType === 'sms' ? 'Envoyer un SMS' :
            stepType === 'wait' ? 'Attendre' :
            stepType === 'condition' ? 'Condition' : 'Action',
      config: stepType === 'wait' ? { delay: 1, unit: 'hours' } : {},
      position: { x: 0, y: flow.steps.length * 100 }
    }

    updateFlow({
      id: flowId,
      steps: [...flow.steps, newStep]
    })
  }

  const handleRemoveStep = (flowId: string, stepId: string) => {
    const flow = flows.find(f => f.id === flowId)
    if (!flow) return

    updateFlow({
      id: flowId,
      steps: flow.steps.filter(s => s.id !== stepId)
    })
  }

  const handleUpdateStep = (flowId: string, stepId: string, updates: Partial<AutomationStep>) => {
    const flow = flows.find(f => f.id === flowId)
    if (!flow) return

    updateFlow({
      id: flowId,
      steps: flow.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Workflow className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Automations</p>
                <p className="text-2xl font-bold">{stats.totalFlows}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Play className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actives</p>
                <p className="text-2xl font-bold">{stats.activeFlows}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacts entrés</p>
                <p className="text-2xl font-bold">{stats.totalEntered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux conversion</p>
                <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Automation
        </Button>
      </div>

      {/* Flows List */}
      <div className="space-y-4">
        {filteredFlows.length === 0 ? (
          <Card className="p-8 text-center">
            <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune automation configurée</p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une automation
            </Button>
          </Card>
        ) : (
          filteredFlows.map((flow) => (
            <FlowCard 
              key={flow.id}
              flow={flow}
              triggerLabels={TRIGGER_LABELS}
              onEdit={() => { setSelectedFlow(flow); setShowBuilderDialog(true) }}
              onDuplicate={() => duplicateFlow(flow.id)}
              onDelete={() => deleteFlow(flow.id)}
              onToggle={(active) => toggleFlowStatus({ id: flow.id, status: active ? 'active' : 'paused' })}
            />
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle Automation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de l'automation</Label>
              <Input 
                placeholder="Ex: Relance panier abandonné"
                value={newFlow.name}
                onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Description de l'automation..."
                value={newFlow.description}
                onChange={(e) => setNewFlow({ ...newFlow, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Déclencheur</Label>
              <Select 
                value={newFlow.trigger_type} 
                onValueChange={(v: AutomationFlow['trigger_type']) => setNewFlow({ ...newFlow, trigger_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {TRIGGER_ICONS[key]}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trigger Config based on type */}
            {newFlow.trigger_type === 'cart_abandonment' && (
              <div className="space-y-2">
                <Label>Délai avant déclenchement</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number"
                    value={newFlow.trigger_config.delay || 1}
                    onChange={(e) => setNewFlow({ 
                      ...newFlow, 
                      trigger_config: { ...newFlow.trigger_config, delay: parseInt(e.target.value) }
                    })}
                    className="w-20"
                  />
                  <Select 
                    value={newFlow.trigger_config.unit || 'hours'}
                    onValueChange={(v) => setNewFlow({ 
                      ...newFlow, 
                      trigger_config: { ...newFlow.trigger_config, unit: v }
                    })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Heures</SelectItem>
                      <SelectItem value="days">Jours</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">après l'abandon</span>
                </div>
              </div>
            )}

            {newFlow.trigger_type === 'inactive' && (
              <div className="space-y-2">
                <Label>Période d'inactivité</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number"
                    value={newFlow.trigger_config.days || 30}
                    onChange={(e) => setNewFlow({ 
                      ...newFlow, 
                      trigger_config: { ...newFlow.trigger_config, days: parseInt(e.target.value) }
                    })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">jours sans activité</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={!newFlow.name}>
              Créer l'automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flow Builder Dialog */}
      <Dialog open={showBuilderDialog} onOpenChange={setShowBuilderDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Éditer: {selectedFlow?.name}</DialogTitle>
          </DialogHeader>
          {selectedFlow && (
            <div className="py-4">
              {/* Trigger */}
              <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg mb-4">
                <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                  {TRIGGER_ICONS[selectedFlow.trigger_type]}
                </div>
                <div>
                  <p className="font-medium">Déclencheur: {TRIGGER_LABELS[selectedFlow.trigger_type]}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFlow.trigger_type === 'cart_abandonment' && 
                      `${selectedFlow.trigger_config.delay || 1} ${selectedFlow.trigger_config.unit || 'heures'} après l'abandon`}
                    {selectedFlow.trigger_type === 'inactive' && 
                      `${selectedFlow.trigger_config.days || 30} jours sans activité`}
                    {selectedFlow.trigger_type === 'welcome' && 'Dès l\'inscription'}
                    {selectedFlow.trigger_type === 'post_purchase' && 'Après chaque achat'}
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {selectedFlow.steps.map((step, index) => (
                  <div key={step.id} className="relative">
                    {index > 0 && (
                      <div className="absolute left-6 -top-3 h-3 w-0.5 bg-border" />
                    )}
                    <StepCard 
                      step={step}
                      templates={templates}
                      onUpdate={(updates) => handleUpdateStep(selectedFlow.id, step.id, updates)}
                      onRemove={() => handleRemoveStep(selectedFlow.id, step.id)}
                    />
                    <div className="absolute left-6 -bottom-3 h-3 w-0.5 bg-border" />
                  </div>
                ))}
              </div>

              {/* Add Step */}
              <div className="flex items-center gap-2 mt-6">
                <Button variant="outline" size="sm" onClick={() => handleAddStep(selectedFlow.id, 'email')}>
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddStep(selectedFlow.id, 'sms')}>
                  <MessageSquare className="h-4 w-4 mr-1" />
                  SMS
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddStep(selectedFlow.id, 'wait')}>
                  <Clock className="h-4 w-4 mr-1" />
                  Délai
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddStep(selectedFlow.id, 'condition')}>
                  <GitBranch className="h-4 w-4 mr-1" />
                  Condition
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuilderDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface FlowCardProps {
  flow: AutomationFlow
  triggerLabels: Record<string, string>
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggle: (active: boolean) => void
}

function FlowCard({ flow, triggerLabels, onEdit, onDuplicate, onDelete, onToggle }: FlowCardProps) {
  const triggerIcon = TRIGGER_ICONS[flow.trigger_type] || <Zap className="h-4 w-4" />
  const triggerLabel = triggerLabels[flow.trigger_type] || flow.trigger_type

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            {triggerIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{flow.name}</h4>
              <Badge variant={flow.status === 'active' ? 'default' : 'secondary'}>
                {flow.status === 'active' ? 'Actif' : flow.status === 'paused' ? 'En pause' : 'Brouillon'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{flow.description || triggerLabel}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span>{flow.steps.length} étape(s)</span>
              <span>{flow.stats?.entered || 0} entrés</span>
              <span>{flow.stats?.completed || 0} terminés</span>
              <span>{flow.stats?.converted || 0} convertis</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              checked={flow.status === 'active'}
              onCheckedChange={onToggle}
            />
            <span className="text-sm">{flow.status === 'active' ? 'Actif' : 'Inactif'}</span>
          </div>

          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Éditer
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  )
}

interface StepCardProps {
  step: AutomationStep
  templates: { id: string; name: string }[]
  onUpdate: (updates: Partial<AutomationStep>) => void
  onRemove: () => void
}

function StepCard({ step, templates, onUpdate, onRemove }: StepCardProps) {
  const [isEditing, setIsEditing] = useState(false)

  const stepIcon = step.type === 'email' ? <Mail className="h-4 w-4" /> :
                   step.type === 'sms' ? <MessageSquare className="h-4 w-4" /> :
                   step.type === 'wait' ? <Clock className="h-4 w-4" /> :
                   step.type === 'condition' ? <GitBranch className="h-4 w-4" /> :
                   <Zap className="h-4 w-4" />

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            step.type === 'email' ? 'bg-blue-500/10' :
            step.type === 'sms' ? 'bg-green-500/10' :
            step.type === 'wait' ? 'bg-yellow-500/10' :
            'bg-purple-500/10'
          }`}>
            {stepIcon}
          </div>
          <div className="flex-1">
            <Input 
              value={step.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="font-medium border-none p-0 h-auto focus-visible:ring-0"
            />
            
            {step.type === 'email' && (
              <Select 
                value={step.config.template_id || ''}
                onValueChange={(v) => onUpdate({ config: { ...step.config, template_id: v } })}
              >
                <SelectTrigger className="w-48 h-7 text-xs mt-1">
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {step.type === 'wait' && (
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  type="number"
                  value={step.config.delay || 1}
                  onChange={(e) => onUpdate({ config: { ...step.config, delay: parseInt(e.target.value) } })}
                  className="w-16 h-7 text-xs"
                />
                <Select 
                  value={step.config.unit || 'hours'}
                  onValueChange={(v) => onUpdate({ config: { ...step.config, unit: v } })}
                >
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Min</SelectItem>
                    <SelectItem value="hours">Heures</SelectItem>
                    <SelectItem value="days">Jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {step.type === 'condition' && (
              <Select 
                value={step.config.condition_type || 'opened_email'}
                onValueChange={(v) => onUpdate({ config: { ...step.config, condition_type: v } })}
              >
                <SelectTrigger className="w-48 h-7 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opened_email">A ouvert l'email</SelectItem>
                  <SelectItem value="clicked_link">A cliqué un lien</SelectItem>
                  <SelectItem value="made_purchase">A effectué un achat</SelectItem>
                  <SelectItem value="visited_page">A visité une page</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  )
}
