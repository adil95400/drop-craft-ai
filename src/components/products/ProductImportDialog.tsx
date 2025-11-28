import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Globe, Database, Sparkles, Upload, Download, Loader2, ShoppingCart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { importExportService } from '@/services/importExportService'
import { useCatalog } from '@/domains/commerce/hooks/useCatalog'
import { supabase } from '@/integrations/supabase/client'

interface ProductImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ImportMethod = 'csv' | 'url' | 'ai' | 'catalog'

export function ProductImportDialog({ open, onOpenChange }: ProductImportDialogProps) {
  const { toast } = useToast()
  const { products: catalogProducts, loadMarketplace } = useCatalog()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedMethod, setSelectedMethod] = useState<ImportMethod>('csv')
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [selectedCatalogProducts, setSelectedCatalogProducts] = useState<string[]>([])

  React.useEffect(() => {
    if (selectedMethod === 'catalog' && catalogProducts.length === 0) {
      loadMarketplace()
    }
  }, [selectedMethod, catalogProducts.length, loadMarketplace])

  const handleImport = async () => {
    setIsImporting(true)
    setImportProgress(0)

    try {
      let result

      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('Utilisateur non authentifié')

      switch (selectedMethod) {
        case 'csv':
          if (!file) throw new Error('Veuillez sélectionner un fichier CSV')
          result = await importExportService.importFromCSV(file, userId)
          break
        case 'url':
          if (!url.trim()) throw new Error('Veuillez saisir une URL valide')
          result = await importExportService.importFromURL(url.trim(), userId)
          break
        case 'ai':
          if (!aiPrompt.trim()) throw new Error('Veuillez saisir une description pour générer les produits')
          result = await importExportService.generateWithAI(aiPrompt.trim(), userId, 5)
          break
        case 'catalog':
          if (selectedCatalogProducts.length === 0) throw new Error('Veuillez sélectionner au moins un produit du catalogue')
          result = await importExportService.importFromCatalog(selectedCatalogProducts, userId)
          break
        default:
          throw new Error('Méthode d\'import non supportée')
      }

      clearInterval(progressInterval)
      setImportProgress(100)

      if (result.success) {
        toast({
          title: "Import réussi !",
          description: `${result.imported} produit${result.imported > 1 ? 's ont' : ' a'} été importé${result.imported > 1 ? 's' : ''} avec succès`,
        })
        resetForm()
        onOpenChange(false)
      } else {
        throw new Error(result.errors.join(', '))
      }
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const resetForm = () => {
    setFile(null)
    setUrl('')
    setAiPrompt('')
    setSelectedCatalogProducts([])
    setImportProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
    } else {
      toast({
        title: "Format non supporté",
        description: "Veuillez sélectionner un fichier CSV valide",
        variant: "destructive"
      })
    }
  }

  const toggleCatalogProduct = (productId: string) => {
    setSelectedCatalogProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer des Produits
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as ImportMethod)}>
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Fichier CSV
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              URL/API
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Génération IA
            </TabsTrigger>
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Catalogue
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="csv">
              <Card>
                <CardHeader>
                  <CardTitle>Import depuis fichier CSV</CardTitle>
                  <CardDescription>
                    Importez vos produits depuis un fichier CSV. Le fichier doit contenir les colonnes : name, price, description, category, stock_quantity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="csv-file">Fichier CSV *</Label>
                    <Input 
                      id="csv-file"
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv"
                      aria-required="true"
                      aria-describedby="csv-help"
                      onChange={handleFileChange}
                      disabled={isImporting}
                      className="bg-background file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    <p id="csv-help" className="text-xs text-muted-foreground mt-1">
                      Format requis: CSV avec colonnes name, price, description, category, stock_quantity
                    </p>
                  </div>
                  {file && (
                    <div className="text-sm text-muted-foreground">
                      Fichier sélectionné : {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="url">
              <Card>
                <CardHeader>
                  <CardTitle>Import depuis URL ou API</CardTitle>
                  <CardDescription>
                    Importez des produits depuis une URL JSON ou une API REST
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="import-url">URL de l'API *</Label>
                    <Input 
                      id="import-url"
                      type="url"
                      placeholder="https://api.example.com/products"
                      value={url}
                      maxLength={2000}
                      aria-required="true"
                      aria-describedby="url-help"
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isImporting}
                      className="bg-background"
                    />
                    <p id="url-help" className="text-xs text-muted-foreground mt-1">
                      L'API doit retourner du JSON avec un tableau de produits contenant: name, price, description
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai">
              <Card>
                <CardHeader>
                  <CardTitle>Génération IA de produits</CardTitle>
                  <CardDescription>
                    Décrivez le type de produits que vous souhaitez et l'IA générera 5 produits correspondants
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ai-prompt">Description des produits à générer *</Label>
                    <Textarea
                      id="ai-prompt"
                      placeholder="Ex: Des produits électroniques innovants pour la maison intelligente, avec des prix entre 50€ et 300€"
                      value={aiPrompt}
                      maxLength={1000}
                      aria-required="true"
                      aria-describedby="ai-help"
                      onChange={(e) => setAiPrompt(e.target.value)}
                      disabled={isImporting}
                      rows={4}
                      className="bg-background resize-none"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p id="ai-help" className="text-xs text-muted-foreground">
                        Plus votre description est précise, meilleurs seront les produits générés
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {aiPrompt.length} / 1000
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalog">
              <Card>
                <CardHeader>
                  <CardTitle>Import depuis le catalogue</CardTitle>
                  <CardDescription>
                    Sélectionnez des produits du catalogue mondial pour les ajouter à votre inventaire
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {catalogProducts.length > 0 ? (
                      <div className="grid gap-3 max-h-96 overflow-y-auto pr-2 rounded-lg border p-4 bg-muted/30">
                        {catalogProducts.slice(0, 20).map((product) => (
                          <div key={product.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-background hover:bg-accent/50 transition-colors">
                            <Checkbox
                              checked={selectedCatalogProducts.includes(product.id)}
                              onCheckedChange={() => toggleCatalogProduct(product.id)}
                              disabled={isImporting}
                              aria-label={`Sélectionner ${product.name}`}
                            />
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="h-12 w-12 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg'
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{product.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="font-semibold text-primary">{product.price}€</span>
                                <span>•</span>
                                <span>{product.category}</span>
                              </div>
                              <div className="flex gap-1 mt-1">
                                {product.is_trending && <Badge variant="secondary" className="text-xs">Tendance</Badge>}
                                {product.is_bestseller && <Badge variant="default" className="text-xs">Best-seller</Badge>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/30">
                        <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin text-primary" />
                        <p className="font-medium">Chargement du catalogue...</p>
                        <p className="text-sm mt-1">Veuillez patienter</p>
                      </div>
                    )}
                    
                    {selectedCatalogProducts.length > 0 && (
                      <div className="text-sm font-medium">
                        {selectedCatalogProducts.length} produit{selectedCatalogProducts.length > 1 ? 's' : ''} sélectionné{selectedCatalogProducts.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {isImporting && (
            <Card className="mt-4 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Import en cours...
                    </span>
                    <span className="text-primary">{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Veuillez patienter, cette opération peut prendre quelques instants
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }} 
              disabled={isImporting}
              className="sm:order-1"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleImport}
              className="sm:order-2"
              disabled={
                isImporting || 
                (selectedMethod === 'csv' && !file) ||
                (selectedMethod === 'url' && !url.trim()) ||
                (selectedMethod === 'ai' && !aiPrompt.trim()) ||
                (selectedMethod === 'catalog' && selectedCatalogProducts.length === 0)
              }
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Démarrer l'import
                  {selectedMethod === 'catalog' && selectedCatalogProducts.length > 0 && (
                    <span className="ml-2 text-xs">({selectedCatalogProducts.length})</span>
                  )}
                </>
              )}
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}