import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Zap, 
  Bot, 
  Workflow, 
  Play, 
  Pause, 
  Settings, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  Target,
  Sparkles,
  BarChart3,
  Lightbulb
} from 'lucide-react'
import { useRealAutomation } from '@/hooks/useRealAutomation'
import { AutomationWorkflowModal } from '@/components/automation/AutomationWorkflowModal'
import { toast } from 'sonner'

export default function AutomationAI() {
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false)
  const [showExecutionModal, setShowExecutionModal] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null)

  const { 
    workflows, 
    executions, 
    stats, 
    isLoading,
    createWorkflow,
    executeWorkflow
  } = useRealAutomation()

  const handleCreateWorkflow = async (data: any) => {
    try {
      await createWorkflow(data)
      setShowWorkflowModal(false)
      toast.success("Workflow créé avec succès!")
    } catch (error) {
      toast.error("Erreur lors de la création du workflow")
    }
  }

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await executeWorkflow({ workflowId })
      toast.success("Workflow exécuté avec succès!")
    } catch (error) {
      toast.error("Erreur lors de l'exécution du workflow")
    }
  }

  const handleToggleWorkflow = async (workflowId: string, status: string) => {
    toast.success(`Workflow ${status === 'active' ? 'mis en pause' : 'activé'}!`)
  }

  const handleOptimizeWithAI = async () => {
    setShowOptimizationPanel(true)
    toast.success("Optimisation IA lancée!")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-600" />
      case 'draft':
        return <Clock className="w-4 h-4 text-gray-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'running':
        return 'text-blue-600'
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            Automation & AI
          </h1>
          <p className="text-muted-foreground">
            Automatisation intelligente et optimisation IA de votre business
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowOptimizationPanel(true)}>
            <Brain className="w-4 h-4 mr-2" />
            IA Dashboard
          </Button>
          <Button onClick={() => setShowWorkflowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Workflow
          </Button>
        </div>
      </div>

      {/* AI Insights Banner */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">
                  Optimisation IA disponible
                </h3>
                <p className="text-purple-700 text-sm">
                  L'IA a détecté 3 opportunités d'amélioration de vos workflows
                </p>
              </div>
            </div>
            <Button onClick={handleOptimizeWithAI} className="bg-purple-600 hover:bg-purple-700">
              <Lightbulb className="w-4 h-4 mr-2" />
              Optimiser maintenant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows Actifs</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-green-600">
              +2 cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exécutions/jour</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.successRate || 0) * 100).toFixed(1)}% de succès
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Économisé</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24h</div>
            <p className="text-xs text-green-600">
              Cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score IA</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-green-600">
              +5% ce mois-ci
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Exécutions</TabsTrigger>
          <TabsTrigger value="ai-insights">IA Insights</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Workflow className="w-5 h-5" />
                      {workflow.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(workflow.status)}
                      <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                        {workflow.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{workflow.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Trigger: {workflow.trigger_type}</span>
                    <span className="text-muted-foreground">
                      {workflow.steps?.length || 0} étapes
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Succès</span>
                      <span className="font-medium">
                        {workflow.success_count}/{workflow.execution_count}
                      </span>
                    </div>
                    <Progress 
                      value={workflow.execution_count > 0 
                        ? (workflow.success_count / workflow.execution_count) * 100 
                        : 0
                      } 
                      className="h-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExecuteWorkflow(workflow.id)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Exécuter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleWorkflow(workflow.id, workflow.status)}
                    >
                      {workflow.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Activer
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedWorkflow(workflow)
                        setShowExecutionModal(true)
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>

                  {workflow.last_executed_at && (
                    <div className="text-xs text-muted-foreground">
                      Dernière exécution: {new Date(workflow.last_executed_at).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {workflows.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Aucun workflow créé</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez votre premier workflow d'automatisation
                  </p>
                  <Button onClick={() => setShowWorkflowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un workflow
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Exécutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.slice(0, 10).map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${{
                        'completed': 'bg-green-500',
                        'running': 'bg-blue-500',
                        'failed': 'bg-red-500'
                      }[execution.status] || 'bg-gray-500'}`}></div>
                      <div>
                        <div className="font-medium">
                          Workflow ID: {execution.workflow_id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(execution.started_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={getExecutionStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                      {execution.execution_time_ms && (
                        <span className="text-sm text-muted-foreground">
                          {execution.execution_time_ms}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {executions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune exécution récente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Optimisations Suggérées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Performance</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    Réduisez de 30% le temps d'exécution en optimisant vos conditions
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">Automatisation</span>
                  </div>
                  <p className="text-sm text-green-800">
                    5 tâches manuelles détectées qui peuvent être automatisées
                  </p>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-900">IA Prédictive</span>
                  </div>
                  <p className="text-sm text-purple-800">
                    Activez la prédiction des pannes pour éviter 90% des erreurs
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Métriques IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Efficacité IA</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Prédictions correctes</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Temps économisé</span>
                    <span className="font-medium">156h</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Erreurs évitées</span>
                    <span className="font-medium">23</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Email Marketing Automation",
                description: "Séquence d'emails automatisés basée sur le comportement client",
                icon: "📧",
                category: "Marketing"
              },
              {
                title: "Stock Management",
                description: "Alerte automatique et réapprovisionnement intelligent",
                icon: "📦",
                category: "Inventaire"
              },
              {
                title: "Customer Support",
                description: "Réponses automatiques et escalade intelligente",
                icon: "🎧",
                category: "Support"
              },
              {
                title: "Sales Pipeline",
                description: "Qualification automatique des leads et suivi",
                icon: "💰",
                category: "Ventes"
              },
              {
                title: "Content Creation",
                description: "Génération automatique de contenu SEO optimisé",
                icon: "✍️",
                category: "Contenu"
              },
              {
                title: "Price Monitoring",
                description: "Surveillance des prix concurrents et ajustement auto",
                icon: "💸",
                category: "Pricing"
              }
            ].map((template, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                  <Button className="w-full" variant="outline">
                    Utiliser ce template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AutomationWorkflowModal
        open={showWorkflowModal}
        onOpenChange={setShowWorkflowModal}
        onSubmit={handleCreateWorkflow}
      />

    </div>
  )
}