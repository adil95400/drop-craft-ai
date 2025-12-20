import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Save, X } from 'lucide-react'
import { CRMContact } from '@/hooks/useRealTimeMarketing'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface EditContactModalProps {
  contact: CRMContact | null
  isOpen: boolean
  onClose: () => void
}

export function EditContactModal({ contact, isOpen, onClose }: EditContactModalProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', lifecycle_stage: 'subscriber', lead_score: 50 })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (contact) {
      setFormData({ name: contact.name, email: contact.email, phone: contact.phone || '', company: contact.company || '', lifecycle_stage: contact.lifecycle_stage, lead_score: contact.lead_score })
    }
  }, [contact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    toast({ title: "Contact mis à jour", description: "Les modifications ont été enregistrées" })
    queryClient.invalidateQueries({ queryKey: ['crm-contacts-realtime'] })
    onClose()
  }

  if (!contact) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Modifier le Contact<Badge variant="secondary">{formData.lifecycle_stage}</Badge></DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nom *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
          </div>
          <div><Label>Étape</Label><Select value={formData.lifecycle_stage} onValueChange={(v) => setFormData({ ...formData, lifecycle_stage: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="subscriber">Abonné</SelectItem><SelectItem value="lead">Lead</SelectItem><SelectItem value="customer">Client</SelectItem></SelectContent></Select></div>
          <div className="flex gap-3"><Button type="button" variant="outline" onClick={onClose} className="flex-1"><X className="h-4 w-4 mr-2" />Annuler</Button><Button type="submit" className="flex-1"><Save className="h-4 w-4 mr-2" />Enregistrer</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
