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
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  DollarSign, 
  Package, 
  Tag, 
  AlertCircle,
  TrendingUp,
  Percent,
  Plus,
  Minus
} from 'lucide-react'
import { Product } from '@/lib/supabase'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

interface BulkEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProducts: Product[]
  onSuccess: () => void
  categories: string[]
}

type PriceModificationType = 'percentage' | 'fixed' | 'set'
type StockModificationType = 'add' | 'subtract' | 'set'

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess,
  categories
}: BulkEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Prix
  const [priceModType, setPriceModType] = useState<PriceModificationType>('percentage')
  const [priceValue, setPriceValue] = useState('')
  
  // Marge
  const [marginValue, setMarginValue] = useState('')
  
  // Stock
  const [stockModType, setStockModType] = useState<StockModificationType>('add')
  const [stockValue, setStockValue] = useState('')
  
  // Catégorie
  const [selectedCategory, setSelectedCategory] = useState<string>('none')
  const [newCategory, setNewCategory] = useState('')
  
  // Tags
  const [tagsToAdd, setTagsToAdd] = useState('')
  const [tagsToRemove, setTagsToRemove] = useState('')
  
  // Statut
  const [newStatus, setNewStatus] = useState<'none' | 'active' | 'inactive' | 'draft'>('none')

  const calculateNewPrice = (currentPrice: number): number => {
    const value = parseFloat(priceValue)
    if (isNaN(value)) return currentPrice

    switch (priceModType) {
      case 'percentage':
        return Math.round(currentPrice * (1 + value / 100) * 100) / 100
      case 'fixed':
        return Math.round((currentPrice + value) * 100) / 100
      case 'set':
        return value
      default:
        return currentPrice
    }
  }

  const calculateNewMargin = (price: number, costPrice?: number): number | null => {
    const value = parseFloat(marginValue)
    if (isNaN(value) || !costPrice) return null
    
    // Calculer le nouveau prix basé sur la marge désirée
    // Marge = ((Prix - Coût) / Prix) * 100
    // Prix = Coût / (1 - Marge/100)
    const newPrice = costPrice / (1 - value / 100)
    return Math.round(newPrice * 100) / 100
  }

  const calculateNewStock = (currentStock: number): number => {
    const value = parseInt(stockValue)
    if (isNaN(value)) return currentStock

    switch (stockModType) {
      case 'add':
        return currentStock + value
      case 'subtract':
        return Math.max(0, currentStock - value)
      case 'set':
        return value
      default:
        return currentStock
    }
  }

  const processTags = (currentTags: string[] | null): string[] => {
    let tags = currentTags || []
    
    // Ajouter des tags
    if (tagsToAdd.trim()) {
      const newTags = tagsToAdd.split(',').map(t => t.trim()).filter(Boolean)
      tags = [...new Set([...tags, ...newTags])]
    }
    
    // Retirer des tags
    if (tagsToRemove.trim()) {
      const removeTags = tagsToRemove.split(',').map(t => t.trim()).filter(Boolean)
      tags = tags.filter(t => !removeTags.includes(t))
    }
    
    return tags
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      const updates = selectedProducts.map(product => {
        const update: any = { id: product.id }
        
        // Prix
        if (priceValue) {
          if (marginValue && product.cost_price) {
            // Si une marge est spécifiée, utiliser la marge
            const newPrice = calculateNewMargin(product.price, product.cost_price)
            if (newPrice) {
              update.price = newPrice
              update.profit_margin = parseFloat(marginValue)
            }
          } else {
            // Sinon utiliser la modification de prix
            update.price = calculateNewPrice(product.price)
            
            // Recalculer la marge si le coût est disponible
            if (product.cost_price) {
              const newMargin = ((update.price - product.cost_price) / update.price) * 100
              update.profit_margin = Math.round(newMargin * 100) / 100
            }
          }
        } else if (marginValue && product.cost_price) {
          // Seulement la marge est spécifiée
          const newPrice = calculateNewMargin(product.price, product.cost_price)
          if (newPrice) {
            update.price = newPrice
            update.profit_margin = parseFloat(marginValue)
          }
        }
        
        // Stock
        if (stockValue) {
          update.stock_quantity = calculateNewStock(product.stock_quantity || 0)
        }
        
        // Catégorie
        if (selectedCategory !== 'none') {
          update.category = selectedCategory === 'new' ? newCategory : selectedCategory
        }
        
        // Tags
        if (tagsToAdd || tagsToRemove) {
          update.tags = processTags(product.tags)
        }
        
        // Statut
        if (newStatus !== 'none') {
          update.status = newStatus
        }
        
        return update
      })

      // Appliquer les mises à jour en batch
      const { error } = await supabase
        .from('products')
        .upsert(updates, { onConflict: 'id' })

      if (error) throw error

      toast.success('Modifications appliquées', {
        description: `${selectedProducts.length} produit(s) modifié(s)`
      })
      
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Bulk edit error:', error)
      toast.error('Erreur lors de la modification en masse')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setPriceValue('')
    setMarginValue('')
    setStockValue('')
    setSelectedCategory('none')
    setNewCategory('')
    setTagsToAdd('')
    setTagsToRemove('')
    setNewStatus('none')
  }

  const hasChanges = priceValue || marginValue || stockValue || 
    selectedCategory !== 'none' || tagsToAdd || tagsToRemove || newStatus !== 'none'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Édition en masse</DialogTitle>
          <DialogDescription>
            Modifier {selectedProducts.length} produit(s) simultanément
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="prices" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="prices">
              <DollarSign className="h-4 w-4 mr-1" />
              Prix
            </TabsTrigger>
            <TabsTrigger value="stock">
              <Package className="h-4 w-4 mr-1" />
              Stock
            </TabsTrigger>
            <TabsTrigger value="category">
              <Tag className="h-4 w-4 mr-1" />
              Catégorie
            </TabsTrigger>
            <TabsTrigger value="other">
              <AlertCircle className="h-4 w-4 mr-1" />
              Autres
            </TabsTrigger>
          </TabsList>

          {/* Onglet Prix */}
          <TabsContent value="prices" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Modification des prix
                </Label>
                
                <RadioGroup value={priceModType} onValueChange={(v) => setPriceModType(v as PriceModificationType)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="cursor-pointer">
                      Augmenter/diminuer de X%
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="cursor-pointer">
                      Augmenter/diminuer de X€
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="set" id="set" />
                    <Label htmlFor="set" className="cursor-pointer">
                      Définir un prix fixe
                    </Label>
                  </div>
                </RadioGroup>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={
                      priceModType === 'percentage' ? 'Ex: 10 ou -10' :
                      priceModType === 'fixed' ? 'Ex: 5.00 ou -5.00' :
                      'Ex: 29.99'
                    }
                    value={priceValue}
                    onChange={(e) => setPriceValue(e.target.value)}
                  />
                  {priceModType === 'percentage' && <Percent className="h-4 w-4 text-muted-foreground" />}
                  {priceModType === 'fixed' && <span className="text-muted-foreground">€</span>}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Définir une marge cible
                </Label>
                <p className="text-sm text-muted-foreground">
                  Le prix sera recalculé automatiquement pour atteindre cette marge
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 30"
                    value={marginValue}
                    onChange={(e) => setMarginValue(e.target.value)}
                  />
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Nécessite un prix de revient. Produits concernés: {selectedProducts.filter(p => p.cost_price).length}/{selectedProducts.length}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Stock */}
          <TabsContent value="stock" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Modification du stock
              </Label>
              
              <RadioGroup value={stockModType} onValueChange={(v) => setStockModType(v as StockModificationType)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="add" id="add" />
                  <Label htmlFor="add" className="cursor-pointer flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Ajouter des unités
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="subtract" id="subtract" />
                  <Label htmlFor="subtract" className="cursor-pointer flex items-center gap-1">
                    <Minus className="h-4 w-4" />
                    Retirer des unités
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="set" id="stock-set" />
                  <Label htmlFor="stock-set" className="cursor-pointer">
                    Définir une quantité fixe
                  </Label>
                </div>
              </RadioGroup>

              <Input
                type="number"
                placeholder={stockModType === 'set' ? 'Ex: 100' : 'Ex: 50'}
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
              />
            </div>
          </TabsContent>

          {/* Onglet Catégorie */}
          <TabsContent value="category" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Modifier la catégorie
              </Label>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ne pas modifier</SelectItem>
                  <Separator className="my-1" />
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  <Separator className="my-1" />
                  <SelectItem value="new">+ Nouvelle catégorie</SelectItem>
                </SelectContent>
              </Select>

              {selectedCategory === 'new' && (
                <Input
                  placeholder="Nom de la nouvelle catégorie"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-base font-semibold">Gestion des tags</Label>
              
              <div className="space-y-2">
                <Label htmlFor="add-tags" className="text-sm">Ajouter des tags</Label>
                <Input
                  id="add-tags"
                  placeholder="tag1, tag2, tag3"
                  value={tagsToAdd}
                  onChange={(e) => setTagsToAdd(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Séparez les tags par des virgules</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remove-tags" className="text-sm">Retirer des tags</Label>
                <Input
                  id="remove-tags"
                  placeholder="tag1, tag2, tag3"
                  value={tagsToRemove}
                  onChange={(e) => setTagsToRemove(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Onglet Autres */}
          <TabsContent value="other" className="space-y-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Modifier le statut</Label>
              
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ne pas modifier</SelectItem>
                  <SelectItem value="active">
                    <Badge variant="default">Actif</Badge>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <Badge variant="secondary">Inactif</Badge>
                  </SelectItem>
                  <SelectItem value="draft">
                    <Badge variant="outline">Brouillon</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {hasChanges ? (
                <span className="text-foreground font-medium">
                  {selectedProducts.length} produit(s) sera modifié(s)
                </span>
              ) : (
                'Aucune modification'
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !hasChanges}
              >
                {isSubmitting ? 'Application...' : 'Appliquer les modifications'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
