import { useState, useEffect } from 'react'
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
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { ExportService } from '@/services/export.service'
import { ExportConfig } from '@/lib/validation/orderSchema'
import { 
  Download, 
  FileSpreadsheet, 
  FileJson, 
  Loader2, 
  CheckCircle,
  Package,
  ShoppingCart,
  Users,
  AlertCircle
} from 'lucide-react'

interface ExportDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: 'products' | 'orders' | 'customers'
}

const DATA_TYPES = [
  { value: 'products', label: 'Produits', icon: Package },
  { value: 'orders', label: 'Commandes', icon: ShoppingCart },
  { value: 'customers', label: 'Clients', icon: Users },
]

const FORMATS = [
  { value: 'csv', label: 'CSV', description: 'Compatible Excel, Google Sheets', icon: FileSpreadsheet },
  { value: 'xlsx', label: 'Excel', description: 'Format Microsoft Excel natif', icon: FileSpreadsheet },
  { value: 'json', label: 'JSON', description: 'Format pour développeurs/API', icon: FileJson },
]

export function ExportDataDialog({ open, onOpenChange, defaultType }: ExportDataDialogProps) {
  const { user } = useAuth()
  const [dataType, setDataType] = useState<'products' | 'orders' | 'customers'>(defaultType || 'products')
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'json'>('csv')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [availableColumns, setAvailableColumns] = useState<{ key: string; label: string }[]>([])
  const [includeArchived, setIncludeArchived] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exportResult, setExportResult] = useState<{ success: boolean; filename: string; recordCount: number } | null>(null)

  // Update available columns when data type changes
  useEffect(() => {
    const columns = ExportService.getAvailableColumns(dataType)
    setAvailableColumns(columns)
    // Select all columns by default
    setSelectedColumns(columns.map(c => c.key))
  }, [dataType])

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setExportResult(null)
      setProgress(0)
      if (defaultType) setDataType(defaultType)
    }
  }, [open, defaultType])

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(c => c !== columnKey)
        : [...prev, columnKey]
    )
  }

  const selectAllColumns = () => {
    setSelectedColumns(availableColumns.map(c => c.key))
  }

  const deselectAllColumns = () => {
    setSelectedColumns([])
  }

  const handleExport = async () => {
    if (!user) {
      toast.error('Vous devez être connecté')
      return
    }

    if (selectedColumns.length === 0) {
      toast.error('Sélectionnez au moins une colonne')
      return
    }

    setIsExporting(true)
    setProgress(10)

    try {
      const config: ExportConfig = {
        dataType,
        format,
        columns: selectedColumns,
        filters: {
          includeArchived,
        },
      }

      setProgress(30)

      const result = await ExportService.exportData(user.id, config)
      
      setProgress(100)
      setExportResult(result)

      if (result.success) {
        toast.success(`${result.recordCount} enregistrements exportés`)
      } else {
        toast.error(result.error || 'Erreur lors de l\'export')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'export')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    if (!isExporting) {
      setExportResult(null)
      setProgress(0)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exporter des données
          </DialogTitle>
        </DialogHeader>

        {exportResult?.success ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Export terminé !</h3>
              <p className="text-muted-foreground">
                {exportResult.recordCount} enregistrements exportés
              </p>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-2">
              {exportResult.filename}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Le fichier a été téléchargé automatiquement
            </p>
            <Button onClick={handleClose} className="mt-4">
              Fermer
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Data Type Selection */}
            <div className="space-y-2">
              <Label>Type de données</Label>
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

            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Format d'export</Label>
              <div className="grid grid-cols-3 gap-3">
                {FORMATS.map(f => {
                  const Icon = f.icon
                  return (
                    <div
                      key={f.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        format === f.value 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setFormat(f.value as typeof format)}
                    >
                      <Icon className="h-5 w-5 mb-2" />
                      <div className="font-medium">{f.label}</div>
                      <div className="text-xs text-muted-foreground">{f.description}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Column Selection */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Colonnes à exporter</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAllColumns}>
                      Tout
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAllColumns}>
                      Aucun
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {availableColumns.map(column => (
                    <div
                      key={column.key}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-accent"
                    >
                      <Checkbox
                        id={column.key}
                        checked={selectedColumns.includes(column.key)}
                        onCheckedChange={() => toggleColumn(column.key)}
                      />
                      <Label 
                        htmlFor={column.key} 
                        className="cursor-pointer flex-1"
                      >
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeArchived"
                checked={includeArchived}
                onCheckedChange={(checked) => setIncludeArchived(checked as boolean)}
              />
              <Label htmlFor="includeArchived" className="cursor-pointer">
                Inclure les éléments archivés
              </Label>
            </div>

            {selectedColumns.length === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sélectionnez au moins une colonne à exporter
                </AlertDescription>
              </Alert>
            )}

            {/* Progress */}
            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Export en cours...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isExporting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting || selectedColumns.length === 0}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
