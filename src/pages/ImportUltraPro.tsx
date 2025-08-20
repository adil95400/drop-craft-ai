import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdvancedImportInterface } from '@/components/import/AdvancedImportInterface'
import { EnhancedImportResults } from '@/components/import/EnhancedImportResults'
import { ImportHistory } from '@/components/import/ImportHistory'
import { ImportTemplates } from '@/components/import/ImportTemplates'
import { AIImportUltraPro } from '@/components/import/AIImportUltraPro'
import { BulkImportUltraPro } from '@/components/import/BulkImportUltraPro'
import { RealTimeMonitoring } from '@/components/import/RealTimeMonitoring'
import { AdvancedMapping } from '@/components/import/AdvancedMapping'
import { ImportAnalytics } from '@/components/import/ImportAnalytics'
import { AutomationRules } from '@/components/import/AutomationRules'
import { RequirePlan } from '@/components/plan/RequirePlan'

const ImportUltraPro = () => {
  return (
    <RequirePlan minPlan="ultra_pro">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Import Ultra Pro</h1>
          <p className="text-muted-foreground">
            Plateforme d'import avancée avec mapping intelligent, optimisation IA et exportation multi-canaux
          </p>
        </div>

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
            <AdvancedImportInterface />
          </TabsContent>

          <TabsContent value="results">
            <EnhancedImportResults />
          </TabsContent>

          <TabsContent value="ai">
            <AIImportUltraPro />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkImportUltraPro />
          </TabsContent>

          <TabsContent value="monitoring">
            <RealTimeMonitoring />
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