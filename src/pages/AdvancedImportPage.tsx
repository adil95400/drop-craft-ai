import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { Helmet } from 'react-helmet-async'
import { 
  Upload, Link2, Code, FileSpreadsheet, 
  Wand2, CheckCircle, AlertCircle, Loader2,
  ArrowRight, FileText, Globe
} from 'lucide-react'

const AdvancedImportPage = () => {
  const { toast } = useToast()
  const [importMethod, setImportMethod] = useState<'csv' | 'url' | 'api'>('csv')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [apiUrl, setApiUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier CSV",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    setProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          toast({
            title: "Import réussi",
            description: `${file.name} importé avec succès`
          })
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const handleApiImport = async () => {
    if (!apiUrl) {
      toast({
        title: "URL manquante",
        description: "Veuillez entrer une URL d'API",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    
    // Simulate API call
    setTimeout(() => {
      setUploading(false)
      toast({
        title: "Import API réussi",
        description: "Produits importés depuis l'API"
      })
    }, 2000)
  }

  const handleWebsiteScraping = async () => {
    if (!websiteUrl) {
      toast({
        title: "URL manquante",
        description: "Veuillez entrer l'URL du site à analyser",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    
    setTimeout(() => {
      setUploading(false)
      toast({
        title: "Scraping terminé",
        description: "Produits extraits avec succès"
      })
    }, 3000)
  }

  return (
    <>
      <Helmet>
        <title>Import Avancé - Drop Craft AI</title>
        <meta name="description" content="Importez vos produits via CSV, API ou scraping intelligent" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Import Avancé</h1>
          <p className="text-muted-foreground">
            Importez vos produits en masse via différentes sources
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CSV Import</p>
                  <p className="text-2xl font-bold">Illimité</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Link2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">API Connectées</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Wand2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IA Scraping</p>
                  <p className="text-2xl font-bold">Actif</p>
                  <Badge variant="secondary" className="mt-1">Pro</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Import Interface */}
        <Tabs value={importMethod} onValueChange={(v: any) => setImportMethod(v)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="csv" className="gap-2">
              <Upload className="h-4 w-4" />
              Fichier CSV
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Code className="h-4 w-4" />
              API REST
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Globe className="h-4 w-4" />
              Scraping IA
            </TabsTrigger>
          </TabsList>

          {/* CSV Import */}
          <TabsContent value="csv" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Import CSV
                </CardTitle>
                <CardDescription>
                  Importez vos produits depuis un fichier CSV formaté
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Area */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <p className="text-sm font-medium mb-2">
                      Cliquez pour sélectionner ou glissez-déposez
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formats acceptés: CSV (max 10MB)
                    </p>
                  </Label>
                  <Input 
                    id="file-upload"
                    type="file" 
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </div>

                {/* Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Import en cours...</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                {/* Template Download */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Modèle CSV</p>
                      <p className="text-xs text-muted-foreground">Format recommandé</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Télécharger
                  </Button>
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Format attendu :</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>name, description, price, sku, category</li>
                    <li>stock_quantity, image_url, supplier_id</li>
                    <li>Encodage UTF-8 recommandé</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Import */}
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Import API REST
                </CardTitle>
                <CardDescription>
                  Connectez-vous à une API pour importer automatiquement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-url">URL de l'API</Label>
                  <Input 
                    id="api-url"
                    placeholder="https://api.example.com/products"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">Clé API (optionnel)</Label>
                    <Input 
                      id="api-key"
                      type="password"
                      placeholder="sk_..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-format">Format</Label>
                    <Input 
                      id="api-format"
                      placeholder="JSON"
                      defaultValue="JSON"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleApiImport} 
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Importer depuis l'API
                    </>
                  )}
                </Button>

                {/* Popular APIs */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">APIs populaires :</p>
                  <div className="grid gap-2">
                    {[
                      { name: 'AliExpress', status: 'active' },
                      { name: 'Amazon MWS', status: 'inactive' },
                      { name: 'BigBuy', status: 'active' }
                    ].map((api) => (
                      <div key={api.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${api.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm font-medium">{api.name}</span>
                        </div>
                        <Badge variant={api.status === 'active' ? 'default' : 'secondary'}>
                          {api.status === 'active' ? 'Connecté' : 'Non connecté'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scraping Import */}
          <TabsContent value="url" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Scraping Intelligent IA
                  <Badge variant="secondary">Pro</Badge>
                </CardTitle>
                <CardDescription>
                  Extrayez automatiquement des produits depuis n'importe quel site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website-url">URL du site à analyser</Label>
                  <Input 
                    id="website-url"
                    placeholder="https://example.com/products"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Scraping Intelligent
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Notre IA détecte automatiquement les produits, prix, images et descriptions.
                        Fonctionne sur la plupart des sites e-commerce.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleWebsiteScraping} 
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Lancer le scraping IA
                    </>
                  )}
                </Button>

                {/* Features */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Capacités IA :</p>
                  <div className="grid gap-2">
                    {[
                      'Détection automatique des produits',
                      'Extraction des prix et variations',
                      'Téléchargement des images HD',
                      'Génération de descriptions SEO',
                      'Mapping automatique des catégories'
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Imports */}
        <Card>
          <CardHeader>
            <CardTitle>Imports récents</CardTitle>
            <CardDescription>Historique de vos derniers imports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'products_2024.csv', date: 'Il y a 2h', status: 'success', count: 150 },
                { name: 'aliexpress_api', date: 'Hier', status: 'success', count: 89 },
                { name: 'supplier_catalog.csv', date: 'Il y a 3j', status: 'error', count: 0 }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.count} produits</p>
                    <Badge variant={item.status === 'success' ? 'default' : 'destructive'}>
                      {item.status === 'success' ? 'Réussi' : 'Échec'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default AdvancedImportPage
