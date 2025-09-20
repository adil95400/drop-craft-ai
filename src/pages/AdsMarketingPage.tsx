import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  TrendingUp, 
  DollarSign, 
  Eye, 
  MousePointer, 
  Download, 
  Settings,
  BarChart3,
  Target,
  Zap,
  ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AdAccount {
  id: string
  platform: 'google' | 'facebook' | 'tiktok'
  name: string
  status: 'connected' | 'disconnected' | 'error'
  spend: number
  clicks: number
  impressions: number
  conversions: number
  lastSync: string
}

interface Campaign {
  id: string
  name: string
  platform: 'google' | 'facebook' | 'tiktok'
  status: 'active' | 'paused' | 'ended'
  budget: number
  spend: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
  roas: number
}

const AdsMarketingPage = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data
  const adAccounts: AdAccount[] = [
    {
      id: 'google-001',
      platform: 'google',
      name: 'Google Ads Principal',
      status: 'connected',
      spend: 2847.50,
      clicks: 1247,
      impressions: 45600,
      conversions: 89,
      lastSync: '2024-01-20 14:30'
    },
    {
      id: 'facebook-001',
      platform: 'facebook',
      name: 'Facebook Business',
      status: 'connected',
      spend: 1923.75,
      clicks: 892,
      impressions: 67800,
      conversions: 67,
      lastSync: '2024-01-20 14:25'
    },
    {
      id: 'tiktok-001',
      platform: 'tiktok',
      name: 'TikTok Ads Manager',
      status: 'disconnected',
      spend: 0,
      clicks: 0,
      impressions: 0,
      conversions: 0,
      lastSync: 'Jamais'
    }
  ]

  const campaigns: Campaign[] = [
    {
      id: 'camp-001',
      name: 'Chaises Bureau - Google',
      platform: 'google',
      status: 'active',
      budget: 50,
      spend: 42.30,
      clicks: 127,
      impressions: 2340,
      ctr: 5.43,
      cpc: 0.33,
      roas: 4.2
    },
    {
      id: 'camp-002',
      name: 'Mobilier Salon - Facebook',
      platform: 'facebook',
      status: 'active',
      budget: 75,
      spend: 68.90,
      clicks: 89,
      impressions: 3420,
      ctr: 2.60,
      cpc: 0.77,
      roas: 3.8
    }
  ]

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google': return '🔍'
      case 'facebook': return '📘'
      case 'tiktok': return '🎵'
      default: return '📊'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active': return 'bg-green-100 text-green-800'
      case 'disconnected':
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'error':
      case 'ended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleConnectPlatform = (platform: string) => {
    toast({
      title: "Redirection vers l'authentification",
      description: `Vous allez être redirigé vers ${platform} pour autoriser l'accès`,
    })
  }

  const handleExportCatalog = (format: string) => {
    toast({
      title: "Export en cours",
      description: `Génération du flux ${format} en cours...`,
    })
  }

  const totalSpend = adAccounts.reduce((sum, account) => sum + account.spend, 0)
  const totalClicks = adAccounts.reduce((sum, account) => sum + account.clicks, 0)
  const totalImpressions = adAccounts.reduce((sum, account) => sum + account.impressions, 0)
  const totalConversions = adAccounts.reduce((sum, account) => sum + account.conversions, 0)
  const averageROAS = campaigns.reduce((sum, camp) => sum + camp.roas, 0) / campaigns.length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ads & Marketing</h1>
          <p className="text-muted-foreground">Gestion des campagnes publicitaires et analyse ROI</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter rapport
          </Button>
          <Button>
            <Target className="mr-2 h-4 w-4" />
            Nouvelle campagne
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+12% vs mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+8% vs mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clics</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15% vs mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageROAS.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">+0.3x vs mois dernier</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="platforms">Plateformes</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="catalogs">Flux catalogues</TabsTrigger>
          <TabsTrigger value="analytics">Analytics ROI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance par plateforme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.conversions} conversions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">€{account.spend.toFixed(2)}</p>
                        <Badge className={getStatusColor(account.status)}>{account.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Campagnes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.slice(0, 3).map((campaign) => (
                    <div key={campaign.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getPlatformIcon(campaign.platform)} ROAS: {campaign.roas}x
                          </p>
                        </div>
                        <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(campaign.spend / campaign.budget) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        €{campaign.spend} / €{campaign.budget} ({Math.round((campaign.spend / campaign.budget) * 100)}%)
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['google', 'facebook', 'tiktok'].map((platform) => (
              <Card key={platform}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getPlatformIcon(platform)}</span>
                    <div>
                      <CardTitle className="capitalize">{platform} Ads</CardTitle>
                      <CardDescription>Connecteur publicitaire</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adAccounts.find(acc => acc.platform === platform) ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Dépenses:</span>
                        <span className="font-bold">€{adAccounts.find(acc => acc.platform === platform)?.spend}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversions:</span>
                        <span className="font-bold">{adAccounts.find(acc => acc.platform === platform)?.conversions}</span>
                      </div>
                      <Badge className={getStatusColor(adAccounts.find(acc => acc.platform === platform)?.status || '')}>
                        {adAccounts.find(acc => acc.platform === platform)?.status}
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-4">Non connecté</p>
                      <Button onClick={() => handleConnectPlatform(platform)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Connecter
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Campagnes actives</h3>
            <Button>
              <Target className="mr-2 h-4 w-4" />
              Créer une campagne
            </Button>
          </div>
          
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-xl">{getPlatformIcon(campaign.platform)}</span>
                        {campaign.name}
                      </CardTitle>
                      <CardDescription>Budget: €{campaign.budget}/jour</CardDescription>
                    </div>
                    <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Dépensé</p>
                      <p className="text-lg font-bold">€{campaign.spend}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clics</p>
                      <p className="text-lg font-bold">{campaign.clicks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Impressions</p>
                      <p className="text-lg font-bold">{campaign.impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CTR</p>
                      <p className="text-lg font-bold">{campaign.ctr}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CPC</p>
                      <p className="text-lg font-bold">€{campaign.cpc}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ROAS</p>
                      <p className="text-lg font-bold text-green-600">{campaign.roas}x</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analyser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="catalogs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flux dynamiques de catalogues</CardTitle>
              <CardDescription>Exportez vos produits vers les plateformes publicitaires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Google Shopping</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Produits exportés:</span>
                        <span className="font-bold">1,247</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dernière maj:</span>
                        <span>Il y a 2h</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked />
                        <Label>Sync automatique</Label>
                      </div>
                      <Button size="sm" onClick={() => handleExportCatalog('Google Shopping')}>
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Facebook Catalog</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Produits exportés:</span>
                        <span className="font-bold">1,198</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dernière maj:</span>
                        <span>Il y a 1h</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch defaultChecked />
                        <Label>Sync automatique</Label>
                      </div>
                      <Button size="sm" onClick={() => handleExportCatalog('Facebook Catalog')}>
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">TikTok Catalog</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Produits exportés:</span>
                        <span className="font-bold">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dernière maj:</span>
                        <span>Jamais</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch />
                        <Label>Sync automatique</Label>
                      </div>
                      <Button size="sm" variant="outline" disabled>
                        <Download className="mr-2 h-4 w-4" />
                        Non configuré
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuration des flux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Fréquence de synchronisation</Label>
                      <Select defaultValue="hourly">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Toutes les heures</SelectItem>
                          <SelectItem value="daily">Quotidienne</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Inclure les produits</Label>
                      <Select defaultValue="active">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les produits</SelectItem>
                          <SelectItem value="active">Produits actifs uniquement</SelectItem>
                          <SelectItem value="instock">En stock uniquement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ROI par source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adAccounts.map((account) => {
                    const roi = ((account.conversions * 150 - account.spend) / account.spend * 100)
                    return (
                      <div key={account.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getPlatformIcon(account.platform)}</span>
                          <span className="font-medium capitalize">{account.platform}</span>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attribution des conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Recherche payante</span>
                    <span className="font-bold">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  
                  <div className="flex justify-between">
                    <span>Social payant</span>
                    <span className="font-bold">32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                  
                  <div className="flex justify-between">
                    <span>Display</span>
                    <span className="font-bold">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                  
                  <div className="flex justify-between">
                    <span>Email</span>
                    <span className="font-bold">8%</span>
                  </div>
                  <Progress value={8} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métriques avancées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">LTV/CAC</p>
                  <p className="text-2xl font-bold text-green-600">3.2x</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Payback Period</p>
                  <p className="text-2xl font-bold">2.3 mois</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">CPM Moyen</p>
                  <p className="text-2xl font-bold">€12.45</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Quality Score</p>
                  <p className="text-2xl font-bold">8.2/10</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdsMarketingPage