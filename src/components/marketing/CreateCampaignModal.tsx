import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Mail, Target, Share2, MessageSquare, X, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { logError } from '@/utils/consoleCleanup'

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
    target_audience: {
      age_min: '',
      age_max: '',
      interests: [] as string[],
      locations: [] as string[]
    },
    content: {
      subject: '',
      message: '',
      cta_text: '',
      cta_url: ''
    }
  })
  
  const [newInterest, setNewInterest] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.type) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      const { error } = await supabase.from('marketing_campaigns').insert({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        status: 'draft',
        budget_total: formData.budget_total ? parseFloat(formData.budget_total) : null,
        budget_spent: 0,
        user_id: user.id,
        scheduled_at: formData.scheduled_date?.toISOString(),
        target_audience: formData.target_audience as any,
        content: formData.content as any,
        settings: {} as any,
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          roas: 0,
          conversion_rate: 0
        } as any
      })

      if (error) throw error

      toast({
        title: "Campagne créée",
        description: "Votre campagne a été créée avec succès"
      })

      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-realtime'] })
      onClose()
    } catch (error: any) {
      logError(error, 'Campaign creation');
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la campagne",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addInterest = () => {
    if (newInterest && !formData.target_audience.interests.includes(newInterest)) {
      setFormData(prev => ({
        ...prev,
        target_audience: {
          ...prev.target_audience,
          interests: [...prev.target_audience.interests, newInterest]
        }
      }))
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      target_audience: {
        ...prev.target_audience,
        interests: prev.target_audience.interests.filter(i => i !== interest)
      }
    }))
  }

  const addLocation = () => {
    if (newLocation && !formData.target_audience.locations.includes(newLocation)) {
      setFormData(prev => ({
        ...prev,
        target_audience: {
          ...prev.target_audience,
          locations: [...prev.target_audience.locations, newLocation]
        }
      }))
      setNewLocation('')
    }
  }

  const removeLocation = (location: string) => {
    setFormData(prev => ({
      ...prev,
      target_audience: {
        ...prev.target_audience,
        locations: prev.target_audience.locations.filter(l => l !== location)
      }
    }))
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
          {/* Type de campagne */}
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

          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la campagne *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ma super campagne"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget total (€)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget_total}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_total: e.target.value }))}
                placeholder="1000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre campagne..."
              rows={3}
            />
          </div>

          {/* Planification */}
          <div className="space-y-2">
            <Label>Date de lancement</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.scheduled_date ? (
                    format(formData.scheduled_date, "PPP", { locale: fr })
                  ) : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.scheduled_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, scheduled_date: date }))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Audience cible */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-medium">Audience cible</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Âge minimum</Label>
                <Input
                  type="number"
                  value={formData.target_audience.age_min}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    target_audience: { ...prev.target_audience, age_min: e.target.value }
                  }))}
                  placeholder="18"
                />
              </div>
              <div className="space-y-2">
                <Label>Âge maximum</Label>
                <Input
                  type="number"
                  value={formData.target_audience.age_max}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    target_audience: { ...prev.target_audience, age_max: e.target.value }
                  }))}
                  placeholder="65"
                />
              </div>
            </div>

            {/* Intérêts */}
            <div className="space-y-2">
              <Label>Centres d'intérêt</Label>
              <div className="flex gap-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Ajouter un intérêt"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                />
                <Button type="button" variant="outline" size="icon" onClick={addInterest}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.target_audience.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {interest}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeInterest(interest)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Localisations */}
            <div className="space-y-2">
              <Label>Localisations</Label>
              <div className="flex gap-2">
                <Input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Ajouter une localisation"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                />
                <Button type="button" variant="outline" size="icon" onClick={addLocation}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.target_audience.locations.map((location, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {location}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeLocation(location)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Contenu (pour email et SMS) */}
          {(formData.type === 'email' || formData.type === 'sms') && (
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">Contenu de la campagne</h3>
              
              {formData.type === 'email' && (
                <div className="space-y-2">
                  <Label>Sujet de l'email</Label>
                  <Input
                    value={formData.content.subject}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      content: { ...prev.content, subject: e.target.value }
                    }))}
                    placeholder="Sujet accrocheur..."
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={formData.content.message}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, message: e.target.value }
                  }))}
                  placeholder="Rédigez votre message..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Texte du bouton d'action</Label>
                  <Input
                    value={formData.content.cta_text}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      content: { ...prev.content, cta_text: e.target.value }
                    }))}
                    placeholder="Découvrir maintenant"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL du bouton</Label>
                  <Input
                    value={formData.content.cta_url}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      content: { ...prev.content, cta_url: e.target.value }
                    }))}
                    placeholder="https://monsite.fr/offre"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer la campagne"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}