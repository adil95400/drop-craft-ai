import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, Settings, Play, Pause, Copy, Trash2, 
  Mail, Clock, Users, Zap, ArrowRight, 
  Filter, Calendar, MessageSquare, Target
} from 'lucide-react'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface Workflow {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger_config: any
  steps: WorkflowStep[]
  status: 'active' | 'draft' | 'paused'
  execution_count: number
  success_count: number
  failure_count: number
  last_executed_at?: string
  created_at: string
  updated_at: string
}

interface WorkflowStep {
  id: string
  type: 'email' | 'wait' | 'condition' | 'tag' | 'webhook'
  config: any
  delay?: number
  conditions?: any[]
}

export function AutomationWorkflows() {
  const { automationJobs } = useRealTimeMarketing()
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Séquence de Bienvenue',
      description: 'Série d\'emails automatiques pour nouveaux abonnés',
      trigger_type: 'contact_created',
      trigger_config: { segment: 'new_subscribers' },
      steps: [
        { id: '1', type: 'email', config: { template: 'welcome', subject: 'Bienvenue !' } },
        { id: '2', type: 'wait', config: {}, delay: 3 },
        { id: '3', type: 'email', config: { template: 'onboarding', subject: 'Comment bien commencer' } },
        { id: '4', type: 'wait', config: {}, delay: 7 },
        { id: '5', type: 'condition', config: { field: 'engagement', operator: 'greater_than', value: 50 } },
        { id: '6', type: 'email', config: { template: 'premium_offer', subject: 'Offre spéciale pour vous' } }
      ],
      status: 'active',
      execution_count: 1250,
      success_count: 1180,
      failure_count: 70,
      last_executed_at: '2024-01-20T10:30:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-20T10:30:00Z'
    },
    {
      id: '2', 
      name: 'Récupération Panier Abandonné',
      description: 'Relance automatique pour paniers abandonnés',
      trigger_type: 'cart_abandoned',
      trigger_config: { delay_hours: 2 },
      steps: [
        { id: '1', type: 'email', config: { template: 'cart_reminder', subject: 'Vous avez oublié quelque chose...' } },
        { id: '2', type: 'wait', config: {}, delay: 1 },
        { id: '3', type: 'email', config: { template: 'cart_discount', subject: '10% de réduction sur votre commande' } },
        { id: '4', type: 'wait', config: {}, delay: 3 },
        { id: '5', type: 'email', config: { template: 'cart_final', subject: 'Dernière chance !' } }
      ],
      status: 'active',
      execution_count: 850,
      success_count: 680,
      failure_count: 170,
      last_executed_at: '2024-01-20T14:15:00Z',
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-20T14:15:00Z'
    },
    {
      id: '3',
      name: 'Lead Nurturing B2B',
      description: 'Nurturing progressif pour prospects B2B',
      trigger_type: 'lead_scored',
      trigger_config: { min_score: 50 },
      steps: [
        { id: '1', type: 'email', config: { template: 'b2b_intro', subject: 'Découvrez nos solutions entreprise' } },
        { id: '2', type: 'wait', config: {}, delay: 5 },
        { id: '3', type: 'email', config: { template: 'case_study', subject: 'Étude de cas client' } },
        { id: '4', type: 'wait', config: {}, delay: 7 },
        { id: '5', type: 'condition', config: { field: 'email_opened', operator: 'equals', value: true } },
        { id: '6', type: 'email', config: { template: 'demo_invite', subject: 'Planifiez votre démonstration' } }
      ],
      status: 'draft',
      execution_count: 0,
      success_count: 0,
      failure_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    }
  ])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger_type: 'contact_created'
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'contact_created': return <Users className="h-4 w-4" />
      case 'cart_abandoned': return <Target className="h-4 w-4" />
      case 'lead_scored': return <Zap className="h-4 w-4" />
      case 'email_opened': return <Mail className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'wait': return <Clock className="h-4 w-4" />
      case 'condition': return <Filter className="h-4 w-4" />
      case 'tag': return <Target className="h-4 w-4" />
      case 'webhook': return <Zap className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const handleCreateWorkflow = async () => {
    try {
      // Create the workflow object directly without Supabase for demo
      const newWorkflowData: Workflow = {
        id: Date.now().toString(),
        ...newWorkflow,
        trigger_config: {},
        steps: [],
        status: 'draft',
        execution_count: 0,
        success_count: 0,
        failure_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setWorkflows([...workflows, newWorkflowData])
      setIsCreateModalOpen(false)
      setNewWorkflow({ name: '', description: '', trigger_type: 'contact_created' })

      toast({
        title: "Workflow créé",
        description: "Le workflow a été créé avec succès"
      })

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le workflow",
        variant: "destructive"
      })
    }
  }

  const handleStatusChange = (workflowId: string, newStatus: 'active' | 'paused' | 'draft') => {
    setWorkflows(workflows.map(w => 
      w.id === workflowId 
        ? { ...w, status: newStatus, updated_at: new Date().toISOString() }
        : w
    ))

    toast({
      title: "Statut mis à jour",
      description: `Le workflow est maintenant ${newStatus === 'active' ? 'actif' : newStatus === 'paused' ? 'en pause' : 'en brouillon'}`
    })
  }

  const handleDuplicateWorkflow = (workflow: Workflow) => {
    const duplicatedWorkflow = {
      ...workflow,
      id: Date.now().toString(),
      name: `${workflow.name} (Copie)`,
      status: 'draft' as const,
      execution_count: 0,
      success_count: 0,
      failure_count: 0,
      last_executed_at: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setWorkflows([...workflows, duplicatedWorkflow])

    toast({
      title: "Workflow dupliqué",
      description: "Une copie du workflow a été créée"
    })
  }

  const handleDeleteWorkflow = (workflowId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce workflow ?')) {
      setWorkflows(workflows.filter(w => w.id !== workflowId))
      
      toast({
        title: "Workflow supprimé",
        description: "Le workflow a été supprimé avec succès"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflows d'Automatisation</h2>
          <p className="text-muted-foreground">
            Créez et gérez vos séquences marketing automatisées
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un Workflow</DialogTitle>
              <DialogDescription>
                Configurez votre nouveau workflow d'automatisation marketing
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="workflow-name">Nom du Workflow</Label>
                <Input
                  id="workflow-name"
                  placeholder="Ex: Séquence de bienvenue"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  placeholder="Décrivez l'objectif de ce workflow..."
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="workflow-trigger">Déclencheur</Label>
                <Select 
                  value={newWorkflow.trigger_type} 
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact_created">Nouveau contact</SelectItem>
                    <SelectItem value="email_opened">Email ouvert</SelectItem>
                    <SelectItem value="link_clicked">Lien cliqué</SelectItem>
                    <SelectItem value="cart_abandoned">Panier abandonné</SelectItem>
                    <SelectItem value="lead_scored">Score de lead atteint</SelectItem>
                    <SelectItem value="tag_added">Tag ajouté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateWorkflow} disabled={!newWorkflow.name.trim()}>
                Créer le Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows Actifs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sur {workflows.length} workflows total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exécutions Total</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + w.execution_count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                (workflows.reduce((sum, w) => sum + w.success_count, 0) / 
                 workflows.reduce((sum, w) => sum + w.execution_count, 1)) * 100
              ).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Moyenne générale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Cours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automationJobs.filter(job => job.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Exécutions actives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {getTriggerIcon(workflow.trigger_type)}
                    <h3 className="font-semibold text-lg">{workflow.name}</h3>
                    <Badge className={getStatusColor(workflow.status)}>
                      {workflow.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {workflow.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={workflow.status === 'active'}
                    onCheckedChange={(checked) => 
                      handleStatusChange(workflow.id, checked ? 'active' : 'paused')
                    }
                  />
                  <Button variant="outline" size="sm" onClick={() => handleDuplicateWorkflow(workflow)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Steps Preview */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Étapes du Workflow:</h4>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {workflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
                        {getStepIcon(step.type)}
                        <span className="text-sm capitalize">
                          {step.type === 'email' ? 'Email' :
                           step.type === 'wait' ? `Attendre ${step.delay}j` :
                           step.type === 'condition' ? 'Condition' :
                           step.type === 'tag' ? 'Tag' : 'Webhook'
                          }
                        </span>
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{workflow.execution_count.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Exécutions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{workflow.success_count.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Succès</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {workflow.execution_count > 0 
                      ? ((workflow.success_count / workflow.execution_count) * 100).toFixed(1)
                      : '0'
                    }%
                  </div>
                  <div className="text-xs text-muted-foreground">Taux de Succès</div>
                </div>
              </div>
              
              {workflow.last_executed_at && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Dernière exécution: {new Date(workflow.last_executed_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun workflow configuré</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre premier workflow d'automatisation pour optimiser vos campagnes marketing
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un Workflow
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}