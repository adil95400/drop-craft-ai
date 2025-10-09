import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActionButton } from '@/components/common/ActionButton'
import { Helmet } from 'react-helmet-async'
import { CampaignCreator } from '@/components/marketing/CampaignCreator'
import { MarketingAnalytics } from '@/components/marketing/MarketingAnalytics'
import { SmartAutomationBuilder } from '@/components/marketing/SmartAutomationBuilder'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { 
  Mail, MessageSquare, Users, TrendingUp,
  Play, Pause, Eye, Edit, BarChart3,
  Target, Zap, Calendar, Settings, Sparkles,
  Brain, Activity, Award
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  type: 'email' | 'sms' | 'automation'
  status: 'active' | 'paused' | 'draft' | 'completed'
  created_at: string
  sent: number
  opened: number
  clicked: number
  converted: number
  revenue: number
  open_rate: number
  click_rate: number
  conversion_rate: number
}

const ModernMarketingPage: React.FC = () => {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCampaignCreator, setShowCampaignCreator] = useState(false)
  const [activeTab, setActiveTab] = useState('campaigns')

  useEffect(() => {
    if (user?.id) {
      loadCampaigns()
    }
  }, [user?.id])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('automated_campaigns')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mappedCampaigns: Campaign[] = (data || []).map(camp => ({
        id: camp.id,
        name: camp.campaign_name,
        type: camp.campaign_type as 'email' | 'sms' | 'automation',
        status: camp.status as 'active' | 'paused' | 'draft' | 'completed',
        created_at: camp.created_at,
        sent: (camp.current_metrics as any)?.sent || 0,
        opened: (camp.current_metrics as any)?.opened || 0,
        clicked: (camp.current_metrics as any)?.clicked || 0,
        converted: (camp.current_metrics as any)?.converted || 0,
        revenue: (camp.current_metrics as any)?.revenue || 0,
        open_rate: (camp.current_metrics as any)?.open_rate || 0,
        click_rate: (camp.current_metrics as any)?.click_rate || 0,
        conversion_rate: (camp.current_metrics as any)?.conversion_rate || 0
      }))

      setCampaigns(mappedCampaigns)
    } catch (error) {
      console.error('Erreur chargement campagnes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, text: 'Active' },
      paused: { variant: 'secondary' as const, text: 'En pause' },
      draft: { variant: 'outline' as const, text: 'Brouillon' },
      completed: { variant: 'default' as const, text: 'Terminée' }
    }
    const config = variants[status as keyof typeof variants] || variants.draft
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      email: <Mail className="h-4 w-4" />,
      sms: <MessageSquare className="h-4 w-4" />,
      automation: <Zap className="h-4 w-4" />
    }
    return icons[type as keyof typeof icons] || icons.email
  }

  // Calculs des statistiques globales
  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)
  const avgOpenRate = campaigns.filter(c => c.sent > 0).reduce((sum, c) => sum + c.open_rate, 0) / 
                     Math.max(campaigns.filter(c => c.sent > 0).length, 1)
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Marketing - Drop Craft AI | Campagnes & Automation</title>
        <meta name="description" content="Créez et gérez vos campagnes email, SMS et séquences d'automation marketing." />
      </Helmet>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
            <p className="text-muted-foreground">
              Gérez vos {campaigns.length} campagnes - {activeCampaigns} actives
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button 
              className="btn-gradient"
              onClick={() => setShowCampaignCreator(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Nouvelle campagne IA
            </Button>
          </div>
        </div>

        {/* Métriques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{totalSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Messages envoyés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()}€</div>
              <p className="text-xs text-muted-foreground">Revenus générés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{avgOpenRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Taux d'ouverture moyen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{activeCampaigns}</div>
              <p className="text-xs text-muted-foreground">Campagnes actives</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Campagnes
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Automation IA
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="segments" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Segments
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Toutes les Campagnes</CardTitle>
                <CardDescription>
                  Gérez vos campagnes email, SMS et séquences d'automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-full">
                            {getTypeIcon(campaign.type)}
                          </div>
                          <div>
                            <h3 className="font-medium">{campaign.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Créée le {new Date(campaign.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(campaign.status)}
                          <Badge variant="outline" className="capitalize">
                            {campaign.type}
                          </Badge>
                        </div>
                      </div>

                      {campaign.sent > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          <div>
                            <div className="text-lg font-semibold">{campaign.sent.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Envoyés</p>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-blue-600">{campaign.open_rate}%</div>
                            <p className="text-xs text-muted-foreground">Ouverture</p>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-green-600">{campaign.click_rate}%</div>
                            <p className="text-xs text-muted-foreground">Clic</p>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-purple-600">{campaign.conversion_rate}%</div>
                            <p className="text-xs text-muted-foreground">Conversion</p>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-orange-600">{campaign.revenue.toLocaleString()}€</div>
                            <p className="text-xs text-muted-foreground">Revenus</p>
                          </div>
                        </div>
                      )}

                      {campaign.sent > 0 && (
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Taux d'ouverture</span>
                            <span>{campaign.open_rate}%</span>
                          </div>
                          <Progress value={campaign.open_rate} className="h-2" />
                          
                          <div className="flex justify-between text-sm">
                            <span>Taux de clic</span>
                            <span>{campaign.click_rate}%</span>
                          </div>
                          <Progress value={campaign.click_rate} className="h-2" />
                        </div>
                      )}

                      <div className="flex gap-2">
                        {campaign.status === 'active' ? (
                          <Button variant="outline" size="sm">
                            <Pause className="h-4 w-4 mr-1" />
                            Pauser
                          </Button>
                        ) : campaign.status === 'paused' ? (
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            Reprendre
                          </Button>
                        ) : campaign.status === 'draft' ? (
                          <Button variant="default" size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            Lancer
                          </Button>
                        ) : null}
                        
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button variant="ghost" size="sm">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Stats
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <SmartAutomationBuilder />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <MarketingAnalytics />
          </TabsContent>

          <TabsContent value="segments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Segments d'Audience</CardTitle>
                <CardDescription>
                  Ciblez vos campagnes avec des segments personnalisés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">VIP Clients</h3>
                      <p className="text-sm text-muted-foreground">
                        Clients avec plus de 500€ d'achats
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">1,247</div>
                      <div className="text-sm text-muted-foreground">contacts</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Nouveaux Inscrits</h3>
                      <p className="text-sm text-muted-foreground">
                        Inscrits dans les 30 derniers jours
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">456</div>
                      <div className="text-sm text-muted-foreground">contacts</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Acheteurs Fréquents</h3>
                      <p className="text-sm text-muted-foreground">
                        Plus de 3 commandes en 6 mois
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">892</div>
                      <div className="text-sm text-muted-foreground">contacts</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates Email & SMS</CardTitle>
                <CardDescription>
                  Bibliothèque de templates prêts à utiliser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded mb-3 flex items-center justify-center">
                      <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Newsletter Moderne</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Template clean pour newsletters
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Utiliser
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 rounded mb-3 flex items-center justify-center">
                      <Target className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Promotion Flash</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Template pour ventes flash
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Utiliser
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 rounded mb-3 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-2">SMS Rapide</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Template SMS concis et efficace
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Utiliser
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Campaign Creator Modal */}
        <CampaignCreator
          isOpen={showCampaignCreator}
          onClose={() => setShowCampaignCreator(false)}
          onSave={(campaign) => {
            setCampaigns(prev => [...prev, campaign])
            console.log('Nouvelle campagne créée:', campaign)
          }}
        />
      </div>
    </>
  )
}

export default ModernMarketingPage