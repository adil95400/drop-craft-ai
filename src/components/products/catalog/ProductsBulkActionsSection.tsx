/**
 * Section actions en masse pour les produits sélectionnés
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Upload, Edit3, Trash2 } from 'lucide-react'
import { BulkEditPanel } from '@/components/products/BulkEditPanel'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'

interface ProductsBulkActionsSectionProps {
  selectedProducts: string[]
  products: UnifiedProduct[]
  showBulkEdit: boolean
  onShowBulkEditChange: (show: boolean) => void
  onExportClick: () => void
  onDeleteClick: () => void
  onClearSelection: () => void
  onRefresh: () => void
}

export const ProductsBulkActionsSection = memo(function ProductsBulkActionsSection({
  selectedProducts,
  products,
  showBulkEdit,
  onShowBulkEditChange,
  onExportClick,
  onDeleteClick,
  onClearSelection,
  onRefresh
}: ProductsBulkActionsSectionProps) {
  if (selectedProducts.length === 0) return null

  const selectedProductsData = products.filter(p => selectedProducts.includes(p.id))

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg"
    >
      <Badge variant="secondary" className="bg-primary/20 text-primary font-medium">
        {selectedProducts.length} sélectionné(s)
      </Badge>
      
      <div className="flex-1" />
      
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={onExportClick}
      >
        <Upload className="h-4 w-4" />
        Exporter
      </Button>

      <Sheet open={showBulkEdit} onOpenChange={onShowBulkEditChange}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit3 className="h-4 w-4" />
            Éditer
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <BulkEditPanel
            selectedProducts={selectedProductsData}
            onComplete={() => {
              onShowBulkEditChange(false)
              onClearSelection()
              onRefresh()
            }}
            onCancel={() => onShowBulkEditChange(false)}
          />
        </SheetContent>
      </Sheet>

      <Button 
        variant="destructive" 
        size="sm" 
        className="gap-2"
        onClick={onDeleteClick}
      >
        <Trash2 className="h-4 w-4" />
        Supprimer
      </Button>

      <Button 
        variant="ghost" 
        size="sm"
        onClick={onClearSelection}
      >
        Désélectionner
      </Button>
    </motion.div>
  )
})
