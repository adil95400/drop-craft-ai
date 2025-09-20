import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Code, Play, Check, AlertTriangle, Settings, Eye, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface APIConfig {
  url: string
  method: 'GET' | 'POST'
  headers: Record<string, string>
  body?: string
  authentication: {
    type: 'none' | 'bearer' | 'api_key' | 'basic'
    token?: string
    username?: string
    password?: string
    api_key_header?: string
    api_key_value?: string
  }
  pagination: {
    enabled: boolean
    type: 'offset' | 'cursor' | 'page'
    page_param?: string
    size_param?: string
    max_pages?: number
  }
  data_path: string // JSONPath to products array
  field_mapping: Record<string, string>
}

interface APITestResult {
  success: boolean
  status: number
  data: any
  error?: string
  products_found: number
  sample_product?: any
}

export function APIImportWizard() {
  const { toast } = useToast()
  const [step, setStep] = useState<'config' | 'test' | 'mapping' | 'import'>('config')
  const [config, setConfig] = useState<APIConfig>({
    url: '',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    authentication: { type: 'none' },
    pagination: { enabled: false, type: 'page', max_pages: 5 },
    data_path: '$',
    field_mapping: {}
  })
  const [testResult, setTestResult] = useState<APITestResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleAuthChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      authentication: {
        ...prev.authentication,
        [key]: value
      }
    }))
  }

  const handlePaginationChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        [key]: value
      }
    }))
  }

  const testAPI = async () => {
    setIsTesting(true)
    try {
      const response = await supabase.functions.invoke('api-import-test', {
        body: { config }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      setTestResult(response.data)
      if (response.data.success) {
        toast({
          title: "Test réussi",
          description: `${response.data.products_found} produits trouvés`
        })
        setStep('mapping')
      } else {
        toast({
          title: "Test échoué",
          description: response.data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erreur de test",
        description: "Impossible de tester l'API",
        variant: "destructive"
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleFieldMapping = (apiField: string, productField: string) => {
    setConfig(prev => ({
      ...prev,
      field_mapping: {
        ...prev.field_mapping,
        [apiField]: productField
      }
    }))
  }

  const startImport = async () => {
    setIsImporting(true)
    setImportProgress(0)

    try {
      const response = await supabase.functions.invoke('api-import-execute', {
        body: { config }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      // Simulate progress updates
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 500)

      toast({
        title: "Import démarré",
        description: "L'import des produits est en cours..."
      })

      setStep('import')
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Impossible de démarrer l'import",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  const PRODUCT_FIELDS = {
    name: 'Nom du produit',
    description: 'Description',
    price: 'Prix',
    sku: 'SKU/Référence',
    category: 'Catégorie',
    brand: 'Marque',
    stock_quantity: 'Stock',
    image_url: 'URL Image',
    weight: 'Poids',
    dimensions: 'Dimensions'
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Assistant d'Import API
        </CardTitle>
        <CardDescription>
          Connectez-vous à n'importe quelle API REST pour importer vos produits
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config">1. Configuration</TabsTrigger>
            <TabsTrigger value="test" disabled={step !== 'test'}>2. Test</TabsTrigger>
            <TabsTrigger value="mapping" disabled={step !== 'mapping'}>3. Mapping</TabsTrigger>
            <TabsTrigger value="import" disabled={step !== 'import'}>4. Import</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuration de base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="url">URL de l'API *</Label>
                    <Input
                      id="url"
                      placeholder="https://api.example.com/products"
                      value={config.url}
                      onChange={(e) => handleConfigChange('url', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="method">Méthode HTTP</Label>
                    <Select value={config.method} onValueChange={(value) => handleConfigChange('method', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="data_path">Chemin vers les données (JSONPath)</Label>
                    <Input
                      id="data_path"
                      placeholder="$.products ou $.data"
                      value={config.data_path}
                      onChange={(e) => handleConfigChange('data_path', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Chemin JSON vers le tableau de produits
                    </p>
                  </div>

                  {config.method === 'POST' && (
                    <div>
                      <Label htmlFor="body">Corps de la requête (JSON)</Label>
                      <Textarea
                        id="body"
                        placeholder='{"page": 1, "limit": 100}'
                        value={config.body || ''}
                        onChange={(e) => handleConfigChange('body', e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Authentification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Type d'authentification</Label>
                    <Select value={config.authentication.type} onValueChange={(value) => handleAuthChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.authentication.type === 'bearer' && (
                    <div>
                      <Label htmlFor="token">Token</Label>
                      <Input
                        id="token"
                        type="password"
                        placeholder="Bearer token"
                        value={config.authentication.token || ''}
                        onChange={(e) => handleAuthChange('token', e.target.value)}
                      />
                    </div>
                  )}

                  {config.authentication.type === 'api_key' && (
                    <>
                      <div>
                        <Label htmlFor="api_key_header">Nom du header</Label>
                        <Input
                          id="api_key_header"
                          placeholder="X-API-Key"
                          value={config.authentication.api_key_header || ''}
                          onChange={(e) => handleAuthChange('api_key_header', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="api_key_value">Valeur de l'API Key</Label>
                        <Input
                          id="api_key_value"
                          type="password"
                          placeholder="API Key"
                          value={config.authentication.api_key_value || ''}
                          onChange={(e) => handleAuthChange('api_key_value', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {config.authentication.type === 'basic' && (
                    <>
                      <div>
                        <Label htmlFor="username">Nom d'utilisateur</Label>
                        <Input
                          id="username"
                          value={config.authentication.username || ''}
                          onChange={(e) => handleAuthChange('username', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                          id="password"
                          type="password"
                          value={config.authentication.password || ''}
                          onChange={(e) => handleAuthChange('password', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Headers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">En-têtes HTTP</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(config.headers).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <Input
                          placeholder="Header"
                          value={key}
                          onChange={(e) => {
                            const newHeaders = { ...config.headers }
                            delete newHeaders[key]
                            newHeaders[e.target.value] = value
                            handleConfigChange('headers', newHeaders)
                          }}
                        />
                        <Input
                          placeholder="Valeur"
                          value={value}
                          onChange={(e) => {
                            handleConfigChange('headers', {
                              ...config.headers,
                              [key]: e.target.value
                            })
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newHeaders = { ...config.headers }
                            delete newHeaders[key]
                            handleConfigChange('headers', newHeaders)
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleConfigChange('headers', {
                          ...config.headers,
                          '': ''
                        })
                      }}
                    >
                      Ajouter un en-tête
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pagination */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pagination</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="pagination_enabled"
                      checked={config.pagination.enabled}
                      onChange={(e) => handlePaginationChange('enabled', e.target.checked)}
                    />
                    <Label htmlFor="pagination_enabled">Activer la pagination</Label>
                  </div>

                  {config.pagination.enabled && (
                    <>
                      <div>
                        <Label>Type de pagination</Label>
                        <Select value={config.pagination.type} onValueChange={(value) => handlePaginationChange('type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="page">Par page</SelectItem>
                            <SelectItem value="offset">Par offset</SelectItem>
                            <SelectItem value="cursor">Par curseur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="page_param">Paramètre de page</Label>
                          <Input
                            id="page_param"
                            placeholder="page"
                            value={config.pagination.page_param || ''}
                            onChange={(e) => handlePaginationChange('page_param', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="size_param">Paramètre de taille</Label>
                          <Input
                            id="size_param"
                            placeholder="limit"
                            value={config.pagination.size_param || ''}
                            onChange={(e) => handlePaginationChange('size_param', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="max_pages">Nombre max de pages</Label>
                        <Input
                          id="max_pages"
                          type="number"
                          value={config.pagination.max_pages || 5}
                          onChange={(e) => handlePaginationChange('max_pages', parseInt(e.target.value))}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={testAPI} disabled={!config.url || isTesting}>
                {isTesting ? 'Test en cours...' : 'Tester la configuration'}
                <Play className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            {testResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {testResult.success ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    Résultat du test
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Statut HTTP</Label>
                      <Badge variant={testResult.status === 200 ? "default" : "destructive"}>
                        {testResult.status}
                      </Badge>
                    </div>
                    <div>
                      <Label>Produits trouvés</Label>
                      <p className="text-lg font-medium">{testResult.products_found}</p>
                    </div>
                  </div>

                  {testResult.error && (
                    <div>
                      <Label>Erreur</Label>
                      <p className="text-sm text-red-600">{testResult.error}</p>
                    </div>
                  )}

                  {testResult.sample_product && (
                    <div>
                      <Label>Exemple de produit</Label>
                      <ScrollArea className="h-32 w-full border rounded-md p-2">
                        <pre className="text-xs">
                          {JSON.stringify(testResult.sample_product, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button onClick={() => setStep('config')} variant="outline">
                      Modifier la configuration
                    </Button>
                    {testResult.success && (
                      <Button onClick={() => setStep('mapping')}>
                        Configurer le mapping
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            {testResult?.sample_product && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mapping des champs</CardTitle>
                  <CardDescription>
                    Associez les champs de l'API à vos champs produit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {Object.keys(testResult.sample_product).map((apiField) => (
                      <div key={apiField} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex-1">
                          <Label className="font-medium">{apiField}</Label>
                          <p className="text-xs text-muted-foreground">
                            Exemple: {String(testResult.sample_product[apiField]).substring(0, 50)}...
                          </p>
                        </div>
                        <div className="w-48">
                          <Select
                            value={config.field_mapping[apiField] || ''}
                            onValueChange={(value) => handleFieldMapping(apiField, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Ignorer</SelectItem>
                              {Object.entries(PRODUCT_FIELDS).map(([field, label]) => (
                                <SelectItem key={field} value={field}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button onClick={() => setStep('test')} variant="outline">
                      Retour au test
                    </Button>
                    <Button 
                      onClick={startImport}
                      disabled={Object.keys(config.field_mapping).length === 0}
                    >
                      Démarrer l'import
                      <Zap className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium">Import en cours...</h3>
                  <Progress value={importProgress} className="w-full" />
                  <p className="text-muted-foreground">
                    {importProgress}% terminé
                  </p>

                  {importProgress === 100 && (
                    <div className="space-y-4">
                      <p className="text-green-600 font-medium">Import terminé avec succès !</p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => setStep('config')} variant="outline">
                          Nouvel import
                        </Button>
                        <Button onClick={() => window.location.href = '/import/results'}>
                          Voir les produits
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}