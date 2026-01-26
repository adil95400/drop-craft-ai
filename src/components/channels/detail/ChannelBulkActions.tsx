/**
 * ChannelBulkActions - Actions en masse pour les produits
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckSquare, Square, MoreHorizontal, Download, Upload, 
  Trash2, Edit3, Power, PowerOff, Tag, Percent, Loader2,
  FileSpreadsheet, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  title: string | null
  price: number | null
  status: string | null
}

interface ChannelBulkActionsProps {
  products: Product[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onAction?: (action: string, ids: string[], params?: any) => Promise<void>
}

export function ChannelBulkActions({
  products,
  selectedIds,
  onSelectionChange,
  onAction
}: ChannelBulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPriceDialog, setShowPriceDialog] = useState(false)
  const [priceAdjustment, setPriceAdjustment] = useState({ type: 'percent', value: '' })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const allSelected = products.length > 0 && selectedIds.length === products.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < products.length

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(products.map(p => p.id))
    }
  }

  const handleAction = async (action: string, params?: any) => {
    if (selectedIds.length === 0) {
      toast.error('Sélectionnez au moins un produit')
      return
    }

    setIsLoading(true)
    try {
      await onAction?.(action, selectedIds, params)
      
      switch (action) {
        case 'activate':
          toast.success(`${selectedIds.length} produit(s) activé(s)`)
          break
        case 'deactivate':
          toast.success(`${selectedIds.length} produit(s) désactivé(s)`)
          break
        case 'delete':
          toast.success(`${selectedIds.length} produit(s) supprimé(s)`)
          onSelectionChange([])
          break
        case 'update_price':
          toast.success(`Prix mis à jour pour ${selectedIds.length} produit(s)`)
          break
        case 'export':
          toast.success('Export démarré')
          break
      }
    } catch (error) {
      toast.error('Erreur lors de l\'action')
    } finally {
      setIsLoading(false)
      setShowPriceDialog(false)
      setShowDeleteDialog(false)
    }
  }

  const handleExportCSV = () => {
    const selectedProducts = products.filter(p => selectedIds.includes(p.id))
    const csv = [
      ['ID', 'Titre', 'Prix', 'Statut'].join(','),
      ...selectedProducts.map(p => 
        [p.id, `"${p.title || ''}"`, p.price || 0, p.status || 'draft'].join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-export-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success(`${selectedIds.length} produit(s) exporté(s)`)
  }

  return (
    <>
      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-background border border-border shadow-2xl rounded-2xl">
              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
              </Badge>
              
              <div className="h-6 w-px bg-border" />
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleAction('activate')}
                disabled={isLoading}
                className="gap-2"
              >
                <Power className="h-4 w-4 text-green-600" />
                <span className="hidden sm:inline">Activer</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleAction('deactivate')}
                disabled={isLoading}
                className="gap-2"
              >
                <PowerOff className="h-4 w-4 text-yellow-600" />
                <span className="hidden sm:inline">Désactiver</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPriceDialog(true)}
                disabled={isLoading}
                className="gap-2"
              >
                <Percent className="h-4 w-4 text-blue-600" />
                <span className="hidden sm:inline">Prix</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleExportCSV}
                disabled={isLoading}
                className="gap-2"
              >
                <Download className="h-4 w-4 text-purple-600" />
                <span className="hidden sm:inline">Exporter</span>
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Supprimer</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onSelectionChange([])}
                className="text-muted-foreground"
              >
                Annuler
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {allSelected ? (
            <CheckSquare className="h-5 w-5 text-primary" />
          ) : someSelected ? (
            <div className="h-5 w-5 rounded border-2 border-primary bg-primary/20 flex items-center justify-center">
              <div className="w-2 h-0.5 bg-primary" />
            </div>
          ) : (
            <Square className="h-5 w-5" />
          )}
          {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
        </button>

        {selectedIds.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {selectedIds.length} / {products.length}
          </Badge>
        )}
      </div>

      {/* Price Adjustment Dialog */}
      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier les prix</DialogTitle>
            <DialogDescription>
              Ajuster le prix de {selectedIds.length} produit(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={priceAdjustment.type === 'percent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriceAdjustment(prev => ({ ...prev, type: 'percent' }))}
                className="flex-1"
              >
                <Percent className="h-4 w-4 mr-2" />
                Pourcentage
              </Button>
              <Button
                variant={priceAdjustment.type === 'fixed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriceAdjustment(prev => ({ ...prev, type: 'fixed' }))}
                className="flex-1"
              >
                €
                Montant fixe
              </Button>
            </div>
            
            <div className="relative">
              <Input
                type="number"
                placeholder={priceAdjustment.type === 'percent' ? 'Ex: -10 ou +15' : 'Ex: -5.00 ou +10.00'}
                value={priceAdjustment.value}
                onChange={(e) => setPriceAdjustment(prev => ({ ...prev, value: e.target.value }))}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {priceAdjustment.type === 'percent' ? '%' : '€'}
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Utilisez un nombre négatif pour réduire et positif pour augmenter
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => handleAction('update_price', priceAdjustment)}
              disabled={!priceAdjustment.value || isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Êtes-vous sûr de vouloir supprimer {selectedIds.length} produit(s) ? 
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleAction('delete')}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
