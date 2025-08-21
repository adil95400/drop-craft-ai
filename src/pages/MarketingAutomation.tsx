import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AutomationWorkflows } from '@/components/marketing/AutomationWorkflows'
import { AIMarketingOptimizer } from '@/components/marketing/AIMarketingOptimizer'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { 
  Zap, Bot, Workflow, Settings, 
  Play, Pause, CheckCircle, AlertTriangle,
  Clock, Target, TrendingUp
} from 'lucide-react'

export default function MarketingAutomation() {
  const { automationJobs, isLoading } = useRealTimeMarketing()

  const runningJobs = automationJobs.filter(job => job.status === 'running')
  const completedJobs = automationJobs.filter(job => job.status === 'completed')
  const failedJobs = automationJobs.filter(job => job.status === 'failed')

  return (
    <>
      <Helmet>
        <title>Automatisation Marketing - Workflows et IA</title>
        <meta name="description" content="Automatisez vos campagnes marketing avec des workflows intelligents et l'IA pour optimiser vos performances." />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Automatisation Marketing</h1>
            <p className="text-muted-foreground mt-2">
              Workflows intelligents et optimisation IA pour maximiser vos résultats
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {runningJobs.length} workflows actifs
            </div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Automation Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workflows Actifs</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{runningJobs.length}</div>
              <p className="text-xs text-muted-foreground">
                En cours d'exécution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tâches Terminées</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedJobs.length}</div>
              <p className="text-xs text-muted-foreground">
                Succès ce mois-ci
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
                {automationJobs.length > 0 
                  ? ((completedJobs.length / automationJobs.length) * 100).toFixed(1)
                  : '0'
                }%
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                +5.2% ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temps Économisé</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156h</div>
              <p className="text-xs text-muted-foreground">
                Cette semaine
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Jobs Status */}
        {runningJobs.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Zap className="h-5 w-5" />
                Workflows en Cours d'Exécution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {runningJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <div className="font-medium">{job.job_type}</div>
                      <div className="text-sm text-muted-foreground">
                        Démarré il y a {Math.floor((new Date().getTime() - new Date(job.created_at).getTime()) / 60000)} min
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{job.progress}%</div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {runningJobs.length > 3 && (
                  <div className="text-sm text-muted-foreground text-center">
                    +{runningJobs.length - 3} autres workflows actifs
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Automation Tabs */}
        <Tabs defaultValue="workflows" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="ai-optimizer">IA Optimizer</TabsTrigger>
            <TabsTrigger value="triggers">Déclencheurs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-6">
            <AutomationWorkflows />
          </TabsContent>

          <TabsContent value="ai-optimizer" className="space-y-6">
            <AIMarketingOptimizer />
          </TabsContent>

          <TabsContent value="triggers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Déclencheurs Avancés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Configuration des Déclencheurs</h3>
                  <p className="text-sm">
                    Configurez des déclencheurs personnalisés basés sur le comportement utilisateur, 
                    les événements système et les données externes
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Analytics d'Automatisation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Performance des Automatisations</h3>
                  <p className="text-sm">
                    Analysez l'efficacité de vos workflows automatisés et identifiez 
                    les opportunités d'optimisation
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Error Handling */}
        {failedJobs.length > 0 && (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Workflows avec Erreurs ({failedJobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {failedJobs.slice(0, 2).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                    <div>
                      <div className="font-medium text-red-900">{job.job_type}</div>
                      <div className="text-sm text-red-600">
                        {job.error_message || 'Erreur inconnue'}
                      </div>
                    </div>
                    <button className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors">
                      Réessayer
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}