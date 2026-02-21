import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UnifiedProduct } from '@/services/ProductsUnifiedService'
import { Check, X } from 'lucide-react'

interface QuickEditPanelProps {
  product: UnifiedProduct
  onSave: (updates: Partial<UnifiedProduct>) => Promise<void>
  onCancel: () => void
}

export function QuickEditPanel({ product, onSave, onCancel }: QuickEditPanelProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    price: product.price,
    stock_quantity: product.stock_quantity || 0,
    status: product.status
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(formData)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <Card className="p-4 border-primary/50 shadow-lg">
      <div className="space-y-3" onKeyDown={handleKeyDown}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">Édition rapide</h4>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="quick-name" className="text-xs">Nom</Label>
            <Input
              id="quick-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="h-8"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="quick-price" className="text-xs">Prix (€)</Label>
            <Input
              id="quick-price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              className="h-8"
            />
          </div>

          <div>
            <Label htmlFor="quick-stock" className="text-xs">Stock</Label>
            <Input
              id="quick-stock"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
              className="h-8"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="quick-status" className="text-xs">Statut</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'active' | 'paused' | 'draft' | 'archived') => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          <kbd className="px-1 py-0.5 rounded bg-muted">Ctrl</kbd> + <kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> pour sauvegarder • 
          <kbd className="px-1 py-0.5 rounded bg-muted ml-1">Esc</kbd> pour annuler
        </p>
      </div>
    </Card>
  )
}
