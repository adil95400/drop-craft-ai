import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductionImportInterface } from '@/components/import/ProductionImportInterface'
import { ImportURLInterface } from '@/components/import/ImportURLInterface'
import { BulkImportUltraPro } from '@/components/import/BulkImportUltraPro'
import { ScheduledImportsUltraPro } from '@/components/import/ScheduledImportsUltraPro'
import { AIImportUltraPro } from '@/components/import/AIImportUltraPro'

const ImportUltraPro = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <Tabs defaultValue="production" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="url">Import URL</TabsTrigger>
          <TabsTrigger value="bulk">Import en Masse</TabsTrigger>
          <TabsTrigger value="scheduled">Planifiés</TabsTrigger>
          <TabsTrigger value="ai">IA Avancée</TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  )
}

export default ImportUltraPro