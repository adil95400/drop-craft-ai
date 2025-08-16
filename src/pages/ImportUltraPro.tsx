import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductionImportInterface } from '@/components/import/ProductionImportInterface'
import { ImportURLInterface } from '@/components/import/ImportURLInterface'
import { ImportUltraProInterface } from '@/components/import/ImportUltraProInterface'
import { BulkImportUltraPro } from '@/components/import/BulkImportUltraPro'
import { ScheduledImportsUltraPro } from '@/components/import/ScheduledImportsUltraPro'
import { AIImportUltraPro } from '@/components/import/AIImportUltraPro'
import { ImportResults } from '@/components/import/ImportResults'
import { ImportHistory } from '@/components/import/ImportHistory'
import { ImportTemplates } from '@/components/import/ImportTemplates'
import { RequirePlan } from '@/components/plan/RequirePlan'

const ImportUltraPro = () => {
  return (
    <RequirePlan minPlan="ultra_pro">
      <div className="container mx-auto p-6 space-y-8">
        <Tabs defaultValue="interface" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9 text-xs">
          <TabsTrigger value="interface">Interface</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="url">Import URL</TabsTrigger>
          <TabsTrigger value="bulk">En Masse</TabsTrigger>
          <TabsTrigger value="scheduled">Planifiés</TabsTrigger>
          <TabsTrigger value="ai">IA Avancée</TabsTrigger>
          <TabsTrigger value="results">Résultats</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="interface">
          <ImportUltraProInterface />
        </TabsContent>

        <TabsContent value="production">
          <ProductionImportInterface />
        </TabsContent>

        <TabsContent value="url">
          <ImportURLInterface />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkImportUltraPro />
        </TabsContent>

        <TabsContent value="scheduled">
          <ScheduledImportsUltraPro />
        </TabsContent>

        <TabsContent value="ai">
          <AIImportUltraPro />
        </TabsContent>

        <TabsContent value="results">
          <ImportResults />
        </TabsContent>

        <TabsContent value="history">
          <ImportHistory />
        </TabsContent>

        <TabsContent value="templates">
          <ImportTemplates />
        </TabsContent>
        </Tabs>
      </div>
    </RequirePlan>
  )
}

export default ImportUltraPro