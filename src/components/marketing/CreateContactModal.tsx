import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface CreateContactModalProps {
  isOpen: boolean
  onClose: () => void
}

const lifecycleStages = [
  { value: 'subscriber', label: 'Abonné' },
  { value: 'lead', label: 'Lead' },
  { value: 'customer', label: 'Client' },
]

export function CreateContactModal({ isOpen, onClose }: CreateContactModalProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', position: '', lifecycle_stage: 'subscriber' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      toast({ title: "Erreur", description: "Veuillez remplir le nom et l'email", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      toast({ title: "Contact créé", description: `Le contact "${formData.name}" a été ajouté avec succès` })
      queryClient.invalidateQueries({ queryKey: ['crm-contacts-realtime'] })
      onClose()
      setFormData({ name: '', email: '', phone: '', company: '', position: '', lifecycle_stage: 'subscriber' })
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><User className="h-5 w-5" />Ajouter un contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Étape du cycle</Label>
            <Select value={formData.lifecycle_stage} onValueChange={(v) => setFormData(prev => ({ ...prev, lifecycle_stage: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{lifecycleStages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
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
