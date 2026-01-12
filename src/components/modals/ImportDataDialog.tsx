import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { ImportService, ParsedData, ImportResult } from '@/services/import.service'
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Package,
  ShoppingCart,
  Users,
  X,
  FileSpreadsheet
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

interface ImportDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: 'products' | 'orders' | 'customers'
}

const DATA_TYPES = [
  { value: 'products', label: 'Produits', icon: Package },
  { value: 'orders', label: 'Commandes', icon: ShoppingCart },
  { value: 'customers', label: 'Clients', icon: Users },
]

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

export function ImportDataDialog({ open, onOpenChange, defaultType }: ImportDataDialogProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState<ImportStep>('upload')
  const [dataType, setDataType] = useState<'products' | 'orders' | 'customers'>(defaultType || 'products')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [targetFields, setTargetFields] = useState<{ key: string; label: string; required?: boolean }[]>([])
  
  // Options
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [validateData, setValidateData] = useState(true)
  
  // Progress
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Update target fields when data type changes
  useEffect(() => {
    const fields = ImportService.getTargetFields(dataType)
    setTargetFields(fields)
  }, [dataType])

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      resetState()
      if (defaultType) setDataType(defaultType)
    }
  }, [open, defaultType])

  const resetState = () => {
    setStep('upload')
    setFile(null)
    setParsedData(null)
    setMappings({})
    setProgress(0)
    setImportResult(null)
    setIsProcessing(false)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const validExtensions = ['csv', 'xlsx', 'xls']
    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    
    if (!extension || !validExtensions.includes(extension)) {
      toast.error('Format non supporté. Utilisez CSV ou Excel.')
      return
    }

    setFile(selectedFile)
    setIsProcessing(true)

    try {
      const parsed = await ImportService.parseFile(selectedFile)
      setParsedData(parsed)
      
      // Auto-map columns based on name similarity
      const autoMappings: Record<string, string> = {}
      parsed.headers.forEach(header => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z]/g, '')
        const matchingField = targetFields.find(f => {
          const normalizedField = f.key.toLowerCase().replace(/[^a-z]/g, '')
          const normalizedLabel = f.label.toLowerCase().replace(/[^a-z]/g, '')
          return normalizedField === normalizedHeader || normalizedLabel === normalizedHeader
        })
        if (matchingField) {
          autoMappings[header] = matchingField.key
        }
      })
      setMappings(autoMappings)
      
      setStep('mapping')
      toast.success(`${parsed.totalRows} lignes détectées`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du parsing')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setMappings(prev => ({
      ...prev,
      [sourceColumn]: targetField
    }))
  }

  const handleStartImport = async () => {
    if (!user || !parsedData) return

    setStep('importing')
    setIsProcessing(true)
    setProgress(0)

    try {
      const result = await ImportService.importData(
        user.id,
        parsedData,
        {
          dataType,
          mappings,
          options: {
            skipDuplicates,
            updateExisting,
            validateData,
          },
        },
        (current, total) => {
          setProgress(Math.round((current / total) * 100))
        }
      )

      setImportResult(result)
      setStep('complete')

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`${dataType}-unified`] })
      queryClient.invalidateQueries({ queryKey: [`unified-${dataType}`] })
      queryClient.invalidateQueries({ queryKey: [dataType] })

      if (result.imported > 0) {
        toast.success(`${result.imported} enregistrements importés`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'import')
      setStep('mapping')
    } finally {
      setIsProcessing(false)
    }
  }

  const getMappedFieldsCount = () => {
    return Object.values(mappings).filter(v => v).length
  }

  const getRequiredFieldsMapped = () => {
    const requiredFields = targetFields.filter(f => f.required).map(f => f.key)
    const mappedTargets = Object.values(mappings)
    return requiredFields.every(rf => mappedTargets.includes(rf))
  }

  const handleClose = () => {
    if (!isProcessing) {
      resetState()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importer des données
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 'upload' && (
            <div className="space-y-6 py-4">
              {/* Data Type Selection */}
              <div className="space-y-2">
                <Label>Type de données à importer</Label>
                <div className="grid grid-cols-3 gap-3">
                  {DATA_TYPES.map(type => {
                    const Icon = type.icon
                    return (
                      <div
                        key={type.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors text-center ${
                          dataType === type.value 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => setDataType(type.value as typeof dataType)}
                      >
                        <Icon className="h-6 w-6 mx-auto mb-2" />
                        <span className="font-medium">{type.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* File Upload */}
              <div className="space-y-4">
                <Label>Fichier à importer</Label>
                
                {!file ? (
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium">Cliquez pour sélectionner un fichier</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ou glissez-déposez ici
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Formats supportés: CSV, Excel (.xlsx, .xls)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <FileText className="h-10 w-10 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyse du fichier en cours...
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'mapping' && parsedData && (
            <div className="space-y-6 py-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  {parsedData.totalRows} lignes détectées avec {parsedData.headers.length} colonnes.
                  Associez vos colonnes aux champs cibles.
                </AlertDescription>
              </Alert>

              {/* Column Mapping */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex justify-between items-center">
                    <span>Correspondance des colonnes</span>
                    <Badge variant="secondary">
                      {getMappedFieldsCount()}/{parsedData.headers.length} mappées
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {parsedData.headers.map(header => (
                      <div key={header} className="flex items-center gap-4">
                        <div className="flex-1 font-mono text-sm bg-accent p-2 rounded">
                          {header}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={mappings[header] || ''}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Sélectionner un champ" />
                          </SelectTrigger>
                          <SelectContent className="z-[100] bg-popover">
                            <SelectItem value="">— Ne pas importer —</SelectItem>
                            {targetFields.map(field => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label} {field.required && '*'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Import Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Options d'import</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipDuplicates"
                      checked={skipDuplicates}
                      onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                    />
                    <Label htmlFor="skipDuplicates" className="cursor-pointer">
                      Ignorer les doublons
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="updateExisting"
                      checked={updateExisting}
                      onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
                    />
                    <Label htmlFor="updateExisting" className="cursor-pointer">
                      Mettre à jour les enregistrements existants
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="validateData"
                      checked={validateData}
                      onCheckedChange={(checked) => setValidateData(checked as boolean)}
                    />
                    <Label htmlFor="validateData" className="cursor-pointer">
                      Valider les données avant import
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Data Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aperçu des données (5 premières lignes)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {parsedData.headers.map(header => (
                            <TableHead key={header} className="whitespace-nowrap">
                              {header}
                              {mappings[header] && (
                                <span className="text-primary ml-1">→ {mappings[header]}</span>
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.rows.slice(0, 5).map((row, i) => (
                          <TableRow key={i}>
                            {parsedData.headers.map(header => (
                              <TableCell key={header} className="whitespace-nowrap">
                                {String(row[header] || '')}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {!getRequiredFieldsMapped() && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Certains champs obligatoires ne sont pas mappés. Vérifiez la correspondance.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="py-12 text-center space-y-6">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Import en cours...</h3>
                <p className="text-muted-foreground">
                  Ne fermez pas cette fenêtre
                </p>
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </div>
          )}

          {step === 'complete' && importResult && (
            <div className="py-8 text-center space-y-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Import terminé !</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                  <div className="text-sm text-green-600">Importés</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                  <div className="text-sm text-yellow-600">Ignorés</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-red-600">Échoués</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <Card className="max-w-lg mx-auto text-left">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-600">Erreurs ({importResult.errors.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      <ul className="text-sm space-y-1">
                        {importResult.errors.slice(0, 10).map((error, i) => (
                          <li key={i} className="text-muted-foreground">{error}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li className="text-muted-foreground">
                            ... et {importResult.errors.length - 10} autres erreurs
                          </li>
                        )}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <Button onClick={handleClose}>
                Fermer
              </Button>
            </div>
          )}
        </div>

        {(step === 'upload' || step === 'mapping') && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Annuler
            </Button>
            
            {step === 'mapping' && (
              <Button
                onClick={handleStartImport}
                disabled={isProcessing || !getRequiredFieldsMapped()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer {parsedData?.totalRows} lignes
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
