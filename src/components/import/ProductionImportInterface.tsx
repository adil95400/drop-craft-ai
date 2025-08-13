import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Download, Upload, ExternalLink, Search, Filter, ShoppingCart, Package } from 'lucide-react'

interface ImportJob {
  id: string
  source_type: string
  status: string
  total_rows: number
  processed_rows: number
  success_rows: number
  error_rows: number
  created_at: string
}

export const ProductionImportInterface = () => {
  const { toast } = useToast()
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [importCategory, setImportCategory] = useState<string>('')
  const [importUrl, setImportUrl] = useState<string>('')
  const [recentImports, setRecentImports] = useState<ImportJob[]>([])

  const handleBigBuyImport = async () => {
    if (!importCategory) {
      toast({
        title: "Catégorie requise",
        description: "Veuillez sélectionner une catégorie d'import",
        variant: "destructive"
      })
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    try {
      const { data, error } = await supabase.functions.invoke('import-bigbuy', {
        body: { 
          category: importCategory,
          limit: 50 
        }
      })

      if (error) throw error

      // Simulate progress
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsImporting(false)
            toast({
              title: "Import BigBuy terminé",
              description: `${data.imported} produits importés avec succès`
            })
            return 100
          }
          return prev + 10
        })
      }, 500)

    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer depuis BigBuy",
        variant: "destructive"
      })
      setIsImporting(false)
    }
  }

  const handleUrlImport = async () => {
    if (!importUrl) {
      toast({
        title: "URL requise",
        description: "Veuillez saisir une URL à importer",
        variant: "destructive"
      })
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    try {
      const { data, error } = await supabase.functions.invoke('url-import', {
        body: { url: importUrl }
      })

      if (error) throw error

      setImportProgress(100)
      setIsImporting(false)
      
      toast({
        title: "Import URL terminé",
        description: "Produit importé et analysé avec succès"
      })

    } catch (error) {
      console.error('URL import error:', error)
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer depuis cette URL",
        variant: "destructive"
      })
      setIsImporting(false)
    }
  }

  const suppliers = [
    { id: 'bigbuy', name: 'BigBuy', description: 'Grossiste européen', connected: true },
    { id: 'aliexpress', name: 'AliExpress', description: 'Plateforme B2B', connected: false },
    { id: 'amazon', name: 'Amazon', description: 'Marketplace global', connected: false },
    { id: 'shopify', name: 'Shopify Stores', description: 'Boutiques Shopify', connected: true }
  ]

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports & Outdoors',
    'Health & Beauty',
    'Toys & Games',
    'Automotive',
    'Books & Media'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Production</h1>
          <p className="text-muted-foreground">
            Importez des produits depuis vos fournisseurs connectés
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtres avancés
        </Button>
      </div>

      {/* Progress Bar */}
      {isImporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Import en cours...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="suppliers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="url">Import URL</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-6">
          {/* Supplier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    <Badge variant={supplier.connected ? "default" : "secondary"}>
                      {supplier.connected ? "Connecté" : "Non connecté"}
                    </Badge>
                  </div>
                  <CardDescription>{supplier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supplier.connected && supplier.id === 'bigbuy' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="category">Catégorie</Label>
                        <Select value={importCategory} onValueChange={setImportCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handleBigBuyImport}
                        disabled={isImporting || !importCategory}
                        className="w-full gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Importer produits
                      </Button>
                    </div>
                  )}
                  
                  {supplier.connected && supplier.id === 'shopify' && (
                    <Button variant="outline" className="w-full gap-2">
                      <Search className="h-4 w-4" />
                      Parcourir boutiques
                    </Button>
                  )}
                  
                  {!supplier.connected && (
                    <Button variant="outline" className="w-full gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Connecter
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="url" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import depuis URL</CardTitle>
              <CardDescription>
                Importez un produit directement depuis une URL de produit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="url">URL du produit</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/product/..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleUrlImport}
                disabled={isImporting || !importUrl}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Importer produit
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des imports</CardTitle>
              <CardDescription>
                Consultez vos derniers imports et leur statut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun import récent</p>
                <p className="text-sm">Vos imports apparaîtront ici</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}