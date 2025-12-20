import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'
import { getPlatformMappings, type FieldMapping } from '@/lib/platform-field-mapper'
import { useToast } from '@/hooks/use-toast'

interface FieldMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: string
  onSave: (mappings: FieldMapping[]) => void
}

export function FieldMappingDialog({ open, onOpenChange, platform, onSave }: FieldMappingDialogProps) {
  const [customMappings, setCustomMappings] = useState<FieldMapping[]>([])
  const [standardMappings, setStandardMappings] = useState<FieldMapping[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadMappings()
    }
  }, [open, platform])

  const loadMappings = () => {
    // Charger les mappings standards
    const standard = getPlatformMappings(platform)
    setStandardMappings(standard)

    // Charger les mappings personnalisés depuis localStorage
    try {
      const stored = localStorage.getItem(`field_mappings_${platform}`)
      if (stored) {
        const custom: FieldMapping[] = JSON.parse(stored)
        setCustomMappings(custom)
      }
    } catch (error: any) {
      console.error('Error loading mappings:', error)
    }
  }

  const handleAddMapping = () => {
    setCustomMappings([
      ...customMappings,
      { sourceField: '', targetField: '', required: false }
    ])
  }

  const handleRemoveMapping = (index: number) => {
    setCustomMappings(customMappings.filter((_, i) => i !== index))
  }

  const handleUpdateMapping = (index: number, field: keyof FieldMapping, value: any) => {
    const updated = [...customMappings]
    updated[index] = { ...updated[index], [field]: value }
    setCustomMappings(updated)
  }

  const handleSave = async () => {
    try {
      const validMappings = customMappings.filter(m => m.sourceField && m.targetField)
      
      // Save to localStorage
      localStorage.setItem(`field_mappings_${platform}`, JSON.stringify(validMappings))

      toast({
        title: 'Succès',
        description: 'Mappings sauvegardés avec succès'
      })

      onSave(validMappings)
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Configuration des mappings - {platform}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Mappings standards */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Mappings standards</h3>
              <div className="space-y-2">
                {standardMappings.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <Badge variant="outline" className="min-w-[120px]">
                      {mapping.sourceField}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="secondary" className="min-w-[150px]">
                      {mapping.targetField}
                    </Badge>
                    {mapping.required && (
                      <Badge variant="destructive" className="ml-auto">Requis</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mappings personnalisés */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Mappings personnalisés</h3>
                <Button size="sm" variant="outline" onClick={handleAddMapping}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-3">
                {customMappings.map((mapping, index) => (
                  <div key={index} className="flex items-end gap-2 p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Champ source</Label>
                          <Input
                            value={mapping.sourceField}
                            onChange={(e) => handleUpdateMapping(index, 'sourceField', e.target.value)}
                            placeholder="ex: custom_field"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Champ cible</Label>
                          <Input
                            value={mapping.targetField}
                            onChange={(e) => handleUpdateMapping(index, 'targetField', e.target.value)}
                            placeholder="ex: platform_field"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Valeur par défaut</Label>
                          <Input
                            value={mapping.defaultValue || ''}
                            onChange={(e) => handleUpdateMapping(index, 'defaultValue', e.target.value)}
                            placeholder="Optionnel"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Requis</Label>
                          <Select
                            value={mapping.required ? 'true' : 'false'}
                            onValueChange={(v) => handleUpdateMapping(index, 'required', v === 'true')}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="false">Non</SelectItem>
                              <SelectItem value="true">Oui</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveMapping(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {customMappings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucun mapping personnalisé. Cliquez sur "Ajouter" pour en créer.
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}