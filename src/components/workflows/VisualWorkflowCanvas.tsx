/**
 * Visual Workflow Canvas - Drag & drop workflow builder with @dnd-kit
 * Real visual node editor with connections and step configuration
 */
import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Zap, Plus, Trash2, ArrowDown, Mail, Bell, Package, ShoppingCart, Clock,
  GitBranch, AlertTriangle, Settings, Webhook, Globe, Send, GripVertical,
  ChevronRight, Sparkles, Database, Filter, MessageSquare, Bot,
  RefreshCw, Pause, Play, Copy, MoreVertical
} from 'lucide-react';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'loop';
  name: string;
  description?: string;
  icon: string;
  config: Record<string, any>;
  isConfigured: boolean;
}

interface VisualWorkflowCanvasProps {
  nodes: WorkflowNode[];
  onNodesChange: (nodes: WorkflowNode[]) => void;
  onNodeSelect?: (node: WorkflowNode) => void;
  selectedNodeId?: string;
}

const NODE_PALETTE = {
  triggers: [
    { id: 'new-order', name: 'Nouvelle commande', icon: 'ShoppingCart', description: 'Déclenché à chaque commande' },
    { id: 'low-stock', name: 'Stock bas', icon: 'AlertTriangle', description: 'Stock sous un seuil' },
    { id: 'new-product', name: 'Nouveau produit', icon: 'Package', description: 'Produit importé/créé' },
    { id: 'schedule', name: 'Planification', icon: 'Clock', description: 'Cron / intervalles' },
    { id: 'webhook', name: 'Webhook entrant', icon: 'Webhook', description: 'HTTP POST externe' },
    { id: 'price-change', name: 'Changement de prix', icon: 'RefreshCw', description: 'Détection de variation' },
    { id: 'customer-event', name: 'Événement client', icon: 'MessageSquare', description: 'Inscription, achat, etc.' },
  ],
  conditions: [
    { id: 'if-then', name: 'Si / Alors', icon: 'GitBranch', description: 'Branchement conditionnel' },
    { id: 'filter', name: 'Filtre', icon: 'Filter', description: 'Filtrer les données' },
    { id: 'switch', name: 'Switch / Multi', icon: 'GitBranch', description: 'Plusieurs chemins' },
  ],
  actions: [
    { id: 'send-email', name: 'Envoyer un email', icon: 'Mail', description: 'SMTP / template' },
    { id: 'webhook-out', name: 'Appel Webhook', icon: 'Webhook', description: 'POST vers URL externe' },
    { id: 'update-stock', name: 'Modifier stock', icon: 'Package', description: 'Ajuster les quantités' },
    { id: 'notify', name: 'Notification', icon: 'Bell', description: 'In-app / Push' },
    { id: 'reorder', name: 'Réapprovisionner', icon: 'ShoppingCart', description: 'Commander au fournisseur' },
    { id: 'api-call', name: 'Appel API', icon: 'Globe', description: 'REST / GraphQL' },
    { id: 'ai-enrich', name: 'Enrichissement IA', icon: 'Bot', description: 'Optimiser avec l\'IA' },
    { id: 'update-db', name: 'Mise à jour BDD', icon: 'Database', description: 'Modifier des données' },
    { id: 'send-sms', name: 'SMS / Push', icon: 'Send', description: 'Message mobile' },
  ],
  flow: [
    { id: 'delay', name: 'Délai', icon: 'Clock', description: 'Attendre X minutes/heures' },
    { id: 'loop', name: 'Boucle', icon: 'RefreshCw', description: 'Répéter N fois' },
    { id: 'pause', name: 'Pause', icon: 'Pause', description: 'Approbation manuelle' },
  ],
};

const ICON_MAP: Record<string, any> = {
  ShoppingCart, AlertTriangle, Package, Clock, Mail, Bell, Zap, GitBranch,
  Settings, Webhook, Globe, Send, Sparkles, Database, Filter, MessageSquare,
  Bot, RefreshCw, Pause, Play, Copy,
};

const TYPE_COLORS: Record<string, string> = {
  trigger: 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30',
  condition: 'border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/30',
  action: 'border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30',
  delay: 'border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/30',
  loop: 'border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/30',
};

const TYPE_LABELS: Record<string, string> = {
  trigger: 'Déclencheur',
  condition: 'Condition',
  action: 'Action',
  delay: 'Contrôle',
  loop: 'Contrôle',
};

function SortableNode({ 
  node, isSelected, onSelect, onRemove, onDuplicate 
}: { 
  node: WorkflowNode; isSelected: boolean; onSelect: () => void; onRemove: () => void; onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = ICON_MAP[node.icon] || Zap;

  return (
    <div ref={setNodeRef} style={style} className={cn('relative group', isDragging && 'z-50 opacity-80')}>
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          TYPE_COLORS[node.type],
          isSelected && 'ring-2 ring-primary shadow-lg',
          !node.isConfigured && 'border-dashed'
        )}
        onClick={onSelect}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className={cn(
            'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
            node.type === 'trigger' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
            node.type === 'condition' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300' :
            'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300'
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{node.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px] h-4">{TYPE_LABELS[node.type]}</Badge>
              {!node.isConfigured && <Badge variant="secondary" className="text-[10px] h-4">À configurer</Badge>}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); onDuplicate(); }}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); onRemove(); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function VisualWorkflowCanvas({ nodes, onNodesChange, onNodeSelect, selectedNodeId }: VisualWorkflowCanvasProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = nodes.findIndex(n => n.id === active.id);
    const newIndex = nodes.findIndex(n => n.id === over.id);
    const newNodes = [...nodes];
    const [removed] = newNodes.splice(oldIndex, 1);
    newNodes.splice(newIndex, 0, removed);
    onNodesChange(newNodes);
  }, [nodes, onNodesChange]);

  const addNode = (template: any, type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: crypto.randomUUID(),
      type,
      name: template.name,
      description: template.description,
      icon: template.icon,
      config: {},
      isConfigured: false,
    };
    onNodesChange([...nodes, newNode]);
    onNodeSelect?.(newNode);
    setPaletteOpen(false);
  };

  const removeNode = (id: string) => onNodesChange(nodes.filter(n => n.id !== id));

  const duplicateNode = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    const clone = { ...node, id: crypto.randomUUID(), name: `${node.name} (copie)` };
    const idx = nodes.findIndex(n => n.id === id);
    const newNodes = [...nodes];
    newNodes.splice(idx + 1, 0, clone);
    onNodesChange(newNodes);
  };

  const hasTrigger = nodes.some(n => n.type === 'trigger');

  return (
    <div className="flex gap-4 h-full">
      {/* Canvas */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" /> {nodes.length} étapes
            </Badge>
            {hasTrigger && <Badge className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Trigger OK</Badge>}
          </div>
          <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
            <SheetTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
            </SheetTrigger>
            <SheetContent className="w-[360px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Ajouter une étape</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                <div className="space-y-6 pr-4">
                  {/* Triggers */}
                  <div>
                    <h4 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Déclencheurs
                    </h4>
                    <div className="space-y-1">
                      {NODE_PALETTE.triggers.map(t => {
                        const I = ICON_MAP[t.icon] || Zap;
                        return (
                          <Button
                            key={t.id}
                            variant="ghost"
                            className="w-full justify-start h-auto py-2 px-3"
                            onClick={() => addNode(t, 'trigger')}
                            disabled={hasTrigger}
                          >
                            <I className="h-4 w-4 mr-3 text-blue-500 shrink-0" />
                            <div className="text-left">
                              <div className="text-sm font-medium">{t.name}</div>
                              <div className="text-xs text-muted-foreground">{t.description}</div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <Separator />
                  {/* Conditions */}
                  <div>
                    <h4 className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4" /> Conditions
                    </h4>
                    <div className="space-y-1">
                      {NODE_PALETTE.conditions.map(t => {
                        const I = ICON_MAP[t.icon] || GitBranch;
                        return (
                          <Button key={t.id} variant="ghost" className="w-full justify-start h-auto py-2 px-3" onClick={() => addNode(t, 'condition')}>
                            <I className="h-4 w-4 mr-3 text-amber-500 shrink-0" />
                            <div className="text-left">
                              <div className="text-sm font-medium">{t.name}</div>
                              <div className="text-xs text-muted-foreground">{t.description}</div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <Separator />
                  {/* Actions */}
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-600 mb-2 flex items-center gap-2">
                      <Play className="h-4 w-4" /> Actions
                    </h4>
                    <div className="space-y-1">
                      {NODE_PALETTE.actions.map(t => {
                        const I = ICON_MAP[t.icon] || Zap;
                        return (
                          <Button key={t.id} variant="ghost" className="w-full justify-start h-auto py-2 px-3" onClick={() => addNode(t, 'action')}>
                            <I className="h-4 w-4 mr-3 text-emerald-500 shrink-0" />
                            <div className="text-left">
                              <div className="text-sm font-medium">{t.name}</div>
                              <div className="text-xs text-muted-foreground">{t.description}</div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <Separator />
                  {/* Flow control */}
                  <div>
                    <h4 className="text-sm font-semibold text-purple-600 mb-2 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" /> Contrôle de flux
                    </h4>
                    <div className="space-y-1">
                      {NODE_PALETTE.flow.map(t => {
                        const I = ICON_MAP[t.icon] || Clock;
                        return (
                          <Button key={t.id} variant="ghost" className="w-full justify-start h-auto py-2 px-3" onClick={() => addNode(t, t.id === 'delay' ? 'delay' : 'loop')}>
                            <I className="h-4 w-4 mr-3 text-purple-500 shrink-0" />
                            <div className="text-left">
                              <div className="text-sm font-medium">{t.name}</div>
                              <div className="text-xs text-muted-foreground">{t.description}</div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {nodes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Canvas vide</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par ajouter un déclencheur, puis ajoutez des conditions et actions
              </p>
              <Button onClick={() => setPaletteOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter la première étape
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={nodes.map(n => n.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {nodes.map((node, idx) => (
                  <div key={node.id}>
                    {idx > 0 && (
                      <div className="flex justify-center py-1">
                        <ArrowDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <SortableNode
                      node={node}
                      isSelected={selectedNodeId === node.id}
                      onSelect={() => onNodeSelect?.(node)}
                      onRemove={() => removeNode(node.id)}
                      onDuplicate={() => duplicateNode(node.id)}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {nodes.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" size="sm" onClick={() => setPaletteOpen(true)} className="gap-2">
              <Plus className="h-3.5 w-3.5" /> Ajouter une étape
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
