import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Upload, 
  FileSpreadsheet, 
  ShoppingBag, 
  Link2, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Clock,
  Package
} from 'lucide-react'
import { useUnifiedImport } from '@/hooks/useUnifiedImport'
import { ImportCSVWithValidation } from './ImportCSVWithValidation'

export function UnifiedImportInterface() {
  const {
    isImporting,
    isCSVImporting,
    isShopifyImporting,
    isAPIImporting,
    progress,
    importCSV,
    importShopify,
    importAPI,
    importHistory,
    isLoadingHistory
  } = useUnifiedImport()

  const [activeTab, setActiveTab] = useState('csv')
  const [apiUrl, setApiUrl] = useState('')
  const [includeVariants, setIncludeVariants] = useState(true)

  const handleShopifyImport = () => {
    importShopify({ includeVariants })
  }

  const handleAPIImport = () => {
    if (!apiUrl.trim()) return
    importAPI(apiUrl)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'failed': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Import Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Import Unifié
          </CardTitle>
          <CardDescription>
            Importez vos produits depuis plusieurs sources en un seul endroit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="csv">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV / Excel
              </TabsTrigger>
              <TabsTrigger value="shopify">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shopify
              </TabsTrigger>
              <TabsTrigger value="api">
                <Link2 className="h-4 w-4 mr-2" />
                API / URL
              </TabsTrigger>
            </TabsList>

            {/* CSV Import */}
            <TabsContent value="csv" className="space-y-4 mt-6">
              <ImportCSVWithValidation />
            </TabsContent>

            {/* Shopify Import */}
            <TabsContent value="shopify" className="space-y-4 mt-6">
              <Alert>
                <ShoppingBag className="h-4 w-4" />
                <AlertDescription>
                  Import complet de tous vos produits Shopify avec leurs variantes
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Inclure les variantes</Label>
                    <p className="text-sm text-muted-foreground">
                      Importer chaque variante comme un produit séparé
                    </p>
                  </div>
                  <Switch
                    checked={includeVariants}
                    onCheckedChange={setIncludeVariants}
                    disabled={isShopifyImporting}
                  />
                </div>

                {isShopifyImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Import en cours...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                <Button
                  onClick={handleShopifyImport}
                  disabled={isShopifyImporting}
                  className="w-full"
                  size="lg"
                >
                  {isShopifyImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Importer tous les produits Shopify
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* API Import */}
            <TabsContent value="api" className="space-y-4 mt-6">
              <Alert>
                <Link2 className="h-4 w-4" />
                <AlertDescription>
                  Importez des produits depuis une URL API retournant du JSON
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-url">URL de l'API</Label>
                  <Input
                    id="api-url"
                    type="url"
                    placeholder="https://api.example.com/products"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    disabled={isAPIImporting}
                  />
                  <p className="text-sm text-muted-foreground">
                    L'API doit retourner un JSON avec un tableau de produits
                  </p>
                </div>

                {isAPIImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Import en cours...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                <Button
                  onClick={handleAPIImport}
                  disabled={isAPIImporting || !apiUrl.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isAPIImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Importer depuis l'API
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Imports History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique récent</CardTitle>
          <CardDescription>
            Les 5 derniers imports effectués
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : importHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun import récent
            </div>
          ) : (
            <div className="space-y-3">
              {importHistory.slice(0, 5).map((record: any) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium">{record.platform || record.source_url}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.platform?.toUpperCase()} • {record.products_imported || 0} importés
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
