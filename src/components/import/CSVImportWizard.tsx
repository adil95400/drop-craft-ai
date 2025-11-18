import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, FileText, Check, AlertTriangle, X, Download, Eye } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface CSVData {
  headers: string[]
  rows: any[]
  fileName: string
}

interface ValidationError {
  row: number
  field: string
  message: string
  severity: 'error' | 'warning'
}

interface ProductMapping {
  [csvColumn: string]: string
}

const PRODUCT_FIELDS = {
  name: { label: 'Nom du produit', required: true },
  description: { label: 'Description', required: false },
  price: { label: 'Prix', required: true },
  sku: { label: 'SKU/Référence', required: false },
  category: { label: 'Catégorie', required: false },
  brand: { label: 'Marque', required: false },
  stock_quantity: { label: 'Stock', required: false },
  image_url: { label: 'URL Image', required: false },
  weight: { label: 'Poids', required: false },
  dimensions: { label: 'Dimensions', required: false }
}

export function CSVImportWizard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState<'upload' | 'mapping' | 'validation' | 'import'>('upload')
  const [csvData, setCsvData] = useState<CSVData | null>(null)
  const [mapping, setMapping] = useState<ProductMapping>({})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [validProducts, setValidProducts] = useState<any[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast({
            title: "Erreur de parsing",
            description: "Le fichier CSV contient des erreurs de format",
            variant: "destructive"
          })
          return
        }

        setCsvData({
          headers: results.meta.fields || [],
          rows: results.data,
          fileName: file.name
        })
        setStep('mapping')
      },
      error: (error) => {
        toast({
          title: "Erreur",
          description: `Impossible de lire le fichier: ${error.message}`,
          variant: "destructive"
        })
      }
    })
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  })

  const handleMappingChange = (csvColumn: string, productField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvColumn]: productField
    }))
  }

  const validateData = () => {
    if (!csvData) return

    const errors: ValidationError[] = []
    const products: any[] = []

    csvData.rows.forEach((row, index) => {
      const product: any = {}
      let hasRequiredFields = true

      // Map CSV columns to product fields
      Object.entries(mapping).forEach(([csvColumn, productField]) => {
        if (productField && productField !== 'ignore') {
          product[productField] = row[csvColumn]
        }
      })

      // Validate required fields
      Object.entries(PRODUCT_FIELDS).forEach(([field, config]) => {
        if (config.required && (!product[field] || product[field].toString().trim() === '')) {
          errors.push({
            row: index + 1,
            field,
            message: `${config.label} est requis`,
            severity: 'error'
          })
          hasRequiredFields = false
        }
      })

      // Validate price format
      if (product.price && isNaN(parseFloat(product.price))) {
        errors.push({
          row: index + 1,
          field: 'price',
          message: 'Prix invalide',
          severity: 'error'
        })
        hasRequiredFields = false
      }

      // Validate stock quantity
      if (product.stock_quantity && isNaN(parseInt(product.stock_quantity))) {
        errors.push({
          row: index + 1,
          field: 'stock_quantity',
          message: 'Quantité de stock invalide',
          severity: 'warning'
        })
      }

      if (hasRequiredFields) {
        products.push({
          ...product,
          row_number: index + 1,
          price: parseFloat(product.price) || 0,
          stock_quantity: parseInt(product.stock_quantity) || 0
        })
      }
    })

    setValidationErrors(errors)
    setValidProducts(products)
    setStep('validation')
  }

  const startImport = async () => {
    if (validProducts.length === 0) return

    setIsImporting(true)
    setImportProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      let imported = 0
      const batchSize = 10

      for (let i = 0; i < validProducts.length; i += batchSize) {
        const batch = validProducts.slice(i, i + batchSize)
        
        const productsToInsert = batch.map(product => ({
          user_id: user.id,
          external_id: product.sku || `csv_${Date.now()}_${product.row_number}`,
          name: product.name,
          description: product.description || '',
          price: product.price,
          sku: product.sku || '',
          category: product.category || 'Imported',
          brand: product.brand || '',
          stock_quantity: product.stock_quantity || 0,
          image_url: product.image_url || '',
          weight: product.weight ? parseFloat(product.weight) : null,
          status: 'pending',
          source: 'csv_import',
          ai_optimized: false,
          quality_score: 0.5
        }))

        const { error } = await supabase
          .from('imported_products')
          .insert(productsToInsert)

        if (error) {
          console.error('Import error:', error)
          toast({
            title: "Erreur d'import",
            description: `Erreur lors de l'import du lot ${Math.floor(i / batchSize) + 1}`,
            variant: "destructive"
          })
        } else {
          imported += batch.length
          setImportProgress((imported / validProducts.length) * 100)
        }
      }

      toast({
        title: "Import réussi",
        description: `${imported} produits importés avec succès`
      })

      setStep('import')
    } catch (error) {
      console.error('Import failed:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de l'import des produits",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  const resetWizard = () => {
    setStep('upload')
    setCsvData(null)
    setMapping({})
    setValidationErrors([])
    setValidProducts([])
    setImportProgress(0)
    setIsImporting(false)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Assistant d'Import CSV
        </CardTitle>
        <CardDescription>
          Importez vos produits depuis un fichier CSV avec mapping automatique des colonnes
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" disabled={step !== 'upload'}>
              1. Upload
            </TabsTrigger>
            <TabsTrigger value="mapping" disabled={step !== 'mapping'}>
              2. Mapping
            </TabsTrigger>
            <TabsTrigger value="validation" disabled={step !== 'validation'}>
              3. Validation
            </TabsTrigger>
            <TabsTrigger value="import" disabled={step !== 'import'}>
              4. Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier CSV'}
              </h3>
              <p className="text-muted-foreground mb-4">
                ou cliquez pour sélectionner un fichier
              </p>
              <Badge variant="outline">CSV, XLS, XLSX acceptés</Badge>
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            {csvData && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Mapping des colonnes</h3>
                    <p className="text-sm text-muted-foreground">
                      Fichier: {csvData.fileName} ({csvData.rows.length} lignes)
                    </p>
                  </div>
                  <Button onClick={() => setStep('upload')} variant="outline">
                    Changer de fichier
                  </Button>
                </div>

                <div className="grid gap-4">
                  {csvData.headers.map((header, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <Label className="font-medium">{header}</Label>
                        <p className="text-xs text-muted-foreground">
                          Exemple: {csvData.rows[0]?.[header]?.toString().substring(0, 50)}...
                        </p>
                      </div>
                      <div className="w-48">
                        <Select
                          value={mapping[header] || ''}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un champ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">Ignorer</SelectItem>
                            {Object.entries(PRODUCT_FIELDS).map(([field, config]) => (
                              <SelectItem key={field} value={field}>
                                {config.label} {config.required && '*'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button onClick={() => setStep('upload')} variant="outline">
                    Retour
                  </Button>
                  <Button onClick={validateData} disabled={Object.keys(mapping).length === 0}>
                    Valider les données
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Validation des données</h3>
                <p className="text-sm text-muted-foreground">
                  {validProducts.length} produits valides, {validationErrors.filter(e => e.severity === 'error').length} erreurs
                </p>
              </div>
              <Button onClick={() => setStep('mapping')} variant="outline">
                Modifier le mapping
              </Button>
            </div>

            {validationErrors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    Erreurs de validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {validationErrors.slice(0, 50).map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {error.severity === 'error' ? (
                            <X className="w-4 h-4 text-red-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="font-medium">Ligne {error.row}:</span>
                          <span>{error.message}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-500" />
                  Aperçu des produits valides ({validProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Catégorie</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validProducts.slice(0, 10).map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.price}€</TableCell>
                          <TableCell>{product.sku || '-'}</TableCell>
                          <TableCell>{product.category || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={() => setStep('mapping')} variant="outline">
                Retour
              </Button>
              <Button 
                onClick={startImport} 
                disabled={validProducts.length === 0 || validationErrors.some(e => e.severity === 'error')}
              >
                Importer {validProducts.length} produits
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">Import terminé !</h3>
              <p className="text-muted-foreground">
                {validProducts.length} produits ont été importés avec succès
              </p>
              
              {isImporting && (
                <div className="space-y-2">
                  <Progress value={importProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    Import en cours... {Math.round(importProgress)}%
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button onClick={resetWizard} variant="outline">
                  Nouvel import
                </Button>
                <Button onClick={() => navigate('/import/results')}>
                  Voir les produits importés
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}