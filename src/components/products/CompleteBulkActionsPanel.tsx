import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Trash2, 
  FolderTree, 
  ToggleLeft, 
  TrendingUp, 
  Copy, 
  Download,
  CheckCircle,
  X
} from 'lucide-react'
import { useBulkActions } from '@/hooks/useBulkActions'
import { usePublishProducts } from '@/hooks/usePublishProducts'
import { importExportService } from '@/services/importExportService'
import { BulkDeleteConfirmDialog } from './BulkDeleteConfirmDialog'
import { BulkPriceUpdateDialog } from './BulkPriceUpdateDialog'
import { BulkCategoryUpdateDialog } from './BulkCategoryUpdateDialog'
import { BulkStatusUpdateDialog } from './BulkStatusUpdateDialog'
import { toast } from 'sonner'

interface CompleteBulkActionsPanelProps {
  selectedProducts: any[]
  onClearSelection: () => void
  onRefresh?: () => void
}

export function CompleteBulkActionsPanel({ 
  selectedProducts, 
  onClearSelection,
  onRefresh 
}: CompleteBulkActionsPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPriceDialog, setShowPriceDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)

  const { 
    bulkDelete, 
    bulkUpdateCategory, 
    bulkUpdateStatus, 
    bulkUpdatePrices,
    bulkDuplicate,
    isDeleting,
    isUpdatingCategory,
    isUpdatingStatus,
    isUpdatingPrices,
    isDuplicating
  } = useBulkActions()

  const { bulkPublish, isBulkPublishing } = usePublishProducts()

  const selectedIds = selectedProducts.map(p => p.id)
  const existingCategories = Array.from(new Set(selectedProducts.map(p => p.category).filter(Boolean)))

  const handleDelete = () => {
    bulkDelete(selectedIds)
    setShowDeleteDialog(false)
    onClearSelection()
    onRefresh?.()
  }

  const handlePriceUpdate = (type: 'increase' | 'decrease' | 'set', value: number) => {
    let multiplier = 1
    
    if (type === 'set') {
      // Pour un prix fixe, on ne peut pas utiliser un multiplicateur simple
      toast.error('La modification de prix fixe n\'est pas encore implémentée')
      return
    } else if (type === 'increase') {
      multiplier = 1 + (value / 100)
    } else {
      multiplier = 1 - (value / 100)
    }

    bulkUpdatePrices({ productIds: selectedIds, multiplier })
    onRefresh?.()
  }

  const handleCategoryUpdate = (category: string) => {
    bulkUpdateCategory({ productIds: selectedIds, category })
    onRefresh?.()
  }

  const handleStatusUpdate = (status: 'active' | 'inactive' | 'draft') => {
    bulkUpdateStatus({ productIds: selectedIds, status })
    onRefresh?.()
  }

  const handleDuplicate = () => {
    bulkDuplicate(selectedIds)
    onClearSelection()
    onRefresh?.()
  }

  const handlePublish = () => {
    bulkPublish(selectedIds)
    onClearSelection()
    onRefresh?.()
  }

  const handleExport = async () => {
    try {
      importExportService.exportToCSV(selectedProducts, `selected_products_${Date.now()}.csv`)
      toast.success(`${selectedProducts.length} produits exportés`)
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    }
  }

  const isLoading = isDeleting || isUpdatingCategory || isUpdatingStatus || isUpdatingPrices || isDuplicating || isBulkPublishing

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''} sélectionné{selectedProducts.length > 1 ? 's' : ''}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Désélectionner
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCategoryDialog(true)}
              disabled={isLoading}
            >
              <FolderTree className="h-4 w-4 mr-2" />
              Catégorie
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatusDialog(true)}
              disabled={isLoading}
            >
              <ToggleLeft className="h-4 w-4 mr-2" />
              Statut
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPriceDialog(true)}
              disabled={isLoading}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Prix
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={isLoading}
            >
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePublish}
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Publier
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      <BulkDeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        count={selectedProducts.length}
        onConfirm={handleDelete}
      />

      <BulkPriceUpdateDialog
        open={showPriceDialog}
        onOpenChange={setShowPriceDialog}
        count={selectedProducts.length}
        onConfirm={handlePriceUpdate}
      />

      <BulkCategoryUpdateDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        count={selectedProducts.length}
        existingCategories={existingCategories}
        onConfirm={handleCategoryUpdate}
      />

      <BulkStatusUpdateDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        count={selectedProducts.length}
        onConfirm={handleStatusUpdate}
      />
    </>
  )
}
