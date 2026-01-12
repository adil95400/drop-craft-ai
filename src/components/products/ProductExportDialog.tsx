import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Download, Loader2, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { importExportService } from '@/services/importExportService'
import { useProductsUnified } from '@/hooks/unified'

interface ProductExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductExportDialog({ open, onOpenChange }: ProductExportDialogProps) {
  const { toast } = useToast()
  const { products } = useProductsUnified()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportFormat, setExportFormat] = useState('csv')

  const handleExport = async () => {
    if (products.length === 0) {
      toast({
        title: "Aucun produit à exporter",
        description: "Vous devez avoir des produits pour effectuer un export",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    try {
      for (let i = 0; i <= 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setExportProgress(i)
      }

      const filename = `produits_export_${new Date().toISOString().split('T')[0]}`
      
      switch (exportFormat) {
        case 'csv':
          importExportService.exportToCSV(products, `${filename}.csv`)
          break
        case 'json':
          importExportService.exportToJSON(products, `${filename}.json`)
          break
        case 'excel':
          importExportService.exportToExcel(products, `${filename}.xlsx`)
          break
      }

      setExportProgress(100)
      toast({
        title: "Export réussi !",
        description: `${products.length} produits exportés en ${exportFormat.toUpperCase()}`
      })
      
      setTimeout(() => onOpenChange(false), 1000)
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exporter les Produits</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="export-format">Format d'export *</Label>
            <Select value={exportFormat} onValueChange={setExportFormat} disabled={isExporting}>
              <SelectTrigger id="export-format" className="bg-background">
                <SelectValue placeholder="Sélectionner un format" />
              </SelectTrigger>
              <SelectContent className="z-[100] bg-popover">
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <div>
                      <div className="font-medium">CSV</div>
                      <div className="text-xs text-muted-foreground">Compatible Excel, Google Sheets</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Excel (.xlsx)</div>
                      <div className="text-xs text-muted-foreground">Format Microsoft Excel</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <div>
                      <div className="font-medium">JSON</div>
                      <div className="text-xs text-muted-foreground">Format API/développeurs</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Produits à exporter</span>
              <span className="text-2xl font-bold text-primary">{products.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Tous vos produits seront exportés au format {exportFormat.toUpperCase()}
            </p>
          </div>

          {isExporting && (
            <div className="space-y-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Export en cours...
                </span>
                <span className="text-primary">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Préparation de vos {products.length} produits...
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
              className="sm:order-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || products.length === 0}
              className="sm:order-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter ({products.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}