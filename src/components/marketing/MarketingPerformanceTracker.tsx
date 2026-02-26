import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Eye, MousePointer, Target, Calendar, Download
} from 'lucide-react'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function MarketingPerformanceTracker() {
  const { campaigns, stats, isLoading } = useRealTimeMarketing()
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState('30d')

  // Fetch real ad campaign data from database
  const { data: adCampaigns = [] } = useQuery({
    queryKey: ['ad-campaigns-performance', user?.id, timeRange],
    queryFn: async () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('user_id', user!.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  // Build performance data from real campaigns, grouped by date
  const performanceData = (() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const now = new Date()
    const grouped: Record<string, { revenue: number; conversions: number; impressions: number; clicks: number }> = {}

    // Initialize all days with zeros
    for (let i = 0; i < days; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - (days - 1 - i))
      const key = date.toISOString().split('T')[0]
      grouped[key] = { revenue: 0, conversions: 0, impressions: 0, clicks: 0 }
    }

    // Aggregate real campaign data by date
    for (const campaign of adCampaigns) {
      const dateKey = new Date(campaign.created_at).toISOString().split('T')[0]
      if (grouped[dateKey]) {
        grouped[dateKey].revenue += (campaign.spend || 0) * (campaign.roas || 0)
        grouped[dateKey].conversions += campaign.conversions || 0
        grouped[dateKey].impressions += campaign.impressions || 0
        grouped[dateKey].clicks += campaign.clicks || 0
      }
    }

    return Object.entries(grouped).map(([date, data]) => {
      const d = new Date(date)
      return {
        date,
        dateLabel: d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        revenue: Math.round(data.revenue),
        conversions: data.conversions,
        impressions: data.impressions,
        clicks: data.clicks,
        ctr: data.impressions > 0 ? Number(((data.clicks / data.impressions) * 100).toFixed(2)) : 0,
        roas: data.clicks > 0 && data.revenue > 0 ? Number((data.revenue / (data.clicks * 0.5)).toFixed(2)) : 0,
      }
    })
  })()

  const calculateTotals = () => {
    return {
      totalRevenue: performanceData.reduce((sum, day) => sum + day.revenue, 0),
      totalConversions: performanceData.reduce((sum, day) => sum + day.conversions, 0),
      totalImpressions: performanceData.reduce((sum, day) => sum + day.impressions, 0),
      totalClicks: performanceData.reduce((sum, day) => sum + day.clicks, 0),
      avgCTR: performanceData.length > 0 ? performanceData.reduce((sum, day) => sum + day.ctr, 0) / performanceData.length : 0,
      avgROAS: performanceData.length > 0 ? performanceData.reduce((sum, day) => sum + day.roas, 0) / performanceData.length : 0
    }
  }

  const totals = calculateTotals()
  const conversionRate = totals.totalClicks > 0 ? (totals.totalConversions / totals.totalClicks) * 100 : 0

  // Channel performance from real campaigns
  const channelPerformance = (() => {
    const channelColors: Record<string, string> = {
      'google': '#4285F4', 'facebook': '#1877F2', 'email': '#34A853',
      'linkedin': '#0077B5', 'instagram': '#E4405F', 'tiktok': '#000000'
    }
    const byPlatform: Record<string, { revenue: number; conversions: number; spend: number }> = {}
    
    for (const c of adCampaigns) {
      const platform = c.platform || 'other'
      if (!byPlatform[platform]) byPlatform[platform] = { revenue: 0, conversions: 0, spend: 0 }
      byPlatform[platform].spend += c.spend || 0
      byPlatform[platform].conversions += c.conversions || 0
      byPlatform[platform].revenue += (c.spend || 0) * (c.roas || 0)
    }

    return Object.entries(byPlatform).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      revenue: Math.round(data.revenue),
      conversions: data.conversions,
      spend: Math.round(data.spend),
      color: channelColors[name.toLowerCase()] || '#888888'
    }))
  })()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs en Temps Réel */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {totals.totalRevenue > 0 ? (
                <><TrendingUp className="h-3 w-3 text-green-500 mr-1" />Données réelles</>
              ) : (
                <>Aucune donnée pour cette période</>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totals.totalConversions)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {adCampaigns.length} campagnes actives
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(2)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {totals.totalClicks > 0 ? `${formatNumber(totals.totalClicks)} clics` : 'Aucun clic enregistré'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.avgROAS.toFixed(2)}x</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {channelPerformance.length} canaux actifs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Tendance des Revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="dateLabel" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Revenus']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance par Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {channelPerformance.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Aucune campagne publicitaire enregistrée
              </div>
            ) : (
              <div className="space-y-4">
                {channelPerformance.map((channel, index) => {
                  const roas = channel.spend > 0 ? channel.revenue / channel.spend : 0
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <Badge variant="outline">ROAS: {roas.toFixed(1)}x</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <div className="font-medium text-foreground">{formatCurrency(channel.revenue)}</div>
                          <div>Revenus</div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{channel.conversions}</div>
                          <div>Conversions</div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{formatCurrency(channel.spend)}</div>
                          <div>Dépensé</div>
                        </div>
                      </div>
                      <Progress 
                        value={channelPerformance.length > 0 ? (channel.revenue / Math.max(...channelPerformance.map(c => c.revenue), 1)) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métriques Détaillées */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Impressions & Clics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="dateLabel" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" strokeWidth={2} name="Impressions" />
                  <Line type="monotone" dataKey="clicks" stroke="hsl(var(--secondary))" strokeWidth={2} name="Clics" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversions par Jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="dateLabel" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {channelPerformance.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Aucune donnée
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelPerformance}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="spend"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {channelPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
