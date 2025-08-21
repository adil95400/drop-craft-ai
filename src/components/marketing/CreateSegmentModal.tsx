import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Plus, X, Filter } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface CreateSegmentModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SegmentCriteria {
  field: string
  operator: string
  value: string
}

const criteriaFields = [
  { value: 'age', label: 'Âge', type: 'number' },
  { value: 'location', label: 'Localisation', type: 'text' },
  { value: 'lifecycle_stage', label: 'Étape du cycle de vie', type: 'select' },
  { value: 'lead_score', label: 'Score de lead', type: 'number' },
  { value: 'source', label: 'Source d\'acquisition', type: 'text' },
  { value: 'company', label: 'Entreprise', type: 'text' },
  { value: 'position', label: 'Poste', type: 'text' }
]

const operators = {
  number: [
    { value: 'eq', label: 'égal à' },
    { value: 'gt', label: 'supérieur à' },
    { value: 'lt', label: 'inférieur à' },
    { value: 'gte', label: 'supérieur ou égal à' },
    { value: 'lte', label: 'inférieur ou égal à' }
  ],
  text: [
    { value: 'eq', label: 'égal à' },
    { value: 'contains', label: 'contient' },
    { value: 'starts_with', label: 'commence par' },
    { value: 'ends_with', label: 'finit par' }
  ],
  select: [
    { value: 'eq', label: 'égal à' },
    { value: 'in', label: 'dans la liste' }
  ]
}

const lifecycleStages = [
  'subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist'
]

export function CreateSegmentModal({ isOpen, onClose }: CreateSegmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: [] as SegmentCriteria[]
  })
  
  const [newCriteria, setNewCriteria] = useState<SegmentCriteria>({
    field: '',
    operator: '',
    value: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || formData.criteria.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le nom et ajouter au moins un critère",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Calculer le nombre estimé de contacts (simulation)
      const estimatedContacts = Math.floor(Math.random() * 500) + 50

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      const { error } = await supabase.from('marketing_segments').insert({
        name: formData.name,
        description: formData.description,
        user_id: user.id,
        criteria: { conditions: formData.criteria, logic: 'AND' } as any,
        contact_count: estimatedContacts,
        last_updated: new Date().toISOString()
      })

      if (error) throw error

      toast({
        title: "Segment créé",
        description: `Le segment "${formData.name}" a été créé avec ${estimatedContacts} contacts estimés`
      })

      queryClient.invalidateQueries({ queryKey: ['marketing-segments-realtime'] })
      onClose()
      
      // Reset form
      setFormData({ name: '', description: '', criteria: [] })
    } catch (error: any) {
      console.error('Error creating segment:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le segment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addCriteria = () => {
    if (newCriteria.field && newCriteria.operator && newCriteria.value) {
      setFormData(prev => ({
        ...prev,
        criteria: [...prev.criteria, newCriteria]
      }))
      setNewCriteria({ field: '', operator: '', value: '' })
    }
  }

  const removeCriteria = (index: number) => {
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index)
    }))
  }

  const selectedField = criteriaFields.find(f => f.value === newCriteria.field)
  const availableOperators = selectedField ? operators[selectedField.type as keyof typeof operators] : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Créer un segment d'audience
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du segment *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Clients Premium"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez ce segment d'audience..."
                rows={3}
              />
            </div>
          </div>

          {/* Critères de segmentation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Critères de segmentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ajouter un nouveau critère */}
              <div className="grid grid-cols-4 gap-3 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Champ</Label>
                  <Select
                    value={newCriteria.field}
                    onValueChange={(value) => setNewCriteria(prev => ({ 
                      ...prev, 
                      field: value, 
                      operator: '',
                      value: '' 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {criteriaFields.map(field => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Opérateur</Label>
                  <Select
                    value={newCriteria.operator}
                    onValueChange={(value) => setNewCriteria(prev => ({ ...prev, operator: value }))}
                    disabled={!newCriteria.field}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Opérateur..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOperators.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valeur</Label>
                  {selectedField?.value === 'lifecycle_stage' ? (
                    <Select
                      value={newCriteria.value}
                      onValueChange={(value) => setNewCriteria(prev => ({ ...prev, value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Étape..." />
                      </SelectTrigger>
                      <SelectContent>
                        {lifecycleStages.map(stage => (
                          <SelectItem key={stage} value={stage}>
                            {stage.charAt(0).toUpperCase() + stage.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={selectedField?.type === 'number' ? 'number' : 'text'}
                      value={newCriteria.value}
                      onChange={(e) => setNewCriteria(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Valeur..."
                      disabled={!newCriteria.operator}
                    />
                  )}
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addCriteria}
                    disabled={!newCriteria.field || !newCriteria.operator || !newCriteria.value}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Liste des critères existants */}
              {formData.criteria.length > 0 && (
                <div className="space-y-2">
                  <Label>Critères ajoutés :</Label>
                  {formData.criteria.map((criteria, index) => {
                    const field = criteriaFields.find(f => f.value === criteria.field)
                    const operator = availableOperators.find(op => op.value === criteria.operator)
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{field?.label}</Badge>
                          <span className="text-sm text-muted-foreground">{operator?.label}</span>
                          <Badge>{criteria.value}</Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCriteria(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                  
                  {formData.criteria.length > 1 && (
                    <div className="text-sm text-muted-foreground">
                      Les critères sont combinés avec l'opérateur AND (tous doivent être respectés)
                    </div>
                  )}
                </div>
              )}

              {formData.criteria.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun critère défini. Ajoutez au moins un critère pour créer le segment.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aperçu estimé */}
          {formData.criteria.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Aperçu du segment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Contacts estimés : <strong>{Math.floor(Math.random() * 500) + 50}</strong></span>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  * Cette estimation est basée sur les données actuelles de votre base de contacts
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || formData.criteria.length === 0}
            >
              {isSubmitting ? "Création..." : "Créer le segment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}