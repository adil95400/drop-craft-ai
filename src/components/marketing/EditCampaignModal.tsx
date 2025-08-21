import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon, Save, X } from 'lucide-react'
import { MarketingCampaign } from '@/hooks/useRealTimeMarketing'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface EditCampaignModalProps {
  campaign: MarketingCampaign | null
  isOpen: boolean
  onClose: () => void
}

export function EditCampaignModal({ campaign, isOpen, onClose }: EditCampaignModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'email',
    status: 'draft',
    budget_total: 0,
    scheduled_at: null as Date | null,
    target_audience: {},
    content: {},
    settings: {}
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description || '',
        type: campaign.type,
        status: campaign.status,
        budget_total: campaign.budget_total || 0,
        scheduled_at: campaign.scheduled_at ? new Date(campaign.scheduled_at) : null,
        target_audience: campaign.target_audience || {},
        content: campaign.content || {},
        settings: campaign.settings || {}
      })
    }
  }, [campaign])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaign) return

    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          status: formData.status,
          budget_total: formData.budget_total,
          scheduled_at: formData.scheduled_at?.toISOString(),
          target_audience: formData.target_audience,
          content: formData.content,
          settings: formData.settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign.id)

      if (error) throw error

      toast({
        title: "Campagne mise à jour",
        description: "Les modifications ont été enregistrées avec succès"
      })

      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns-realtime'] })
      onClose()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la campagne",
        variant: "destructive"
      })
    }
  }

  if (!campaign) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Modifier la Campagne
            <Badge variant="outline">{campaign.type}</Badge>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Nom de la campagne</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom de la campagne..."
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-type">Type de campagne</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Marketing</SelectItem>
                  <SelectItem value="sms">SMS Marketing</SelectItem>
                  <SelectItem value="social">Réseaux Sociaux</SelectItem>
                  <SelectItem value="ads">Publicités Payantes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez l'objectif de cette campagne..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-status">Statut</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">En pause</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-budget">Budget total (€)</Label>
              <Input
                id="edit-budget"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget_total}
                onChange={(e) => setFormData({ ...formData, budget_total: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label>Date de programmation (optionnel)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.scheduled_at && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.scheduled_at ? (
                    format(formData.scheduled_at, "PPP", { locale: fr })
                  ) : (
                    "Sélectionner une date"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.scheduled_at || undefined}
                  onSelect={(date) => setFormData({ ...formData, scheduled_at: date || null })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium">Paramètres Avancés</h3>
            
            <div>
              <Label htmlFor="edit-target-audience">Audience Cible (JSON)</Label>
              <Textarea
                id="edit-target-audience"
                value={JSON.stringify(formData.target_audience, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    setFormData({ ...formData, target_audience: parsed })
                  } catch {}
                }}
                placeholder='{"age_range": "25-45", "interests": ["tech", "business"]}'
                rows={3}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="edit-content">Contenu de la Campagne (JSON)</Label>
              <Textarea
                id="edit-content"
                value={JSON.stringify(formData.content, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    setFormData({ ...formData, content: parsed })
                  } catch {}
                }}
                placeholder='{"subject": "Nouvelle offre", "template": "newsletter"}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les Modifications
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}