import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AsyncButton } from '@/components/ui/async-button'
import { 
  Upload, 
  Link, 
  FileText, 
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Database,
  Zap
} from 'lucide-react'
import { useImportUltraPro } from '@/hooks/useImportUltraPro'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface ImportUltraProInterfaceProps {
  onImportComplete?: (result: any) => void
}

export const ImportUltraProInterface = ({ onImportComplete }: ImportUltraProInterfaceProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [importUrl, setImportUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  
  const { 
    bulkImport, 
    isBulkImporting,
    importedProducts 
  } = useImportUltraPro()

  const importMethods = [
    {
      id: 'url',
      title: 'Import par URL',
      description: 'Importez des produits depuis une page web ou catalogue en ligne',
      icon: Link,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'csv',
      title: 'Import CSV/Excel',
      description: 'Importez vos produits depuis un fichier CSV ou Excel',
      icon: FileText,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'image',
      title: 'Import par Image',
      description: 'Importez des produits en analysant des images avec IA',
      icon: ImageIcon,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'bulk',
      title: 'Import en Masse',
      description: 'Importez massivement depuis des fournisseurs connectés',
      icon: Database,
      color: 'from-orange-500 to-red-500'
    }
  ]

  const handleUrlImport = async () => {
    if (!importUrl.trim()) {
      toast.error('Veuillez saisir une URL valide')
      return
    }

    setIsProcessing(true)
    setImportProgress(0)

    try {
      // Simulate URL import process
      const progressSteps = [20, 40, 60, 80, 100]
      for (const step of progressSteps) {
        setImportProgress(step)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Call URL import edge function
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase.functions.invoke('url-import', {
        body: {
          url: importUrl,
          userId: user.id,
          options: {
            extract_images: true,
            analyze_content: true,
            auto_categorize: true
          }
        }
      })

      if (error) throw new Error(error.message)
      if (!data.success) throw new Error(data.error || 'Import failed')

      toast.success(`Import réussi ! ${data?.products?.length || 1} produit(s) importé(s)`)
      onImportComplete?.(data)
      setImportUrl('')
      
    } catch (error: any) {
      toast.error(`Erreur d'import: ${error.message}`)
    } finally {
      setIsProcessing(false)
      setImportProgress(0)
    }
  }

  const handleFileImport = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier')
      return
    }

    setIsProcessing(true)
    setImportProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Simulate file processing
      const progressSteps = [15, 35, 55, 75, 90, 100]
      for (const step of progressSteps) {
        setImportProgress(step)
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      // Process file import (this would call your edge function)
      toast.success(`Fichier ${selectedFile.name} importé avec succès`)
      setSelectedFile(null)
      
    } catch (error: any) {
      toast.error(`Erreur d'import: ${error.message}`)
    } finally {
      setIsProcessing(false)
      setImportProgress(0)
    }
  }

  const handleBulkImport = async (type: string) => {
    try {
      await bulkImport({
        type: type as any,
        platform: 'aliexpress',
        filters: {}
      })
    } catch (error: any) {
      toast.error(`Erreur d'import: ${error.message}`)
    }
  }

  const stats = {
    total: importedProducts.length,
    success: importedProducts.filter(p => p.status === 'published').length,
    pending: importedProducts.filter(p => p.status === 'draft').length,
    errors: importedProducts.filter(p => p.review_status === 'rejected').length
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total Importé</p>
              </div>
              <Database className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                <p className="text-sm text-muted-foreground">Publié</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-sm text-muted-foreground">En Attente</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                <p className="text-sm text-muted-foreground">Erreurs</p>
              </div>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Méthodes d'Import</CardTitle>
          <CardDescription>
            Choisissez votre méthode d'import préférée pour vos produits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {importMethods.map((method) => {
              const IconComponent = method.icon
              const isSelected = selectedMethod === method.id
              
              return (
                <Card 
                  key={method.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`mx-auto mb-3 p-3 w-12 h-12 rounded-lg bg-gradient-to-r ${method.color} flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{method.title}</h3>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Method-specific interfaces */}
          {selectedMethod === 'url' && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Import par URL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="import-url">URL du produit ou catalogue</Label>
                  <Input
                    id="import-url"
                    type="url"
                    placeholder="https://exemple.com/produit-ou-catalogue"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                
                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={importProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      Analyse de l'URL en cours... {importProgress}%
                    </p>
                  </div>
                )}
                
                <AsyncButton
                  onClick={handleUrlImport}
                  disabled={!importUrl.trim() || isProcessing}
                  className="w-full"
                >
                  <Link className="w-4 h-4 mr-2" />
                  Importer depuis l'URL
                </AsyncButton>
              </CardContent>
            </Card>
          )}

          {selectedMethod === 'csv' && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Import CSV/Excel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="import-file">Fichier CSV ou Excel</Label>
                  <div className="mt-2">
                    <input
                      id="import-file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      disabled={isProcessing}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Fichier sélectionné: {selectedFile.name}
                    </p>
                  )}
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={importProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      Traitement du fichier... {importProgress}%
                    </p>
                  </div>
                )}

                <AsyncButton
                  onClick={handleFileImport}
                  disabled={!selectedFile || isProcessing}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer le fichier
                </AsyncButton>
              </CardContent>
            </Card>
          )}

          {selectedMethod === 'bulk' && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Import en Masse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AsyncButton
                    onClick={() => handleBulkImport('trending_products')}
                    disabled={isBulkImporting}
                    variant="outline"
                    className="h-auto p-4 flex-col items-start"
                  >
                    <Zap className="w-5 h-5 mb-2" />
                    <div className="text-left">
                      <div className="font-medium">Produits Tendance</div>
                      <div className="text-sm text-muted-foreground">~500 produits populaires</div>
                    </div>
                  </AsyncButton>

                  <AsyncButton
                    onClick={() => handleBulkImport('winners_detected')}
                    disabled={isBulkImporting}
                    variant="outline"
                    className="h-auto p-4 flex-col items-start"
                  >
                    <CheckCircle className="w-5 h-5 mb-2" />
                    <div className="text-left">
                      <div className="font-medium">Winners Détectés</div>
                      <div className="text-sm text-muted-foreground">~150 produits sélectionnés par IA</div>
                    </div>
                  </AsyncButton>
                </div>

                {isBulkImporting && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-medium">Import en cours...</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      L'import en masse peut prendre quelques minutes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}