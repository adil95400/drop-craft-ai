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
import { useRealProducts } from '@/hooks/useRealProducts'

interface ProductExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductExportDialog({ open, onOpenChange }: ProductExportDialogProps) {
  const { toast } = useToast()
  const { products } = useRealProducts()
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
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Export en cours...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
              Annuler
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}