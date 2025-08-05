import { AppLayout } from "@/layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Megaphone, Mail, Users, BarChart3, Zap, Settings, Calendar, Target } from "lucide-react"

export default function Marketing() {
  const campaigns = [
    {
      id: 1,
      name: "Promo Black Friday",
      type: "Email",
      status: "active",
      reach: "15,234",
      opens: "45%",
      clicks: "12%",
      conversions: "8%"
    },
    {
      id: 2,
      name: "Nouveau Client",
      type: "Automation",
      status: "active",
      reach: "2,847",
      opens: "62%",
      clicks: "18%",
      conversions: "15%"
    }
  ]

  const segments = [
    { name: "Nouveaux clients", count: 1247, growth: "+12%" },
    { name: "Clients VIP", count: 89, growth: "+5%" },
    { name: "Panier abandonné", count: 456, growth: "-3%" },
    { name: "Clients inactifs", count: 234, growth: "-8%" }
  ]

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Marketing</h1>
            <p className="text-muted-foreground mt-2">
              Créez et gérez vos campagnes marketing pour booster vos ventes
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Megaphone className="w-4 h-4 mr-2" />
              Nouvelle Campagne
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Emails envoyés</p>
                  <p className="text-2xl font-bold">24,567</p>
                  <p className="text-sm text-green-600">+12% vs mois dernier</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Taux d'ouverture</p>
                  <p className="text-2xl font-bold">48.3%</p>
                  <p className="text-sm text-green-600">+2.1% vs mois dernier</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold">1,234</p>
                  <p className="text-sm text-green-600">+8.4% vs mois dernier</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Abonnés</p>
                  <p className="text-2xl font-bold">18,923</p>
                  <p className="text-sm text-green-600">+156 cette semaine</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <div className="space-y-6">
              {/* Active Campaigns */}
              <Card>
                <CardHeader>
                  <CardTitle>Campagnes Actives</CardTitle>
                  <CardDescription>
                    Gérez vos campagnes en cours et créez-en de nouvelles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                            <Mail className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{campaign.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{campaign.type}</Badge>
                              <Badge 
                                variant={campaign.status === 'active' ? 'default' : 'secondary'}
                                className={campaign.status === 'active' ? 'bg-green-500' : ''}
                              >
                                {campaign.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">{campaign.reach}</div>
                            <div className="text-muted-foreground">Portée</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{campaign.opens}</div>
                            <div className="text-muted-foreground">Ouvertures</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{campaign.clicks}</div>
                            <div className="text-muted-foreground">Clics</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{campaign.conversions}</div>
                            <div className="text-muted-foreground">Conversions</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Voir</Button>
                          <Button variant="outline" size="sm">Modifier</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Automation Marketing
                </CardTitle>
                <CardDescription>
                  Configurez des séquences automatisées pour vos clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Bienvenue Nouveau Client</h3>
                    <p className="text-sm text-muted-foreground mb-3">Séquence d'onboarding automatique</p>
                    <Badge className="bg-green-500">Actif</Badge>
                  </Card>
                  
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Panier Abandonné</h3>
                    <p className="text-sm text-muted-foreground mb-3">Récupération de paniers</p>
                    <Badge className="bg-green-500">Actif</Badge>
                  </Card>
                  
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Client Inactif</h3>
                    <p className="text-sm text-muted-foreground mb-3">Réactivation des clients</p>
                    <Badge variant="secondary">Inactif</Badge>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="segments">
            <Card>
              <CardHeader>
                <CardTitle>Segments Clients</CardTitle>
                <CardDescription>
                  Organisez vos clients en segments pour un marketing ciblé
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {segments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{segment.name}</h3>
                        <p className="text-2xl font-bold mt-1">{segment.count.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={segment.growth.startsWith('+') ? 'default' : 'destructive'}
                          className={segment.growth.startsWith('+') ? 'bg-green-500' : ''}
                        >
                          {segment.growth}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance par Canal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Email Marketing</span>
                      <span className="font-semibold">48.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>SMS Marketing</span>
                      <span className="font-semibold">62.1%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Push Notifications</span>
                      <span className="font-semibold">35.7%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ROI par Campagne</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Promo Black Friday</span>
                      <span className="font-semibold text-green-600">+320%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Nouveau Client</span>
                      <span className="font-semibold text-green-600">+156%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Panier Abandonné</span>
                      <span className="font-semibold text-green-600">+89%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}