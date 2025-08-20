import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Trash2,
  Copy,
  GitBranch,
  Zap,
  Mail,
  ShoppingCart,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  title: string
  description: string
  config: Record<string, any>
  position: { x: number; y: number }
  connections: string[]
}

interface Workflow {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'draft'
  trigger_type: string
  nodes: WorkflowNode[]
  executions: number
  success_rate: number
  created_at: string
  updated_at: string
}

const WorkflowBuilder = () => {
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Abandon de Panier - Email de Relance',
      description: 'Envoie automatiquement un email de relance après abandon de panier',
      status: 'active',
      trigger_type: 'cart_abandoned',
      nodes: [],
      executions: 1247,
      success_rate: 23.5,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      name: 'Nouveau Client - Séquence de Bienvenue',
      description: 'Séquence d\'onboarding pour les nouveaux clients',
      status: 'active',
      trigger_type: 'customer_created',
      nodes: [],
      executions: 892,
      success_rate: 67.2,
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-19T16:45:00Z'
    },
    {
      id: '3',
      name: 'Stock Faible - Notification Équipe',
      description: 'Alerte l\'équipe quand un produit est en rupture de stock',
      status: 'paused',
      trigger_type: 'low_stock',
      nodes: [],
      executions: 456,
      success_rate: 100,
      created_at: '2024-01-05T11:20:00Z',
      updated_at: '2024-01-18T08:15:00Z'
    }
  ])

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showBuilderDialog, setShowBuilderDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger_type: ''
  })

  const [builderNodes, setBuilderNodes] = useState<WorkflowNode[]>([
    {
      id: 'trigger-1',
      type: 'trigger',
      title: 'Déclencheur',
      description: 'Abandon de panier après 1 heure',
      config: { delay: 60, condition: 'cart_abandoned' },
      position: { x: 100, y: 100 },
      connections: ['condition-1']
    },
    {
      id: 'condition-1',
      type: 'condition',
      title: 'Condition',
      description: 'Si la valeur du panier > 50€',
      config: { field: 'cart_value', operator: '>', value: 50 },
      position: { x: 100, y: 250 },
      connections: ['action-1', 'action-2']
    },
    {
      id: 'action-1',
      type: 'action',
      title: 'Action - Email Premium',
      description: 'Envoyer email avec code promo 10%',
      config: { 
        type: 'email', 
        template: 'premium_cart_recovery',
        subject: 'N\'oubliez pas votre panier - 10% de réduction',
        discount: 10
      },
      position: { x: 50, y: 400 },
      connections: []
    },
    {
      id: 'action-2',
      type: 'action',
      title: 'Action - Email Standard',
      description: 'Envoyer email de rappel simple',
      config: { 
        type: 'email', 
        template: 'standard_cart_recovery',
        subject: 'Votre panier vous attend'
      },
      position: { x: 200, y: 400 },
      connections: []
    }
  ])

  const createWorkflow = async () => {
    setLoading(true)
    try {
      const workflow: Workflow = {
        id: Date.now().toString(),
        name: newWorkflow.name,
        description: newWorkflow.description,
        status: 'draft',
        trigger_type: newWorkflow.trigger_type,
        nodes: [],
        executions: 0,
        success_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setWorkflows(prev => [...prev, workflow])
      setShowCreateDialog(false)
      setNewWorkflow({ name: '', description: '', trigger_type: '' })
      toast.success('Workflow créé avec succès')
    } catch (error) {
      console.error('Error creating workflow:', error)
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflowStatus = (workflowId: string) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === workflowId 
        ? { 
            ...workflow, 
            status: workflow.status === 'active' ? 'paused' : 'active',
            updated_at: new Date().toISOString()
          }
        : workflow
    ))
  }

  const duplicateWorkflow = (workflow: Workflow) => {
    const duplicate: Workflow = {
      ...workflow,
      id: Date.now().toString(),
      name: `${workflow.name} (Copie)`,
      status: 'draft',
      executions: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setWorkflows(prev => [...prev, duplicate])
    toast.success('Workflow dupliqué')
  }

  const deleteWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId))
    toast.success('Workflow supprimé')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-orange-100 text-orange-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />
      case 'paused':
        return <Pause className="w-4 h-4" />
      case 'draft':
        return <Settings className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'cart_abandoned':
        return <ShoppingCart className="w-4 h-4" />
      case 'customer_created':
        return <Users className="w-4 h-4" />
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4" />
      case 'order_placed':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'trigger':
        return <Zap className="w-5 h-5 text-blue-600" />
      case 'condition':
        return <GitBranch className="w-5 h-5 text-purple-600" />
      case 'action':
        return <Mail className="w-5 h-5 text-green-600" />
      case 'delay':
        return <Clock className="w-5 h-5 text-orange-600" />
      default:
        return <Settings className="w-5 h-5 text-gray-600" />
    }
  }

  const availableTriggers = [
    { id: 'cart_abandoned', label: 'Abandon de panier', description: 'Quand un client abandonne son panier' },
    { id: 'customer_created', label: 'Nouveau client', description: 'Quand un nouveau client s\'inscrit' },
    { id: 'order_placed', label: 'Commande passée', description: 'Quand une commande est confirmée' },
    { id: 'low_stock', label: 'Stock faible', description: 'Quand un produit est en rupture' },
    { id: 'product_viewed', label: 'Produit consulté', description: 'Quand un produit est consulté plusieurs fois' },
    { id: 'review_received', label: 'Avis reçu', description: 'Quand un client laisse un avis' }
  ]

  const availableActions = [
    { id: 'send_email', label: 'Envoyer Email', description: 'Envoie un email personnalisé' },
    { id: 'send_sms', label: 'Envoyer SMS', description: 'Envoie un SMS au client' },
    { id: 'create_task', label: 'Créer Tâche', description: 'Crée une tâche pour l\'équipe' },
    { id: 'update_customer', label: 'Mettre à jour Client', description: 'Modifie les données client' },
    { id: 'add_tag', label: 'Ajouter Tag', description: 'Ajoute un tag au client' },
    { id: 'webhook', label: 'Webhook', description: 'Appelle une API externe' }
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Workflow className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Constructeur de Workflows</h1>
            <p className="text-muted-foreground">
              Automatisez vos processus métier avec des workflows intelligents
            </p>
          </div>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau workflow</DialogTitle>
              <DialogDescription>
                Configurez les paramètres de base de votre workflow
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Nom du workflow</Label>
                <Input
                  id="workflow-name"
                  placeholder="Ex: Relance panier abandonné"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  placeholder="Décrivez l'objectif de ce workflow"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="workflow-trigger">Déclencheur</Label>
                <Select 
                  value={newWorkflow.trigger_type} 
                  onValueChange={(value) => setNewWorkflow(prev => ({ ...prev, trigger_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un déclencheur" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTriggers.map((trigger) => (
                      <SelectItem key={trigger.id} value={trigger.id}>
                        <div>
                          <div className="font-medium">{trigger.label}</div>
                          <div className="text-sm text-muted-foreground">{trigger.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={createWorkflow} 
                  disabled={loading || !newWorkflow.name || !newWorkflow.trigger_type}
                >
                  Créer le workflow
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{workflows.length}</p>
                <p className="text-sm text-muted-foreground">Workflows totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{workflows.filter(w => w.status === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {workflows.reduce((sum, w) => sum + w.executions, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Exécutions totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(workflows.reduce((sum, w) => sum + w.success_rate, 0) / workflows.length)}%
                </p>
                <p className="text-sm text-muted-foreground">Taux de succès moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflows">Mes Workflows</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          <div className="grid grid-cols-1 gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTriggerIcon(workflow.trigger_type)}
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(workflow.status)}>
                        {getStatusIcon(workflow.status)}
                        <span className="ml-1">
                          {workflow.status === 'active' ? 'Actif' : 
                           workflow.status === 'paused' ? 'En pause' : 'Brouillon'}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{workflow.executions}</p>
                      <p className="text-sm text-muted-foreground">Exécutions</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{workflow.success_rate}%</p>
                      <p className="text-sm text-muted-foreground">Taux de succès</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {Math.round(workflow.executions * workflow.success_rate / 100)}
                      </p>
                      <p className="text-sm text-muted-foreground">Succès</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-sm font-medium">Dernière mise à jour</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workflow.updated_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedWorkflow(workflow)
                          setShowBuilderDialog(true)
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateWorkflow(workflow)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Dupliquer
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`workflow-${workflow.id}`} className="text-sm">
                          {workflow.status === 'active' ? 'Actif' : 'Inactif'}
                        </Label>
                        <Switch
                          id={`workflow-${workflow.id}`}
                          checked={workflow.status === 'active'}
                          onCheckedChange={() => toggleWorkflowStatus(workflow.id)}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteWorkflow(workflow.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Série d\'emails de bienvenue',
                description: 'Séquence automatique pour nouveaux clients',
                trigger: 'customer_created',
                category: 'Onboarding'
              },
              {
                name: 'Récupération panier abandonné',
                description: 'Relance automatique avec remise progressive',
                trigger: 'cart_abandoned',
                category: 'E-commerce'
              },
              {
                name: 'Demande d\'avis client',
                description: 'Demande d\'avis après livraison',
                trigger: 'order_delivered',
                category: 'Satisfaction'
              },
              {
                name: 'Réactivation client inactif',
                description: 'Campagne de win-back automatique',
                trigger: 'customer_inactive',
                category: 'Rétention'
              },
              {
                name: 'Notification stock critique',
                description: 'Alerte équipe pour réapprovisionnement',
                trigger: 'low_stock',
                category: 'Gestion'
              },
              {
                name: 'Upsell post-achat',
                description: 'Recommandations personnalisées après achat',
                trigger: 'order_completed',
                category: 'Ventes'
              }
            ].map((template, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{template.category}</Badge>
                    {getTriggerIcon(template.trigger)}
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Utiliser ce modèle
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance des Workflows</CardTitle>
                <CardDescription>Métriques clés par workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{workflow.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {workflow.executions} exécutions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{workflow.success_rate}%</p>
                        <p className="text-sm text-muted-foreground">Succès</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insights & Recommandations</CardTitle>
                <CardDescription>Optimisations suggérées par l'IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h4 className="font-semibold text-green-800">Optimisation détectée</h4>
                    <p className="text-sm text-green-600 mt-1">
                      Le workflow "Abandon de panier" pourrait avoir un taux de succès +12% 
                      en ajoutant un délai de 2h au lieu de 1h.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-orange-50">
                    <h4 className="font-semibold text-orange-800">Action recommandée</h4>
                    <p className="text-sm text-orange-600 mt-1">
                      Créer un workflow de réactivation pour les 89 clients inactifs 
                      depuis plus de 30 jours.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-semibold text-blue-800">Nouvelle opportunité</h4>
                    <p className="text-sm text-blue-600 mt-1">
                      Mettre en place un workflow d'upsell pour les clients ayant 
                      commandé plus de 3 fois (234 clients éligibles).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Workflow Builder Modal */}
      <Dialog open={showBuilderDialog} onOpenChange={setShowBuilderDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Constructeur de Workflow - {selectedWorkflow?.name}
            </DialogTitle>
            <DialogDescription>
              Glissez-déposez les éléments pour construire votre workflow
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-4 gap-6 h-96">
            {/* Palette des composants */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-4">Composants</h3>
              <div className="space-y-2">
                <div className="p-2 border rounded bg-white cursor-move">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Déclencheur</span>
                  </div>
                </div>
                <div className="p-2 border rounded bg-white cursor-move">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">Condition</span>
                  </div>
                </div>
                <div className="p-2 border rounded bg-white cursor-move">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Action</span>
                  </div>
                </div>
                <div className="p-2 border rounded bg-white cursor-move">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">Délai</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone de construction */}
            <div className="col-span-3 border rounded-lg p-4 bg-gray-50 relative overflow-auto">
              <h3 className="font-semibold mb-4">Canvas du Workflow</h3>
              <div className="min-h-full relative">
                {builderNodes.map((node) => (
                  <div
                    key={node.id}
                    className="absolute p-3 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      width: 180
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getNodeIcon(node.type)}
                      <span className="font-medium text-sm">{node.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {node.description}
                    </p>
                  </div>
                ))}
                
                {/* Connections - simplified representation */}
                <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
                  <line
                    x1="190"
                    y1="130"
                    x2="190"
                    y2="250"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <line
                    x1="190"
                    y1="280"
                    x2="140"
                    y2="400"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <line
                    x1="190"
                    y1="280"
                    x2="290"
                    y2="400"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="10"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#cbd5e1"
                      />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowBuilderDialog(false)}>
              Annuler
            </Button>
            <Button>
              Sauvegarder le workflow
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WorkflowBuilder