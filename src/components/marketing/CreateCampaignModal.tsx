import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Mail, Target, Share2, MessageSquare, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMarketingCampaigns } from '@/hooks/useMarketingCampaigns'
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
    type: initialType || 'email',
    budget: '',
    scheduled_date: undefined as Date | undefined
  })
  
  const { createCampaign, isCreating } = useMarketingCampaigns()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.type) return

    createCampaign({
      name: formData.name,
      type: formData.type,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      start_date: formData.scheduled_date?.toISOString() || undefined,
      status: 'draft'
    }, {
      onSuccess: () => {
        onClose()
        setFormData({ name: '', type: initialType || 'email', budget: '', scheduled_date: undefined })
      }
    })
  }

  const selectedType = campaignTypes.find(t => t.value === formData.type)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <div 
                  key={type.value} 
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-colors", 
                    formData.type === type.value 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )} 
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                >
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
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                placeholder="Ma campagne marketing" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget total (€)</Label>
              <Input 
                id="budget" 
                type="number" 
                value={formData.budget} 
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))} 
                placeholder="1000" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date de lancement</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.scheduled_date 
                    ? format(formData.scheduled_date, 'PPP', { locale: fr }) 
                    : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.scheduled_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, scheduled_date: date }))}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isCreating || !formData.name || !formData.type}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreating ? "Création..." : "Créer la campagne"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
