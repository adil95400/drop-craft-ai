import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Play, Pause, Trash2, Plus, Settings, Zap, Clock, Mail, 
  MessageSquare, Tag, Package, DollarSign, Truck, Users,
  ArrowRight, GitBranch, Repeat, Square, Circle, Diamond,
  Save, Copy, Download, Upload, Eye, EyeOff, GripVertical,
  ChevronDown, ChevronRight, AlertCircle, CheckCircle, X
} from 'lucide-react';

// Types
interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  nodes: WorkflowNode[];
  createdAt: Date;
  updatedAt: Date;
}

// Node templates
const nodeTemplates = {
  triggers: [
    { type: 'trigger', name: 'Nouvelle commande', icon: Package, category: 'orders' },
    { type: 'trigger', name: 'Produit importé', icon: Upload, category: 'products' },
    { type: 'trigger', name: 'Stock bas', icon: AlertCircle, category: 'inventory' },
    { type: 'trigger', name: 'Nouveau client', icon: Users, category: 'customers' },
    { type: 'trigger', name: 'Prix modifié', icon: DollarSign, category: 'pricing' },
    { type: 'trigger', name: 'Planification', icon: Clock, category: 'schedule' },
  ],
  conditions: [
    { type: 'condition', name: 'Si valeur égale', icon: GitBranch, operator: 'equals' },
    { type: 'condition', name: 'Si supérieur à', icon: GitBranch, operator: 'greater' },
    { type: 'condition', name: 'Si inférieur à', icon: GitBranch, operator: 'less' },
    { type: 'condition', name: 'Si contient', icon: GitBranch, operator: 'contains' },
    { type: 'condition', name: 'ET logique', icon: GitBranch, operator: 'and' },
    { type: 'condition', name: 'OU logique', icon: GitBranch, operator: 'or' },
  ],
  actions: [
    { type: 'action', name: 'Envoyer email', icon: Mail, action: 'send_email' },
    { type: 'action', name: 'Envoyer SMS', icon: MessageSquare, action: 'send_sms' },
    { type: 'action', name: 'Modifier prix', icon: DollarSign, action: 'update_price' },
    { type: 'action', name: 'Modifier stock', icon: Package, action: 'update_stock' },
    { type: 'action', name: 'Ajouter tag', icon: Tag, action: 'add_tag' },
    { type: 'action', name: 'Publier produit', icon: Upload, action: 'publish_product' },
    { type: 'action', name: 'Créer expédition', icon: Truck, action: 'create_shipment' },
    { type: 'action', name: 'Webhook', icon: Zap, action: 'webhook' },
  ],
  delays: [
    { type: 'delay', name: 'Attendre minutes', icon: Clock, unit: 'minutes' },
    { type: 'delay', name: 'Attendre heures', icon: Clock, unit: 'hours' },
    { type: 'delay', name: 'Attendre jours', icon: Clock, unit: 'days' },
  ],
};

// Node component
function WorkflowNodeCard({ 
  node, 
  isSelected, 
  onSelect, 
  onDelete, 
  onConfigure 
}: { 
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onConfigure: () => void;
}) {
  const getNodeStyle = () => {
    switch (node.type) {
      case 'trigger':
        return 'border-green-500 bg-green-500/10';
      case 'condition':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'action':
        return 'border-blue-500 bg-blue-500/10';
      case 'delay':
        return 'border-purple-500 bg-purple-500/10';
      default:
        return 'border-border bg-card';
    }
  };

  const getNodeIcon = () => {
    switch (node.type) {
      case 'trigger':
        return <Circle className="h-4 w-4 text-green-500" />;
      case 'condition':
        return <Diamond className="h-4 w-4 text-yellow-500" />;
      case 'action':
        return <Square className="h-4 w-4 text-blue-500" />;
      case 'delay':
        return <Clock className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <div
      className={cn(
        "relative group p-4 rounded-lg border-2 cursor-pointer transition-all",
        "hover:shadow-md",
        getNodeStyle(),
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={onSelect}
    >
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted border-2 border-border" />
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted border-2 border-border" />
      
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-background/50">
          {getNodeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{node.name}</span>
            <Badge variant="outline" className="text-[10px]">
              {node.type}
            </Badge>
          </div>
          {node.config.description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {node.config.description}
            </p>
          )}
        </div>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onConfigure(); }}>
          <Settings className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Main component
export function VisualWorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Auto-publish après import',
      description: 'Publie automatiquement les produits après import',
      isActive: true,
      nodes: [
        { id: 'n1', type: 'trigger', name: 'Produit importé', config: {}, position: { x: 0, y: 0 }, connections: ['n2'] },
        { id: 'n2', type: 'condition', name: 'Si prix > 10€', config: { operator: 'greater', field: 'price', value: 10 }, position: { x: 0, y: 100 }, connections: ['n3'] },
        { id: 'n3', type: 'action', name: 'Publier produit', config: { action: 'publish_product' }, position: { x: 0, y: 200 }, connections: [] },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(workflows[0]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [draggedTemplate, setDraggedTemplate] = useState<any>(null);

  const handleAddNode = useCallback((template: any) => {
    if (!selectedWorkflow) return;

    const newNode: WorkflowNode = {
      id: `n${Date.now()}`,
      type: template.type,
      name: template.name,
      config: { ...template },
      position: { x: 0, y: selectedWorkflow.nodes.length * 100 },
      connections: [],
    };

    // Connect to last node if exists
    const updatedNodes = [...selectedWorkflow.nodes];
    if (updatedNodes.length > 0) {
      const lastNode = updatedNodes[updatedNodes.length - 1];
      lastNode.connections = [newNode.id];
    }
    updatedNodes.push(newNode);

    const updatedWorkflow = {
      ...selectedWorkflow,
      nodes: updatedNodes,
      updatedAt: new Date(),
    };

    setSelectedWorkflow(updatedWorkflow);
    setWorkflows(prev => prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w));
    toast.success(`${template.name} ajouté au workflow`);
  }, [selectedWorkflow]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (!selectedWorkflow) return;

    const updatedNodes = selectedWorkflow.nodes
      .filter(n => n.id !== nodeId)
      .map(n => ({
        ...n,
        connections: n.connections.filter(c => c !== nodeId),
      }));

    const updatedWorkflow = {
      ...selectedWorkflow,
      nodes: updatedNodes,
      updatedAt: new Date(),
    };

    setSelectedWorkflow(updatedWorkflow);
    setWorkflows(prev => prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w));
    setSelectedNode(null);
    toast.success('Nœud supprimé');
  }, [selectedWorkflow]);

  const handleToggleWorkflow = useCallback((workflowId: string) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id === workflowId) {
        const updated = { ...w, isActive: !w.isActive };
        if (selectedWorkflow?.id === workflowId) {
          setSelectedWorkflow(updated);
        }
        toast.success(updated.isActive ? 'Workflow activé' : 'Workflow désactivé');
        return updated;
      }
      return w;
    }));
  }, [selectedWorkflow]);

  const handleSaveWorkflow = useCallback(() => {
    toast.success('Workflow sauvegardé');
  }, []);

  const handleCreateWorkflow = useCallback(() => {
    const newWorkflow: Workflow = {
      id: `w${Date.now()}`,
      name: 'Nouveau workflow',
      isActive: false,
      nodes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setWorkflows(prev => [...prev, newWorkflow]);
    setSelectedWorkflow(newWorkflow);
    toast.success('Nouveau workflow créé');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Éditeur de Workflows</h2>
          <p className="text-muted-foreground">
            Créez des automatisations visuelles avec glisser-déposer
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateWorkflow}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau workflow
          </Button>
          <Button onClick={handleSaveWorkflow} disabled={!selectedWorkflow}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workflows List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mes Workflows</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-4 pt-0">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all",
                      "hover:bg-accent",
                      selectedWorkflow?.id === workflow.id && "bg-accent border border-primary/20"
                    )}
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{workflow.name}</span>
                      <Switch
                        checked={workflow.isActive}
                        onCheckedChange={() => handleToggleWorkflow(workflow.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={workflow.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {workflow.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {workflow.nodes.length} nœuds
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedWorkflow?.name || 'Sélectionnez un workflow'}
              </CardTitle>
              {selectedWorkflow && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleToggleWorkflow(selectedWorkflow.id)}>
                    {selectedWorkflow.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedWorkflow ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 p-2">
                  {selectedWorkflow.nodes.map((node, index) => (
                    <React.Fragment key={node.id}>
                      <WorkflowNodeCard
                        node={node}
                        isSelected={selectedNode?.id === node.id}
                        onSelect={() => setSelectedNode(node)}
                        onDelete={() => handleDeleteNode(node.id)}
                        onConfigure={() => {
                          setSelectedNode(node);
                          setIsConfigOpen(true);
                        }}
                      />
                      {index < selectedWorkflow.nodes.length - 1 && (
                        <div className="flex justify-center">
                          <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}

                  {selectedWorkflow.nodes.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Glissez des éléments depuis le panneau de droite</p>
                      <p className="text-sm">pour construire votre workflow</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez ou créez un workflow</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Node Palette */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Éléments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="triggers" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
                <TabsTrigger value="triggers" className="text-xs">Triggers</TabsTrigger>
                <TabsTrigger value="conditions" className="text-xs">Cond.</TabsTrigger>
                <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
                <TabsTrigger value="delays" className="text-xs">Délais</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[340px]">
                <TabsContent value="triggers" className="m-0 p-4 pt-0">
                  <div className="space-y-2">
                    {nodeTemplates.triggers.map((template, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-green-500/30 bg-green-500/5 cursor-pointer hover:bg-green-500/10 transition-colors"
                        onClick={() => handleAddNode(template)}
                      >
                        <div className="flex items-center gap-2">
                          <template.icon className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">{template.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="conditions" className="m-0 p-4 pt-0">
                  <div className="space-y-2">
                    {nodeTemplates.conditions.map((template, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 cursor-pointer hover:bg-yellow-500/10 transition-colors"
                        onClick={() => handleAddNode(template)}
                      >
                        <div className="flex items-center gap-2">
                          <template.icon className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{template.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="m-0 p-4 pt-0">
                  <div className="space-y-2">
                    {nodeTemplates.actions.map((template, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors"
                        onClick={() => handleAddNode(template)}
                      >
                        <div className="flex items-center gap-2">
                          <template.icon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">{template.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="delays" className="m-0 p-4 pt-0">
                  <div className="space-y-2">
                    {nodeTemplates.delays.map((template, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5 cursor-pointer hover:bg-purple-500/10 transition-colors"
                        onClick={() => handleAddNode(template)}
                      >
                        <div className="flex items-center gap-2">
                          <template.icon className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium">{template.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Node Configuration Sheet */}
      <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Configuration du nœud</SheetTitle>
          </SheetHeader>
          {selectedNode && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nom</Label>
                <Input value={selectedNode.name} className="mt-1" readOnly />
              </div>
              <div>
                <Label>Type</Label>
                <Badge className="mt-1">{selectedNode.type}</Badge>
              </div>
              
              {selectedNode.type === 'condition' && (
                <>
                  <div>
                    <Label>Champ</Label>
                    <Select defaultValue="price">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price">Prix</SelectItem>
                        <SelectItem value="stock">Stock</SelectItem>
                        <SelectItem value="category">Catégorie</SelectItem>
                        <SelectItem value="title">Titre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valeur</Label>
                    <Input type="number" placeholder="10" className="mt-1" />
                  </div>
                </>
              )}

              {selectedNode.type === 'action' && (
                <>
                  <div>
                    <Label>Destinataire (email/webhook)</Label>
                    <Input placeholder="email@example.com" className="mt-1" />
                  </div>
                  <div>
                    <Label>Message</Label>
                    <Input placeholder="Message personnalisé..." className="mt-1" />
                  </div>
                </>
              )}

              {selectedNode.type === 'delay' && (
                <div>
                  <Label>Durée</Label>
                  <div className="flex gap-2 mt-1">
                    <Input type="number" placeholder="5" className="flex-1" />
                    <Select defaultValue="minutes">
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">min</SelectItem>
                        <SelectItem value="hours">h</SelectItem>
                        <SelectItem value="days">j</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={() => {
                setIsConfigOpen(false);
                toast.success('Configuration sauvegardée');
              }}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Appliquer
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
