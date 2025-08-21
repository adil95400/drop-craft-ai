import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, Pause, Square, Settings, TrendingUp, TrendingDown,
  Eye, MousePointer, DollarSign, Target, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface LiveCampaignMetrics {
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  ctr: number
  cpc: number
  roas: number
  conversionRate: number
}

export function LiveCampaignMonitor() {
  const { campaigns, isLoading } = useRealTimeMarketing()
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  const [liveMetrics, setLiveMetrics] = useState<LiveCampaignMetrics>({
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spend: 0,
    revenue: 0,
    ctr: 0,
    cpc: 0,
    roas: 0,
    conversionRate: 0
  })
  const { toast } = useToast()

  // Simulate real-time metrics updates
  useEffect(() => {
    if (!selectedCampaign) return

    const interval = setInterval(() => {
      setLiveMetrics(prev => {
        const newImpressions = prev.impressions + Math.floor(Math.random() * 50) + 10
        const newClicks = prev.clicks + Math.floor(Math.random() * 5) + 1
        const newConversions = prev.conversions + (Math.random() > 0.8 ? 1 : 0)
        const newSpend = prev.spend + Math.random() * 10 + 2
        const newRevenue = prev.revenue + Math.random() * 50 + 10

        return {
          impressions: newImpressions,
          clicks: newClicks,
          conversions: newConversions,
          spend: newSpend,
          revenue: newRevenue,
          ctr: (newClicks / newImpressions) * 100,
          cpc: newSpend / newClicks,
          roas: newRevenue / newSpend,
          conversionRate: (newConversions / newClicks) * 100
        }
      })
    }, 3000) // Update every 3 seconds

    return () => clearInterval(interval)
  }, [selectedCampaign])

  const activeCampaigns = campaigns.filter(c => c.status === 'active')

  const handleCampaignAction = async (campaignId: string, action: 'pause' | 'resume' | 'stop') => {
    try {
      const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'completed'
      
      await supabase
        .from('marketing_campaigns')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      toast({
        title: `Campagne ${action === 'pause' ? 'mise en pause' : action === 'resume' ? 'reprise' : 'arrêtée'}`,
        description: "L'action a été effectuée avec succès"
      })

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'action",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPerformanceIndicator = (value: number, benchmark: number) => {
    if (value > benchmark * 1.1) {
      return { icon: TrendingUp, color: 'text-green-600', label: 'Excellent' }
    } else if (value > benchmark * 0.9) {
      return { icon: CheckCircle2, color: 'text-blue-600', label: 'Normal' }
    } else {
      return { icon: TrendingDown, color: 'text-red-600', label: 'À améliorer' }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Campaign Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Campagnes Actives - Monitoring en Temps Réel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activeCampaigns.map((campaign) => (
              <div 
                key={campaign.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedCampaign?.id === campaign.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate">{campaign.name}</h4>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Budget: {formatCurrency(campaign.budget_total || 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Dépensé: {formatCurrency(campaign.budget_spent || 0)}
                </div>
                <Progress 
                  value={((campaign.budget_spent || 0) / (campaign.budget_total || 1)) * 100}
                  className="h-1 mt-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCampaign && (
        <div className="space-y-6">
          {/* Campaign Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedCampaign.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCampaign.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedCampaign.status === 'active' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCampaignAction(selectedCampaign.id, 'pause')}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}
                  {selectedCampaign.status === 'paused' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCampaignAction(selectedCampaign.id, 'resume')}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Reprendre
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCampaignAction(selectedCampaign.id, 'stop')}
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Arrêter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Paramètres
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Live Metrics Dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{liveMetrics.impressions.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {(() => {
                    const indicator = getPerformanceIndicator(liveMetrics.impressions, 10000)
                    const Icon = indicator.icon
                    return (
                      <>
                        <Icon className={`h-3 w-3 mr-1 ${indicator.color}`} />
                        {indicator.label}
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CTR</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{liveMetrics.ctr.toFixed(2)}%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {(() => {
                    const indicator = getPerformanceIndicator(liveMetrics.ctr, 2.5)
                    const Icon = indicator.icon
                    return (
                      <>
                        <Icon className={`h-3 w-3 mr-1 ${indicator.color}`} />
                        {indicator.label}
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROAS</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{liveMetrics.roas.toFixed(2)}x</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {(() => {
                    const indicator = getPerformanceIndicator(liveMetrics.roas, 3.0)
                    const Icon = indicator.icon
                    return (
                      <>
                        <Icon className={`h-3 w-3 mr-1 ${indicator.color}`} />
                        {indicator.label}
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{liveMetrics.conversions}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>Taux: {liveMetrics.conversionRate.toFixed(2)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Métriques Financières</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Dépensé</span>
                  <span className="font-medium">{formatCurrency(liveMetrics.spend)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Revenus</span>
                  <span className="font-medium">{formatCurrency(liveMetrics.revenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">CPC Moyen</span>
                  <span className="font-medium">{formatCurrency(liveMetrics.cpc)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Profit</span>
                  <span className={`font-medium ${
                    liveMetrics.revenue - liveMetrics.spend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(liveMetrics.revenue - liveMetrics.spend)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes & Recommandations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {liveMetrics.ctr < 1.5 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-800">CTR Faible</div>
                      <div className="text-sm text-yellow-700">
                        Considérez optimiser vos créatifs ou ciblage
                      </div>
                    </div>
                  </div>
                )}
                
                {liveMetrics.roas > 4.0 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-800">Excellente Performance</div>
                      <div className="text-sm text-green-700">
                        Envisagez d'augmenter le budget de cette campagne
                      </div>
                    </div>
                  </div>
                )}

                {liveMetrics.conversionRate < 2.0 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-800">Taux de Conversion Bas</div>
                      <div className="text-sm text-red-700">
                        Vérifiez l'expérience de la landing page
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}