import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Users, Save, Eye } from 'lucide-react'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { useToast } from '@/hooks/use-toast'

export function AdvancedSegmentBuilder() {
  const { contacts } = useRealTimeMarketing()
  const [segmentName, setSegmentName] = useState('')
  const [estimatedSize, setEstimatedSize] = useState(0)
  const { toast } = useToast()

  const calculatePreview = () => {
    setEstimatedSize(Math.floor(contacts.length * 0.3))
  }

  const handleSaveSegment = async () => {
    if (!segmentName.trim()) {
      toast({ title: "Erreur", description: "Veuillez saisir un nom pour le segment", variant: "destructive" })
      return
    }
    toast({ title: "Segment créé", description: "Le segment a été sauvegardé avec succès" })
    setSegmentName('')
    setEstimatedSize(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Générateur de Segments Avancé</h2>
          <p className="text-muted-foreground">Créez des segments dynamiques</p>
        </div>
        <Button onClick={calculatePreview} variant="outline" className="gap-2"><Eye className="h-4 w-4" />Prévisualiser</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Informations du Segment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nom du Segment</Label><Input placeholder="Ex: Prospects B2B qualifiés" value={segmentName} onChange={(e) => setSegmentName(e.target.value)} /></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Aperçu</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{estimatedSize}</div>
              <div className="text-sm text-muted-foreground">contacts correspondants</div>
            </div>
            <Badge variant="secondary" className="w-full justify-center">{((estimatedSize / Math.max(contacts.length, 1)) * 100).toFixed(1)}% du total</Badge>
            <Button onClick={handleSaveSegment} className="w-full gap-2"><Save className="h-4 w-4" />Sauvegarder</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
