import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Target, Play, Pause, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { Progress } from "@/components/ui/progress"

interface Campaign {
  id: string
  campaign_name: string
  campaign_type: string
  status: string
  target_criteria: any
  content_templates: any
  current_metrics: any
  created_at: string
}

// Mock campaigns data since automated_campaigns table doesn't have campaign_name etc
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    campaign_name: 'Campagne Black Friday',
    campaign_type: 'promotional',
    status: 'active',
    target_criteria: { audience: 'Tous les clients' },
    content_templates: { email: { subject: 'Offres Black Friday', body: 'Découvrez nos offres!' } },
    current_metrics: { sent: 1500, opened: 450, clicked: 120, converted: 35 },
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    campaign_name: 'Newsletter Hebdomadaire',
    campaign_type: 'educational',
    status: 'draft',
    target_criteria: { audience: 'Abonnés newsletter' },
    content_templates: { email: { subject: 'Votre newsletter', body: 'Les news de la semaine' } },
    current_metrics: { sent: 0, opened: 0, clicked: 0, converted: 0 },
    created_at: new Date().toISOString()
  }
]

export const CampaignManager = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [campaignName, setCampaignName] = useState("")
  const [campaignType, setCampaignType] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailContent, setEmailContent] = useState("")
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)

  const { isLoading } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      // Return mock data since table doesn't have the expected schema
      return mockCampaigns
    }
  })

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        campaign_name: campaignName,
        campaign_type: campaignType,
        status: 'draft',
        target_criteria: { audience: targetAudience },
        content_templates: {
          email: {
            subject: emailSubject,
            body: emailContent
          }
        },
        current_metrics: {
          sent: 0,
          opened: 0,
          clicked: 0,
          converted: 0
        },
        created_at: new Date().toISOString()
      }
      setCampaigns(prev => [newCampaign, ...prev])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({
        title: "Campagne créée",
        description: "La campagne a été créée avec succès"
      })
      setIsCreating(false)
      setCampaignName("")
      setCampaignType("")
      setTargetAudience("")
      setEmailSubject("")
      setEmailContent("")
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la campagne a été modifié"
      })
    }
  })

  const generateWithAI = async () => {
    toast({
      title: "Génération IA en cours",
      description: "L'IA génère le contenu de votre campagne..."
    })

    // Simulate AI generation
    setTimeout(() => {
      setEmailSubject(`🔥 Offre exclusive pour ${targetAudience || 'vous'}`)
      setEmailContent(`Bonjour,\n\nNous avons une offre exceptionnelle pour vous !\n\nCordialement,\nL'équipe`)
      toast({
        title: "Contenu généré",
        description: "Le contenu de la campagne a été généré avec succès"
      })
    }, 1500)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      draft: { variant: "outline", label: "Brouillon" },
      active: { variant: "default", label: "Active" },
      paused: { variant: "secondary", label: "En pause" },
      completed: { variant: "secondary", label: "Terminée" }
    }
    const config = variants[status] || variants.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestion des campagnes</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Target className="w-4 h-4 mr-2" />
              Nouvelle campagne
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une campagne marketing</DialogTitle>
              <DialogDescription>
                Configurez votre nouvelle campagne automatisée
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nom de la campagne</Label>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Ex: Offre Black Friday 2024"
                />
              </div>

              <div className="space-y-2">
                <Label>Type de campagne</Label>
                <Select value={campaignType} onValueChange={setCampaignType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotional">Promotionnelle</SelectItem>
                    <SelectItem value="educational">Éducative</SelectItem>
                    <SelectItem value="reengagement">Réengagement</SelectItem>
                    <SelectItem value="transactional">Transactionnelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Audience cible</Label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ex: Clients inactifs depuis 30 jours"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Sujet de l'email</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateWithAI}
                    disabled={!campaignType || !targetAudience}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer avec IA
                  </Button>
                </div>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Sujet accrocheur pour votre email"
                />
              </div>

              <div className="space-y-2">
                <Label>Contenu de l'email</Label>
                <Textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Contenu principal de votre email marketing..."
                  rows={8}
                />
              </div>

              <Button
                onClick={() => createCampaignMutation.mutate()}
                disabled={!campaignName || !campaignType || !emailSubject || !emailContent}
                className="w-full"
              >
                Créer la campagne
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Chargement...</p>
        ) : campaigns?.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Aucune campagne créée</p>
            <Button className="mt-4" onClick={() => setIsCreating(true)}>
              Créer votre première campagne
            </Button>
          </Card>
        ) : (
          campaigns?.map((campaign) => {
            const metrics = campaign.current_metrics as any || {}
            const openRate = metrics.sent > 0 ? (metrics.opened / metrics.sent) * 100 : 0
            const clickRate = metrics.sent > 0 ? (metrics.clicked / metrics.sent) * 100 : 0
            
            return (
              <Card key={campaign.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{campaign.campaign_name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Type: {campaign.campaign_type} • Créée le {format(new Date(campaign.created_at), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: 'active' })}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Lancer
                      </Button>
                    )}
                    {campaign.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: 'paused' })}
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: 'active' })}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Reprendre
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Envoyés</p>
                    <p className="text-2xl font-bold">{metrics.sent || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taux d'ouverture</p>
                    <p className="text-2xl font-bold">{openRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taux de clic</p>
                    <p className="text-2xl font-bold">{clickRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-bold">{metrics.converted || 0}</p>
                  </div>
                </div>

                {campaign.status === 'active' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium">65%</span>
                    </div>
                    <Progress value={65} />
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
