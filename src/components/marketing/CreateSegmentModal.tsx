import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface CreateSegmentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateSegmentModal({ isOpen, onClose }: CreateSegmentModalProps) {
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast({ title: "Erreur", description: "Veuillez remplir le nom du segment", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      toast({ title: "Segment créé", description: `Le segment "${formData.name}" a été créé` })
      queryClient.invalidateQueries({ queryKey: ['marketing-segments-realtime'] })
      onClose()
      setFormData({ name: '', description: '' })
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Créer un segment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du segment *</Label>
            <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Création..." : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
