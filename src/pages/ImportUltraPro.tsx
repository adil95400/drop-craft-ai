import { useAutoSync } from '@/hooks/useAutoSync'
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ImportUltraProInterface } from '@/components/import/ImportUltraProInterface'
import { AdvancedImportResults } from '@/components/import/AdvancedImportResults'
import { ImportHistory } from '@/components/import/ImportHistory'
import { ImportTemplates } from '@/components/import/ImportTemplates'
import { AIImportUltraPro } from '@/components/import/AIImportUltraPro'
import { BulkImportUltraPro } from '@/components/import/BulkImportUltraPro'
import { RealTimeImportMonitor } from '@/components/import/RealTimeImportMonitor'
import { AdvancedMapping } from '@/components/import/AdvancedMapping'
import { ImportAnalytics } from '@/components/import/ImportAnalytics'
import { AutomationRules } from '@/components/import/AutomationRules'
import { RequirePlan } from '@/components/plan/RequirePlan'

const ImportUltraPro = () => {
  const { enableAutoSync, isSyncing } = useAutoSync()
  
  return (
    <RequirePlan minPlan="ultra_pro">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Import Ultra Pro</h1>
            <p className="text-muted-foreground mt-2">
              Plateforme d'import avancée avec mapping intelligent, optimisation IA et synchronisation automatique
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <a href="/suppliers/dashboard">Gérer les Fournisseurs</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/suppliers/marketplace">Ajouter des Fournisseurs</a>
            </Button>
            <SyncStatusIndicator compact />
            <div className="text-sm text-gray-500">
              Sync auto {enableAutoSync ? 'activée' : 'désactivée'}
            </div>
          </div>
        </div>

        <SyncStatusIndicator />

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="import">Import Avancé</TabsTrigger>
            <TabsTrigger value="results">Produits</TabsTrigger>
            <TabsTrigger value="ai">IA Optimization</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="mapping">Mapping</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="import">
            <ImportUltraProInterface />
          </TabsContent>

          <TabsContent value="results">
            <AdvancedImportResults />
          </TabsContent>

          <TabsContent value="ai">
            <AIImportUltraPro />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkImportUltraPro />
          </TabsContent>

          <TabsContent value="monitoring">
            <RealTimeImportMonitor />
          </TabsContent>

          <TabsContent value="mapping">
            <AdvancedMapping />
          </TabsContent>

          <TabsContent value="analytics">
            <ImportAnalytics />
          </TabsContent>

          <TabsContent value="automation">
            <AutomationRules />
          </TabsContent>
        </Tabs>
      </div>
    </RequirePlan>
  )
}

export default ImportUltraPro