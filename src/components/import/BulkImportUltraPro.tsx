import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  Clock, 
  Settings,
  CheckCircle,
  Target
} from 'lucide-react'
import { useImportUltraPro } from '@/hooks/useImportUltraPro'
import { toast } from 'sonner'

export const BulkImportUltraPro = () => {
  const { 
    bulkImport, 
    isBulkImporting, 
    bulkProgress,
    importedProducts 
  } = useImportUltraPro()

  const [selectedPlatform, setSelectedPlatform] = useState('')

  const handleBulkImport = async () => {
    if (!selectedPlatform) {
      toast.error('Veuillez sélectionner une plateforme')
      return
    }

    try {
      await bulkImport({
        type: 'platform_bulk' as any,
        platform: selectedPlatform,
        filters: {},
        settings: {}
      })
      toast.success('Import massif lancé!')
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Import Massif Ultra Pro</h1>
        <p className="text-muted-foreground">
          Importez des milliers de produits depuis les plus grandes plateformes
        </p>
      </div>

      {isBulkImporting && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-orange-600 animate-pulse" />
                <p className="font-medium">Import massif en cours...</p>
                <Badge>{Math.round(bulkProgress)}%</Badge>
              </div>
              <Progress value={bulkProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Sélection de la Plateforme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['aliexpress', 'amazon', 'ebay'].map((platform) => (
              <Card 
                key={platform}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPlatform === platform ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedPlatform(platform)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold capitalize">{platform}</h3>
                  <p className="text-sm text-muted-foreground">
                    Import depuis {platform}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Button 
            onClick={handleBulkImport}
            disabled={isBulkImporting || !selectedPlatform}
            className="w-full"
            size="lg"
          >
            {isBulkImporting ? (
              <>
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Database className="w-5 h-5 mr-2" />
                Lancer l'Import Massif
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}