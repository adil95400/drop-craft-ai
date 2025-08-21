import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AsyncButton } from '@/components/ui/async-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Zap,
  Settings
} from 'lucide-react'
import { useImportUltraPro } from '@/hooks/useImportUltraPro'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { ImportMethodsGrid } from './ImportMethodsGrid'

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
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Read and parse CSV file
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsText(selectedFile)
      })

      const parseCSV = (text: string): { headers: string[], rows: string[][] } => {
        const lines = text.split('\n').filter(line => line.trim())
        if (lines.length === 0) throw new Error('Fichier CSV vide')
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const rows = lines.slice(1).map(line => 
          line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        )
        
        return { headers, rows }
      }

      setImportProgress(20)
      const { headers, rows } = parseCSV(text)
      
      // Enhanced column mapping
      const generateColumnMapping = (headers: string[]): Record<string, string> => {
        const mapping: Record<string, string> = {}
        const mappings: Record<string, string[]> = {
          name: ['name', 'title', 'product_name', 'nom', 'titre', 'product'],
          description: ['description', 'desc', 'details', 'content'],
          sku: ['sku', 'reference', 'ref', 'code', 'product_id'],
          category: ['category', 'categorie', 'type', 'cat'],
          sub_category: ['sub_category', 'subcategory', 'sous_categorie'],
          brand: ['brand', 'marque', 'vendor'],
          price: ['price', 'prix', 'selling_price', 'amount'],
          cost_price: ['cost', 'cost_price', 'cout', 'purchase_price'],
          currency: ['currency', 'devise', 'curr'],
          stock_quantity: ['stock', 'quantity', 'qty', 'quantite', 'inventory'],
          image_url: ['image', 'photo', 'picture', 'img', 'main_image_url'],
          image_urls: ['images', 'image_urls', 'additional_image_urls', 'photos'],
          video_urls: ['video_url', 'video_urls', 'video', 'vid'],
          supplier_name: ['supplier', 'fournisseur', 'vendor'],
          seo_keywords: ['seo_keywords', 'keywords', 'mots_cles', 'tags'],
          tags: ['tags', 'mots_cles']
        }
        
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase()
          for (const [field, patterns] of Object.entries(mappings)) {
            if (patterns.some(pattern => lowerHeader.includes(pattern))) {
              mapping[header] = field
              break
            }
          }
        })
        
        return mapping
      }

      const mapping = generateColumnMapping(headers)
      setImportProgress(40)

      // Create import job
      const { data: importJob, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          user_id: user.id,
          source_type: 'csv',
          status: 'processing',
          total_rows: rows.length,
          processed_rows: 0,
          success_rows: 0,
          error_rows: 0,
          mapping_config: mapping
        })
        .select()
        .single()

      if (jobError) throw new Error(`Erreur création job: ${jobError.message}`)
      setImportProgress(60)

      // Process each row
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []
      const productsToInsert: any[] = []

      rows.forEach((row, index) => {
        try {
          const product: any = {
            user_id: user.id,
            import_id: importJob.id,
            status: 'draft',
            review_status: 'pending'
          }

          // Map each header to product field
          headers.forEach((header, headerIndex) => {
            const field = mapping[header]
            const value = row[headerIndex]?.trim()
            
            if (field && value) {
              // Handle numeric fields with validation and overflow protection
              if (['price', 'cost_price', 'compare_at_price', 'weight', 'supplier_price', 'shipping_cost'].includes(field)) {
                // Clean numeric value - replace comma with dot for European format
                const cleanValue = value.replace(',', '.').replace(/[^\d.-]/g, '')
                let numValue = parseFloat(cleanValue) || 0
                
                // Limit to reasonable ranges to prevent overflow (max 999999.99)
                if (numValue > 999999.99) numValue = 999999.99
                if (numValue < 0) numValue = 0
                
                product[field] = Math.round(numValue * 100) / 100 // Round to 2 decimals
              }
              // Handle integer fields with validation
              else if (['stock_quantity', 'min_order', 'max_order'].includes(field)) {
                const cleanValue = value.replace(/[^\d]/g, '')
                let intValue = parseInt(cleanValue) || 0
                
                // Limit to reasonable ranges (max 999999)
                if (intValue > 999999) intValue = 999999
                if (intValue < 0) intValue = 0
                
                product[field] = intValue
              }
              // Handle array fields (split by semicolon)
              else if (['image_urls', 'video_urls', 'seo_keywords', 'tags'].includes(field)) {
                product[field] = value.split(';').map(item => item.trim()).filter(Boolean)
              }
              // Handle special image mapping
              else if (field === 'image_url' || field === 'main_image_url') {
                if (!product.image_urls) product.image_urls = []
                product.image_urls.unshift(value) // Put main image first
              }
              // Handle video URL mapping (singular to plural)
              else if (header.toLowerCase().includes('video_url') && !header.toLowerCase().includes('video_urls')) {
                if (!product.video_urls) product.video_urls = []
                product.video_urls.push(value)
              }
              // Handle text fields
              else {
                product[field] = value
              }
            }
          })

          // Validate required fields with better error handling
          if (!product.name || product.name.length === 0) {
            console.log(`Produit ligne ${index + 1}:`, { name: product.name, price: product.price, row })
            throw new Error(`Ligne ${index + 1}: Nom du produit requis (reçu: "${product.name}")`)
          }
          if (!product.price || product.price <= 0) {
            console.log(`Prix invalide ligne ${index + 1}:`, { price: product.price, rawPrice: row[headers.indexOf('price')] })
            throw new Error(`Ligne ${index + 1}: Prix valide requis (reçu: ${product.price})`)
          }

          // Ensure user_id and import_id are set
          if (!product.user_id) {
            throw new Error(`Ligne ${index + 1}: user_id manquant`)
          }
          if (!product.import_id) {
            throw new Error(`Ligne ${index + 1}: import_id manquant`)
          }

          productsToInsert.push(product)
          successCount++
        } catch (error) {
          errorCount++
          errors.push((error as Error).message)
        }
      })

      setImportProgress(80)

      // Insert all valid products
      if (productsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('imported_products')
          .insert(productsToInsert)

        if (insertError) {
          throw new Error(`Erreur insertion produits: ${insertError.message}`)
        }
      }

      setImportProgress(90)

      // Update import job with final results
      await supabase
        .from('import_jobs')
        .update({
          status: 'completed',
          processed_rows: rows.length,
          success_rows: successCount,
          error_rows: errorCount,
          errors: errors,
          result_data: {
            total: rows.length,
            success: successCount,
            errors: errorCount,
            completion_time: new Date().toISOString()
          }
        })
        .eq('id', importJob.id)

      setImportProgress(100)

      toast.success(`Import réussi ! ${successCount} produits importés sur ${rows.length} lignes traitées.`)
      onImportComplete?.({
        products_imported: successCount,
        total_processed: rows.length,
        errors: errorCount,
        import_job_id: importJob.id
      })
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

      {/* Import Interface Tabs */}
      <Tabs defaultValue="methods" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="methods" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Méthodes d'Import
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Manuel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="methods">
          <ImportMethodsGrid />
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Import Manuel</CardTitle>
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
                    {/* Template Download Section */}
                    <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium mb-1">Template CSV recommandé</h4>
                          <p className="text-sm text-muted-foreground">
                            Téléchargez notre template optimisé avec toutes les colonnes supportées
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = '/files/template-import.csv'
                            link.download = 'template-import.csv'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            toast.success('Template CSV téléchargé')
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Télécharger Template
                        </Button>
                      </div>
                    </div>
                    
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
        </TabsContent>
      </Tabs>

      {/* Imported Products List */}
      {importedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Produits Importés ({importedProducts.length})
            </CardTitle>
            <CardDescription>
              Liste des produits récemment importés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {importedProducts.slice(0, 10).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {product.image_urls && product.image_urls[0] && (
                      <img 
                        src={product.image_urls[0]} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku} • {product.currency} {product.price}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      product.status === 'published' ? 'default' : 
                      product.status === 'draft' ? 'secondary' : 'destructive'
                    }>
                      {product.status === 'published' ? 'Publié' :
                       product.status === 'draft' ? 'Brouillon' : 'Erreur'}
                    </Badge>
                    {product.ai_score && (
                      <Badge variant="outline">
                        IA: {product.ai_score}/10
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {importedProducts.length > 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline">
                    Voir tous les {importedProducts.length} produits
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}