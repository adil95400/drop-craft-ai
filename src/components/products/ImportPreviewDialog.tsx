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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  RefreshCw,
  XCircle,
  Upload
} from 'lucide-react'
import { ImportPreview, ConflictResolution } from '@/services/csvImportService'
import { cn } from '@/lib/utils'

interface ImportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preview: ImportPreview | null
  onConfirm: (resolutions: ConflictResolution[]) => Promise<void>
  isImporting: boolean
}

export function ImportPreviewDialog({
  open,
  onOpenChange,
  preview,
  onConfirm,
  isImporting
}: ImportPreviewDialogProps) {
  const [conflictResolutions, setConflictResolutions] = useState<ConflictResolution[]>([])

  if (!preview) return null

  const stats = {
    total: preview.new.length + preview.updates.length + preview.conflicts.length,
    new: preview.new.length,
    updates: preview.updates.length,
    conflicts: preview.conflicts.length,
    errors: preview.errors.length
  }

  const handleConflictResolution = (index: number, action: ConflictResolution['action']) => {
    setConflictResolutions(prev => {
      const existing = prev.find(r => r.productIndex === index)
      if (existing) {
        return prev.map(r => r.productIndex === index ? { ...r, action } : r)
      }
      return [...prev, { productIndex: index, action }]
    })
  }

  const allConflictsResolved = preview.conflicts.length === 0 || 
    preview.conflicts.every((_, index) => 
      conflictResolutions.some(r => r.productIndex === index)
    )

  const handleConfirm = async () => {
    await onConfirm(conflictResolutions)
    setConflictResolutions([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Aperçu de l'import CSV</DialogTitle>
          <DialogDescription>
            Vérifiez les modifications avant de les appliquer
          </DialogDescription>
        </DialogHeader>

        {/* Statistiques */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Plus className="h-4 w-4" />
              Nouveaux
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.new}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <RefreshCw className="h-4 w-4" />
              Mises à jour
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.updates}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" />
              Conflits
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats.conflicts}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <XCircle className="h-4 w-4" />
              Erreurs
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
          </div>
        </div>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new">
              Nouveaux ({stats.new})
            </TabsTrigger>
            <TabsTrigger value="updates">
              Mises à jour ({stats.updates})
            </TabsTrigger>
            <TabsTrigger value="conflicts" disabled={stats.conflicts === 0}>
              Conflits ({stats.conflicts})
            </TabsTrigger>
            <TabsTrigger value="errors" disabled={stats.errors === 0}>
              Erreurs ({stats.errors})
            </TabsTrigger>
          </TabsList>

          {/* Nouveaux produits */}
          <TabsContent value="new">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 p-1">
                {preview.new.map((product, index) => (
                  <div key={index} className="rounded-lg border p-4 bg-green-50/50 dark:bg-green-950/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{product.name}</h4>
                          <Badge variant="outline" className="text-green-600">Nouveau</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Prix:</span> {product.price}€
                          </div>
                          {product.sku && (
                            <div>
                              <span className="text-muted-foreground">SKU:</span> {product.sku}
                            </div>
                          )}
                          {product.category && (
                            <div>
                              <span className="text-muted-foreground">Catégorie:</span> {product.category}
                            </div>
                          )}
                          {product.stock_quantity !== undefined && (
                            <div>
                              <span className="text-muted-foreground">Stock:</span> {product.stock_quantity}
                            </div>
                          )}
                        </div>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Mises à jour */}
          <TabsContent value="updates">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 p-1">
                {preview.updates.map((update, index) => (
                  <div key={index} className="rounded-lg border p-4 bg-blue-50/50 dark:bg-blue-950/20">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{update.product.name}</h4>
                        <Badge variant="outline" className="text-blue-600">Mise à jour</Badge>
                      </div>
                      <RefreshCw className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      {update.changes.map((change, i) => (
                        <div key={i} className="text-sm text-muted-foreground">
                          • {change}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Conflits */}
          <TabsContent value="conflicts">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 p-1">
                {preview.conflicts.map((conflict, index) => {
                  const resolution = conflictResolutions.find(r => r.productIndex === index)
                  return (
                    <div key={index} className="rounded-lg border p-4 bg-orange-50/50 dark:bg-orange-950/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{conflict.product.name}</h4>
                            <Badge variant="destructive">Conflit {conflict.conflictType === 'sku' ? 'SKU' : 'Nom'}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {conflict.conflictType === 'sku' 
                              ? `Le SKU "${conflict.product.sku}" existe déjà pour "${conflict.existingProduct.name}"`
                              : `Le nom "${conflict.product.name}" existe déjà`
                            }
                          </p>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={resolution?.action === 'skip' ? 'default' : 'outline'}
                          onClick={() => handleConflictResolution(index, 'skip')}
                        >
                          Ignorer
                        </Button>
                        <Button
                          size="sm"
                          variant={resolution?.action === 'update' ? 'default' : 'outline'}
                          onClick={() => handleConflictResolution(index, 'update')}
                        >
                          Mettre à jour l'existant
                        </Button>
                        <Button
                          size="sm"
                          variant={resolution?.action === 'create_new' ? 'default' : 'outline'}
                          onClick={() => handleConflictResolution(index, 'create_new')}
                        >
                          Créer un nouveau
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Erreurs */}
          <TabsContent value="errors">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 p-1">
                {preview.errors.map((error, index) => (
                  <div key={index} className="rounded-lg border p-4 bg-red-50/50 dark:bg-red-950/20">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium mb-1">Ligne {error.row}</div>
                        <div className="text-sm text-muted-foreground">{error.error}</div>
                        {error.product.name && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Produit: {error.product.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {stats.conflicts > 0 && !allConflictsResolved && (
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Veuillez résoudre tous les conflits avant de continuer l'import
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!allConflictsResolved || isImporting || stats.errors > 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Import en cours...' : `Importer ${stats.total} produit(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
