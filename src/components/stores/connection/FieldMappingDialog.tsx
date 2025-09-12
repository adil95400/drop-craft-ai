import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface FieldMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: string
  onSave: (mappings: any[]) => void
}

export function FieldMappingDialog({ open, onOpenChange, platform, onSave }: FieldMappingDialogProps) {
  const handleSave = () => {
    onSave([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuration des mappings - {platform}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            La configuration des mappings sera bientôt disponible
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}