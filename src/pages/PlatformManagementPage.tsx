import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlatformAnalyticsDashboard } from '@/components/platform/PlatformAnalyticsDashboard'
import { SyncConfigManager } from '@/components/platform/SyncConfigManager'
import { ContentOptimizer } from '@/components/platform/ContentOptimizer'
import { BarChart3, RefreshCw, Sparkles } from 'lucide-react'

export default function PlatformManagementPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Gestion des Plateformes</h1>
        <p className="text-muted-foreground">
          Synchronisation automatique, analytics et optimisation IA de vos marketplaces
        </p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Synchronisation
          </TabsTrigger>
          <TabsTrigger value="optimizer" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Optimisation IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <PlatformAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="sync">
          <SyncConfigManager />
        </TabsContent>

        <TabsContent value="optimizer">
          <ContentOptimizer />
        </TabsContent>
      </Tabs>
    </div>
  )
}
