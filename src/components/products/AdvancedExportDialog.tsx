import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  FileSpreadsheet, 
  FileText, 
  Download,
  CheckCircle2,
  Circle
} from 'lucide-react'
import { advancedExportService, ExportFormat, ExportColumn } from '@/services/advancedExportService'
import { Product } from '@/lib/supabase'
import { toast } from 'sonner'

interface AdvancedExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  filteredCount: number
  totalCount: number
}

export function AdvancedExportDialog({
  open,
  onOpenChange,
  products,
  filteredCount,
  totalCount
}: AdvancedExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [columns, setColumns] = useState<ExportColumn[]>(
    advancedExportService.getDefaultColumns()
  )
  const [isExporting, setIsExporting] = useState(false)

  const toggleColumn = (key: string) => {
    setColumns(columns.map(col => 
      col.key === key ? { ...col, enabled: !col.enabled } : col
    ))
  }

  const selectAllColumns = () => {
    setColumns(columns.map(col => ({ ...col, enabled: true })))
  }

  const deselectAllColumns = () => {
    setColumns(columns.map(col => ({ ...col, enabled: false })))
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      const enabledCount = columns.filter(col => col.enabled).length
      
      if (format !== 'csv-shopify' && enabledCount === 0) {
        toast.error('Veuillez sélectionner au moins une colonne')
        return
      }

      const filename = advancedExportService.generateFilename('produits', format)

      switch (format) {
        case 'csv':
          advancedExportService.exportToCSV(products, columns, filename)
          break
        case 'csv-shopify':
          advancedExportService.exportToShopifyCSV(products, filename)
          break
        case 'excel':
          advancedExportService.exportToExcel(products, columns, filename, 'standard')
          break
      }

      toast.success(`${products.length} produit(s) exporté(s)`, {
        description: `Format: ${format.toUpperCase()}`
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Erreur lors de l\'export')
    } finally {
      setIsExporting(false)
    }
  }

  const enabledColumnsCount = columns.filter(col => col.enabled).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Export avancé</DialogTitle>
          <DialogDescription>
            Exportez {filteredCount} produit(s) sur {totalCount} avec un formatage personnalisé
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format d'export */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Format d'export</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="csv" id="csv" />
                <div className="flex-1">
                  <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    <div>
                      <div className="font-medium">CSV Standard</div>
                      <div className="text-sm text-muted-foreground">
                        Format CSV avec colonnes personnalisables
                      </div>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="csv-shopify" id="csv-shopify" />
                <div className="flex-1">
                  <Label htmlFor="csv-shopify" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    <div>
                      <div className="font-medium">CSV Shopify</div>
                      <div className="text-sm text-muted-foreground">
                        Format compatible Shopify avec toutes les colonnes requises
                      </div>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="excel" id="excel" />
                <div className="flex-1">
                  <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Excel (XLSX)</div>
                      <div className="text-sm text-muted-foreground">
                        Fichier Excel avec colonnes ajustées automatiquement
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Sélection des colonnes (seulement pour CSV standard et Excel) */}
          {(format === 'csv' || format === 'excel') && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Colonnes à exporter
                    <Badge variant="secondary" className="ml-2">
                      {enabledColumnsCount} / {columns.length}
                    </Badge>
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={selectAllColumns}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Tout
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllColumns}
                    >
                      <Circle className="h-4 w-4 mr-1" />
                      Aucun
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-3">
                    {columns.map((column) => (
                      <div key={column.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={column.key}
                          checked={column.enabled}
                          onCheckedChange={() => toggleColumn(column.key)}
                        />
                        <Label
                          htmlFor={column.key}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {column.label}
                          {column.shopifyKey && (
                            <span className="text-xs text-muted-foreground ml-2">
                              → {column.shopifyKey}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {/* Info pour Shopify */}
          {format === 'csv-shopify' && (
            <>
              <Separator />
              <div className="rounded-lg bg-muted p-4">
                <h4 className="text-sm font-semibold mb-2">Format Shopify</h4>
                <p className="text-sm text-muted-foreground">
                  L'export inclura automatiquement toutes les colonnes requises par Shopify : 
                  titre, description, prix, stock, images, SEO, métadonnées Google Shopping, etc.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || (format !== 'csv-shopify' && enabledColumnsCount === 0)}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Export en cours...' : 'Exporter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
