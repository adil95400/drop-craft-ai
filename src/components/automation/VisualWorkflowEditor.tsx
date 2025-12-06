import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, Trash2, ArrowDown, Play, Save, Zap, Mail, Database, 
  Globe, Clock, Filter, GitBranch, Code, Bell, ShoppingCart,
  Package, DollarSign, Users, TrendingUp, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface WorkflowStep {
  id: string
  step_type: string
  step_config: Record<string, any>
  position: number
}

interface WorkflowTrigger {
  type: string
  config: Record<string, any>
}

const TRIGGER_TYPES = [
  { value: 'order_created', label: 'Nouvelle commande', icon: ShoppingCart, description: 'Déclenché lors d\'une nouvelle commande' },
  { value: 'product_imported', label: 'Produit importé', icon: Package, description: 'Déclenché lors d\'un import produit' },
  { value: 'price_changed', label: 'Prix modifié', icon: DollarSign, description: 'Déclenché lors d\'un changement de prix' },
  { value: 'stock_low', label: 'Stock faible', icon: AlertTriangle, description: 'Déclenché quand le stock est bas' },
  { value: 'customer_created', label: 'Nouveau client', icon: Users, description: 'Déclenché lors d\'une inscription' },
  { value: 'schedule', label: 'Planification', icon: Clock, description: 'Exécution programmée (cron)' },
  { value: 'manual', label: 'Manuel', icon: Play, description: 'Exécution manuelle uniquement' },
]

const STEP_TYPES = [
  { value: 'conditional', label: 'Condition IF/THEN', icon: GitBranch, category: 'logic', description: 'Branche conditionnelle' },
  { value: 'filter', label: 'Filtre', icon: Filter, category: 'logic', description: 'Filtre les données' },
  { value: 'transform_data', label: 'Transformer', icon: Code, category: 'data', description: 'Transforme les données' },
  { value: 'send_email', label: 'Envoyer Email', icon: Mail, category: 'action', description: 'Envoie un email' },
  { value: 'http_request', label: 'Requête HTTP', icon: Globe, category: 'action', description: 'Appel API externe' },
  { value: 'database_insert', label: 'Insérer en BDD', icon: Database, category: 'data', description: 'Insère des données' },
  { value: 'database_update', label: 'Mise à jour BDD', icon: Database, category: 'data', description: 'Met à jour des données' },
  { value: 'delay', label: 'Délai', icon: Clock, category: 'control', description: 'Pause avant la suite' },
  { value: 'notification', label: 'Notification', icon: Bell, category: 'action', description: 'Envoie une notification' },
]

const OPERATORS = [
  { value: 'equals', label: 'Égal à' },
  { value: 'not_equals', label: 'Différent de' },
  { value: 'greater_than', label: 'Supérieur à' },
  { value: 'less_than', label: 'Inférieur à' },
  { value: 'contains', label: 'Contient' },
  { value: 'not_contains', label: 'Ne contient pas' },
  { value: 'exists', label: 'Existe' },
  { value: 'not_exists', label: 'N\'existe pas' },
]

export function VisualWorkflowEditor() {
  const queryClient = useQueryClient()
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [trigger, setTrigger] = useState<WorkflowTrigger>({ type: 'manual', config: {} })
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)

  const { data: workflows } = useQuery({
    queryKey: ['automation-workflows'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

  const saveWorkflowMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const workflowData = {
        user_id: user.id,
        name: workflowName,
        description: workflowDescription,
        trigger_type: trigger.type,
        trigger_config: trigger.config,
        steps: steps.map((step, index) => ({
          ...step,
          position: index
        })),
        status: 'active'
      }

      const { error } = await supabase
        .from('automation_workflows')
        .insert(workflowData)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] })
      toast.success('Workflow sauvegardé avec succès')
      resetForm()
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde')
    }
  })

  const executeWorkflowMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const { data, error } = await supabase.functions.invoke('workflow-executor', {
        body: { workflowId, manualExecution: true }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`Workflow exécuté en ${data.executionTime}ms`)
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`)
    }
  })

  const resetForm = () => {
    setWorkflowName('')
    setWorkflowDescription('')
    setTrigger({ type: 'manual', config: {} })
    setSteps([])
    setSelectedStepId(null)
  }

  const addStep = (stepType: string) => {
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      step_type: stepType,
      step_config: getDefaultConfig(stepType),
      position: steps.length
    }
    setSteps([...steps, newStep])
    setSelectedStepId(newStep.id)
  }

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(s => s.id !== stepId))
    if (selectedStepId === stepId) setSelectedStepId(null)
  }

  const updateStepConfig = (stepId: string, config: Record<string, any>) => {
    setSteps(steps.map(s => 
      s.id === stepId ? { ...s, step_config: { ...s.step_config, ...config } } : s
    ))
  }

  const getDefaultConfig = (stepType: string): Record<string, any> => {
    switch (stepType) {
      case 'conditional':
        return { condition: { field: '', operator: 'equals', value: '' } }
      case 'filter':
        return { condition: { field: '', operator: 'exists', value: '' } }
      case 'send_email':
        return { to: '', subject: '', body: '' }
      case 'http_request':
        return { url: '', method: 'GET', headers: {}, body: {} }
      case 'database_insert':
        return { table: '', data: {} }
      case 'database_update':
        return { table: '', data: {}, where: {} }
      case 'delay':
        return { duration: 1000 }
      case 'notification':
        return { title: '', message: '', type: 'info' }
      case 'transform_data':
        return { transformations: [] }
      default:
        return {}
    }
  }

  const selectedStep = steps.find(s => s.id === selectedStepId)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Éditeur de Workflows</h1>
          <p className="text-muted-foreground">Créez des automatisations if/then comme Channable</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetForm}>
            Nouveau
          </Button>
          <Button 
            onClick={() => saveWorkflowMutation.mutate()} 
            disabled={!workflowName || steps.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workflow Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuration du Workflow</CardTitle>
            <CardDescription>Définissez les détails et le déclencheur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom du workflow</Label>
                <Input
                  placeholder="Ex: Auto-repricing stock faible"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Déclencheur</Label>
                <Select value={trigger.type} onValueChange={(v) => setTrigger({ ...trigger, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="w-4 h-4" />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Description du workflow..."
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Available Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Étapes Disponibles</CardTitle>
            <CardDescription>Glissez ou cliquez pour ajouter</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {['logic', 'action', 'data', 'control'].map(category => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                      {category === 'logic' ? 'Logique' : 
                       category === 'action' ? 'Actions' :
                       category === 'data' ? 'Données' : 'Contrôle'}
                    </h4>
                    {STEP_TYPES.filter(s => s.category === category).map(stepType => (
                      <Button
                        key={stepType.value}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => addStep(stepType.value)}
                      >
                        <stepType.icon className="w-4 h-4 mr-2" />
                        {stepType.label}
                      </Button>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Étapes du Workflow
            </CardTitle>
            <CardDescription>
              {steps.length} étape{steps.length > 1 ? 's' : ''} configurée{steps.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Ajoutez des étapes depuis le panneau de droite
              </div>
            ) : (
              <div className="space-y-2">
                {/* Trigger */}
                <div className="p-3 border rounded-lg bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary" />
                    <span className="font-medium">Déclencheur:</span>
                    <Badge variant="secondary">
                      {TRIGGER_TYPES.find(t => t.value === trigger.type)?.label || trigger.type}
                    </Badge>
                  </div>
                </div>

                {steps.map((step, index) => {
                  const stepType = STEP_TYPES.find(s => s.value === step.step_type)
                  const Icon = stepType?.icon || Code
                  
                  return (
                    <div key={step.id}>
                      <div className="flex justify-center py-1">
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div 
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedStepId === step.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedStepId(step.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{stepType?.label || step.step_type}</span>
                            <Badge variant="outline" className="text-xs">
                              {index + 1}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeStep(step.id)
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration de l'Étape</CardTitle>
            <CardDescription>
              {selectedStep 
                ? STEP_TYPES.find(s => s.value === selectedStep.step_type)?.description
                : 'Sélectionnez une étape pour la configurer'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedStep ? (
              <StepConfigForm 
                step={selectedStep} 
                onUpdate={(config) => updateStepConfig(selectedStep.id, config)}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Cliquez sur une étape pour la configurer
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Workflows Sauvegardés</CardTitle>
          <CardDescription>{workflows?.length || 0} workflow(s) actif(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {workflows?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucun workflow créé</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflows?.map(wf => (
                <Card key={wf.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{wf.name}</h4>
                      <Badge variant={wf.status === 'active' ? 'default' : 'secondary'}>
                        {wf.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {wf.description || 'Pas de description'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{(wf.steps as any[])?.length || 0} étapes</span>
                      <span>{wf.execution_count || 0} exécutions</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => executeWorkflowMutation.mutate(wf.id)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Exécuter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StepConfigForm({ 
  step, 
  onUpdate 
}: { 
  step: WorkflowStep
  onUpdate: (config: Record<string, any>) => void 
}) {
  const config = step.step_config

  switch (step.step_type) {
    case 'conditional':
    case 'filter':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Champ à évaluer</Label>
            <Input
              placeholder="Ex: order.total, product.price"
              value={config.condition?.field || ''}
              onChange={(e) => onUpdate({ 
                condition: { ...config.condition, field: e.target.value }
              })}
            />
          </div>
          <div className="space-y-2">
            <Label>Opérateur</Label>
            <Select 
              value={config.condition?.operator || 'equals'} 
              onValueChange={(v) => onUpdate({ 
                condition: { ...config.condition, operator: v }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map(op => (
                  <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valeur de comparaison</Label>
            <Input
              placeholder="Ex: 100, completed, true"
              value={config.condition?.value || ''}
              onChange={(e) => onUpdate({ 
                condition: { ...config.condition, value: e.target.value }
              })}
            />
          </div>
        </div>
      )

    case 'send_email':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Destinataire</Label>
            <Input
              placeholder="{{customer.email}} ou email@example.com"
              value={config.to || ''}
              onChange={(e) => onUpdate({ to: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Sujet</Label>
            <Input
              placeholder="Sujet de l'email"
              value={config.subject || ''}
              onChange={(e) => onUpdate({ subject: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Contenu</Label>
            <textarea
              className="w-full min-h-[100px] p-2 border rounded-md text-sm"
              placeholder="Corps de l'email... {{variables}} supportées"
              value={config.body || ''}
              onChange={(e) => onUpdate({ body: e.target.value })}
            />
          </div>
        </div>
      )

    case 'http_request':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              placeholder="https://api.example.com/endpoint"
              value={config.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Méthode</Label>
            <Select 
              value={config.method || 'GET'} 
              onValueChange={(v) => onUpdate({ method: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )

    case 'delay':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Durée (millisecondes)</Label>
            <Input
              type="number"
              placeholder="1000"
              value={config.duration || 1000}
              onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 1000 })}
            />
            <p className="text-xs text-muted-foreground">
              1000ms = 1 seconde, 60000ms = 1 minute
            </p>
          </div>
        </div>
      )

    case 'notification':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input
              placeholder="Titre de la notification"
              value={config.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Input
              placeholder="Message de la notification"
              value={config.message || ''}
              onChange={(e) => onUpdate({ message: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select 
              value={config.type || 'info'} 
              onValueChange={(v) => onUpdate({ type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )

    case 'database_insert':
    case 'database_update':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Table</Label>
            <Input
              placeholder="Ex: products, orders"
              value={config.table || ''}
              onChange={(e) => onUpdate({ table: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Données (JSON)</Label>
            <textarea
              className="w-full min-h-[80px] p-2 border rounded-md text-sm font-mono"
              placeholder='{"field": "{{value}}"}'
              value={JSON.stringify(config.data || {}, null, 2)}
              onChange={(e) => {
                try {
                  onUpdate({ data: JSON.parse(e.target.value) })
                } catch {}
              }}
            />
          </div>
          {step.step_type === 'database_update' && (
            <div className="space-y-2">
              <Label>Condition WHERE (JSON)</Label>
              <textarea
                className="w-full min-h-[60px] p-2 border rounded-md text-sm font-mono"
                placeholder='{"id": "{{item.id}}"}'
                value={JSON.stringify(config.where || {}, null, 2)}
                onChange={(e) => {
                  try {
                    onUpdate({ where: JSON.parse(e.target.value) })
                  } catch {}
                }}
              />
            </div>
          )}
        </div>
      )

    default:
      return (
        <div className="text-center py-4 text-muted-foreground">
          Configuration non disponible pour ce type d'étape
        </div>
      )
  }
}

export default VisualWorkflowEditor
