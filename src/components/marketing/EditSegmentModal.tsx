import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Save, X, Users, Filter } from 'lucide-react'
import { MarketingSegment } from '@/hooks/useRealTimeMarketing'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface EditSegmentModalProps {
  segment: MarketingSegment | null
  isOpen: boolean
  onClose: () => void
}

export function EditSegmentModal({ segment, isOpen, onClose }: EditSegmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: {}
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (segment) {
      setFormData({
        name: segment.name,
        description: segment.description || '',
        criteria: segment.criteria || {}
      })
    }
  }, [segment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!segment) return

    try {
      const { error } = await supabase
        .from('marketing_segments')
        .update({
          name: formData.name,
          description: formData.description,
          criteria: formData.criteria,
          updated_at: new Date().toISOString()
        })
        .eq('id', segment.id)

      if (error) throw error

      toast({
        title: "Segment mis à jour",
        description: "Les modifications ont été enregistrées avec succès"
      })

      queryClient.invalidateQueries({ queryKey: ['marketing-segments-realtime'] })
      onClose()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le segment",
        variant: "destructive"
      })
    }
  }

  if (!segment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Modifier le Segment
            <Badge variant="secondary">{segment.contact_count} contacts</Badge>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="edit-segment-name">Nom du segment</Label>
            <Input
              id="edit-segment-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom du segment..."
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-segment-description">Description</Label>
            <Textarea
              id="edit-segment-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez ce segment d'audience..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="edit-segment-criteria" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Critères de Segmentation (JSON)
            </Label>
            <Textarea
              id="edit-segment-criteria"
              value={JSON.stringify(formData.criteria, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  setFormData({ ...formData, criteria: parsed })
                } catch {
                  // Ignore invalid JSON while typing
                }
              }}
              placeholder='{"age_min": 25, "location": "France", "interests": ["tech"]}'
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Définissez les critères de filtrage en format JSON pour cibler précisément votre audience
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Aperçu du Segment</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Contacts actuels:</span>
                <span className="ml-2 font-medium">{segment.contact_count.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Dernière mise à jour:</span>
                <span className="ml-2 font-medium">
                  {new Date(segment.updated_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Critères actifs:</span>
                <span className="ml-2 font-medium">{Object.keys(formData.criteria).length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Créé le:</span>
                <span className="ml-2 font-medium">
                  {new Date(segment.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
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