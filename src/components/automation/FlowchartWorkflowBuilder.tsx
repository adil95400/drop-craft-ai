import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Play,
  Pause,
  Save,
  Plus,
  Trash2,
  Settings,
  Zap,
  Mail,
  MessageSquare,
  Clock,
  Filter,
  GitBranch,
  Database,
  Globe,
  Bell,
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  GripVertical,
  Copy,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Eye,
  Sparkles,
  Workflow,
  ChevronRight,
  ChevronDown,
  Tag,
  Repeat,
  Code,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence, Reorder } from 'framer-motion'

// Types
interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'branch'
  category: string
  name: string
  icon: any
  config: Record<string, any>
  position: { x: number; y: number }
  connections: string[]
}

interface WorkflowData {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused'
  nodes: WorkflowNode[]
  stats: {
    executions: number
    successRate: number
    lastRun?: string
  }
}

// Node definitions
const TRIGGER_NODES = [
  { type: 'trigger', category: 'order', name: 'Nouvelle commande', icon: ShoppingCart, color: 'emerald' },
  { type: 'trigger', category: 'product', name: 'Produit importé', icon: Package, color: 'blue' },
  { type: 'trigger', category: 'price', name: 'Prix modifié', icon: DollarSign, color: 'orange' },
  { type: 'trigger', category: 'stock', name: 'Stock faible', icon: AlertTriangle, color: 'red' },
  { type: 'trigger', category: 'customer', name: 'Nouveau client', icon: Users, color: 'purple' },
  { type: 'trigger', category: 'schedule', name: 'Planification', icon: Clock, color: 'cyan' },
  { type: 'trigger', category: 'webhook', name: 'Webhook reçu', icon: Globe, color: 'indigo' },
]

const CONDITION_NODES = [
  { type: 'condition', category: 'if', name: 'Si / Alors', icon: GitBranch, color: 'yellow' },
  { type: 'condition', category: 'filter', name: 'Filtre', icon: Filter, color: 'slate' },
  { type: 'condition', category: 'switch', name: 'Switch / Case', icon: Code, color: 'violet' },
]

const ACTION_NODES = [
  { type: 'action', category: 'email', name: 'Envoyer Email', icon: Mail, color: 'blue' },
  { type: 'action', category: 'sms', name: 'Envoyer SMS', icon: MessageSquare, color: 'green' },
  { type: 'action', category: 'notification', name: 'Notification', icon: Bell, color: 'amber' },
  { type: 'action', category: 'update_price', name: 'Modifier Prix', icon: DollarSign, color: 'emerald' },
  { type: 'action', category: 'update_stock', name: 'Modifier Stock', icon: Package, color: 'purple' },
  { type: 'action', category: 'add_tag', name: 'Ajouter Tag', icon: Tag, color: 'pink' },
  { type: 'action', category: 'http', name: 'Requête HTTP', icon: Globe, color: 'indigo' },
  { type: 'action', category: 'database', name: 'Base de données', icon: Database, color: 'slate' },
  { type: 'action', category: 'ai', name: 'Action IA', icon: Sparkles, color: 'violet' },
]

const CONTROL_NODES = [
  { type: 'delay', category: 'wait', name: 'Délai / Attendre', icon: Clock, color: 'gray' },
  { type: 'branch', category: 'loop', name: 'Boucle / Répéter', icon: Repeat, color: 'cyan' },
]

const ALL_NODES = [...TRIGGER_NODES, ...CONDITION_NODES, ...ACTION_NODES, ...CONTROL_NODES]

// Mock workflows
const mockWorkflows: WorkflowData[] = [
  {
    id: '1',
    name: 'Récupération panier abandonné',
    description: 'Email de relance 1h après abandon avec remise 10%',
    status: 'active',
    nodes: [
      { id: 'n1', type: 'trigger', category: 'order', name: 'Panier abandonné', icon: ShoppingCart, config: { delay: 3600 }, position: { x: 100, y: 100 }, connections: ['n2'] },
      { id: 'n2', type: 'condition', category: 'if', name: 'Valeur > 50€', icon: GitBranch, config: { field: 'cart_value', operator: '>', value: 50 }, position: { x: 100, y: 200 }, connections: ['n3'] },
      { id: 'n3', type: 'action', category: 'email', name: 'Email relance', icon: Mail, config: { template: 'cart_reminder' }, position: { x: 100, y: 300 }, connections: [] },
    ],
    stats: { executions: 1250, successRate: 32.5, lastRun: '2024-01-21T14:30:00' }
  },
  {
    id: '2',
    name: 'Alerte stock critique',
    description: 'Notification équipe si stock < 10 unités',
    status: 'active',
    nodes: [
      { id: 'n1', type: 'trigger', category: 'stock', name: 'Stock faible', icon: AlertTriangle, config: { threshold: 10 }, position: { x: 100, y: 100 }, connections: ['n2'] },
      { id: 'n2', type: 'action', category: 'notification', name: 'Notifier équipe', icon: Bell, config: { channel: 'slack' }, position: { x: 100, y: 200 }, connections: [] },
    ],
    stats: { executions: 89, successRate: 100, lastRun: '2024-01-21T09:15:00' }
  },
  {
    id: '3',
    name: 'Auto-repricing concurrentiel',
    description: 'Ajuste les prix si concurrent moins cher',
    status: 'paused',
    nodes: [
      { id: 'n1', type: 'trigger', category: 'price', name: 'Prix concurrent détecté', icon: DollarSign, config: {}, position: { x: 100, y: 100 }, connections: ['n2'] },
      { id: 'n2', type: 'condition', category: 'if', name: 'Écart > 5%', icon: GitBranch, config: { field: 'price_diff', operator: '>', value: 5 }, position: { x: 100, y: 200 }, connections: ['n3', 'n4'] },
      { id: 'n3', type: 'action', category: 'update_price', name: 'Ajuster prix', icon: DollarSign, config: { strategy: 'match' }, position: { x: 50, y: 300 }, connections: [] },
      { id: 'n4', type: 'action', category: 'notification', name: 'Alerter', icon: Bell, config: {}, position: { x: 200, y: 300 }, connections: [] },
    ],
    stats: { executions: 234, successRate: 87.3 }
  }
]

export function FlowchartWorkflowBuilder() {
  const [workflows, setWorkflows] = useState<WorkflowData[]>(mockWorkflows)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingNodes, setEditingNodes] = useState<WorkflowNode[]>([])
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [showNodePanel, setShowNodePanel] = useState(false)
  const [newWorkflowName, setNewWorkflowName] = useState('')
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('')

  const handleCreateWorkflow = () => {
    const newWorkflow: WorkflowData = {
      id: Date.now().toString(),
      name: newWorkflowName || 'Nouveau workflow',
      description: newWorkflowDesc,
      status: 'draft',
      nodes: [],
      stats: { executions: 0, successRate: 0 }
    }
    setWorkflows(prev => [newWorkflow, ...prev])
    setSelectedWorkflow(newWorkflow)
    setEditingNodes([])
    setIsEditing(true)
    setNewWorkflowName('')
    setNewWorkflowDesc('')
    toast.success('Workflow créé')
  }

  const handleAddNode = (nodeTemplate: typeof ALL_NODES[0]) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeTemplate.type as WorkflowNode['type'],
      category: nodeTemplate.category,
      name: nodeTemplate.name,
      icon: nodeTemplate.icon,
      config: {},
      position: { x: 100, y: (editingNodes.length + 1) * 120 },
      connections: []
    }
    
    // Auto-connect to previous node
    if (editingNodes.length > 0) {
      const lastNode = editingNodes[editingNodes.length - 1]
      setEditingNodes(prev => prev.map(n => 
        n.id === lastNode.id ? { ...n, connections: [...n.connections, newNode.id] } : n
      ))
    }
    
    setEditingNodes(prev => [...prev, newNode])
    setSelectedNode(newNode)
    setShowNodePanel(true)
    toast.success(`${nodeTemplate.name} ajouté`)
  }

  const handleRemoveNode = (nodeId: string) => {
    setEditingNodes(prev => prev.filter(n => n.id !== nodeId).map(n => ({
      ...n,
      connections: n.connections.filter(c => c !== nodeId)
    })))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
      setShowNodePanel(false)
    }
    toast.success('Nœud supprimé')
  }

  const handleUpdateNodeConfig = (nodeId: string, config: Record<string, any>) => {
    setEditingNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n
    ))
  }

  const handleSaveWorkflow = () => {
    if (selectedWorkflow) {
      setWorkflows(prev => prev.map(w => 
        w.id === selectedWorkflow.id ? { ...w, nodes: editingNodes } : w
      ))
      toast.success('Workflow sauvegardé')
    }
  }

  const handleToggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id === workflowId) {
        const newStatus = w.status === 'active' ? 'paused' : 'active'
        toast.success(`Workflow ${newStatus === 'active' ? 'activé' : 'mis en pause'}`)
        return { ...w, status: newStatus }
      }
      return w
    }))
  }

  const handleExecuteWorkflow = (workflowId: string) => {
    toast.success('Workflow exécuté avec succès')
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, stats: { ...w.stats, executions: w.stats.executions + 1, lastRun: new Date().toISOString() } } : w
    ))
  }

  const getNodeColor = (category: string) => {
    const colors: Record<string, string> = {
      order: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
      product: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
      price: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
      stock: 'bg-red-500/10 border-red-500/30 text-red-500',
      customer: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
      schedule: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500',
      webhook: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500',
      if: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
      filter: 'bg-slate-500/10 border-slate-500/30 text-slate-500',
      switch: 'bg-violet-500/10 border-violet-500/30 text-violet-500',
      email: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
      sms: 'bg-green-500/10 border-green-500/30 text-green-500',
      notification: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
      update_price: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
      update_stock: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
      add_tag: 'bg-pink-500/10 border-pink-500/30 text-pink-500',
      http: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500',
      database: 'bg-slate-500/10 border-slate-500/30 text-slate-500',
      ai: 'bg-violet-500/10 border-violet-500/30 text-violet-500',
      wait: 'bg-gray-500/10 border-gray-500/30 text-gray-500',
      loop: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500',
    }
    return colors[category] || 'bg-muted border-border'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" />
            Constructeur de Workflows Visuel
          </h2>
          <p className="text-muted-foreground">
            Créez des automatisations if/then avec un éditeur flowchart
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => { setIsEditing(false); setSelectedWorkflow(null) }}>
                Annuler
              </Button>
              <Button onClick={handleSaveWorkflow}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </>
          ) : (
            <Button onClick={() => {
              setIsEditing(true)
              setEditingNodes([])
              setSelectedWorkflow(null)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Workflow
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Workflows actifs</p>
                <p className="text-2xl font-bold">{workflows.filter(w => w.status === 'active').length}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exécutions totales</p>
                <p className="text-2xl font-bold">{workflows.reduce((acc, w) => acc + w.stats.executions, 0).toLocaleString()}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de succès</p>
                <p className="text-2xl font-bold">
                  {(workflows.reduce((acc, w) => acc + w.stats.successRate, 0) / workflows.length || 0).toFixed(1)}%
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nœuds totaux</p>
                <p className="text-2xl font-bold">{workflows.reduce((acc, w) => acc + w.nodes.length, 0)}</p>
              </div>
              <GitBranch className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {isEditing ? (
        /* Editor Mode */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Node Library */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bibliothèque de nœuds</CardTitle>
              <CardDescription>Cliquez pour ajouter au workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {/* Triggers */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                      <Zap className="h-3 w-3" />
                      Déclencheurs
                    </h4>
                    <div className="space-y-1">
                      {TRIGGER_NODES.map(node => (
                        <button
                          key={node.category}
                          onClick={() => handleAddNode(node)}
                          className={`w-full p-2 rounded-lg border text-left text-sm flex items-center gap-2 transition-all hover:scale-[1.02] ${getNodeColor(node.category)}`}
                        >
                          <node.icon className="h-4 w-4" />
                          {node.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conditions */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                      <GitBranch className="h-3 w-3" />
                      Conditions
                    </h4>
                    <div className="space-y-1">
                      {CONDITION_NODES.map(node => (
                        <button
                          key={node.category}
                          onClick={() => handleAddNode(node)}
                          className={`w-full p-2 rounded-lg border text-left text-sm flex items-center gap-2 transition-all hover:scale-[1.02] ${getNodeColor(node.category)}`}
                        >
                          <node.icon className="h-4 w-4" />
                          {node.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                      <Play className="h-3 w-3" />
                      Actions
                    </h4>
                    <div className="space-y-1">
                      {ACTION_NODES.map(node => (
                        <button
                          key={node.category}
                          onClick={() => handleAddNode(node)}
                          className={`w-full p-2 rounded-lg border text-left text-sm flex items-center gap-2 transition-all hover:scale-[1.02] ${getNodeColor(node.category)}`}
                        >
                          <node.icon className="h-4 w-4" />
                          {node.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Control */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Contrôle
                    </h4>
                    <div className="space-y-1">
                      {CONTROL_NODES.map(node => (
                        <button
                          key={node.category}
                          onClick={() => handleAddNode(node)}
                          className={`w-full p-2 rounded-lg border text-left text-sm flex items-center gap-2 transition-all hover:scale-[1.02] ${getNodeColor(node.category)}`}
                        >
                          <node.icon className="h-4 w-4" />
                          {node.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Canvas */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Canvas du Workflow</CardTitle>
                  <CardDescription>{editingNodes.length} nœud(s)</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingNodes([])}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[500px] border border-dashed border-border rounded-lg bg-muted/20 p-4 relative">
                {editingNodes.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Workflow className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Ajoutez des nœuds depuis la bibliothèque</p>
                      <p className="text-sm">Commencez par un déclencheur</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {editingNodes.map((node, index) => {
                        const Icon = node.icon
                        return (
                          <motion.div
                            key={node.id}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative"
                          >
                            {/* Connection Line */}
                            {index > 0 && (
                              <div className="flex justify-center py-2">
                                <div className="w-0.5 h-6 bg-border" />
                                <ArrowRight className="h-4 w-4 text-muted-foreground absolute -mt-1 rotate-90" style={{ marginTop: '4px' }} />
                              </div>
                            )}
                            
                            {/* Node */}
                            <div
                              onClick={() => {
                                setSelectedNode(node)
                                setShowNodePanel(true)
                              }}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                                selectedNode?.id === node.id 
                                  ? 'ring-2 ring-primary ring-offset-2' 
                                  : ''
                              } ${getNodeColor(node.category)}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-background/50">
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{node.name}</p>
                                    <p className="text-xs opacity-70">
                                      {node.type === 'trigger' ? 'Déclencheur' :
                                       node.type === 'condition' ? 'Condition' :
                                       node.type === 'action' ? 'Action' : 'Contrôle'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedNode(node)
                                      setShowNodePanel(true)
                                    }}
                                  >
                                    <Settings className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveNode(node.id)
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Config Preview */}
                              {Object.keys(node.config).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-current/10">
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(node.config).slice(0, 3).map(([key, value]) => (
                                      <Badge key={key} variant="secondary" className="text-xs">
                                        {key}: {String(value).substring(0, 15)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Node Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Configuration</CardTitle>
              <CardDescription>
                {selectedNode ? `Configurer: ${selectedNode.name}` : 'Sélectionnez un nœud'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <NodeConfigPanel 
                  node={selectedNode} 
                  onUpdate={(config) => handleUpdateNodeConfig(selectedNode.id, config)}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Cliquez sur un nœud pour le configurer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Workflow List Mode */
        <div className="space-y-4">
          {/* Create New Workflow Card */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nom du workflow</Label>
                  <Input 
                    placeholder="Ex: Alerte stock critique"
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    placeholder="Description optionnelle"
                    value={newWorkflowDesc}
                    onChange={(e) => setNewWorkflowDesc(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCreateWorkflow} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer et éditer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflows Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map(workflow => (
              <Card 
                key={workflow.id}
                className={`cursor-pointer hover:shadow-lg transition-all ${
                  workflow.status === 'active' ? 'border-green-500/30' : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{workflow.name}</CardTitle>
                      <CardDescription className="line-clamp-1">{workflow.description}</CardDescription>
                    </div>
                    <Switch 
                      checked={workflow.status === 'active'}
                      onCheckedChange={() => handleToggleWorkflow(workflow.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Visual Flow Preview */}
                  <div className="mb-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 flex-wrap">
                      {workflow.nodes.slice(0, 4).map((node, idx) => {
                        const Icon = node.icon
                        return (
                          <div key={node.id} className="flex items-center gap-1">
                            <div className={`p-1.5 rounded ${getNodeColor(node.category)}`}>
                              <Icon className="h-3 w-3" />
                            </div>
                            {idx < Math.min(workflow.nodes.length - 1, 3) && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        )
                      })}
                      {workflow.nodes.length > 4 && (
                        <Badge variant="secondary" className="text-xs">+{workflow.nodes.length - 4}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground text-xs">Exécutions</p>
                      <p className="font-semibold">{workflow.stats.executions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Succès</p>
                      <p className="font-semibold text-green-500">{workflow.stats.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Nœuds</p>
                      <p className="font-semibold">{workflow.nodes.length}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedWorkflow(workflow)
                        setEditingNodes([...workflow.nodes])
                        setIsEditing(true)
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Éditer
                    </Button>
                    <Button 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleExecuteWorkflow(workflow.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Exécuter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Node Configuration Panel Component
function NodeConfigPanel({ node, onUpdate }: { node: WorkflowNode; onUpdate: (config: Record<string, any>) => void }) {
  const [localConfig, setLocalConfig] = useState(node.config)

  const handleChange = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value }
    setLocalConfig(newConfig)
    onUpdate(newConfig)
  }

  const renderConfigFields = () => {
    switch (node.category) {
      case 'if':
      case 'filter':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Champ</Label>
              <Select value={localConfig.field || ''} onValueChange={(v) => handleChange('field', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cart_value">Valeur panier</SelectItem>
                  <SelectItem value="stock_quantity">Quantité stock</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                  <SelectItem value="customer_type">Type client</SelectItem>
                  <SelectItem value="order_total">Total commande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Opérateur</Label>
              <Select value={localConfig.operator || '='} onValueChange={(v) => handleChange('operator', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="=">Égal à</SelectItem>
                  <SelectItem value="!=">Différent de</SelectItem>
                  <SelectItem value=">">Supérieur à</SelectItem>
                  <SelectItem value="<">Inférieur à</SelectItem>
                  <SelectItem value=">=">Supérieur ou égal</SelectItem>
                  <SelectItem value="<=">Inférieur ou égal</SelectItem>
                  <SelectItem value="contains">Contient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valeur</Label>
              <Input 
                placeholder="Ex: 50"
                value={localConfig.value || ''}
                onChange={(e) => handleChange('value', e.target.value)}
              />
            </div>
          </div>
        )

      case 'email':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template email</Label>
              <Select value={localConfig.template || ''} onValueChange={(v) => handleChange('template', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cart_reminder">Rappel panier</SelectItem>
                  <SelectItem value="welcome">Bienvenue</SelectItem>
                  <SelectItem value="order_confirmation">Confirmation commande</SelectItem>
                  <SelectItem value="stock_alert">Alerte stock</SelectItem>
                  <SelectItem value="price_drop">Baisse de prix</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sujet personnalisé (optionnel)</Label>
              <Input 
                placeholder="Laisser vide pour utiliser le template"
                value={localConfig.subject || ''}
                onChange={(e) => handleChange('subject', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={localConfig.includeDiscount || false}
                onCheckedChange={(v) => handleChange('includeDiscount', v)}
              />
              <Label>Inclure code promo</Label>
            </div>
          </div>
        )

      case 'notification':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={localConfig.channel || 'app'} onValueChange={(v) => handleChange('channel', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="app">Notification App</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea 
                placeholder="Message de notification..."
                value={localConfig.message || ''}
                onChange={(e) => handleChange('message', e.target.value)}
              />
            </div>
          </div>
        )

      case 'update_price':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stratégie</Label>
              <Select value={localConfig.strategy || 'match'} onValueChange={(v) => handleChange('strategy', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Aligner sur concurrent</SelectItem>
                  <SelectItem value="undercut">Sous-coter de X%</SelectItem>
                  <SelectItem value="fixed_margin">Marge fixe</SelectItem>
                  <SelectItem value="dynamic">Dynamique IA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marge minimum (%)</Label>
              <Input 
                type="number"
                placeholder="10"
                value={localConfig.minMargin || ''}
                onChange={(e) => handleChange('minMargin', e.target.value)}
              />
            </div>
          </div>
        )

      case 'wait':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Durée</Label>
              <div className="flex gap-2">
                <Input 
                  type="number"
                  placeholder="1"
                  value={localConfig.duration || ''}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  className="flex-1"
                />
                <Select value={localConfig.unit || 'hours'} onValueChange={(v) => handleChange('unit', v)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Heures</SelectItem>
                    <SelectItem value="days">Jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 'stock':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seuil de stock</Label>
              <Input 
                type="number"
                placeholder="10"
                value={localConfig.threshold || ''}
                onChange={(e) => handleChange('threshold', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={localConfig.includeVariants || false}
                onCheckedChange={(v) => handleChange('includeVariants', v)}
              />
              <Label>Inclure les variantes</Label>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Configuration JSON</Label>
              <Textarea 
                placeholder='{"key": "value"}'
                value={JSON.stringify(localConfig, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    setLocalConfig(parsed)
                    onUpdate(parsed)
                  } catch {}
                }}
                className="font-mono text-sm"
                rows={6}
              />
            </div>
          </div>
        )
    }
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        <div className={`p-3 rounded-lg ${getNodeColor(node.category)}`}>
          <div className="flex items-center gap-2">
            <node.icon className="h-5 w-5" />
            <div>
              <p className="font-medium">{node.name}</p>
              <p className="text-xs opacity-70">{node.type}</p>
            </div>
          </div>
        </div>
        
        {renderConfigFields()}
      </div>
    </ScrollArea>
  )
}

// Helper function to get node color (duplicated for use in NodeConfigPanel)
function getNodeColor(category: string) {
  const colors: Record<string, string> = {
    order: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
    product: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
    price: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
    stock: 'bg-red-500/10 border-red-500/30 text-red-500',
    customer: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
    schedule: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500',
    webhook: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500',
    if: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
    filter: 'bg-slate-500/10 border-slate-500/30 text-slate-500',
    switch: 'bg-violet-500/10 border-violet-500/30 text-violet-500',
    email: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
    sms: 'bg-green-500/10 border-green-500/30 text-green-500',
    notification: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    update_price: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
    update_stock: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
    add_tag: 'bg-pink-500/10 border-pink-500/30 text-pink-500',
    http: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500',
    database: 'bg-slate-500/10 border-slate-500/30 text-slate-500',
    ai: 'bg-violet-500/10 border-violet-500/30 text-violet-500',
    wait: 'bg-gray-500/10 border-gray-500/30 text-gray-500',
    loop: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500',
  }
  return colors[category] || 'bg-muted border-border'
}
