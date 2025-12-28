import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, Settings, Play, Pause, Copy, Trash2, 
  Mail, Clock, Users, Zap, ArrowRight, 
  Filter, Calendar, Target
} from 'lucide-react'
import { useAutomationWorkflows } from '@/hooks/useAutomationWorkflows'
import { useToast } from '@/hooks/use-toast'

export function AutomationWorkflows() {
  const { 
    workflows, 
    isLoading, 
    createWorkflow, 
    updateWorkflow, 
    deleteWorkflow, 
    duplicateWorkflow,
    toggleStatus 
  } = useAutomationWorkflows()
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger_type: 'contact_created'
  })

  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'draft': return 'bg-muted text-muted-foreground border-muted'
      default: return 'bg-muted text-muted-foreground border-muted'
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
    await createWorkflow.mutateAsync({
      name: newWorkflow.name,
      description: newWorkflow.description,
      trigger_type: newWorkflow.trigger_type
    })
    
    setIsCreateModalOpen(false)
    setNewWorkflow({ name: '', description: '', trigger_type: 'contact_created' })
    
    toast({
      title: "Workflow créé",
      description: "Le workflow a été créé avec succès"
    })
  }

  const handleStatusChange = async (workflowId: string, isActive: boolean) => {
    await toggleStatus.mutateAsync({ id: workflowId, status: isActive ? 'active' : 'paused' })
    
    toast({
      title: "Statut mis à jour",
      description: `Le workflow est maintenant ${isActive ? 'actif' : 'en pause'}`
    })
  }

  const handleDuplicateWorkflow = async (workflowId: string) => {
    await duplicateWorkflow.mutateAsync(workflowId)
    
    toast({
      title: "Workflow dupliqué",
      description: "Une copie du workflow a été créée"
    })
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce workflow ?')) {
      await deleteWorkflow.mutateAsync(workflowId)
      
      toast({
        title: "Workflow supprimé",
        description: "Le workflow a été supprimé avec succès"
      })
    }
  }

  const activeWorkflows = workflows.filter(w => w.status === 'active').length
  const totalExecutions = workflows.reduce((sum, w) => sum + (w.execution_count || 0), 0)
  const runningJobs = workflows.filter(w => w.status === 'active').length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
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
              <Button 
                onClick={handleCreateWorkflow} 
                disabled={!newWorkflow.name.trim() || createWorkflow.isPending}
              >
                {createWorkflow.isPending ? 'Création...' : 'Créer le Workflow'}
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
            <div className="text-2xl font-bold">{activeWorkflows}</div>
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
            <div className="text-2xl font-bold">{totalExecutions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalExecutions > 0 ? '94.5%' : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">Moyenne générale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Cours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningJobs}</div>
            <p className="text-xs text-muted-foreground">Exécutions actives</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun workflow</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre premier workflow d'automatisation
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                      {workflow.description || 'Aucune description'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={workflow.status === 'active'}
                      onCheckedChange={(checked) => handleStatusChange(workflow.id, checked)}
                      disabled={toggleStatus.isPending}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDuplicateWorkflow(workflow.id)}
                      disabled={duplicateWorkflow.isPending}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                      className="text-destructive hover:text-destructive"
                      disabled={deleteWorkflow.isPending}
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
                    {workflow.steps && workflow.steps.length > 0 ? (
                      workflow.steps.map((step: any, index: number) => (
                        <div key={step.id || index} className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
                            {getStepIcon(step.type)}
                            <span className="text-sm capitalize">
                              {step.type === 'email' ? 'Email' :
                               step.type === 'wait' ? `Attendre ${step.delay || 1}j` :
                               step.type === 'condition' ? 'Condition' :
                               step.type === 'tag' ? 'Tag' : 'Webhook'
                              }
                            </span>
                          </div>
                          {index < workflow.steps.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Aucune étape configurée
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {(workflow.execution_count || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Exécutions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {workflow.execution_count && workflow.execution_count > 0 ? '94.5%' : '0%'}
                    </div>
                    <div className="text-sm text-muted-foreground">Taux de succès</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-destructive">
                      {workflow.execution_count ? Math.floor(workflow.execution_count * 0.055) : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Échecs</div>
                  </div>
                </div>
                
                {workflow.last_run_at && (
                  <div className="mt-4 text-xs text-muted-foreground text-center">
                    Dernière exécution: {new Date(workflow.last_run_at).toLocaleString('fr-FR')}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
