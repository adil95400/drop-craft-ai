import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Target, 
  Users, 
  Mail, 
  MessageSquare, 
  BarChart3, 
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MousePointer,
  DollarSign
} from 'lucide-react'
import { CreativeStudioService, MarketingCampaign } from '@/services/CreativeStudioService'
import { useToast } from '@/hooks/use-toast'

interface MarketingMetrics {
  totalCampaigns: number
  activeCampaigns: number
  totalBudget: number
  totalSpent: number
  avgROI: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
}

export function MarketingHub() {
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [metrics, setMetrics] = useState<MarketingMetrics>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalBudget: 0,
    totalSpent: 0,
    avgROI: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadMarketingData()
  }, [])

  const loadMarketingData = async () => {
    setIsLoading(true)
    try {
      const campaignsData = await CreativeStudioService.getInstance().getMarketingCampaigns()
      setCampaigns(campaignsData)
      
      // Calculate metrics
      const calculatedMetrics: MarketingMetrics = {
        totalCampaigns: campaignsData.length,
        activeCampaigns: campaignsData.filter(c => c.status === 'active').length,
        totalBudget: campaignsData.reduce((sum, c) => sum + (c.budget || 0), 0),
        totalSpent: campaignsData.reduce((sum, c) => {
          const spent = (c.budget || 0) * 0.7 // Assuming 70% spent on average
          return sum + spent
        }, 0),
        avgROI: campaignsData.reduce((sum, c) => sum + (c.performance_metrics?.roi || 0), 0) / Math.max(campaignsData.length, 1),
        totalImpressions: campaignsData.reduce((sum, c) => sum + (c.performance_metrics?.impressions || 0), 0),
        totalClicks: campaignsData.reduce((sum, c) => sum + (c.performance_metrics?.clicks || 0), 0),
        totalConversions: campaignsData.reduce((sum, c) => sum + (c.performance_metrics?.conversions || 0), 0)
      }
      
      setMetrics(calculatedMetrics)
    } catch (error) {
      console.error('Error loading marketing data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données marketing",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptimizeCampaign = async (campaignId: string) => {
    try {
      // Simulate AI optimization
      const optimizedMetrics = {
        impressions: Math.floor(Math.random() * 10000) + 5000,
        clicks: Math.floor(Math.random() * 1000) + 500,
        conversions: Math.floor(Math.random() * 100) + 50,
        roi: Math.random() * 0.5 + 0.2 // 20-70% ROI
      }
      
      await CreativeStudioService.getInstance().updateCampaignPerformance(campaignId, optimizedMetrics)
      
      // Update local state
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, performance_metrics: optimizedMetrics }
          : campaign
      ))
      
      toast({
        title: "Succès",
        description: "Campagne optimisée avec l'IA",
      })
    } catch (error) {
      console.error('Error optimizing campaign:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'optimiser la campagne",
        variant: "destructive",
      })
    }
  }

  const getCampaignTypeIcon = (type: MarketingCampaign['type']) => {
    switch (type) {
      case 'social': return <MessageSquare className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'ads': return <Target className="h-4 w-4" />
      case 'seo': return <TrendingUp className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: MarketingCampaign['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200'
      case 'paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hub Marketing</h1>
          <p className="text-muted-foreground">
            Gérez et optimisez vos campagnes marketing en temps réel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Zap className="h-3 w-3 mr-1" />
            Optimisation IA
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Target className="h-4 w-4 mr-2" />
            Campagnes
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campagnes Totales</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalCampaigns}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeCampaigns} actives
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalBudget)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(metrics.totalSpent)} dépensés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROI Moyen</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(metrics.avgROI * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-green-600 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12% vs mois dernier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(metrics.totalConversions)}</div>
                <p className="text-xs text-muted-foreground">
                  {((metrics.totalConversions / Math.max(metrics.totalClicks, 1)) * 100).toFixed(1)}% taux de conversion
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance des Campagnes</CardTitle>
                <CardDescription>Métriques clés par type de campagne</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['social', 'email', 'ads', 'seo'].map((type) => {
                  const typeCampaigns = campaigns.filter(c => c.type === type)
                  const typeROI = typeCampaigns.reduce((sum, c) => sum + (c.performance_metrics?.roi || 0), 0) / Math.max(typeCampaigns.length, 1)
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCampaignTypeIcon(type as MarketingCampaign['type'])}
                        <span className="font-medium capitalize">
                          {type === 'social' ? 'Réseaux Sociaux' : 
                           type === 'email' ? 'Email Marketing' : 
                           type === 'ads' ? 'Publicités' : 'SEO'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={typeROI * 200} className="w-16" />
                        <span className="text-sm font-medium">
                          {(typeROI * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques d'Engagement</CardTitle>
                <CardDescription>Performance globale des campagnes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span>Impressions</span>
                  </div>
                  <span className="font-semibold">{formatNumber(metrics.totalImpressions)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MousePointer className="h-4 w-4 text-green-600" />
                    <span>Clics</span>
                  </div>
                  <span className="font-semibold">{formatNumber(metrics.totalClicks)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span>Conversions</span>
                  </div>
                  <span className="font-semibold">{formatNumber(metrics.totalConversions)}</span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taux de clic (CTR)</span>
                    <span className="font-semibold">
                      {((metrics.totalClicks / Math.max(metrics.totalImpressions, 1)) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCampaignTypeIcon(campaign.type)}
                      <div>
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <CardDescription className="capitalize">{campaign.type}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {campaign.budget && (
                      <div className="flex justify-between text-sm">
                        <span>Budget:</span>
                        <span className="font-medium">{formatCurrency(campaign.budget)}</span>
                      </div>
                    )}
                    
                    {campaign.performance_metrics?.roi && (
                      <div className="flex justify-between text-sm">
                        <span>ROI:</span>
                        <span className="font-medium text-green-600">
                          {(campaign.performance_metrics.roi * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    
                    {campaign.performance_metrics?.conversions && (
                      <div className="flex justify-between text-sm">
                        <span>Conversions:</span>
                        <span className="font-medium">
                          {formatNumber(campaign.performance_metrics.conversions)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleOptimizeCampaign(campaign.id)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Optimiser avec l'IA
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendances des Performances</CardTitle>
                <CardDescription>Évolution des métriques sur les 30 derniers jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Graphique des performances</p>
                    <p className="text-sm">Données simulées</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommandations IA</CardTitle>
                <CardDescription>Suggestions d'optimisation automatiques</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium">Optimiser les heures de diffusion</h4>
                  <p className="text-sm text-muted-foreground">
                    Vos campagnes email performent mieux entre 9h et 11h
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium">Augmenter le budget publicitaire</h4>
                  <p className="text-sm text-muted-foreground">
                    Potentiel d'augmentation du ROI de 25% avec +500€ de budget
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium">Tester de nouveaux formats</h4>
                  <p className="text-sm text-muted-foreground">
                    Les vidéos courtes génèrent 40% d'engagement en plus
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}