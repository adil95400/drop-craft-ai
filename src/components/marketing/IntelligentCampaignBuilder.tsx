import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Wand2, Target, Mail, MessageSquare, Bot, Send, Zap } from 'lucide-react'
import { useUnifiedMarketing } from '@/hooks/useUnifiedMarketing'

export function IntelligentCampaignBuilder() {
  const { createCampaign, isCreatingCampaign, segments } = useUnifiedMarketing()
  const [step, setStep] = useState(1)
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    type: '',
    budget: ''
  })

  const campaignTypes = [
    { value: 'email', label: 'Email Marketing', icon: Mail },
    { value: 'sms', label: 'SMS Marketing', icon: MessageSquare },
    { value: 'ads', label: 'Publicités', icon: Target }
  ]

  const handleCreateCampaign = async () => {
    try {
      await createCampaign({
        name: campaignData.name,
        description: campaignData.description,
        type: campaignData.type as any,
        status: 'draft',
        budget_total: parseFloat(campaignData.budget) || 0
      })
      
      setCampaignData({ name: '', description: '', type: '', budget: '' })
      setStep(1)
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            Créateur de Campagne IA
          </h2>
          <p className="text-muted-foreground">Créez des campagnes optimisées avec l'IA</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <Progress value={step / 3 * 100} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Informations</span>
            <span>Configuration</span>
            <span>Validation</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Informations de Base"}
            {step === 2 && "Configuration"}
            {step === 3 && "Validation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <Label>Nom de la campagne</Label>
                <Input
                  placeholder="Ex: Promotion Black Friday 2024"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Décrivez votre campagne..."
                  value={campaignData.description}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label>Type de campagne</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {campaignTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-4 border rounded-lg cursor-pointer ${
                        campaignData.type === type.value ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setCampaignData(prev => ({ ...prev, type: type.value }))}
                    >
                      <type.icon className="h-5 w-5 text-primary mb-2" />
                      <div className="font-medium text-sm">{type.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label>Budget (€)</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={campaignData.budget}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, budget: e.target.value }))}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Récapitulatif</h4>
                <div className="space-y-1 text-sm">
                  <div>Nom: {campaignData.name}</div>
                  <div>Type: {campaignData.type}</div>
                  <div>Budget: €{campaignData.budget}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
              Précédent
            </Button>
            
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>Suivant</Button>
            ) : (
              <Button onClick={handleCreateCampaign} disabled={isCreatingCampaign} className="gap-2">
                {isCreatingCampaign ? <Zap className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Créer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}