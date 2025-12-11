import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Workflow, Zap, Play, Plus, RefreshCw, BarChart3 } from 'lucide-react'
import { FlowchartWorkflowBuilder } from '@/components/automation/FlowchartWorkflowBuilder'
import { AdvancedRulesEngine } from '@/components/marketing/AdvancedRulesEngine'
import { cn } from '@/lib/utils'

const statsCards = [
  { label: 'Workflows Actifs', value: '8', icon: Workflow, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Règles', value: '24', icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-500/10' },
  { label: 'Exécutions/jour', value: '156', icon: Play, color: 'text-green-600', bgColor: 'bg-green-500/10' },
  { label: 'Taux Succès', value: '98%', icon: BarChart3, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
]

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState('visual')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    toast.loading('Actualisation des workflows...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    toast.dismiss()
    toast.success('Workflows synchronisés')
  }

  const handleCreateWorkflow = () => {
    toast.info('Ouverture de l\'éditeur de workflow...')
  }

  return (
    <>
      <Helmet>
        <title>Workflows & Automatisations - ShopOpti</title>
        <meta name="description" content="Créez des workflows visuels et des automatisations if/then" />
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Workflow className="h-6 w-6 text-primary" />
              </div>
              Workflows & Automatisations
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Créez des workflows visuels et des automatisations if/then
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Actualiser
            </Button>
            <Button size="sm" onClick={handleCreateWorkflow}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Workflow
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </Card>
            ))
          ) : (
            statsCards.map((stat, idx) => (
              <Card 
                key={idx} 
                className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => setActiveTab(idx < 2 ? 'visual' : 'rules')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-xl md:text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="visual" className="flex items-center gap-2 text-sm">
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Éditeur Visuel</span>
              <span className="sm:hidden">Visuel</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Moteur de Règles</span>
              <span className="sm:hidden">Règles</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual">
            <FlowchartWorkflowBuilder />
          </TabsContent>

          <TabsContent value="rules">
            <AdvancedRulesEngine />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
