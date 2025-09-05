/**
 * Page Marketing moderne - Campagnes email, SMS et automation
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActionButton } from '@/components/common/ActionButton'
import { Helmet } from 'react-helmet-async'
import { 
  Mail, MessageSquare, Users, TrendingUp,
  Play, Pause, Eye, Edit, BarChart3,
  Target, Zap, Calendar, Settings
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Promo Été 2024 - Nouveaux Produits',
          type: 'email',
          status: 'active',
          created_at: '2024-01-10T10:00:00Z',
          sent: 15420,
          opened: 4235,
          clicked: 892,
          converted: 156,
          revenue: 12450.80,
          open_rate: 27.5,
          click_rate: 21.1,
          conversion_rate: 17.5
        },
        {
          id: '2',
          name: 'Abandon de Panier - Séquence Auto',
          type: 'automation',
          status: 'active',
          created_at: '2024-01-05T14:30:00Z',
          sent: 8760,
          opened: 3240,
          clicked: 1120,
          converted: 280,
          revenue: 18920.50,
          open_rate: 37.0,
          click_rate: 34.6,
          conversion_rate: 25.0
        },
        {
          id: '3',
          name: 'Flash Sale SMS - Weekend',
          type: 'sms',
          status: 'completed',
          created_at: '2024-01-08T16:00:00Z',
          sent: 5280,
          opened: 4950,
          clicked: 1485,
          converted: 297,
          revenue: 8765.25,
          open_rate: 93.8,
          click_rate: 30.0,
          conversion_rate: 20.0
        },
        {
          id: '4',
          name: 'Newsletter Mensuelle Janvier',
          type: 'email',
          status: 'draft',
          created_at: '2024-01-12T09:00:00Z',
          sent: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          revenue: 0,
          open_rate: 0,
          click_rate: 0,
          conversion_rate: 0
        }
      ]
      setCampaigns(mockCampaigns)
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
            <Button className="btn-gradient">
              <Target className="h-4 w-4 mr-2" />
              Nouvelle campagne
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

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
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
            <Card>
              <CardHeader>
                <CardTitle>Séquences d'Automation</CardTitle>
                <CardDescription>
                  Créez des workflows automatisés basés sur le comportement client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold">Abandon de Panier</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Séquence automatique pour récupérer les paniers abandonnés
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="default">Active</Badge>
                      <span className="text-sm text-muted-foreground">280 conversions</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">Bienvenue Nouveaux Clients</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Séquence d'onboarding pour nouveaux inscrits
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="default">Active</Badge>
                      <span className="text-sm text-muted-foreground">156 conversions</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">Recommandations Produits</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Suggestions basées sur l'historique d'achat
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">En pause</Badge>
                      <span className="text-sm text-muted-foreground">89 conversions</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold">Réactivation Clients</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Campagne pour clients inactifs depuis 60 jours
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Brouillon</Badge>
                      <ActionButton 
                        size="sm" 
                        variant="default"
                        onClick={async () => console.log('Configure automation')}
                      >
                        Configurer
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      </div>
    </>
  )
}

export default ModernMarketingPage