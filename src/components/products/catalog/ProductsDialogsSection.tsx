/**
 * Section des modales/dialogs pour la page produits
 */

import { memo } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BulkEnrichmentDialog } from '@/components/enrichment'
import { ProductViewModal } from '@/components/modals/ProductViewModal'
import { PlatformExportDialog } from '@/components/products/export/PlatformExportDialog'
import { ProductsDebugPanel } from '@/components/debug/ProductsDebugPanel'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { ProductAIBadge } from '@/components/products/command-center'

interface ProductsDialogsSectionProps {
  // Bulk Enrichment
  showBulkEnrichment: boolean
  onShowBulkEnrichmentChange: (show: boolean) => void
  selectedProducts: string[]
  onEnrichmentComplete: () => void
  
  // View Modal
  viewModalProduct: UnifiedProduct | null
  onViewModalChange: (product: UnifiedProduct | null) => void
  productBadges: Map<string, ProductAIBadge>
  onEdit: (product: UnifiedProduct) => void
  onDelete: (id: string) => void
  onDuplicate: (product: UnifiedProduct) => Promise<void>
  
  // Bulk Delete
  bulkDeleteDialogOpen: boolean
  onBulkDeleteDialogChange: (open: boolean) => void
  isBulkDeleting: boolean
  onBulkDelete: () => Promise<void>
  bulkDeleteCount: number
  
  // Platform Export
  showPlatformExport: boolean
  onShowPlatformExportChange: (show: boolean) => void
  products: UnifiedProduct[]
  onExportSuccess: () => void
}

export const ProductsDialogsSection = memo(function ProductsDialogsSection({
  showBulkEnrichment,
  onShowBulkEnrichmentChange,
  selectedProducts,
  onEnrichmentComplete,
  viewModalProduct,
  onViewModalChange,
  productBadges,
  onEdit,
  onDelete,
  onDuplicate,
  bulkDeleteDialogOpen,
  onBulkDeleteDialogChange,
  isBulkDeleting,
  onBulkDelete,
  bulkDeleteCount,
  showPlatformExport,
  onShowPlatformExportChange,
  products,
  onExportSuccess
}: ProductsDialogsSectionProps) {
  return (
    <>
      {/* Bulk Enrichment Dialog */}
      <BulkEnrichmentDialog
        open={showBulkEnrichment}
        onOpenChange={onShowBulkEnrichmentChange}
        productIds={selectedProducts}
        onComplete={onEnrichmentComplete}
      />

      {/* Debug Panel */}
      <ProductsDebugPanel />
      
      {/* Product View Modal */}
      <ProductViewModal
        open={!!viewModalProduct}
        onOpenChange={(open) => !open && onViewModalChange(null)}
        product={viewModalProduct}
        aiBadge={viewModalProduct ? productBadges.get(viewModalProduct.id) : undefined}
        onEdit={() => {
          if (viewModalProduct) {
            onEdit(viewModalProduct)
            onViewModalChange(null)
          }
        }}
        onDelete={() => {
          if (viewModalProduct) {
            onDelete(viewModalProduct.id)
            onViewModalChange(null)
          }
        }}
        onDuplicate={async () => {
          if (viewModalProduct) {
            await onDuplicate(viewModalProduct)
          }
        }}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={onBulkDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {bulkDeleteCount} produit(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les produits sélectionnés seront définitivement supprimés de votre catalogue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onBulkDelete} 
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Platform Export Dialog */}
      <PlatformExportDialog
        open={showPlatformExport}
        onOpenChange={onShowPlatformExportChange}
        productIds={selectedProducts}
        productNames={products
          .filter(p => selectedProducts.includes(p.id))
          .map(p => p.name)}
        onSuccess={onExportSuccess}
      />
    </>
  )
})
