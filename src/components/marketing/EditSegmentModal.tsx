import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Save, X, Users } from 'lucide-react'
import { MarketingSegment } from '@/hooks/useRealTimeMarketing'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface EditSegmentModalProps {
  segment: MarketingSegment | null
  isOpen: boolean
  onClose: () => void
}

export function EditSegmentModal({ segment, isOpen, onClose }: EditSegmentModalProps) {
  const [formData, setFormData] = useState({ name: '', description: '' })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (segment) {
      setFormData({ name: segment.name, description: segment.description || '' })
    }
  }, [segment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    toast({ title: "Segment mis à jour", description: "Les modifications ont été enregistrées" })
    queryClient.invalidateQueries({ queryKey: ['marketing-segments-realtime'] })
    onClose()
  }

  if (!segment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Modifier le Segment<Badge variant="secondary">{segment.contact_count} contacts</Badge></DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Nom</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
          <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
          <div className="flex gap-3"><Button type="button" variant="outline" onClick={onClose} className="flex-1"><X className="h-4 w-4 mr-2" />Annuler</Button><Button type="submit" className="flex-1"><Save className="h-4 w-4 mr-2" />Enregistrer</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
