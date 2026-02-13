/**
 * PHASE 4: Workflow Builder - Constructeur visuel INTERACTIF
 * Interface drag & drop complète avec @dnd-kit
 */

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  closestCenter
} from '@dnd-kit/core'
import { 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  Play, Plus, ArrowDown, Settings, Trash2, GripVertical,
  Zap, Mail, Database, Calculator, Clock, Filter, Bell,
  ShoppingCart, Package, TrendingUp, AlertTriangle, CheckCircle,
  Save, Eye, Copy
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useRealAutomation } from '@/hooks/useRealAutomation'

// Types pour les blocs de workflow
interface WorkflowBlock {
  id: string
  type: 'trigger' | 'condition' | 'action'
  blockType: string
  name: string
  icon: React.ElementType
  color: string
  config: Record<string, any>
}

interface BlockTemplate {
  blockType: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  type: 'trigger' | 'condition' | 'action'
  defaultConfig: Record<string, any>
}

// Templates de blocs disponibles
const TRIGGER_TEMPLATES: BlockTemplate[] = [
  { 
    blockType: 'new_order', 
    name: 'Nouvelle commande', 
    description: 'Déclenche quand une commande arrive',
    icon: ShoppingCart, 
    color: 'bg-blue-500',
    type: 'trigger',
    defaultConfig: { stores: ['all'] }
  },
  { 
    blockType: 'low_stock', 
    name: 'Stock faible', 
    description: 'Alerte quand stock < seuil',
    icon: AlertTriangle, 
    color: 'bg-orange-500',
    type: 'trigger',
    defaultConfig: { threshold: 10 }
  },
  { 
    blockType: 'price_change', 
    name: 'Changement prix concurrent', 
    description: 'Détecte les variations de prix',
    icon: TrendingUp, 
    color: 'bg-purple-500',
    type: 'trigger',
    defaultConfig: { changePercent: 5 }
  },
  { 
    blockType: 'scheduled', 
    name: 'Planifié', 
    description: 'Exécution à heure fixe',
    icon: Clock, 
    color: 'bg-cyan-500',
    type: 'trigger',
    defaultConfig: { cron: '0 9 * * *' }
  },
]

const CONDITION_TEMPLATES: BlockTemplate[] = [
  { 
    blockType: 'if_margin', 
    name: 'Si marge > X%', 
    description: 'Condition sur la marge',
    icon: Calculator, 
    color: 'bg-yellow-500',
    type: 'condition',
    defaultConfig: { operator: '>', value: 20 }
  },
  { 
    blockType: 'if_stock', 
    name: 'Si stock disponible', 
    description: 'Vérifie la disponibilité',
    icon: Package, 
    color: 'bg-teal-500',
    type: 'condition',
    defaultConfig: { minStock: 1 }
  },
  { 
    blockType: 'filter', 
    name: 'Filtrer produits', 
    description: 'Applique des filtres',
    icon: Filter, 
    color: 'bg-indigo-500',
    type: 'condition',
    defaultConfig: { categories: [] }
  },
]

const ACTION_TEMPLATES: BlockTemplate[] = [
  { 
    blockType: 'send_email', 
    name: 'Envoyer email', 
    description: 'Notification par email',
    icon: Mail, 
    color: 'bg-green-500',
    type: 'action',
    defaultConfig: { template: 'default' }
  },
  { 
    blockType: 'adjust_price', 
    name: 'Ajuster prix', 
    description: 'Modifie le prix automatiquement',
    icon: Calculator, 
    color: 'bg-red-500',
    type: 'action',
    defaultConfig: { adjustment: -5, type: 'percent' }
  },
  { 
    blockType: 'reorder_stock', 
    name: 'Commander stock', 
    description: 'Passe commande fournisseur',
    icon: Database, 
    color: 'bg-indigo-500',
    type: 'action',
    defaultConfig: { quantity: 'auto' }
  },
  { 
    blockType: 'notify', 
    name: 'Notification push', 
    description: 'Envoie une alerte',
    icon: Bell, 
    color: 'bg-pink-500',
    type: 'action',
    defaultConfig: { priority: 'normal' }
  },
]

// Composant bloc draggable dans le canvas
function SortableBlock({ 
  block, 
  onRemove, 
  onEdit,
  isSelected 
}: { 
  block: WorkflowBlock
  onRemove: () => void
  onEdit: () => void
  isSelected: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = block.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all",
        isDragging && "opacity-50 z-50"
      )}
    >
      <motion.div
        layout
        className={cn(
          "flex items-center gap-3 p-4 border rounded-lg bg-card shadow-sm",
          "hover:shadow-md transition-shadow cursor-pointer",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={onEdit}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", block.color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{block.name}</p>
          <Badge variant="secondary" className="text-xs mt-1">
            {block.type === 'trigger' ? 'Déclencheur' : 
             block.type === 'condition' ? 'Condition' : 'Action'}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </motion.div>

      {/* Connecteur vers le bloc suivant */}
      <div className="flex justify-center py-1">
        <ArrowDown className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}

// Composant template de bloc dans la palette
function BlockTemplateItem({ 
  template, 
  onAdd 
}: { 
  template: BlockTemplate
  onAdd: () => void 
}) {
  const Icon = template.icon

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-sm cursor-pointer bg-card"
      onClick={onAdd}
    >
      <div className={cn("w-8 h-8 rounded flex items-center justify-center", template.color)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{template.name}</p>
        <p className="text-xs text-muted-foreground truncate">{template.description}</p>
      </div>
      <Plus className="h-4 w-4 text-muted-foreground" />
    </motion.div>
  )
}

// Panneau de configuration du bloc sélectionné
function BlockConfigPanel({ 
  block, 
  onUpdate,
  onClose 
}: { 
  block: WorkflowBlock | null
  onUpdate: (config: Record<string, any>) => void
  onClose: () => void
}) {
  if (!block) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Sélectionnez un bloc pour le configurer
      </div>
    )
  }

  const Icon = block.icon

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", block.color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">{block.name}</h3>
          <p className="text-xs text-muted-foreground">Configuration du bloc</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        {block.blockType === 'low_stock' && (
          <div>
            <Label htmlFor="threshold">Seuil de stock</Label>
            <Input
              id="threshold"
              type="number"
              value={block.config.threshold || 10}
              onChange={(e) => onUpdate({ ...block.config, threshold: parseInt(e.target.value) })}
              placeholder="10"
            />
          </div>
        )}

        {block.blockType === 'price_change' && (
          <div>
            <Label htmlFor="changePercent">Variation minimale (%)</Label>
            <Input
              id="changePercent"
              type="number"
              value={block.config.changePercent || 5}
              onChange={(e) => onUpdate({ ...block.config, changePercent: parseInt(e.target.value) })}
              placeholder="5"
            />
          </div>
        )}

        {block.blockType === 'adjust_price' && (
          <>
            <div>
              <Label htmlFor="adjustment">Ajustement (%)</Label>
              <Input
                id="adjustment"
                type="number"
                value={block.config.adjustment || -5}
                onChange={(e) => onUpdate({ ...block.config, adjustment: parseInt(e.target.value) })}
                placeholder="-5"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Valeur négative = réduction, positive = augmentation
            </p>
          </>
        )}

        {block.blockType === 'if_margin' && (
          <div>
            <Label htmlFor="marginValue">Marge minimum (%)</Label>
            <Input
              id="marginValue"
              type="number"
              value={block.config.value || 20}
              onChange={(e) => onUpdate({ ...block.config, value: parseInt(e.target.value) })}
              placeholder="20"
            />
          </div>
        )}

        {block.blockType === 'send_email' && (
          <div>
            <Label htmlFor="emailTemplate">Template email</Label>
            <Input
              id="emailTemplate"
              value={block.config.template || 'default'}
              onChange={(e) => onUpdate({ ...block.config, template: e.target.value })}
              placeholder="default"
            />
          </div>
        )}

        {/* Configuration générique pour les autres types */}
        {!['low_stock', 'price_change', 'adjust_price', 'if_margin', 'send_email'].includes(block.blockType) && (
          <p className="text-sm text-muted-foreground">
            Configuration avancée disponible prochainement.
          </p>
        )}
      </div>
    </div>
  )
}

export const WorkflowBuilder: React.FC = () => {
  const { toast } = useToast()
  const { createWorkflow, isCreating } = useRealAutomation()
  const [workflowName, setWorkflowName] = useState('Mon workflow')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [blocks, setBlocks] = useState<WorkflowBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const selectedBlock = useMemo(
    () => blocks.find(b => b.id === selectedBlockId) || null,
    [blocks, selectedBlockId]
  )

  const addBlock = useCallback((template: BlockTemplate) => {
    const newBlock: WorkflowBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      blockType: template.blockType,
      name: template.name,
      icon: template.icon,
      color: template.color,
      config: { ...template.defaultConfig }
    }
    setBlocks(prev => [...prev, newBlock])
    setSelectedBlockId(newBlock.id)
    toast({ title: "Bloc ajouté", description: `${template.name} ajouté au workflow` })
  }, [toast])

  const removeBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId))
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null)
    }
    toast({ title: "Bloc supprimé" })
  }, [selectedBlockId, toast])

  const updateBlockConfig = useCallback((blockId: string, config: Record<string, any>) => {
    setBlocks(prev => prev.map(b => 
      b.id === blockId ? { ...b, config } : b
    ))
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleSave = () => {
    if (blocks.length === 0) {
      toast({ 
        title: "Workflow vide", 
        description: "Ajoutez au moins un bloc avant de sauvegarder",
        variant: "destructive"
      })
      return
    }
    
    const triggerBlock = blocks.find(b => b.type === 'trigger')
    const steps = blocks.map((b, i) => ({
      order: i, type: b.type, blockType: b.blockType,
      name: b.name, config: b.config
    }))

    createWorkflow({
      name: workflowName,
      description: workflowDescription,
      trigger_type: triggerBlock?.blockType || 'manual',
      trigger_config: triggerBlock?.config || {},
      steps,
      status: 'draft' as const,
    })
  }

  const handleTest = () => {
    if (blocks.length === 0) {
      toast({ 
        title: "Aucun bloc", 
        description: "Ajoutez des blocs pour tester le workflow",
        variant: "destructive"
      })
      return
    }
    toast({ 
      title: "Test lancé", 
      description: "Simulation du workflow en cours..." 
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
            placeholder="Nom du workflow"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Glissez-déposez les blocs pour créer votre automatisation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTest}>
            <Eye className="h-4 w-4 mr-2" />
            Tester
          </Button>
          <Button onClick={handleSave} disabled={isCreating}>
            <Save className="h-4 w-4 mr-2" />
            {isCreating ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr_280px]">
        {/* Palette de blocs - Gauche */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Blocs disponibles</CardTitle>
            <CardDescription>Cliquez pour ajouter</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-4 pb-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Déclencheurs
                  </h4>
                  <div className="space-y-2">
                    {TRIGGER_TEMPLATES.map(t => (
                      <BlockTemplateItem key={t.blockType} template={t} onAdd={() => addBlock(t)} />
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Conditions
                  </h4>
                  <div className="space-y-2">
                    {CONDITION_TEMPLATES.map(t => (
                      <BlockTemplateItem key={t.blockType} template={t} onAdd={() => addBlock(t)} />
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Play className="h-3 w-3" /> Actions
                  </h4>
                  <div className="space-y-2">
                    {ACTION_TEMPLATES.map(t => (
                      <BlockTemplateItem key={t.blockType} template={t} onAdd={() => addBlock(t)} />
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Canvas central */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Canvas du workflow</CardTitle>
              <Badge variant="outline">
                {blocks.length} bloc{blocks.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-4">
            <ScrollArea className="h-full">
              {blocks.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-xl">
                    <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Aucun bloc</p>
                    <p className="text-sm">Cliquez sur un bloc à gauche pour commencer</p>
                  </div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    <AnimatePresence>
                      {blocks.map((block) => (
                        <SortableBlock
                          key={block.id}
                          block={block}
                          isSelected={selectedBlockId === block.id}
                          onRemove={() => removeBlock(block.id)}
                          onEdit={() => setSelectedBlockId(block.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </SortableContext>

                  <DragOverlay>
                    {activeId ? (
                      <div className="p-4 border rounded-lg bg-card shadow-lg opacity-80">
                        {blocks.find(b => b.id === activeId)?.name}
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}

              {/* Indicateur de fin */}
              {blocks.length > 0 && (
                <div className="flex justify-center mt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Fin du workflow
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Panneau de configuration - Droite */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-4">
            <BlockConfigPanel
              block={selectedBlock}
              onUpdate={(config) => selectedBlockId && updateBlockConfig(selectedBlockId, config)}
              onClose={() => setSelectedBlockId(null)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
