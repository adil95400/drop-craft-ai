import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Save, X, Mail, Phone, Building, Star } from 'lucide-react'
import { CRMContact } from '@/hooks/useRealTimeMarketing'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface EditContactModalProps {
  contact: CRMContact | null
  isOpen: boolean
  onClose: () => void
}

export function EditContactModal({ contact, isOpen, onClose }: EditContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'active',
    lifecycle_stage: 'subscriber',
    lead_score: 50,
    source: '',
    tags: [] as string[],
    custom_fields: {}
  })

  const [tagInput, setTagInput] = useState('')

  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || '',
        company: contact.company || '',
        position: contact.position || '',
        status: contact.status,
        lifecycle_stage: contact.lifecycle_stage,
        lead_score: contact.lead_score,
        source: contact.source || '',
        tags: contact.tags || [],
        custom_fields: contact.custom_fields || {}
      })
    }
  }, [contact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact) return

    try {
      const { error } = await supabase
        .from('crm_contacts')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          position: formData.position || null,
          status: formData.status,
          lifecycle_stage: formData.lifecycle_stage,
          lead_score: formData.lead_score,
          source: formData.source || null,
          tags: formData.tags,
          custom_fields: formData.custom_fields,
          updated_at: new Date().toISOString()
        })
        .eq('id', contact.id)

      if (error) throw error

      toast({
        title: "Contact mis à jour",
        description: "Les modifications ont été enregistrées avec succès"
      })

      queryClient.invalidateQueries({ queryKey: ['crm-contacts-realtime'] })
      onClose()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le contact",
        variant: "destructive"
      })
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-gray-600'
  }

  if (!contact) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Modifier le Contact
            <Badge variant="secondary">{formData.lifecycle_stage.replace('_', ' ')}</Badge>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-contact-name">Nom complet *</Label>
              <Input
                id="edit-contact-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom et prénom..."
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-contact-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemple.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-contact-phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-contact-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 1 23 45 67 89"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-contact-source">Source</Label>
              <Select 
                value={formData.source} 
                onValueChange={(value) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune source</SelectItem>
                  <SelectItem value="website">Site web</SelectItem>
                  <SelectItem value="social_media">Réseaux sociaux</SelectItem>
                  <SelectItem value="referral">Recommandation</SelectItem>
                  <SelectItem value="paid_ads">Publicité payante</SelectItem>
                  <SelectItem value="email_marketing">Email marketing</SelectItem>
                  <SelectItem value="trade_show">Salon professionnel</SelectItem>
                  <SelectItem value="cold_outreach">Prospection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-contact-company">Entreprise</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-contact-company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Nom de l'entreprise"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-contact-position">Poste</Label>
              <Input
                id="edit-contact-position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Directeur Marketing, CEO..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-contact-status">Statut</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="qualified">Qualifié</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="unqualified">Non qualifié</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-contact-stage">Phase du Cycle de Vie</Label>
              <Select 
                value={formData.lifecycle_stage} 
                onValueChange={(value) => setFormData({ ...formData, lifecycle_stage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscriber">Abonné</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="marketing_qualified_lead">MQL</SelectItem>
                  <SelectItem value="sales_qualified_lead">SQL</SelectItem>
                  <SelectItem value="opportunity">Opportunité</SelectItem>
                  <SelectItem value="customer">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lead Score */}
          <div>
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Score de Lead: <span className={`font-medium ${getLeadScoreColor(formData.lead_score)}`}>{formData.lead_score}/100</span>
            </Label>
            <div className="px-3 py-4">
              <Slider
                value={[formData.lead_score]}
                onValueChange={(value) => setFormData({ ...formData, lead_score: value[0] })}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Faible (0-25)</span>
              <span>Moyen (26-60)</span>
              <span>Élevé (61-85)</span>
              <span>Excellent (86-100)</span>
            </div>
          </div>

          {/* Tags Management */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Ajouter un tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
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