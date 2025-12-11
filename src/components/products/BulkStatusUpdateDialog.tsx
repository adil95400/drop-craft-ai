import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react'

interface BulkStatusUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  onConfirm: (status: 'active' | 'inactive' | 'draft') => Promise<void> | void
}

export function BulkStatusUpdateDialog({ open, onOpenChange, count, onConfirm }: BulkStatusUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | 'draft'>('active')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await onConfirm(selectedStatus)
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Changer le statut</DialogTitle>
          <DialogDescription>
            Modifier le statut de {count} produit{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Label>Nouveau statut</Label>
          <RadioGroup value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as any)}>
            <div 
              className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setSelectedStatus('active')}
            >
              <RadioGroupItem value="active" id="active" />
              <Label htmlFor="active" className="flex items-center gap-2 cursor-pointer flex-1">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium">Actif</div>
                  <div className="text-sm text-muted-foreground truncate">Produits visibles et disponibles à la vente</div>
                </div>
              </Label>
            </div>

            <div 
              className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setSelectedStatus('inactive')}
            >
              <RadioGroupItem value="inactive" id="inactive" />
              <Label htmlFor="inactive" className="flex items-center gap-2 cursor-pointer flex-1">
                <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium">Inactif</div>
                  <div className="text-sm text-muted-foreground truncate">Produits masqués et non disponibles</div>
                </div>
              </Label>
            </div>

            <div 
              className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setSelectedStatus('draft')}
            >
              <RadioGroupItem value="draft" id="draft" />
              <Label htmlFor="draft" className="flex items-center gap-2 cursor-pointer flex-1">
                <FileText className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium">Brouillon</div>
                  <div className="text-sm text-muted-foreground truncate">Produits en cours de préparation</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
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
            disabled={isLoading}
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
