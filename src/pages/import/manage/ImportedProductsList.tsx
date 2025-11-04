import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdvancedImportResults } from '@/components/import/AdvancedImportResults'
import { useNavigate } from 'react-router-dom'
import { Package, ArrowLeft } from 'lucide-react'

export default function ImportedProductsList() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/import/manage')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Produits Importés</h1>
            <p className="text-muted-foreground">
              Liste complète de tous vos produits importés
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/import/quick')}>
          Nouvel import
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Catalogue Importé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedImportResults />
        </CardContent>
      </Card>
    </div>
  )
}
