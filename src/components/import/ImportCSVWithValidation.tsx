import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Download, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import Papa from 'papaparse'
import { ProductImportRowSchema, PRODUCT_COLUMN_MAPPINGS } from '@/lib/schemas/product-import.schema'

interface ParsedRow {
  row: number
  data: any
  valid: boolean
  errors: string[]
}

export function ImportCSVWithValidation() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload')
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [importResult, setImportResult] = useState<{
    imported: number
    errors: number
    total: number
  } | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier CSV",
        variant: "destructive"
      })
      return
    }

    setFile(selectedFile)
    setIsProcessing(true)
    setProgress(10)

    try {
      // Parse CSV
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Normalize header names
          const normalized = header.toLowerCase().trim()
          
          // Try to find matching field in PRODUCT_COLUMN_MAPPINGS
          for (const [fieldName, possibleNames] of Object.entries(PRODUCT_COLUMN_MAPPINGS)) {
            if (possibleNames.some(name => normalized === name || normalized.includes(name))) {
              return fieldName
            }
          }
          
          return header
        },
        complete: (results) => {
          setProgress(50)
          
          console.log('Parsed headers:', results.meta.fields)
          console.log('First row sample:', results.data[0])
          
          // Validate each row
          const validated: ParsedRow[] = results.data.map((row: any, index: number) => {
            try {
              const validatedData = ProductImportRowSchema.parse(row)
              return {
                row: index + 1,
                data: validatedData,
                valid: true,
                errors: []
              }
            } catch (error: any) {
              console.error(`Row ${index + 1} validation error:`, error)
              const errors = error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`) || ['Erreur de validation']
              return {
                row: index + 1,
                data: row,
                valid: false,
                errors
              }
            }
          })

          setParsedData(validated)
          setProgress(100)
          setStep('preview')
          setIsProcessing(false)

          const validCount = validated.filter(r => r.valid).length
          const errorCount = validated.filter(r => !r.valid).length

          toast({
            title: "Analyse terminée",
            description: `${validCount} lignes valides, ${errorCount} erreurs détectées`
          })
        },
        error: (error) => {
          console.error('Parse error:', error)
          toast({
            title: "Erreur d'analyse",
            description: "Impossible de lire le fichier CSV",
            variant: "destructive"
          })
          setIsProcessing(false)
          setProgress(0)
        }
      })
    } catch (error) {
      console.error('File error:', error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      })
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsProcessing(true)
    setStep('importing')
    setProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const csvContent = await file.text()
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const { data, error } = await supabase.functions.invoke('csv-import', {
        body: {
          userId: user.id,
          csvContent,
          source: 'manual'
        }
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (error) throw error

      if (data?.success) {
        setImportResult({
          imported: data.imported || 0,
          errors: 0,
          total: parsedData.length
        })
        setStep('done')
        
        toast({
          title: "Import réussi !",
          description: `${data.imported} produits importés avec succès`
        })
      } else {
        throw new Error(data?.error || 'Erreur lors de l\'import')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Erreur d'import",
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: "destructive"
      })
      setStep('preview')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Exemple Produit',
        description: 'Description du produit exemple',
        price: '29.99',
        cost_price: '15.00',
        sku: 'PROD-001',
        category: 'Électronique',
        brand: 'Ma Marque',
        stock_quantity: '100',
        status: 'active',
        image_url: 'https://example.com/image.jpg',
        supplier_name: 'Fournisseur XYZ',
        tags: 'nouveau,promo,bestseller',
        weight: '0.5',
        length: '10',
        width: '5',
        height: '3'
      }
    ]

    const csv = Papa.unparse(template)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template_produits.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const resetImport = () => {
    setFile(null)
    setStep('upload')
    setParsedData([])
    setImportResult(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validRows = parsedData.filter(r => r.valid)
  const errorRows = parsedData.filter(r => !r.valid)

  return (
    <div className="space-y-6">
      {/* Upload Step */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-12 text-center bg-muted/20">
            <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Importer un fichier CSV</h3>
            <p className="text-muted-foreground mb-6">
              Sélectionnez un fichier CSV avec vos produits
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Sélectionner un fichier
              </Button>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger template
              </Button>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {isProcessing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Analyse en cours...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            </Card>
          )}

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Format attendu:</strong> name, description, price, sku, category, stock_quantity, status
              <br />
              <strong>Colonnes optionnelles:</strong> cost_price, brand, image_url, supplier_name, tags, weight, length, width, height
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Aperçu des données</h3>
              <p className="text-sm text-muted-foreground">
                {file?.name} - {parsedData.length} lignes
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetImport}>
                Annuler
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={validRows.length === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importer {validRows.length} produits
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{parsedData.length}</div>
                <p className="text-xs text-muted-foreground">lignes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Valides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{validRows.length}</div>
                <p className="text-xs text-muted-foreground">prêts à importer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Erreurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{errorRows.length}</div>
                <p className="text-xs text-muted-foreground">à corriger</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="valid" className="w-full">
            <TabsList>
              <TabsTrigger value="valid">
                Produits valides ({validRows.length})
              </TabsTrigger>
              <TabsTrigger value="errors">
                Erreurs ({errorRows.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="valid" className="space-y-2">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {validRows.slice(0, 50).map((row) => (
                  <Card key={row.row}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Ligne {row.row}</Badge>
                            <span className="font-medium">{row.data.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {row.data.price}€ • {row.data.sku} • {row.data.category}
                          </div>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="errors" className="space-y-2">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {errorRows.map((row) => (
                  <Card key={row.row} className="border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="destructive">Ligne {row.row}</Badge>
                            <span className="font-medium">{row.data.name || 'Sans nom'}</span>
                          </div>
                          <ul className="text-sm text-red-600 space-y-1">
                            {row.errors.map((error, idx) => (
                              <li key={idx}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Importing Step */}
      {step === 'importing' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Import en cours...</h3>
                <p className="text-muted-foreground">Veuillez patienter</p>
              </div>
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">{progress}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Done Step */}
      {step === 'done' && importResult && (
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
                <div>
                  <h3 className="text-2xl font-bold text-green-600">Import réussi !</h3>
                  <p className="text-muted-foreground mt-2">
                    {importResult.imported} produits ont été importés avec succès
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div>
                    <div className="text-2xl font-bold">{importResult.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                    <div className="text-sm text-muted-foreground">Importés</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                    <div className="text-sm text-muted-foreground">Erreurs</div>
                  </div>
                </div>
                <Button onClick={resetImport} size="lg">
                  Nouvel import
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
