import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Building, Tag, Plus, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from "sonner";
import { logError } from "@/utils/consoleCleanup";

interface CreateContactModalProps {
  isOpen: boolean
  onClose: () => void
}

const lifecycleStages = [
  { value: 'subscriber', label: 'Abonné' },
  { value: 'lead', label: 'Lead' },
  { value: 'mql', label: 'MQL (Marketing Qualified Lead)' },
  { value: 'sql', label: 'SQL (Sales Qualified Lead)' },
  { value: 'opportunity', label: 'Opportunité' },
  { value: 'customer', label: 'Client' },
  { value: 'evangelist', label: 'Ambassadeur' }
]

const leadSources = [
  'website', 'social_media', 'email_marketing', 'referral', 
  'paid_ads', 'content_marketing', 'webinar', 'event', 'direct'
]

export function CreateContactModal({ isOpen, onClose }: CreateContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    lifecycle_stage: 'subscriber',
    source: '',
    tags: [] as string[],
    custom_fields: {},
    notes: ''
  })
  
  const [newTag, setNewTag] = useState('')
  const [customFields, setCustomFields] = useState<Array<{key: string, value: string}>>([])
  const [newCustomField, setNewCustomField] = useState({ key: '', value: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le nom et l'email",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Convert custom fields array to object
      const customFieldsObj = customFields.reduce((acc, field) => {
        if (field.key && field.value) {
          acc[field.key] = field.value
        }
        return acc
      }, {} as Record<string, string>)

      const leadScore = Math.floor(Math.random() * 100)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      const { error } = await supabase.from('crm_contacts').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        position: formData.position || null,
        status: 'active',
        lifecycle_stage: formData.lifecycle_stage,
        lead_score: leadScore,
        source: formData.source || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        custom_fields: Object.keys(customFieldsObj).length > 0 ? customFieldsObj : null,
        user_id: user.id,
        attribution: {
          notes: formData.notes,
          created_via: 'manual_entry',
          lead_score: leadScore
        } as any
      })

      if (error) throw error

      toast({
        title: "Contact créé",
        description: `Le contact "${formData.name}" a été ajouté avec succès`
      })

      queryClient.invalidateQueries({ queryKey: ['crm-contacts-realtime'] })
      onClose()
      
      // Reset form
      setFormData({
        name: '', email: '', phone: '', company: '', position: '',
        lifecycle_stage: 'subscriber', source: '', tags: [], custom_fields: {}, notes: ''
      })
      setCustomFields([])
    } catch (error: any) {
      logError(error as Error, 'Error creating contact')
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le contact",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addCustomField = () => {
    if (newCustomField.key && newCustomField.value) {
      setCustomFields(prev => [...prev, newCustomField])
      setNewCustomField({ key: '', value: '' })
    }
  }

  const removeCustomField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Ajouter un nouveau contact
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="jean.dupont@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informations professionnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informations professionnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Entreprise</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Mon Entreprise SA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Poste</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Directeur Marketing"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Qualification et suivi */}
          <Card>
            <CardHeader>
              <CardTitle>Qualification et suivi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Étape du cycle de vie</Label>
                  <Select
                    value={formData.lifecycle_stage}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, lifecycle_stage: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lifecycleStages.map(stage => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source d'acquisition</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une source..." />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSources.map(source => (
                        <SelectItem key={source} value={source}>
                          {source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ajouter un tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Champs personnalisés */}
          <Card>
            <CardHeader>
              <CardTitle>Champs personnalisés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ajouter un champ personnalisé */}
              <div className="grid grid-cols-3 gap-3 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Nom du champ</Label>
                  <Input
                    value={newCustomField.key}
                    onChange={(e) => setNewCustomField(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="Budget annuel"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valeur</Label>
                  <Input
                    value={newCustomField.value}
                    onChange={(e) => setNewCustomField(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="50000€"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addCustomField}
                    disabled={!newCustomField.key || !newCustomField.value}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Liste des champs personnalisés */}
              {customFields.length > 0 && (
                <div className="space-y-2">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{field.key}</Badge>
                        <span>{field.value}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomField(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Informations complémentaires sur ce contact..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer le contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}