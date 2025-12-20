import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Save, Eye } from 'lucide-react'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { useToast } from '@/hooks/use-toast'

export function EmailCampaignBuilder() {
  const { segments } = useRealTimeMarketing()
  const [campaignData, setCampaignData] = useState({ name: '', subject: '', content: '' })
  const { toast } = useToast()

  const handleSaveCampaign = async () => {
    if (!campaignData.name.trim() || !campaignData.subject.trim()) {
      toast({ title: "Erreur", description: "Veuillez remplir le nom et l'objet de la campagne", variant: "destructive" })
      return
    }
    toast({ title: "Campagne créée", description: "La campagne email a été enregistrée" })
    setCampaignData({ name: '', subject: '', content: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Générateur de Campagne Email</h2>
          <p className="text-muted-foreground">Créez des campagnes email personnalisées</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Eye className="h-4 w-4" />Prévisualiser</Button>
          <Button onClick={handleSaveCampaign} className="gap-2"><Save className="h-4 w-4" />Sauvegarder</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Contenu de la campagne</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Nom de la campagne</Label><Input placeholder="Ex: Newsletter hebdomadaire" value={campaignData.name} onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })} /></div>
          <div><Label>Objet de l'email</Label><Input placeholder="Sujet accrocheur" value={campaignData.subject} onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })} /></div>
          <div><Label>Contenu</Label><Textarea placeholder="Contenu de votre email..." value={campaignData.content} onChange={(e) => setCampaignData({ ...campaignData, content: e.target.value })} rows={10} /></div>
        </CardContent>
      </Card>
    </div>
  )
}
