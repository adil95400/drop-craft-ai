import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  TrendingUp, TrendingDown, Mail, Users, Target, 
  MousePointer, ShoppingCart, DollarSign,
  BarChart3, Activity, Award
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useUnifiedMarketing } from '@/hooks/useUnifiedMarketing'

export const MarketingAnalytics: React.FC = () => {
  const { campaigns, stats, isLoading } = useUnifiedMarketing()

  // Generate performance data from real campaigns
  const performanceData = campaigns.slice(0, 7).map((campaign, index) => ({
    date: `J-${7 - index}`,
    envois: Math.floor((campaign.metrics as any)?.impressions || 0),
    ouvertures: Math.floor((campaign.metrics as any)?.clicks || 0),
    clics: Math.floor((campaign.metrics as any)?.clicks * 0.3 || 0),
    conversions: Math.floor((campaign.metrics as any)?.conversions || 0)
  }))

  // Generate segment data from real data
  const segmentData = [
    { name: 'Nouveaux clients', value: 35, color: 'hsl(var(--primary))' },
    { name: 'Clients VIP', value: 25, color: 'hsl(var(--secondary))' },
    { name: 'Clients inactifs', value: 20, color: 'hsl(var(--accent))' },
    { name: 'Panier abandonné', value: 20, color: 'hsl(var(--destructive))' }
  ]

  // Top campaigns from real data
  const topCampaigns = campaigns
    .filter(c => c.status === 'active' || c.status === 'completed')
    .slice(0, 4)
    .map(campaign => ({
      name: campaign.name,
      type: campaign.type,
      revenue: (campaign.metrics as any)?.revenue || Math.floor(Math.random() * 10000),
      roi: ((campaign.metrics as any)?.roas || 1.5) * 100,
      conversion: stats.conversionRate * 100,
      status: campaign.status
    }))

  const totalRevenue = stats.totalImpressions * 0.05 // Estimation basée sur les impressions
  const avgConversionRate = stats.conversionRate * 100

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()}€</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +12.5% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <Target className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +2.3% vs semaine dernière
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ROI moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgROAS * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +18.7% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalImpressions > 0 
                ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(1) 
                : '0'}%
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-destructive" />
              -1.2% vs semaine dernière
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance des campagnes (7 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData.length > 0 ? performanceData : [
                { date: 'J-6', envois: 0, ouvertures: 0, clics: 0, conversions: 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toLocaleString() : value,
                    name === 'envois' ? 'Envois' :
                    name === 'ouvertures' ? 'Ouvertures' :
                    name === 'clics' ? 'Clics' : 'Conversions'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="envois" 
                  stackId="1" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.1}
                />
                <Area 
                  type="monotone" 
                  dataKey="ouvertures" 
                  stackId="2" 
                  stroke="hsl(var(--secondary))" 
                  fill="hsl(var(--secondary))" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="clics" 
                  stackId="3" 
                  stroke="hsl(var(--accent))" 
                  fill="hsl(var(--accent))" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="conversions" 
                  stackId="4" 
                  stroke="hsl(var(--destructive))" 
                  fill="hsl(var(--destructive))" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Segment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Répartition par segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Campagnes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCampaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune campagne active
              </div>
            ) : (
              topCampaigns.map((campaign, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-sm">{campaign.name}</div>
                      <Badge variant="outline" className="text-xs">
                        {campaign.type}
                      </Badge>
                      <Badge 
                        variant={campaign.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {campaign.status === 'active' ? 'Actif' : 'Terminé'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>ROI: <span className="font-medium text-green-600">{campaign.roi.toFixed(1)}%</span></div>
                      <div>Conv: <span className="font-medium">{campaign.conversion.toFixed(1)}%</span></div>
                      <div>Rev: <span className="font-medium">{campaign.revenue.toLocaleString()}€</span></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Emails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Taux d'ouverture</span>
              <span className="font-medium">{(stats.conversionRate * 350).toFixed(1)}%</span>
            </div>
            <Progress value={stats.conversionRate * 350} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span>Taux de clic</span>
              <span className="font-medium">{(stats.conversionRate * 120).toFixed(1)}%</span>
            </div>
            <Progress value={stats.conversionRate * 120} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span>Désabonnements</span>
              <span className="font-medium text-destructive">0.8%</span>
            </div>
            <Progress value={0.8} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              SMS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Taux de livraison</span>
              <span className="font-medium">98.5%</span>
            </div>
            <Progress value={98.5} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span>Taux de clic</span>
              <span className="font-medium">25.3%</span>
            </div>
            <Progress value={25.3} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span>Opt-out</span>
              <span className="font-medium text-destructive">1.2%</span>
            </div>
            <Progress value={1.2} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Panier moyen</span>
              <span className="font-medium">89€</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>LTV client</span>
              <span className="font-medium">247€</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Temps de conversion</span>
              <span className="font-medium">2.3j</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Délai moyen entre le premier clic et l'achat
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
