import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Zap, FileSpreadsheet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { UnifiedImportInterface } from '@/components/import/UnifiedImportInterface'
import { CSVImportWizard } from '@/components/import/CSVImportWizard'

export default function QuickImportPage() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/import/manage')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Import Rapide</h1>
          <p className="text-muted-foreground">
            Importez vos produits rapidement et facilement
          </p>
        </div>
      </div>

      <Tabs defaultValue="wizard" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="wizard" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Import CSV Guidé
          </TabsTrigger>
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Import Rapide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wizard" className="mt-6">
          <CSVImportWizard />
        </TabsContent>

        <TabsContent value="quick" className="mt-6">
          <UnifiedImportInterface />
        </TabsContent>
      </Tabs>
    </div>
  )
}
