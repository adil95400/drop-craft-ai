import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Mail, Target, Share2, MessageSquare, X, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface CreateCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  initialType?: string
}

const campaignTypes = [
  { value: 'email', label: 'Email Marketing', icon: Mail, description: 'Campagne emailing avec segmentation' },
  { value: 'social', label: 'Réseaux Sociaux', icon: Share2, description: 'Publication sur les réseaux sociaux' },
  { value: 'ads', label: 'Publicités', icon: Target, description: 'Campagnes Google Ads, Facebook Ads' },
  { value: 'sms', label: 'SMS Marketing', icon: MessageSquare, description: 'Campagne SMS ciblée' }
]

export function CreateCampaignModal({ isOpen, onClose, initialType }: CreateCampaignModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: initialType || '',
    budget_total: '',
    scheduled_date: undefined as Date | undefined,
    target_audience: { age_min: '', age_max: '', interests: [] as string[], locations: [] as string[] },
    content: { subject: '', message: '', cta_text: '', cta_url: '' }
  })
  
  const [newInterest, setNewInterest] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.type) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    // Simulate creation with mock data
    setTimeout(() => {
      toast({ title: "Campagne créée", description: "Votre campagne a été créée avec succès" })
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-realtime'] })
      onClose()
      setIsSubmitting(false)
    }, 500)
  }

  const addInterest = () => {
    if (newInterest && !formData.target_audience.interests.includes(newInterest)) {
      setFormData(prev => ({ ...prev, target_audience: { ...prev.target_audience, interests: [...prev.target_audience.interests, newInterest] } }))
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setFormData(prev => ({ ...prev, target_audience: { ...prev.target_audience, interests: prev.target_audience.interests.filter(i => i !== interest) } }))
  }

  const addLocation = () => {
    if (newLocation && !formData.target_audience.locations.includes(newLocation)) {
      setFormData(prev => ({ ...prev, target_audience: { ...prev.target_audience, locations: [...prev.target_audience.locations, newLocation] } }))
      setNewLocation('')
    }
  }

  const removeLocation = (location: string) => {
    setFormData(prev => ({ ...prev, target_audience: { ...prev.target_audience, locations: prev.target_audience.locations.filter(l => l !== location) } }))
  }

  const selectedType = campaignTypes.find(t => t.value === formData.type)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedType && <selectedType.icon className="h-5 w-5" />}
            Créer une nouvelle campagne
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Type de campagne *</Label>
            <div className="grid grid-cols-2 gap-3">
              {campaignTypes.map((type) => (
                <div key={type.value} className={cn("border rounded-lg p-4 cursor-pointer transition-colors", formData.type === type.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")} onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}>
                  <div className="flex items-center gap-3">
                    <type.icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la campagne *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Ma super campagne" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget total (€)</Label>
              <Input id="budget" type="number" value={formData.budget_total} onChange={(e) => setFormData(prev => ({ ...prev, budget_total: e.target.value }))} placeholder="1000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Décrivez votre campagne..." rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Création..." : "Créer la campagne"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
