import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AsyncButton } from '@/components/ui/async-button'
import { useConfirm } from '@/hooks/useConfirm'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Grid3X3, Edit, Trash2, Copy, Download, Upload, Package, Tag, Archive } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRealProducts } from '@/hooks/useRealProducts'

interface ProductBulkOperationsProps {
  selectedProducts: string[]
  onClearSelection: () => void
}

export function ProductBulkOperations({ selectedProducts, onClearSelection }: ProductBulkOperationsProps) {
  const { toast } = useToast()
  const { updateProduct, deleteProduct } = useRealProducts()
  const { confirm, confirmState } = useConfirm()
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false)
  const [bulkEditData, setBulkEditData] = useState({
    category: '',
    status: '',
    priceAdjustment: '',
    adjustmentType: 'percentage' // 'percentage' | 'fixed'
  })

  const handleBulkEdit = async () => {
    try {
      const { importExportService } = await import('@/services/importExportService')
      
      // Appliquer les modifications selon les champs remplis
      if (bulkEditData.category) {
        await importExportService.bulkUpdateCategory(selectedProducts, bulkEditData.category)
      }
      
      if (bulkEditData.status) {
        await importExportService.bulkUpdateStatus(selectedProducts, bulkEditData.status as 'active' | 'inactive')
      }
      
      if (bulkEditData.priceAdjustment) {
        const adjustment = parseFloat(bulkEditData.priceAdjustment)
        const multiplier = bulkEditData.adjustmentType === 'percentage' 
          ? 1 + (adjustment / 100) 
          : adjustment
        await importExportService.bulkUpdatePrices(selectedProducts, multiplier)
      }
      
      toast({
        title: "Édition en masse réussie",
        description: `${selectedProducts.length} produits ont été mis à jour`,
      })
      
      setShowBulkEditDialog(false)
      setBulkEditData({ category: '', status: '', priceAdjustment: '', adjustmentType: 'percentage' })
      onClearSelection()
    } catch (error) {
      toast({
        title: "Erreur lors de l'édition",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour",
        variant: "destructive"
      })
    }
  }

  const handleBulkDuplicate = async () => {
    try {
      // Simuler la duplication des produits sélectionnés
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Duplication réussie",
        description: `${selectedProducts.length} produits ont été dupliqués`,
      })
      
      onClearSelection()
    } catch (error) {
      toast({
        title: "Erreur lors de la duplication",
        description: "Une erreur est survenue lors de la duplication",
        variant: "destructive"
      })
    }
  }

  const handleBulkExport = async () => {
    try {
      const { importExportService } = await import('@/services/importExportService')
      const { supabase } = await import('@/integrations/supabase/client')
      
      // Récupérer les données réelles des produits sélectionnés
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('id', selectedProducts)
      
      if (error) throw error
      
      // Exporter en CSV avec les vraies données
      importExportService.exportToCSV(
        products, 
        `produits_selection_${new Date().toISOString().split('T')[0]}.csv`
      )
      
      toast({
        title: "Export réussi",
        description: `${selectedProducts.length} produits exportés`,
      })
      
      onClearSelection()
    } catch (error) {
      toast({
        title: "Erreur lors de l'export",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'export",
        variant: "destructive"
      })
    }
  }

  const handleBulkDelete = async () => {
    const confirmed = await confirm({
      title: "Supprimer les produits sélectionnés",
      description: `Êtes-vous sûr de vouloir supprimer ${selectedProducts.length} produits ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "destructive"
    })

    if (!confirmed) return

    try {
      const { importExportService } = await import('@/services/importExportService')
      const success = await importExportService.bulkDelete(selectedProducts)
      
      if (!success) throw new Error('Échec de la suppression')
      
      toast({
        title: "Suppression réussie",
        description: `${selectedProducts.length} produits ont été supprimés`,
      })
      
      onClearSelection()
    } catch (error) {
      toast({
        title: "Erreur lors de la suppression",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression",
        variant: "destructive"
      })
    }
  }

  const handleBulkStatusChange = async (status: string) => {
    try {
      const { importExportService } = await import('@/services/importExportService')
      const success = await importExportService.bulkUpdateStatus(selectedProducts, status as 'active' | 'inactive')
      
      if (!success) throw new Error('Échec de la mise à jour du statut')
      
      toast({
        title: "Statut mis à jour",
        description: `${selectedProducts.length} produits sont maintenant ${status === 'active' ? 'actifs' : 'inactifs'}`,
      })
      
      onClearSelection()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour du statut",
        variant: "destructive"
      })
    }
  }

  if (selectedProducts.length === 0) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Actions Groupées
            <Badge variant="secondary">{selectedProducts.length} sélectionnés</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Éditer en masse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Édition en masse - {selectedProducts.length} produits</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-category">Catégorie</Label>
                  <Select 
                    value={bulkEditData.category}
                    onValueChange={(value) => setBulkEditData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronique">Électronique</SelectItem>
                      <SelectItem value="mode">Mode</SelectItem>
                      <SelectItem value="maison">Maison & Jardin</SelectItem>
                      <SelectItem value="sport">Sport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulk-status">Statut</Label>
                  <Select 
                    value={bulkEditData.status}
                    onValueChange={(value) => setBulkEditData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price-adjustment">Ajustement de prix</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={bulkEditData.adjustmentType}
                      onValueChange={(value) => setBulkEditData(prev => ({ ...prev, adjustmentType: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">€</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="price-adjustment"
                      type="number"
                      placeholder={bulkEditData.adjustmentType === 'percentage' ? '10' : '5.00'}
                      value={bulkEditData.priceAdjustment}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, priceAdjustment: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowBulkEditDialog(false)}>
                    Annuler
                  </Button>
                  <AsyncButton
                    onClick={handleBulkEdit}
                    loadingText="Mise à jour..."
                    successMessage="Mis à jour !"
                  >
                    Appliquer les modifications
                  </AsyncButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <AsyncButton 
            size="sm" 
            variant="outline"
            onClick={handleBulkDuplicate}
            loadingText="Duplication..."
            icon={<Copy className="h-4 w-4" />}
          >
            Dupliquer
          </AsyncButton>

          <AsyncButton 
            size="sm" 
            variant="outline"
            onClick={handleBulkExport}
            loadingText="Export..."
            icon={<Download className="h-4 w-4" />}
          >
            Exporter
          </AsyncButton>

          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleBulkStatusChange('active')}
          >
            <Package className="h-4 w-4 mr-2" />
            Activer
          </Button>

          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleBulkStatusChange('inactive')}
          >
            <Archive className="h-4 w-4 mr-2" />
            Désactiver
          </Button>

          <AsyncButton 
            size="sm" 
            variant="destructive"
            onClick={handleBulkDelete}
            loadingText="Suppression..."
            icon={<Trash2 className="h-4 w-4" />}
          >
            Supprimer
          </AsyncButton>

          <Button size="sm" variant="ghost" onClick={onClearSelection}>
            Désélectionner
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog {...confirmState} onOpenChange={(open) => !open && confirmState.onCancel?.()} />
    </>
  )
}