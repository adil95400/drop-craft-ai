import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdvancedImportInterface } from '@/components/import/AdvancedImportInterface'
import { EnhancedImportResults } from '@/components/import/EnhancedImportResults'
import { ImportHistory } from '@/components/import/ImportHistory'
import { ImportTemplates } from '@/components/import/ImportTemplates'
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="import">Import Avancé</TabsTrigger>
            <TabsTrigger value="results">Produits Importés</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="import">
            <AdvancedImportInterface />
          </TabsContent>

          <TabsContent value="results">
            <EnhancedImportResults />
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