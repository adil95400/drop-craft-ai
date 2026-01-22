import { useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Rocket, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MultiStoreImportSelector } from './MultiStoreImportSelector'
import { useMultiStoreImport, ProductImportData } from '@/hooks/useMultiStoreImport'

interface MultiStoreImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ProductImportData
  onSuccess?: (results: any) => void
}

export function MultiStoreImportDialog({
  open,
  onOpenChange,
  product,
  onSuccess
}: MultiStoreImportDialogProps) {
  const {
    selectedCount,
    hasSelection,
    isImporting,
    progress,
    importToMultipleStoresAsync,
    getSelectedStores
  } = useMultiStoreImport()

  const [importComplete, setImportComplete] = useState(false)

  const handleImport = async () => {
    try {
      const results = await importToMultipleStoresAsync(product)
      setImportComplete(true)
      onSuccess?.(results)
    } catch (error) {
      console.error('Multi-store import failed:', error)
    }
  }

  const handleClose = () => {
    setImportComplete(false)
    onOpenChange(false)
  }

  const progressPercentage = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Import Multi-Boutiques
          </DialogTitle>
          <DialogDescription>
            Importez "{product.title}" vers plusieurs boutiques simultanément
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            {product.images?.[0] && (
              <img 
                src={product.images[0]} 
                alt={product.title}
                className="h-12 w-12 rounded object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.title}</p>
              <p className="text-sm text-muted-foreground">
                {product.price ? `${product.price} €` : 'Prix non défini'}
                {product.source_platform && ` • ${product.source_platform}`}
              </p>
            </div>
          </div>

          {/* Store selector */}
          {!isImporting && !importComplete && (
            <MultiStoreImportSelector showProgress={false} />
          )}

          {/* Import progress */}
          {(isImporting || importComplete) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {importComplete ? 'Import terminé' : 'Import en cours...'}
                  </span>
                  <span className="text-muted-foreground">
                    {progress.completed}/{progress.total}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{progress.successful} réussi(s)</span>
                </div>
                {progress.failed > 0 && (
                  <div className="flex items-center gap-1.5 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{progress.failed} échec(s)</span>
                  </div>
                )}
              </div>

              {/* Results detail */}
              <ScrollArea className="h-40 rounded-lg border">
                <div className="p-3 space-y-2">
                  {progress.results.map((result, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        "flex items-center justify-between p-2 rounded",
                        result.success 
                          ? "bg-green-500/10" 
                          : "bg-destructive/10"
                      )}
                    >
                      <span className="font-medium text-sm">{result.storeName}</span>
                      {result.success ? (
                        <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Importé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {result.error || 'Échec'}
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </div>

        <DialogFooter>
          {importComplete ? (
            <Button onClick={handleClose}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                Annuler
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!hasSelection || isImporting}
              >
                {isImporting ? (
                  <>Importation...</>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Importer vers {selectedCount} boutique(s)
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MultiStoreImportDialog
