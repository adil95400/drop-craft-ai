import { useState, useCallback } from 'react'
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  TouchSensor,
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { 
  Plus, Trash2, ArrowDown, Play, Save, Zap, Mail, Database, 
  Globe, Clock, Filter, GitBranch, Code, Bell, ShoppingCart,
  Package, DollarSign, Users, TrendingUp, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useIsMobile } from '@/hooks/use-mobile'
import { MobileWorkflowStep } from './MobileWorkflowStep'
import { MobileStepsPalette } from './MobileStepsPalette'
import { cn } from '@/lib/utils'

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
  const isMobile = useIsMobile()
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [trigger, setTrigger] = useState<WorkflowTrigger>({ type: 'manual', config: {} })
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [isConfigSheetOpen, setIsConfigSheetOpen] = useState(false)

  // Configure sensors for touch and pointer
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
    setIsConfigSheetOpen(false)
  }

  const addStep = useCallback((stepType: string) => {
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      step_type: stepType,
      step_config: getDefaultConfig(stepType),
      position: steps.length
    }
    setSteps(prev => [...prev, newStep])
    setSelectedStepId(newStep.id)
    if (isMobile) {
      setIsConfigSheetOpen(true)
    }
  }, [steps.length, isMobile])

  const removeStep = useCallback((stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId))
    if (selectedStepId === stepId) {
      setSelectedStepId(null)
      setIsConfigSheetOpen(false)
    }
  }, [selectedStepId])

  const updateStepConfig = useCallback((stepId: string, config: Record<string, any>) => {
    setSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, step_config: { ...s.step_config, ...config } } : s
    ))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        if (navigator.vibrate) {
          navigator.vibrate(5)
        }
        
        return arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          position: index
        }))
      })
    }
  }, [])

  const handleSelectStep = useCallback((stepId: string) => {
    setSelectedStepId(stepId)
    if (isMobile) {
      setIsConfigSheetOpen(true)
    }
  }, [isMobile])

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
    <div className={cn(
      'space-y-4 sm:space-y-6',
      isMobile ? 'p-4 pb-24' : 'p-6'
    )}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Éditeur de Workflows</h1>
          <p className="text-sm text-muted-foreground">Créez des automatisations if/then</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size={isMobile ? 'sm' : 'default'} onClick={resetForm}>
            Nouveau
          </Button>
          <Button 
            size={isMobile ? 'sm' : 'default'}
            onClick={() => saveWorkflowMutation.mutate()} 
            disabled={!workflowName || steps.length === 0}
            className="min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Configuration Section */}
      <div className={cn(
        'grid gap-4 sm:gap-6',
        isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'
      )}>
        {/* Workflow Configuration */}
        <Card className={cn(!isMobile && 'lg:col-span-2')}>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Configuration du Workflow</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Définissez les détails et le déclencheur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn(
              'grid gap-4',
              isMobile ? 'grid-cols-1' : 'md:grid-cols-2'
            )}>
              <div className="space-y-2">
                <Label className="text-sm">Nom du workflow</Label>
                <Input
                  placeholder="Ex: Auto-repricing stock faible"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Déclencheur</Label>
                <Select value={trigger.type} onValueChange={(v) => setTrigger({ ...trigger, type: v })}>
                  <SelectTrigger className="min-h-[44px]">
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
              <Label className="text-sm">Description</Label>
              <Input
                placeholder="Description du workflow..."
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Available Steps - Desktop Only */}
        {!isMobile && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Étapes Disponibles</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Cliquez pour ajouter</CardDescription>
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
                          className="w-full justify-start min-h-[44px]"
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
        )}
      </div>

      {/* Steps Section */}
      <div className={cn(
        'grid gap-4 sm:gap-6',
        isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'
      )}>
        {/* Workflow Steps with DnD */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              Étapes du Workflow
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {steps.length} étape{steps.length > 1 ? 's' : ''} configurée{steps.length > 1 ? 's' : ''}
              {isMobile && ' • Glissez pour réordonner'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {isMobile 
                  ? 'Appuyez sur + pour ajouter des étapes' 
                  : 'Ajoutez des étapes depuis le panneau de droite'
                }
              </div>
            ) : (
              <div className="space-y-2">
                {/* Trigger */}
                <div className="p-3 border rounded-lg bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Déclencheur:</span>
                    <Badge variant="secondary" className="text-xs">
                      {TRIGGER_TYPES.find(t => t.value === trigger.type)?.label || trigger.type}
                    </Badge>
                  </div>
                </div>

                {/* Sortable Steps */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={steps.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {steps.map((step, index) => {
                        const stepType = STEP_TYPES.find(s => s.value === step.step_type)
                        
                        return (
                          <div key={step.id}>
                            <div className="flex justify-center py-1">
                              <ArrowDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                            {isMobile ? (
                              <MobileWorkflowStep
                                step={step}
                                stepType={stepType}
                                index={index}
                                isSelected={selectedStepId === step.id}
                                onSelect={() => handleSelectStep(step.id)}
                                onRemove={() => removeStep(step.id)}
                                onConfigure={() => handleSelectStep(step.id)}
                              />
                            ) : (
                              <DesktopWorkflowStep
                                step={step}
                                stepType={stepType}
                                index={index}
                                isSelected={selectedStepId === step.id}
                                onSelect={() => setSelectedStepId(step.id)}
                                onRemove={() => removeStep(step.id)}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step Configuration - Desktop Panel */}
        {!isMobile && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Configuration de l'Étape</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
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
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Cliquez sur une étape pour la configurer
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Step Configuration Sheet */}
      {isMobile && (
        <Sheet open={isConfigSheetOpen} onOpenChange={setIsConfigSheetOpen}>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle>
                {selectedStep 
                  ? STEP_TYPES.find(s => s.value === selectedStep.step_type)?.label 
                  : 'Configuration'}
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-80px)]">
              {selectedStep ? (
                <StepConfigForm 
                  step={selectedStep} 
                  onUpdate={(config) => updateStepConfig(selectedStep.id, config)}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Sélectionnez une étape
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile FAB for adding steps */}
      {isMobile && <MobileStepsPalette onAddStep={addStep} />}

      {/* Saved Workflows */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Workflows Sauvegardés</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{workflows?.length || 0} workflow(s) actif(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {workflows?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">Aucun workflow créé</p>
          ) : (
            <div className={cn(
              'grid gap-3 sm:gap-4',
              isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'
            )}>
              {workflows?.map(wf => (
                <Card key={wf.id} className="border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm truncate">{wf.name}</h4>
                      <Badge variant={wf.status === 'active' ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {wf.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {wf.description || 'Pas de description'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{(wf.steps as any[])?.length || 0} étapes</span>
                      <span>{wf.execution_count || 0} exécutions</span>
                    </div>
                    <div className="mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full min-h-[44px]"
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

// Desktop step component (non-draggable for now, simpler UI)
function DesktopWorkflowStep({
  step,
  stepType,
  index,
  isSelected,
  onSelect,
  onRemove,
}: {
  step: WorkflowStep
  stepType: any
  index: number
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const Icon = stepType?.icon || Code

  return (
    <div 
      className={cn(
        'p-3 border rounded-lg cursor-pointer transition-colors',
        isSelected 
          ? 'border-primary bg-primary/5' 
          : 'hover:border-primary/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="font-medium text-sm">{stepType?.label || step.step_type}</span>
          <Badge variant="outline" className="text-xs">
            {index + 1}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
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
            <Label className="text-sm">Champ à évaluer</Label>
            <Input
              placeholder="Ex: order.total, product.price"
              value={config.condition?.field || ''}
              onChange={(e) => onUpdate({ 
                condition: { ...config.condition, field: e.target.value }
              })}
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Opérateur</Label>
            <Select 
              value={config.condition?.operator || 'equals'} 
              onValueChange={(v) => onUpdate({ 
                condition: { ...config.condition, operator: v }
              })}
            >
              <SelectTrigger className="min-h-[44px]">
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
            <Label className="text-sm">Valeur de comparaison</Label>
            <Input
              placeholder="Ex: 100, completed, true"
              value={config.condition?.value || ''}
              onChange={(e) => onUpdate({ 
                condition: { ...config.condition, value: e.target.value }
              })}
              className="min-h-[44px]"
            />
          </div>
        </div>
      )

    case 'send_email':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Destinataire</Label>
            <Input
              placeholder="{{customer.email}} ou email@example.com"
              value={config.to || ''}
              onChange={(e) => onUpdate({ to: e.target.value })}
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Sujet</Label>
            <Input
              placeholder="Sujet de l'email"
              value={config.subject || ''}
              onChange={(e) => onUpdate({ subject: e.target.value })}
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Contenu</Label>
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-md text-sm"
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
            <Label className="text-sm">URL</Label>
            <Input
              placeholder="https://api.example.com/endpoint"
              value={config.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Méthode</Label>
            <Select 
              value={config.method || 'GET'} 
              onValueChange={(v) => onUpdate({ method: v })}
            >
              <SelectTrigger className="min-h-[44px]">
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
            <Label className="text-sm">Durée (millisecondes)</Label>
            <Input
              type="number"
              placeholder="1000"
              value={config.duration || 1000}
              onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 1000 })}
              className="min-h-[44px]"
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
            <Label className="text-sm">Titre</Label>
            <Input
              placeholder="Titre de la notification"
              value={config.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Message</Label>
            <Input
              placeholder="Message de la notification"
              value={config.message || ''}
              onChange={(e) => onUpdate({ message: e.target.value })}
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Type</Label>
            <Select 
              value={config.type || 'info'} 
              onValueChange={(v) => onUpdate({ type: v })}
            >
              <SelectTrigger className="min-h-[44px]">
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
            <Label className="text-sm">Table</Label>
            <Input
              placeholder="Ex: products, orders"
              value={config.table || ''}
              onChange={(e) => onUpdate({ table: e.target.value })}
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Données (JSON)</Label>
            <textarea
              className="w-full min-h-[80px] p-3 border rounded-md text-sm font-mono"
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
              <Label className="text-sm">Condition WHERE (JSON)</Label>
              <textarea
                className="w-full min-h-[60px] p-3 border rounded-md text-sm font-mono"
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
        <div className="text-center py-4 text-muted-foreground text-sm">
          Configuration non disponible pour ce type d'étape
        </div>
      )
  }
}

export default VisualWorkflowEditor
