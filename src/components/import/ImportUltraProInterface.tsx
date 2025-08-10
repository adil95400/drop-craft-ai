import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Upload, FileText, Globe, Camera, Zap, CheckCircle, Download, Eye } from 'lucide-react'
import { useRealIntegrations } from '@/hooks/useRealIntegrations'
import { useImportUltraPro } from '@/hooks/useImportUltraPro'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ImportUltraProInterface() {
  const { connectedIntegrations, syncProducts, isSyncingProducts } = useRealIntegrations()
  const {
    importedProducts,
    scheduledImports,
    createImport,
    createScheduledImport,
    bulkOptimizeWithAI,
    isCreatingImport,
    isCreatingScheduled,
    isBulkOptimizing
  } = useImportUltraPro()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importUrl, setImportUrl] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [aiOptimization, setAiOptimization] = useState(true)
  const [scheduleName, setScheduleName] = useState('')
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Mock data for display
  const importJobs = []

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleCsvImport = () => {
    if (!selectedFile) return
    
    createImport({
      type: 'file',
      file: selectedFile,
      ai_optimization: aiOptimization,
      mapping_config: {},
      settings: {
        auto_publish: false,
        price_markup: 1.2,
        category_mapping: true
      }
    })
  }

  const handleUrlImport = () => {
    if (!importUrl) return
    
    createImport({
      type: 'url',
      source_url: importUrl,
      ai_optimization: aiOptimization,
      settings: {
        auto_publish: false,
        price_markup: 1.2
      }
    })
  }

  const handleSupplierSync = () => {
    if (!selectedSupplier) return
    
    const integration = connectedIntegrations.find(i => i.id === selectedSupplier)
    if (integration) {
      syncProducts({ 
        integrationId: integration.id, 
        platform: integration.platform_name 
      })
    }
  }

  const handleScheduleCreate = () => {
    if (!scheduleName || !selectedSupplier) return
    
    createScheduledImport({
      name: scheduleName,
      platform: selectedSupplier,
      frequency: scheduleFrequency,
      next_execution: new Date(Date.now() + 86400000).toISOString(),
      filter_config: {
        ai_optimization: aiOptimization,
        auto_publish: false,
        price_markup: 1.2
      }
    })
    
    setScheduleName('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'processing': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Import Ultra Pro</h2>
        <p className="text-muted-foreground">
          Importez des produits depuis vos fournisseurs avec l'IA d'optimisation automatique
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Imports Aujourd'hui</p>
                <p className="text-2xl font-bold">{importJobs.filter(j => 
                  new Date(j.created_at).toDateString() === new Date().toDateString()
                ).length}</p>
              </div>
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Produits Importés</p>
                <p className="text-2xl font-bold">{importJobs.reduce((acc, job) => 
                  acc + (job.success_rows || 0), 0
                )}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Optimisés IA</p>
                <p className="text-2xl font-bold">{importJobs.filter(j => 
                  j.ai_optimization
                ).length}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Imports Planifiés</p>
                <p className="text-2xl font-bold">{scheduledImports.length}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Fichiers</TabsTrigger>
          <TabsTrigger value="url">URL/API</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="schedule">Planification</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Import de Fichiers
              </CardTitle>
              <CardDescription>
                Uploadez des fichiers CSV, XML ou Excel avec vos produits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Sélectionner un fichier</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xml,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Fichier sélectionné: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ai-opt"
                  checked={aiOptimization}
                  onChange={(e) => setAiOptimization(e.target.checked)}
                />
                <Label htmlFor="ai-opt" className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Optimisation IA automatique
                </Label>
              </div>

              <Button 
                onClick={handleCsvImport}
                disabled={!selectedFile || isCreatingImport}
                className="w-full"
              >
                {isCreatingImport ? 'Import en cours...' : 'Démarrer l\'import'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Import depuis URL/API
              </CardTitle>
              <CardDescription>
                Importez des produits directement depuis une URL ou API fournisseur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="import-url">URL du catalogue</Label>
                <Input
                  id="import-url"
                  placeholder="https://example.com/products.xml"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ai-opt-url"
                  checked={aiOptimization}
                  onChange={(e) => setAiOptimization(e.target.checked)}
                />
                <Label htmlFor="ai-opt-url" className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Optimisation IA automatique
                </Label>
              </div>

              <Button 
                onClick={handleUrlImport}
                disabled={!importUrl || isCreatingImport}
                className="w-full"
              >
                {isCreatingImport ? 'Import en cours...' : 'Importer depuis l\'URL'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronisation Fournisseurs</CardTitle>
              <CardDescription>
                Synchronisez automatiquement avec vos fournisseurs connectés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectedIntegrations.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucun fournisseur connecté. Connectez d'abord vos intégrations dans l'onglet Intégrations.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div>
                    <Label htmlFor="supplier-select">Fournisseur</Label>
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un fournisseur" />
                      </SelectTrigger>
                      <SelectContent>
                        {connectedIntegrations.map((integration) => (
                          <SelectItem key={integration.id} value={integration.id}>
                            {integration.platform_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleSupplierSync}
                    disabled={!selectedSupplier || isSyncingProducts}
                    className="w-full"
                  >
                    {isSyncingProducts ? 'Synchronisation...' : 'Synchroniser les produits'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Imports Planifiés</CardTitle>
              <CardDescription>
                Automatisez vos imports avec une planification récurrente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="schedule-name">Nom de la planification</Label>
                <Input
                  id="schedule-name"
                  placeholder="Import quotidien AliExpress"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="supplier-schedule">Fournisseur</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectedIntegrations.map((integration) => (
                      <SelectItem key={integration.id} value={integration.id}>
                        {integration.platform_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency">Fréquence</Label>
                <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleScheduleCreate}
                disabled={!scheduleName || !selectedSupplier || isCreatingScheduled}
                className="w-full"
              >
                {isCreatingScheduled ? 'Création...' : 'Créer la planification'}
              </Button>
            </CardContent>
          </Card>

          {/* Active Scheduled Imports */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Imports Planifiés Actifs</h3>
            {scheduledImports.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{schedule.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Fréquence: {schedule.frequency} • 
                        Prochaine: {new Date(schedule.next_execution).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={schedule.is_active ? "default" : "secondary"}>
                      {schedule.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Import Jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Imports Récents</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => bulkOptimizeWithAI()}
              disabled={isBulkOptimizing}
            >
              <Zap className="w-4 h-4 mr-1" />
              {isBulkOptimizing ? 'Optimisation...' : 'Optimiser tout avec IA'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {importJobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    <span className="font-medium">{job.source_type}</span>
                    {job.ai_optimization && (
                      <Badge variant="secondary">
                        <Zap className="w-3 h-3 mr-1" />
                        IA
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job.success_rows || 0} réussis • {job.error_rows || 0} erreurs
                  </p>
                  {job.status === 'processing' && (
                    <Progress value={(job.processed_rows / job.total_rows) * 100} className="mt-2" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}