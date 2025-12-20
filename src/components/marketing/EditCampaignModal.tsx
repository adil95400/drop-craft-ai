import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Save, X } from 'lucide-react'
import { MarketingCampaign } from '@/hooks/useRealTimeMarketing'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface EditCampaignModalProps {
  campaign: MarketingCampaign | null
  isOpen: boolean
  onClose: () => void
}

export function EditCampaignModal({ campaign, isOpen, onClose }: EditCampaignModalProps) {
  const [formData, setFormData] = useState({ name: '', description: '', type: 'email', status: 'draft', budget_total: 0 })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (campaign) {
      setFormData({ name: campaign.name, description: campaign.description || '', type: campaign.type, status: campaign.status, budget_total: campaign.budget_total || 0 })
    }
  }, [campaign])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    toast({ title: "Campagne mise à jour", description: "Les modifications ont été enregistrées" })
    queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-realtime'] })
    onClose()
  }

  if (!campaign) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Modifier la Campagne<Badge variant="outline">{campaign.type}</Badge></DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nom</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div><Label>Type</Label><Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="email">Email</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="social">Social</SelectItem><SelectItem value="ads">Ads</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
          <div className="flex gap-3"><Button type="button" variant="outline" onClick={onClose} className="flex-1"><X className="h-4 w-4 mr-2" />Annuler</Button><Button type="submit" className="flex-1"><Save className="h-4 w-4 mr-2" />Enregistrer</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
