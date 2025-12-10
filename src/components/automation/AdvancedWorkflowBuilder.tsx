/**
 * Advanced Workflow Builder - Éditeur visuel complet style Shopify Flow
 * Avec conditions ET/OU multiples, boucles, et intégrations externes
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Play, Pause, Save, Plus, Trash2, Settings, Zap, Mail, MessageSquare, Clock,
  Filter, GitBranch, Database, Globe, Bell, ShoppingCart, Package, DollarSign,
  Users, AlertTriangle, TrendingUp, ArrowRight, GripVertical, Copy, MoreVertical,
  CheckCircle2, XCircle, Eye, Sparkles, Workflow, ChevronRight, ChevronDown,
  Tag, Repeat, Code, RefreshCw, Slack, Webhook, Link2, ExternalLink, Boxes,
  ArrowDown, ArrowUp, LogIn, LogOut, Shuffle, Split, Merge, Circle, Square,
  Triangle, Hexagon, RotateCcw, Timer, Send, FileText, Image, BarChart3,
  Calculator, Search, X, Check, Move, Hand
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

// Types avancés
interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'loop' | 'branch' | 'merge' | 'end'
  category: string
  name: string
  icon: any
  config: Record<string, any>
  position: { x: number; y: number }
  connections: {
    next: string[]
    yes?: string
    no?: string
  }
  conditionGroup?: ConditionGroup
  loopConfig?: LoopConfig
}

interface ConditionGroup {
  operator: 'AND' | 'OR'
  conditions: Condition[]
  groups: ConditionGroup[]
}

interface Condition {
  id: string
  field: string
  operator: string
  value: string | number
  dataType: 'string' | 'number' | 'boolean' | 'date'
}

interface LoopConfig {
  type: 'count' | 'collection' | 'while'
  count?: number
  collection?: string
  whileCondition?: Condition
  maxIterations: number
}

interface WorkflowData {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused'
  nodes: WorkflowNode[]
  integrations: IntegrationConfig[]
  stats: {
    executions: number
    successRate: number
    avgDuration: number
    lastRun?: string
  }
}

interface IntegrationConfig {
  id: string
  type: 'zapier' | 'make' | 'slack' | 'webhook' | 'crm'
  name: string
  config: Record<string, any>
  enabled: boolean
}

// Définition des nœuds disponibles
const TRIGGER_NODES = [
  { type: 'trigger', category: 'order', name: 'Nouvelle commande', icon: ShoppingCart, color: 'emerald', description: 'Déclenché lors d\'une nouvelle commande' },
  { type: 'trigger', category: 'product', name: 'Produit importé', icon: Package, color: 'blue', description: 'Déclenché après import de produit' },
  { type: 'trigger', category: 'price', name: 'Prix modifié', icon: DollarSign, color: 'orange', description: 'Détection de changement de prix' },
  { type: 'trigger', category: 'stock', name: 'Stock faible', icon: AlertTriangle, color: 'red', description: 'Alerte stock sous seuil' },
  { type: 'trigger', category: 'customer', name: 'Nouveau client', icon: Users, color: 'purple', description: 'Inscription client' },
  { type: 'trigger', category: 'schedule', name: 'Planification', icon: Clock, color: 'cyan', description: 'Exécution programmée (cron)' },
  { type: 'trigger', category: 'webhook', name: 'Webhook entrant', icon: Globe, color: 'indigo', description: 'Réception webhook externe' },
  { type: 'trigger', category: 'enrichment', name: 'Enrichissement IA', icon: Sparkles, color: 'violet', description: 'Fin d\'enrichissement IA' },
]

const CONDITION_NODES = [
  { type: 'condition', category: 'if_then', name: 'Si / Alors', icon: GitBranch, color: 'yellow', description: 'Branche conditionnelle simple' },
  { type: 'condition', category: 'if_and', name: 'Si (ET)', icon: Merge, color: 'amber', description: 'Conditions multiples ET' },
  { type: 'condition', category: 'if_or', name: 'Si (OU)', icon: Split, color: 'orange', description: 'Conditions multiples OU' },
  { type: 'condition', category: 'switch', name: 'Switch / Case', icon: Shuffle, color: 'lime', description: 'Branchement multiple' },
  { type: 'condition', category: 'filter', name: 'Filtre avancé', icon: Filter, color: 'slate', description: 'Filtrage de données' },
]

const ACTION_NODES = [
  { type: 'action', category: 'email', name: 'Envoyer Email', icon: Mail, color: 'blue', description: 'Envoi email personnalisé' },
  { type: 'action', category: 'sms', name: 'Envoyer SMS', icon: MessageSquare, color: 'green', description: 'SMS via Twilio/Vonage' },
  { type: 'action', category: 'notification', name: 'Notification Push', icon: Bell, color: 'amber', description: 'Notification interne' },
  { type: 'action', category: 'update_price', name: 'Modifier Prix', icon: DollarSign, color: 'emerald', description: 'Ajustement automatique prix' },
  { type: 'action', category: 'update_stock', name: 'Modifier Stock', icon: Package, color: 'purple', description: 'Mise à jour inventaire' },
  { type: 'action', category: 'duplicate_product', name: 'Dupliquer Produit', icon: Copy, color: 'indigo', description: 'Clone produit avec modifications' },
  { type: 'action', category: 'add_tag', name: 'Ajouter Tag', icon: Tag, color: 'pink', description: 'Taguer produit/commande' },
  { type: 'action', category: 'ai_optimize', name: 'Optimisation IA', icon: Sparkles, color: 'violet', description: 'Enrichissement SEO/contenu IA' },
  { type: 'action', category: 'publish', name: 'Publier Canal', icon: Send, color: 'cyan', description: 'Publication multi-canal' },
  { type: 'action', category: 'http', name: 'Requête HTTP', icon: Globe, color: 'indigo', description: 'Appel API externe' },
  { type: 'action', category: 'database', name: 'Base de données', icon: Database, color: 'slate', description: 'Opération BDD' },
]

const INTEGRATION_NODES = [
  { type: 'action', category: 'zapier', name: 'Zapier', icon: Zap, color: 'orange', description: 'Déclencher Zap Zapier' },
  { type: 'action', category: 'make', name: 'Make (Integromat)', icon: Boxes, color: 'purple', description: 'Scénario Make' },
  { type: 'action', category: 'slack', name: 'Slack', icon: Slack, color: 'green', description: 'Message Slack' },
  { type: 'action', category: 'webhook_out', name: 'Webhook sortant', icon: Webhook, color: 'blue', description: 'Envoyer webhook' },
  { type: 'action', category: 'crm', name: 'CRM (HubSpot/Salesforce)', icon: Users, color: 'red', description: 'Action CRM' },
]

const CONTROL_NODES = [
  { type: 'delay', category: 'wait', name: 'Délai', icon: Timer, color: 'gray', description: 'Attendre avant de continuer' },
  { type: 'loop', category: 'loop', name: 'Boucle', icon: Repeat, color: 'cyan', description: 'Répéter des actions' },
  { type: 'branch', category: 'parallel', name: 'Exécution Parallèle', icon: Split, color: 'violet', description: 'Branches parallèles' },
  { type: 'merge', category: 'merge', name: 'Fusionner', icon: Merge, color: 'emerald', description: 'Rejoindre les branches' },
  { type: 'end', category: 'end', name: 'Fin', icon: Square, color: 'red', description: 'Terminer le workflow' },
]

const ALL_NODE_TYPES = [
  { label: 'Déclencheurs', nodes: TRIGGER_NODES },
  { label: 'Conditions', nodes: CONDITION_NODES },
  { label: 'Actions', nodes: ACTION_NODES },
  { label: 'Intégrations', nodes: INTEGRATION_NODES },
  { label: 'Contrôle', nodes: CONTROL_NODES },
]

const OPERATORS = [
  { value: 'equals', label: 'Égal à', types: ['string', 'number', 'boolean'] },
  { value: 'not_equals', label: 'Différent de', types: ['string', 'number', 'boolean'] },
  { value: 'greater_than', label: 'Supérieur à', types: ['number', 'date'] },
  { value: 'greater_or_equal', label: 'Supérieur ou égal à', types: ['number', 'date'] },
  { value: 'less_than', label: 'Inférieur à', types: ['number', 'date'] },
  { value: 'less_or_equal', label: 'Inférieur ou égal à', types: ['number', 'date'] },
  { value: 'contains', label: 'Contient', types: ['string'] },
  { value: 'not_contains', label: 'Ne contient pas', types: ['string'] },
  { value: 'starts_with', label: 'Commence par', types: ['string'] },
  { value: 'ends_with', label: 'Termine par', types: ['string'] },
  { value: 'is_empty', label: 'Est vide', types: ['string'] },
  { value: 'is_not_empty', label: 'N\'est pas vide', types: ['string'] },
  { value: 'exists', label: 'Existe', types: ['string', 'number', 'boolean'] },
  { value: 'not_exists', label: 'N\'existe pas', types: ['string', 'number', 'boolean'] },
]

const AVAILABLE_FIELDS = [
  { value: 'product.name', label: 'Nom du produit', type: 'string' },
  { value: 'product.price', label: 'Prix du produit', type: 'number' },
  { value: 'product.stock', label: 'Stock', type: 'number' },
  { value: 'product.category', label: 'Catégorie', type: 'string' },
  { value: 'product.brand', label: 'Marque', type: 'string' },
  { value: 'product.margin', label: 'Marge (%)', type: 'number' },
  { value: 'order.total', label: 'Total commande', type: 'number' },
  { value: 'order.status', label: 'Statut commande', type: 'string' },
  { value: 'order.items_count', label: 'Nombre d\'articles', type: 'number' },
  { value: 'customer.email', label: 'Email client', type: 'string' },
  { value: 'customer.total_orders', label: 'Commandes client', type: 'number' },
  { value: 'competitor.price', label: 'Prix concurrent', type: 'number' },
  { value: 'supplier.stock', label: 'Stock fournisseur', type: 'number' },
]

export function AdvancedWorkflowBuilder() {
  const queryClient = useQueryClient()
  const canvasRef = useRef<HTMLDivElement>(null)
  
  const [workflow, setWorkflow] = useState<WorkflowData>({
    id: '',
    name: 'Nouveau workflow',
    description: '',
    status: 'draft',
    nodes: [],
    integrations: [],
    stats: { executions: 0, successRate: 0, avgDuration: 0 }
  })
  
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [showNodeConfig, setShowNodeConfig] = useState(false)
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNodeType, setDraggedNodeType] = useState<any>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Charger les workflows existants
  const { data: workflows = [] } = useQuery({
    queryKey: ['advanced-workflows'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

  // Sauvegarder le workflow
  const saveWorkflowMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const workflowData = {
        user_id: user.id,
        name: workflow.name,
        description: workflow.description,
        trigger_type: workflow.nodes.find(n => n.type === 'trigger')?.category || 'manual',
        trigger_config: workflow.nodes.find(n => n.type === 'trigger')?.config || {},
        steps: workflow.nodes as any,
        status: workflow.status
      }

      if (workflow.id) {
        const { error } = await supabase
          .from('automation_workflows')
          .update(workflowData)
          .eq('id', workflow.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('automation_workflows')
          .insert(workflowData)
          .select()
          .single()
        if (error) throw error
        setWorkflow(prev => ({ ...prev, id: data.id }))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-workflows'] })
      toast.success('Workflow sauvegardé')
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`)
    }
  })

  // Ajouter un nœud
  const addNode = useCallback((nodeType: any, position?: { x: number; y: number }) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: nodeType.type,
      category: nodeType.category,
      name: nodeType.name,
      icon: nodeType.icon,
      config: getDefaultConfig(nodeType.category),
      position: position || { x: 200, y: (workflow.nodes.length + 1) * 120 },
      connections: { next: [] },
      ...(nodeType.category.includes('if') && {
        conditionGroup: { operator: 'AND', conditions: [], groups: [] }
      }),
      ...(nodeType.type === 'loop' && {
        loopConfig: { type: 'count', count: 10, maxIterations: 100 }
      })
    }

    // Auto-connexion au dernier nœud
    if (workflow.nodes.length > 0) {
      const lastNode = workflow.nodes[workflow.nodes.length - 1]
      setWorkflow(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === lastNode.id
            ? { ...n, connections: { ...n.connections, next: [...n.connections.next, newNode.id] } }
            : n
        ).concat([newNode])
      }))
    } else {
      setWorkflow(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }))
    }

    setSelectedNode(newNode)
    setShowNodeConfig(true)
    toast.success(`${nodeType.name} ajouté`)
  }, [workflow.nodes])

  // Supprimer un nœud
  const removeNode = useCallback((nodeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes
        .filter(n => n.id !== nodeId)
        .map(n => ({
          ...n,
          connections: {
            ...n.connections,
            next: n.connections.next.filter(id => id !== nodeId),
            yes: n.connections.yes === nodeId ? undefined : n.connections.yes,
            no: n.connections.no === nodeId ? undefined : n.connections.no
          }
        }))
    }))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
      setShowNodeConfig(false)
    }
    toast.success('Nœud supprimé')
  }, [selectedNode])

  // Mettre à jour la config d'un nœud
  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, any>) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n
      )
    }))
  }, [])

  // Mettre à jour les conditions
  const updateNodeConditions = useCallback((nodeId: string, conditionGroup: ConditionGroup) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId ? { ...n, conditionGroup } : n
      )
    }))
  }, [])

  // Config par défaut selon le type
  const getDefaultConfig = (category: string): Record<string, any> => {
    const configs: Record<string, any> = {
      email: { to: '{{customer.email}}', subject: '', body: '', template: '' },
      sms: { to: '{{customer.phone}}', message: '' },
      notification: { title: '', message: '', type: 'info', channels: ['app'] },
      update_price: { strategy: 'percentage', value: 0, minMargin: 10 },
      update_stock: { operation: 'set', value: 0 },
      duplicate_product: { suffix: '_copy', modifications: {} },
      add_tag: { tags: [] },
      ai_optimize: { fields: ['title', 'description'], model: 'gpt-4' },
      publish: { channels: [] },
      http: { url: '', method: 'POST', headers: {}, body: {} },
      database: { operation: 'insert', table: '', data: {} },
      zapier: { webhookUrl: '', payload: {} },
      make: { webhookUrl: '', scenario: '' },
      slack: { channel: '', message: '', mention: '' },
      webhook_out: { url: '', method: 'POST', headers: {}, payload: {} },
      crm: { action: 'create_contact', data: {} },
      wait: { duration: 60, unit: 'seconds' },
      loop: { type: 'count', count: 10, maxIterations: 100 },
      if_then: { field: '', operator: 'equals', value: '' },
      if_and: { conditions: [] },
      if_or: { conditions: [] },
      switch: { field: '', cases: [] },
      filter: { conditions: [] }
    }
    return configs[category] || {}
  }

  // Obtenir la couleur d'un nœud
  const getNodeColor = (category: string): string => {
    const colors: Record<string, string> = {
      order: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40',
      product: 'from-blue-500/20 to-blue-600/10 border-blue-500/40',
      price: 'from-orange-500/20 to-orange-600/10 border-orange-500/40',
      stock: 'from-red-500/20 to-red-600/10 border-red-500/40',
      customer: 'from-purple-500/20 to-purple-600/10 border-purple-500/40',
      schedule: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/40',
      webhook: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/40',
      enrichment: 'from-violet-500/20 to-violet-600/10 border-violet-500/40',
      if_then: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/40',
      if_and: 'from-amber-500/20 to-amber-600/10 border-amber-500/40',
      if_or: 'from-orange-500/20 to-orange-600/10 border-orange-500/40',
      switch: 'from-lime-500/20 to-lime-600/10 border-lime-500/40',
      filter: 'from-slate-500/20 to-slate-600/10 border-slate-500/40',
      email: 'from-blue-500/20 to-blue-600/10 border-blue-500/40',
      sms: 'from-green-500/20 to-green-600/10 border-green-500/40',
      notification: 'from-amber-500/20 to-amber-600/10 border-amber-500/40',
      update_price: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40',
      update_stock: 'from-purple-500/20 to-purple-600/10 border-purple-500/40',
      duplicate_product: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/40',
      add_tag: 'from-pink-500/20 to-pink-600/10 border-pink-500/40',
      ai_optimize: 'from-violet-500/20 to-violet-600/10 border-violet-500/40',
      publish: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/40',
      http: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/40',
      database: 'from-slate-500/20 to-slate-600/10 border-slate-500/40',
      zapier: 'from-orange-500/20 to-orange-600/10 border-orange-500/40',
      make: 'from-purple-500/20 to-purple-600/10 border-purple-500/40',
      slack: 'from-green-500/20 to-green-600/10 border-green-500/40',
      webhook_out: 'from-blue-500/20 to-blue-600/10 border-blue-500/40',
      crm: 'from-red-500/20 to-red-600/10 border-red-500/40',
      wait: 'from-gray-500/20 to-gray-600/10 border-gray-500/40',
      loop: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/40',
      parallel: 'from-violet-500/20 to-violet-600/10 border-violet-500/40',
      merge: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40',
      end: 'from-red-500/20 to-red-600/10 border-red-500/40',
    }
    return colors[category] || 'from-muted/50 to-muted/30 border-border'
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" />
            <Input
              value={workflow.name}
              onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
              className="text-lg font-semibold bg-transparent border-0 focus-visible:ring-1 w-[300px]"
              placeholder="Nom du workflow..."
            />
          </div>
          <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
            {workflow.status === 'active' ? 'Actif' : workflow.status === 'paused' ? 'Pausé' : 'Brouillon'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowIntegrations(true)}>
            <Link2 className="h-4 w-4 mr-2" />
            Intégrations
          </Button>
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Tester
          </Button>
          <Button size="sm" onClick={() => saveWorkflowMutation.mutate()}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Panneau gauche - Bibliothèque de nœuds */}
        <div className="w-72 border-r bg-muted/30 overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Bibliothèque</h3>
            <p className="text-xs text-muted-foreground">Cliquez pour ajouter</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {ALL_NODE_TYPES.map(group => (
                <div key={group.label}>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    {group.label}
                  </h4>
                  <div className="space-y-1">
                    {group.nodes.map(node => {
                      const Icon = node.icon
                      return (
                        <motion.button
                          key={node.category}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => addNode(node)}
                          className={`w-full p-2.5 rounded-lg border bg-gradient-to-r ${getNodeColor(node.category)} text-left text-sm flex items-center gap-2 transition-all hover:shadow-md`}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{node.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {node.description}
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Canvas principal */}
        <div className="flex-1 relative overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:20px_20px]">
          <div ref={canvasRef} className="min-h-full p-8">
            {workflow.nodes.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <Card className="p-8 text-center max-w-md">
                  <Workflow className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Commencez votre workflow</h3>
                  <p className="text-muted-foreground mb-4">
                    Sélectionnez un déclencheur dans la bibliothèque pour démarrer
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {TRIGGER_NODES.slice(0, 4).map(node => {
                      const Icon = node.icon
                      return (
                        <Button
                          key={node.category}
                          variant="outline"
                          size="sm"
                          onClick={() => addNode(node)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {node.name}
                        </Button>
                      )
                    })}
                  </div>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                {workflow.nodes.map((node, index) => {
                  const Icon = node.icon
                  const isSelected = selectedNode?.id === node.id
                  
                  return (
                    <div key={node.id} className="relative">
                      {/* Connecteur vers le nœud précédent */}
                      {index > 0 && (
                        <div className="flex justify-center py-2">
                          <div className="flex flex-col items-center">
                            <div className="w-0.5 h-6 bg-border" />
                            <ArrowDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      )}
                      
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`relative mx-auto max-w-md p-4 rounded-xl border-2 bg-gradient-to-r cursor-pointer transition-all ${getNodeColor(node.category)} ${
                          isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:shadow-lg'
                        }`}
                        onClick={() => {
                          setSelectedNode(node)
                          setShowNodeConfig(true)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-background/80`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{node.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {node.type === 'trigger' && 'Déclencheur'}
                              {node.type === 'condition' && 'Condition'}
                              {node.type === 'action' && 'Action'}
                              {node.type === 'delay' && 'Contrôle'}
                              {node.type === 'loop' && 'Boucle'}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedNode(node)
                                setShowNodeConfig(true)
                              }}
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeNode(node.id)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Badge de type */}
                        <Badge
                          variant="secondary"
                          className="absolute -top-2 -right-2 text-[10px] px-1.5"
                        >
                          {index + 1}
                        </Badge>
                      </motion.div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panneau de configuration du nœud */}
        <Sheet open={showNodeConfig} onOpenChange={setShowNodeConfig}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {selectedNode && (
                  <>
                    {(() => {
                      const Icon = selectedNode.icon
                      return <Icon className="h-5 w-5" />
                    })()}
                    {selectedNode.name}
                  </>
                )}
              </SheetTitle>
              <SheetDescription>
                Configurez les paramètres de ce nœud
              </SheetDescription>
            </SheetHeader>
            
            {selectedNode && (
              <ScrollArea className="h-[calc(100vh-10rem)] mt-4">
                <NodeConfigPanel
                  node={selectedNode}
                  onUpdateConfig={(config) => updateNodeConfig(selectedNode.id, config)}
                  onUpdateConditions={(conditions) => updateNodeConditions(selectedNode.id, conditions)}
                />
              </ScrollArea>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Dialog Intégrations */}
      <Dialog open={showIntegrations} onOpenChange={setShowIntegrations}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Intégrations Externes</DialogTitle>
            <DialogDescription>
              Connectez votre workflow à Zapier, Make, Slack et plus
            </DialogDescription>
          </DialogHeader>
          
          <IntegrationsPanel
            integrations={workflow.integrations}
            onUpdate={(integrations) => setWorkflow(prev => ({ ...prev, integrations }))}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant de configuration de nœud
function NodeConfigPanel({
  node,
  onUpdateConfig,
  onUpdateConditions
}: {
  node: WorkflowNode
  onUpdateConfig: (config: Record<string, any>) => void
  onUpdateConditions: (conditions: ConditionGroup) => void
}) {
  // Configuration selon le type de nœud
  switch (node.category) {
    case 'if_then':
    case 'if_and':
    case 'if_or':
      return (
        <ConditionBuilder
          conditionGroup={node.conditionGroup || { operator: node.category === 'if_or' ? 'OR' : 'AND', conditions: [], groups: [] }}
          onChange={onUpdateConditions}
        />
      )
    
    case 'email':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Destinataire</Label>
            <Input
              value={node.config.to || ''}
              onChange={(e) => onUpdateConfig({ to: e.target.value })}
              placeholder="{{customer.email}}"
            />
          </div>
          <div className="space-y-2">
            <Label>Sujet</Label>
            <Input
              value={node.config.subject || ''}
              onChange={(e) => onUpdateConfig({ subject: e.target.value })}
              placeholder="Votre commande est confirmée"
            />
          </div>
          <div className="space-y-2">
            <Label>Corps du message</Label>
            <Textarea
              value={node.config.body || ''}
              onChange={(e) => onUpdateConfig({ body: e.target.value })}
              placeholder="Bonjour {{customer.name}}..."
              rows={6}
            />
          </div>
        </div>
      )
    
    case 'slack':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Canal Slack</Label>
            <Input
              value={node.config.channel || ''}
              onChange={(e) => onUpdateConfig({ channel: e.target.value })}
              placeholder="#alerts"
            />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={node.config.message || ''}
              onChange={(e) => onUpdateConfig({ message: e.target.value })}
              placeholder="Nouvelle alerte: {{alert.message}}"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Mentionner</Label>
            <Input
              value={node.config.mention || ''}
              onChange={(e) => onUpdateConfig({ mention: e.target.value })}
              placeholder="@channel ou @user"
            />
          </div>
        </div>
      )
    
    case 'zapier':
    case 'webhook_out':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>URL du Webhook</Label>
            <Input
              value={node.config.webhookUrl || node.config.url || ''}
              onChange={(e) => onUpdateConfig({ webhookUrl: e.target.value, url: e.target.value })}
              placeholder="https://hooks.zapier.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label>Données à envoyer (JSON)</Label>
            <Textarea
              value={typeof node.config.payload === 'object' ? JSON.stringify(node.config.payload, null, 2) : node.config.payload || ''}
              onChange={(e) => {
                try {
                  onUpdateConfig({ payload: JSON.parse(e.target.value) })
                } catch {
                  onUpdateConfig({ payload: e.target.value })
                }
              }}
              placeholder='{"product": "{{product.name}}", "price": "{{product.price}}"}'
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        </div>
      )
    
    case 'update_price':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Stratégie</Label>
            <Select
              value={node.config.strategy || 'percentage'}
              onValueChange={(v) => onUpdateConfig({ strategy: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Pourcentage</SelectItem>
                <SelectItem value="fixed">Montant fixe</SelectItem>
                <SelectItem value="competitor_match">Aligner concurrent</SelectItem>
                <SelectItem value="target_margin">Marge cible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valeur</Label>
            <Input
              type="number"
              value={node.config.value || 0}
              onChange={(e) => onUpdateConfig({ value: parseFloat(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Marge minimum (%)</Label>
            <Input
              type="number"
              value={node.config.minMargin || 10}
              onChange={(e) => onUpdateConfig({ minMargin: parseFloat(e.target.value) })}
            />
          </div>
        </div>
      )
    
    case 'wait':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Durée</Label>
              <Input
                type="number"
                value={node.config.duration || 60}
                onChange={(e) => onUpdateConfig({ duration: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Unité</Label>
              <Select
                value={node.config.unit || 'seconds'}
                onValueChange={(v) => onUpdateConfig({ unit: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">Secondes</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Heures</SelectItem>
                  <SelectItem value="days">Jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )
    
    case 'loop':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type de boucle</Label>
            <Select
              value={node.loopConfig?.type || 'count'}
              onValueChange={(v) => onUpdateConfig({ loopType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Nombre fixe</SelectItem>
                <SelectItem value="collection">Pour chaque élément</SelectItem>
                <SelectItem value="while">Tant que (condition)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nombre d'itérations</Label>
            <Input
              type="number"
              value={node.loopConfig?.count || 10}
              onChange={(e) => onUpdateConfig({ count: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Maximum d'itérations (sécurité)</Label>
            <Input
              type="number"
              value={node.loopConfig?.maxIterations || 100}
              onChange={(e) => onUpdateConfig({ maxIterations: parseInt(e.target.value) })}
            />
          </div>
        </div>
      )
    
    default:
      return (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Configuration pour: {node.name}
          </p>
          <Textarea
            value={JSON.stringify(node.config, null, 2)}
            onChange={(e) => {
              try {
                onUpdateConfig(JSON.parse(e.target.value))
              } catch {}
            }}
            rows={10}
            className="font-mono text-sm"
          />
        </div>
      )
  }
}

// Constructeur de conditions avancées
function ConditionBuilder({
  conditionGroup,
  onChange
}: {
  conditionGroup: ConditionGroup
  onChange: (group: ConditionGroup) => void
}) {
  const addCondition = () => {
    onChange({
      ...conditionGroup,
      conditions: [
        ...conditionGroup.conditions,
        { id: `cond_${Date.now()}`, field: '', operator: 'equals', value: '', dataType: 'string' }
      ]
    })
  }

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    onChange({
      ...conditionGroup,
      conditions: conditionGroup.conditions.map(c =>
        c.id === id ? { ...c, ...updates } : c
      )
    })
  }

  const removeCondition = (id: string) => {
    onChange({
      ...conditionGroup,
      conditions: conditionGroup.conditions.filter(c => c.id !== id)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>Opérateur logique</Label>
          <Badge variant={conditionGroup.operator === 'AND' ? 'default' : 'secondary'}>
            {conditionGroup.operator}
          </Badge>
        </div>
        <Select
          value={conditionGroup.operator}
          onValueChange={(v: 'AND' | 'OR') => onChange({ ...conditionGroup, operator: v })}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">ET</SelectItem>
            <SelectItem value="OR">OU</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {conditionGroup.conditions.map((condition, index) => (
          <Card key={condition.id} className="p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Select
                  value={condition.field}
                  onValueChange={(v) => updateCondition(condition.id, { field: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Champ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_FIELDS.map(f => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Select
                    value={condition.operator}
                    onValueChange={(v) => updateCondition(condition.id, { operator: v })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    value={condition.value as string}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                    placeholder="Valeur..."
                    className="flex-1"
                  />
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => removeCondition(condition.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {index < conditionGroup.conditions.length - 1 && (
              <div className="flex justify-center mt-2">
                <Badge variant="outline" className="text-xs">
                  {conditionGroup.operator}
                </Badge>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={addCondition}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une condition
      </Button>
    </div>
  )
}

// Panneau des intégrations
function IntegrationsPanel({
  integrations,
  onUpdate
}: {
  integrations: IntegrationConfig[]
  onUpdate: (integrations: IntegrationConfig[]) => void
}) {
  const availableIntegrations = [
    { type: 'zapier', name: 'Zapier', icon: Zap, description: 'Connectez 5000+ apps', color: 'orange' },
    { type: 'make', name: 'Make (Integromat)', icon: Boxes, description: 'Automatisations avancées', color: 'purple' },
    { type: 'slack', name: 'Slack', icon: Slack, description: 'Notifications équipe', color: 'green' },
    { type: 'webhook', name: 'Webhooks', icon: Webhook, description: 'API personnalisées', color: 'blue' },
    { type: 'crm', name: 'CRM', icon: Users, description: 'HubSpot, Salesforce...', color: 'red' },
  ]

  const toggleIntegration = (type: string) => {
    const existing = integrations.find(i => i.type === type)
    if (existing) {
      onUpdate(integrations.map(i => i.type === type ? { ...i, enabled: !i.enabled } : i))
    } else {
      onUpdate([...integrations, { id: `int_${Date.now()}`, type: type as any, name: type, config: {}, enabled: true }])
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {availableIntegrations.map(int => {
        const isEnabled = integrations.find(i => i.type === int.type)?.enabled
        const Icon = int.icon
        
        return (
          <Card
            key={int.type}
            className={`p-4 cursor-pointer transition-all ${isEnabled ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`}
            onClick={() => toggleIntegration(int.type)}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${int.color}-500/10`}>
                <Icon className={`h-5 w-5 text-${int.color}-500`} />
              </div>
              <div className="flex-1">
                <div className="font-medium">{int.name}</div>
                <div className="text-xs text-muted-foreground">{int.description}</div>
              </div>
              <Switch checked={isEnabled} />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
