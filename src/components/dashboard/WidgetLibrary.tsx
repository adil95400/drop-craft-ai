import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'

interface WidgetLibraryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WidgetLibrary({ open, onOpenChange }: WidgetLibraryProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bibliothèque de widgets
          </DialogTitle>
        </DialogHeader>
        <div className="py-8 text-center text-muted-foreground">
          <p>La bibliothèque de widgets sera disponible prochainement.</p>
          <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
