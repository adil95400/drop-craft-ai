import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { TrendingUp, TrendingDown, Percent, DollarSign, Loader2 } from 'lucide-react'

interface BulkPriceUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  onConfirm: (type: 'increase' | 'decrease' | 'set', value: number) => Promise<void> | void
}

export function BulkPriceUpdateDialog({ open, onOpenChange, count, onConfirm }: BulkPriceUpdateDialogProps) {
  const [updateType, setUpdateType] = useState<'percentage' | 'fixed'>('percentage')
  const [operation, setOperation] = useState<'increase' | 'decrease' | 'set'>('increase')
  const [value, setValue] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) return
    
    setIsLoading(true)
    try {
      await onConfirm(operation, numValue)
      onOpenChange(false)
      setValue('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mise à jour des prix en masse</DialogTitle>
          <DialogDescription>
            Modifier les prix de {count} produit{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Type d'opération</Label>
            <RadioGroup value={operation} onValueChange={(v) => setOperation(v as any)}>
              <div 
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setOperation('increase')}
              >
                <RadioGroupItem value="increase" id="increase" />
                <Label htmlFor="increase" className="flex items-center gap-2 cursor-pointer flex-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Augmenter les prix
                </Label>
              </div>
              <div 
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setOperation('decrease')}
              >
                <RadioGroupItem value="decrease" id="decrease" />
                <Label htmlFor="decrease" className="flex items-center gap-2 cursor-pointer flex-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Diminuer les prix
                </Label>
              </div>
              <div 
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setOperation('set')}
              >
                <RadioGroupItem value="set" id="set" />
                <Label htmlFor="set" className="flex items-center gap-2 cursor-pointer flex-1">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  Définir un prix fixe
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Type de modification</Label>
            <Select value={updateType} onValueChange={(v) => setUpdateType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Pourcentage (%)
                  </div>
                </SelectItem>
                <SelectItem value="fixed">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Montant fixe (€)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">
              {operation === 'set' 
                ? 'Nouveau prix (€)' 
                : updateType === 'percentage' 
                  ? 'Pourcentage (%)' 
                  : 'Montant (€)'}
            </Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={operation === 'set' ? '29.99' : updateType === 'percentage' ? '10' : '5.00'}
            />
          </div>

          {value && parseFloat(value) > 0 && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Aperçu de la modification :</p>
              <p className="text-muted-foreground">
                {operation === 'set' 
                  ? `Tous les prix seront fixés à ${parseFloat(value).toFixed(2)}€`
                  : operation === 'increase'
                    ? updateType === 'percentage'
                      ? `Les prix seront augmentés de ${value}%`
                      : `Les prix seront augmentés de ${parseFloat(value).toFixed(2)}€`
                    : updateType === 'percentage'
                      ? `Les prix seront réduits de ${value}%`
                      : `Les prix seront réduits de ${parseFloat(value).toFixed(2)}€`
                }
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="sm:w-auto w-full"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!value || parseFloat(value) <= 0 || isLoading}
            className="sm:w-auto w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour...
              </>
            ) : (
              `Mettre à jour ${count} produit${count > 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
