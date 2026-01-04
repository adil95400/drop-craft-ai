import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useReturns, ReturnItem } from '@/hooks/useReturns'

interface CreateReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId?: string
}

export function CreateReturnDialog({ open, onOpenChange, orderId }: CreateReturnDialogProps) {
  const { createReturn, isCreating } = useReturns()
  
  const [formData, setFormData] = useState({
    reason: '',
    reason_category: '' as 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'damaged_shipping' | 'other' | '',
    description: '',
    refund_method: '' as 'original_payment' | 'store_credit' | 'exchange' | '',
    refund_amount: '',
    items: [] as ReturnItem[]
  })

  const [newItem, setNewItem] = useState({
    product_name: '',
    quantity: 1,
    price: 0
  })

  const handleAddItem = () => {
    if (!newItem.product_name) return
    
    setFormData({
      ...formData,
      items: [...formData.items, {
        product_id: `prod_${Date.now()}`,
        product_name: newItem.product_name,
        quantity: newItem.quantity,
        price: newItem.price
      }]
    })
    setNewItem({ product_name: '', quantity: 1, price: 0 })
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.reason || !formData.reason_category || formData.items.length === 0) {
      return
    }

    createReturn({
      order_id: orderId,
      reason: formData.reason,
      reason_category: formData.reason_category || undefined,
      description: formData.description || undefined,
      refund_method: formData.refund_method || undefined,
      refund_amount: formData.refund_amount ? parseFloat(formData.refund_amount) : undefined,
      items: formData.items,
      status: 'pending'
    }, {
      onSuccess: () => {
        onOpenChange(false)
        setFormData({
          reason: '',
          reason_category: '',
          description: '',
          refund_method: '',
          refund_amount: '',
          items: []
        })
      }
    })
  }

  const totalRefund = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une demande de retour</DialogTitle>
          <DialogDescription>
            Enregistrez une nouvelle demande de retour client
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reason_category">Catégorie de retour *</Label>
              <Select 
                value={formData.reason_category} 
                onValueChange={(v) => setFormData({ ...formData, reason_category: v as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defective">Produit défectueux</SelectItem>
                  <SelectItem value="wrong_item">Mauvais article envoyé</SelectItem>
                  <SelectItem value="not_as_described">Non conforme à la description</SelectItem>
                  <SelectItem value="changed_mind">Changement d'avis</SelectItem>
                  <SelectItem value="damaged_shipping">Endommagé à la livraison</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund_method">Méthode de remboursement</Label>
              <Select 
                value={formData.refund_method} 
                onValueChange={(v) => setFormData({ ...formData, refund_method: v as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original_payment">Moyen de paiement original</SelectItem>
                  <SelectItem value="store_credit">Avoir boutique</SelectItem>
                  <SelectItem value="exchange">Échange</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Raison détaillée *</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Décrivez brièvement la raison du retour"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description complémentaire</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Informations supplémentaires..."
              rows={3}
            />
          </div>

          {/* Items */}
          <div className="space-y-4">
            <Label>Articles à retourner *</Label>
            
            {formData.items.length > 0 && (
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{item.product_name}</span>
                      <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-medium">€{(item.price * item.quantity).toFixed(2)}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="text-right text-sm text-muted-foreground">
                  Total: <span className="font-semibold">€{totalRefund.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-12 gap-2 p-3 border rounded-lg border-dashed">
              <div className="col-span-5">
                <Input
                  placeholder="Nom du produit"
                  value={newItem.product_name}
                  onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Qté"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Prix unitaire"
                  value={newItem.price || ''}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleAddItem}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Refund Amount Override */}
          <div className="space-y-2">
            <Label htmlFor="refund_amount">Montant du remboursement (€)</Label>
            <Input
              id="refund_amount"
              type="number"
              step="0.01"
              value={formData.refund_amount}
              onChange={(e) => setFormData({ ...formData, refund_amount: e.target.value })}
              placeholder={totalRefund > 0 ? `Suggéré: ${totalRefund.toFixed(2)}` : 'Montant à rembourser'}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || !formData.reason || !formData.reason_category || formData.items.length === 0}
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer le retour
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
