import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, Globe, Database, Zap, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProductImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductImportDialog({ open, onOpenChange }: ProductImportDialogProps) {
  const [importType, setImportType] = useState('csv')
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvMapping, setCsvMapping] = useState({
    name: '',
    price: '',
    description: '',
    sku: '',
    category: '',
    stock: ''
  })
  const [urlInput, setUrlInput] = useState('')
  const [apiConfig, setApiConfig] = useState({
    endpoint: '',
    apiKey: '',
    format: 'json'
  })
  const { toast } = useToast()

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setCsvFile(file)
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    setImportProgress(0)

    try {
      // Simulation de l'import avec progress
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 500)

      // Attendre la fin de la simulation
      await new Promise(resolve => setTimeout(resolve, 5000))

      toast({
        title: "Import terminé",
        description: "125 produits ont été importés avec succès",
      })
      
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Une erreur s'est produite lors de l'import",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const csvColumns = [
    { value: 'name', label: 'Nom du produit' },
    { value: 'price', label: 'Prix' },
    { value: 'cost_price', label: 'Prix de revient' },
    { value: 'description', label: 'Description' },
    { value: 'sku', label: 'SKU' },
    { value: 'category', label: 'Catégorie' },
    { value: 'stock_quantity', label: 'Stock' },
    { value: 'image_url', label: 'URL Image' },
  ]

  const importMethods = [
    {
      id: 'csv',
      title: 'Fichier CSV',
      description: 'Importez vos produits depuis un fichier CSV',
      icon: FileText,
      badge: 'Populaire'
    },
    {
      id: 'url',
      title: 'URL/Site Web',
      description: 'Importez depuis une URL ou scrapez un site',
      icon: Globe,
      badge: 'Automatique'
    },
    {
      id: 'api',
      title: 'API REST',
      description: 'Connectez votre API pour synchroniser',
      icon: Database,
      badge: 'Avancé'
    },
    {
      id: 'ai',
      title: 'Génération IA',
      description: 'Créez des produits avec l\'IA',
      icon: Zap,
      badge: 'Nouveau'
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer des Produits</DialogTitle>
        </DialogHeader>

        {isImporting ? (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-medium mb-2">Import en cours...</h3>
              <p className="text-muted-foreground">
                Veuillez patienter pendant l'import de vos produits
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">89</div>
                <div className="text-sm text-muted-foreground">Importés</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-orange-500">12</div>
                <div className="text-sm text-muted-foreground">En traitement</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-red-500">3</div>
                <div className="text-sm text-muted-foreground">Erreurs</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Method Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {importMethods.map((method) => (
                <Card 
                  key={method.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    importType === method.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setImportType(method.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <method.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{method.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {method.badge}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {method.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Import Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration d'import</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={importType} onValueChange={setImportType}>
                  <TabsContent value="csv" className="space-y-4">
                    <div>
                      <Label htmlFor="csv-file">Fichier CSV</Label>
                      <Input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="mt-1"
                      />
                      {csvFile && (
                        <div className="mt-2 flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{csvFile.name}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Correspondance des colonnes</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {Object.entries(csvMapping).map(([field, value]) => (
                          <div key={field}>
                            <Label className="text-sm capitalize">{field}</Label>
                            <Select value={value} onValueChange={(val) => 
                              setCsvMapping(prev => ({ ...prev, [field]: val }))
                            }>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner colonne" />
                              </SelectTrigger>
                              <SelectContent>
                                {csvColumns.map(col => (
                                  <SelectItem key={col.value} value={col.value}>
                                    {col.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>Format CSV requis avec en-têtes sur la première ligne</span>
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label htmlFor="url-input">URL du site ou catalogue</Label>
                      <Input
                        id="url-input"
                        placeholder="https://example.com/products"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Type de contenu</Label>
                        <Select defaultValue="auto">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Détection automatique</SelectItem>
                            <SelectItem value="ecommerce">Site e-commerce</SelectItem>
                            <SelectItem value="feed">Flux produits</SelectItem>
                            <SelectItem value="xml">Fichier XML</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Fréquence de mise à jour</Label>
                        <Select defaultValue="manual">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manuelle</SelectItem>
                            <SelectItem value="daily">Quotidienne</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="api" className="space-y-4">
                    <div>
                      <Label htmlFor="api-endpoint">Point de terminaison API</Label>
                      <Input
                        id="api-endpoint"
                        placeholder="https://api.example.com/products"
                        value={apiConfig.endpoint}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="api-key">Clé API</Label>
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="Votre clé API"
                        value={apiConfig.apiKey}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Format de réponse</Label>
                      <Select value={apiConfig.format} onValueChange={(val) => 
                        setApiConfig(prev => ({ ...prev, format: val }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="space-y-4">
                    <div>
                      <Label htmlFor="ai-prompt">Description des produits à créer</Label>
                      <Textarea
                        id="ai-prompt"
                        placeholder="Ex: Créez 20 produits de vêtements casual pour hommes et femmes avec des prix entre 25€ et 150€"
                        className="mt-1"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre de produits</Label>
                        <Select defaultValue="10">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 produits</SelectItem>
                            <SelectItem value="10">10 produits</SelectItem>
                            <SelectItem value="25">25 produits</SelectItem>
                            <SelectItem value="50">50 produits</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Catégorie principale</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fashion">Mode</SelectItem>
                            <SelectItem value="electronics">Électronique</SelectItem>
                            <SelectItem value="home">Maison</SelectItem>
                            <SelectItem value="sports">Sport</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <div className="space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger modèle
                </Button>
                <Button onClick={handleImport}>
                  <Upload className="h-4 w-4 mr-2" />
                  Démarrer l'import
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}