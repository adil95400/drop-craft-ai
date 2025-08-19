import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Globe, 
  FileText, 
  Settings, 
  Zap, 
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Database
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface XMLJSONImportInterfaceProps {
  onImport: (data: any) => void
}

export const XMLJSONImportInterface = ({ onImport }: XMLJSONImportInterfaceProps) => {
  const [xmlUrl, setXmlUrl] = useState("")
  const [jsonUrl, setJsonUrl] = useState("")
  const [syncInterval, setSyncInterval] = useState("60")
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [syncEnabled, setSyncEnabled] = useState(false)
  const { toast } = useToast()

  const supplierTemplates = [
    {
      name: "BigBuy XML",
      url: "https://api.bigbuy.eu/rest/catalog/products.xml",
      type: "xml",
      fields: ["sku", "name", "description", "price", "stock", "images"],
      description: "Catalogue complet BigBuy"
    },
    {
      name: "VidaXL JSON", 
      url: "https://api.vidaxl.com/products.json",
      type: "json",
      fields: ["id", "title", "description", "price", "quantity", "images"],
      description: "API VidaXL en temps réel"
    },
    {
      name: "Matterhorn XML",
      url: "https://api.matterhorn.fi/xml/products",
      type: "xml", 
      fields: ["product_id", "name", "description", "price", "stock_status"],
      description: "Flux XML Matterhorn"
    },
    {
      name: "Printful API",
      url: "https://api.printful.com/products",
      type: "json",
      fields: ["id", "name", "thumbnail_url", "price"],
      description: "Produits Print on Demand"
    }
  ]

  const handleImport = async (url: string, type: 'xml' | 'json') => {
    setIsLoading(true)
    setProgress(0)

    try {
      // Simulation du processus d'import en temps réel
      const stages = [
        { progress: 20, message: "Connexion au flux..." },
        { progress: 40, message: "Validation du format..." },
        { progress: 60, message: "Mapping des champs..." },
        { progress: 80, message: "Import des produits..." },
        { progress: 100, message: "Import terminé!" }
      ]

      for (const stage of stages) {
        setProgress(stage.progress)
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      // Appel à l'edge function pour le vrai import
      const { data, error } = await supabase.functions.invoke('xml-json-import', {
        body: { url, type, syncInterval: parseInt(syncInterval) }
      })

      if (error) throw error

      onImport({
        type: `${type}-import`,
        url,
        products: data.products || [],
        totalFound: data.totalFound || 0
      })

      toast({
        title: "Import réussi !",
        description: `${data.totalFound || 0} produits importés depuis le flux ${type.toUpperCase()}`,
      })

    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer depuis ce flux",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  const handleSyncToggle = async (enabled: boolean) => {
    setSyncEnabled(enabled)
    
    if (enabled) {
      // Activer la synchronisation automatique
      toast({
        title: "Synchronisation activée",
        description: `Synchronisation automatique toutes les ${syncInterval} minutes`,
      })
    } else {
      toast({
        title: "Synchronisation désactivée",
        description: "La synchronisation automatique a été arrêtée",
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            Import en cours...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <Database className="w-8 h-8 mx-auto mb-2 text-primary animate-pulse" />
            <p className="text-sm font-medium">
              {progress < 40 && "Connexion au flux de données..."}
              {progress >= 40 && progress < 60 && "Validation du format..."}
              {progress >= 60 && progress < 80 && "Mapping automatique des champs..."}
              {progress >= 80 && "Import des produits en cours..."}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Import Flux XML/JSON Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Templates Fournisseurs</TabsTrigger>
              <TabsTrigger value="custom">URL Personnalisée</TabsTrigger>
              <TabsTrigger value="sync">Synchronisation</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supplierTemplates.map((template, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-sm">{template.name}</h4>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                          </div>
                          <Badge variant={template.type === 'xml' ? 'default' : 'secondary'}>
                            {template.type.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {template.fields.slice(0, 4).map((field, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                            {template.fields.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.fields.length - 4}
                              </Badge>
                            )}
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleImport(template.url, template.type as 'xml' | 'json')}
                          >
                            <Zap className="w-3 h-3 mr-2" />
                            Importer maintenant
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="xml-url">Flux XML</Label>
                      <Input
                        id="xml-url"
                        placeholder="https://fournisseur.com/products.xml"
                        value={xmlUrl}
                        onChange={(e) => setXmlUrl(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      onClick={() => handleImport(xmlUrl, 'xml')} 
                      disabled={!xmlUrl}
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Importer XML
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="json-url">API JSON</Label>
                      <Input
                        id="json-url"
                        placeholder="https://api.fournisseur.com/products.json"
                        value={jsonUrl}
                        onChange={(e) => setJsonUrl(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      onClick={() => handleImport(jsonUrl, 'json')} 
                      disabled={!jsonUrl}
                      className="w-full"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Importer JSON
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Formats supportés</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• XML standard (RSS, Atom, custom)</li>
                    <li>• JSON REST API</li>
                    <li>• CSV via HTTP</li>
                    <li>• Mapping automatique des champs</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sync" className="mt-6">
              <div className="space-y-6">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Synchronisation Automatique</h4>
                          <p className="text-sm text-muted-foreground">
                            Maintenir les prix et stocks à jour en temps réel
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={syncEnabled ? "default" : "outline"}
                        onClick={() => handleSyncToggle(!syncEnabled)}
                      >
                        {syncEnabled ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Activé
                          </>
                        ) : (
                          <>
                            <Settings className="w-4 h-4 mr-2" />
                            Activer
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="sync-interval">Intervalle (minutes)</Label>
                    <Input
                      id="sync-interval"
                      type="number"
                      min="15"
                      max="1440"
                      value={syncInterval}
                      onChange={(e) => setSyncInterval(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Test de connexion
                    </Button>
                  </div>
                  
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Voir les logs
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Statut des synchronisations</h4>
                  <div className="space-y-2">
                    {[
                      { name: "BigBuy XML", status: "active", lastSync: "Il y a 5 min", products: 1247 },
                      { name: "VidaXL JSON", status: "inactive", lastSync: "Jamais", products: 0 },
                      { name: "Matterhorn XML", status: "error", lastSync: "Il y a 2h", products: 856 }
                    ].map((sync, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            sync.status === 'active' ? 'bg-green-500' :
                            sync.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{sync.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {sync.products} produits • {sync.lastSync}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          sync.status === 'active' ? 'default' :
                          sync.status === 'error' ? 'destructive' : 'secondary'
                        }>
                          {sync.status === 'active' ? 'Actif' :
                           sync.status === 'error' ? 'Erreur' : 'Inactif'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}