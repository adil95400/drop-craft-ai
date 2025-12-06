import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Send, Users, TrendingUp, Clock, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export default function EmailMarketing() {
  const queryClient = useQueryClient()
  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [segmentType, setSegmentType] = useState('all')

  const { data: campaigns } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('automated_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .eq('campaign_type', 'email')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

  const { data: contacts } = useQuery({
    queryKey: ['email-contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
      
      if (error) throw error
      return data || []
    }
  })

  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('automated_campaigns')
        .insert({
          user_id: user.id,
          campaign_name: campaignData.name,
          campaign_type: 'email',
          trigger_type: 'manual',
          status: 'draft',
          content_templates: {
            subject: campaignData.subject,
            body: campaignData.content,
            segment: campaignData.segment
          }
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      toast.success('Campagne créée avec succès')
      setCampaignName('')
      setSubject('')
      setEmailContent('')
    },
    onError: () => {
      toast.error('Erreur lors de la création')
    }
  })

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignData: { subject: string; body: string; segment: string }) => {
      const { data, error } = await supabase.functions.invoke('send-email-campaign', {
        body: {
          subject: campaignData.subject,
          body: campaignData.body,
          segment: campaignData.segment,
          sendNow: true
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast.success(`Campagne envoyée: ${data.sent} emails envoyés`)
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`)
    }
  })

  const handleCreateCampaign = () => {
    if (!campaignName || !subject || !emailContent) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    createCampaignMutation.mutate({
      name: campaignName,
      subject,
      content: emailContent,
      segment: segmentType
    })
  }

  const stats = {
    totalContacts: contacts?.length || 0,
    totalCampaigns: campaigns?.length || 0,
    activeCampaigns: campaigns?.filter(c => c.status === 'active').length || 0,
    avgOpenRate: 24.5
  }

  const emailTemplates = [
    {
      name: 'Email de bienvenue',
      subject: 'Bienvenue chez [Votre Marque] 🎉',
      content: 'Bonjour {{first_name}},\n\nMerci de rejoindre notre communauté ! Nous sommes ravis de vous accueillir.\n\nPour commencer, voici un code promo exclusif : WELCOME10\n\nÀ bientôt !'
    },
    {
      name: 'Panier abandonné',
      subject: 'Vous avez oublié quelque chose 🛒',
      content: 'Bonjour {{first_name}},\n\nNous avons remarqué que vous avez laissé des articles dans votre panier.\n\nFinalisez votre commande maintenant et profitez de -10% avec le code CART10\n\nArticles dans votre panier:\n{{cart_items}}'
    },
    {
      name: 'Promotion flash',
      subject: '⚡ Vente Flash - 48h seulement !',
      content: 'Bonjour {{first_name}},\n\nNe manquez pas notre vente flash exceptionnelle !\n\nJusqu\'à -50% sur une sélection de produits pendant 48h seulement.\n\nDécouvrez les offres maintenant !'
    }
  ]

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Marketing</h1>
        <p className="text-muted-foreground">Créez et gérez vos campagnes d'email marketing automatisées</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">Abonnés actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campagnes</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">{stats.activeCampaigns} actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'ouverture</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgOpenRate}%</div>
            <p className="text-xs text-muted-foreground">Moyenne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automatisations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Workflows actifs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList>
          <TabsTrigger value="create">Créer une Campagne</TabsTrigger>
          <TabsTrigger value="campaigns">Mes Campagnes</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle Campagne Email</CardTitle>
              <CardDescription>Créez une campagne email personnalisée pour vos clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Nom de la campagne</Label>
                <Input
                  id="campaign-name"
                  placeholder="Ex: Promotion Été 2024"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Objet de l'email</Label>
                <Input
                  id="subject"
                  placeholder="Ex: 🎉 Soldes d'été - Jusqu'à -50%"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment">Segment de clients</Label>
                <Select value={segmentType} onValueChange={setSegmentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les contacts</SelectItem>
                    <SelectItem value="active">Clients actifs</SelectItem>
                    <SelectItem value="new">Nouveaux clients</SelectItem>
                    <SelectItem value="inactive">Clients inactifs</SelectItem>
                    <SelectItem value="vip">Clients VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenu de l'email</Label>
                <Textarea
                  id="content"
                  placeholder="Écrivez votre message ici... Utilisez {{first_name}} pour personnaliser"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={10}
                />
                <p className="text-sm text-muted-foreground">
                  Variables disponibles: {"{{first_name}}, {{last_name}}, {{email}}"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateCampaign} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Créer et Programmer
                </Button>
                <Button 
                  variant="default"
                  onClick={() => {
                    if (!subject || !emailContent) {
                      toast.error('Veuillez remplir le sujet et le contenu')
                      return
                    }
                    sendCampaignMutation.mutate({
                      subject,
                      body: emailContent,
                      segment: segmentType
                    })
                  }}
                  disabled={sendCampaignMutation.isPending}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {sendCampaignMutation.isPending ? 'Envoi...' : 'Envoyer Maintenant'}
                </Button>
                <Button variant="outline">
                  Enregistrer comme brouillon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {campaigns?.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{campaign.campaign_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Créée le {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                    <Button size="sm">Voir Détails</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!campaigns || campaigns.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune campagne créée pour le moment
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {emailTemplates.map((template, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>Sujet: {template.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">{template.content}</pre>
                  </div>
                  <Button onClick={() => {
                    setCampaignName(template.name)
                    setSubject(template.subject)
                    setEmailContent(template.content)
                    toast.success('Template chargé')
                  }}>
                    Utiliser ce template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflows d'Automation</CardTitle>
              <CardDescription>Configurez des emails automatiques basés sur le comportement client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">Email de bienvenue</h4>
                      <p className="text-sm text-muted-foreground">Envoyé 1h après inscription</p>
                    </div>
                  </div>
                  <Badge variant="default">Actif</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">Panier abandonné</h4>
                      <p className="text-sm text-muted-foreground">Relance après 24h d'inactivité</p>
                    </div>
                  </div>
                  <Badge variant="default">Actif</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">Réactivation client</h4>
                      <p className="text-sm text-muted-foreground">Après 30 jours sans achat</p>
                    </div>
                  </div>
                  <Badge variant="default">Actif</Badge>
                </div>
              </div>

              <Button className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Créer un nouveau workflow
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
