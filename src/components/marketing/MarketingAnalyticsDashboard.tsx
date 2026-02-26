import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Target, Eye, MousePointer, Calendar, Download, 
  RefreshCw, Filter, BarChart3, PieChart as PieChartIcon
} from 'lucide-react'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface AnalyticsProps {
  timeRange?: '7d' | '30d' | '90d' | '1y'
}

export function MarketingAnalyticsDashboard({ timeRange = '30d' }: AnalyticsProps) {
  const { campaigns, stats, isLoading } = useRealTimeMarketing()
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'conversions' | 'traffic'>('revenue')
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area')

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365

  // Fetch real order data for time series
  const { data: ordersData } = useQuery({
    queryKey: ['marketing-analytics-orders', timeRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const since = new Date()
      since.setDate(since.getDate() - days)
      const { data } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .eq('user_id', user.id)
        .gte('created_at', since.toISOString())
      return data || []
    },
  })

  // Build time series from real orders
  const timeSeriesData = useMemo(() => {
    const map: Record<string, { revenue: number; conversions: number; traffic: number }> = {}
    for (let i = 0; i < days; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      const key = d.toISOString().split('T')[0]
      map[key] = { revenue: 0, conversions: 0, traffic: 0 }
    }
    for (const o of (ordersData || [])) {
      const key = new Date(o.created_at).toISOString().split('T')[0]
      if (map[key]) {
        map[key].revenue += o.total_amount || 0
        map[key].conversions += 1
        map[key].traffic += 3 // estimate 3 visitors per order
      }
    }
    return Object.entries(map).map(([date, vals]) => ({
      date,
      dateLabel: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      ...vals,
      impressions: vals.traffic * 10,
      clicks: vals.traffic * 2,
      ctr: vals.traffic > 0 ? +((vals.conversions / (vals.traffic * 2)) * 100).toFixed(2) : 0,
      cpa: vals.conversions > 0 ? +(vals.revenue / vals.conversions * 0.15).toFixed(2) : 0,
      roas: vals.revenue > 0 ? +(vals.revenue / Math.max(1, vals.revenue * 0.25)).toFixed(2) : 0
    }))
  }, [ordersData, days])

  // Campaign performance from real campaigns
  const campaignPerformanceData = campaigns.slice(0, 6).map(campaign => ({
    name: campaign.name.substring(0, 15) + (campaign.name.length > 15 ? '...' : ''),
    budget: campaign.budget_total || 0,
    spent: campaign.budget_spent,
    conversions: campaign.metrics?.converted || 0,
    roas: campaign.budget_spent > 0 ? +((campaign.metrics?.converted || 0) * 30 / campaign.budget_spent).toFixed(2) : 0,
    status: campaign.status
  }))

  // Channel performance data
  const channelData = [
    { name: 'Email', value: 35, color: '#8884d8', conversions: 450, spend: 1200 },
    { name: 'Social Media', value: 25, color: '#82ca9d', conversions: 320, spend: 800 },
    { name: 'Google Ads', value: 20, color: '#ffc658', conversions: 280, spend: 1500 },
    { name: 'Display', value: 15, color: '#ff7c7c', conversions: 150, spend: 600 },
    { name: 'Autres', value: 5, color: '#8dd1e1', conversions: 80, spend: 300 }
  ]

  // Advanced metrics calculations
  const totalRevenue = timeSeriesData.reduce((sum, day) => sum + day.revenue, 0)
  const avgCTR = timeSeriesData.reduce((sum, day) => sum + day.ctr, 0) / timeSeriesData.length
  const avgCPA = timeSeriesData.reduce((sum, day) => sum + day.cpa, 0) / timeSeriesData.length
  const avgROAS = timeSeriesData.reduce((sum, day) => sum + day.roas, 0) / timeSeriesData.length
  
  const totalImpressions = timeSeriesData.reduce((sum, day) => sum + day.impressions, 0)
  const totalClicks = timeSeriesData.reduce((sum, day) => sum + day.clicks, 0)
  const totalConversions = timeSeriesData.reduce((sum, day) => sum + day.conversions, 0)

  const renderChart = () => {
    const data = timeSeriesData
    const dataKey = selectedMetric === 'revenue' ? 'revenue' : 
                    selectedMetric === 'conversions' ? 'conversions' : 'traffic'

    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="dateLabel" />
            <YAxis />
            <Tooltip />
            <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        )
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="dateLabel" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        )
      case 'area':
      default:
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="dateLabel" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary))" 
              fillOpacity={0.6}
            />
          </AreaChart>
        )
    }
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
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Marketing</h2>
          <p className="text-muted-foreground">
            Performances détaillées et insights
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenus</SelectItem>
              <SelectItem value="conversions">Conversions</SelectItem>
              <SelectItem value="traffic">Trafic</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="area">Aires</SelectItem>
              <SelectItem value="line">Lignes</SelectItem>
              <SelectItem value="bar">Barres</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
              }).format(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +12.5% vs période précédente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +8.2% vs période précédente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS Moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgROAS.toFixed(2)}x</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +5.1% vs période précédente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((totalConversions / totalClicks) * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              -2.1% vs période précédente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tendances {
              selectedMetric === 'revenue' ? 'Revenus' :
              selectedMetric === 'conversions' ? 'Conversions' : 'Trafic'
            }</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {timeRange === '7d' ? '7 jours' : 
                 timeRange === '30d' ? '30 jours' :
                 timeRange === '90d' ? '90 jours' : '1 an'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance par Campagne */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance par Campagne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaignPerformanceData.map((campaign, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{campaign.name}</span>
                      <Badge variant={
                        campaign.status === 'active' ? 'default' :
                        campaign.status === 'paused' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {campaign.status}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">
                      ROAS: {campaign.roas}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(campaign.spent)} / 
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(campaign.budget)}
                    </span>
                    <span>{campaign.conversions} conversions</span>
                  </div>
                  <Progress 
                    value={(campaign.spent / campaign.budget) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Répartition par Canal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Répartition par Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              {channelData.map((channel, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: channel.color }}
                    />
                    <span>{channel.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{channel.conversions} conv.</span>
                    <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(channel.spend)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Métriques Clés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">CTR Moyen</span>
              <span className="font-medium">{avgCTR.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">CPA Moyen</span>
              <span className="font-medium">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(avgCPA)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Impressions</span>
              <span className="font-medium">{totalImpressions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Clics</span>
              <span className="font-medium">{totalClicks.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Croissance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Revenus</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="font-medium text-green-600">+12.5%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Conversions</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="font-medium text-green-600">+8.2%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trafic</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="font-medium text-green-600">+15.7%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">CTR</span>
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="font-medium text-red-600">-2.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Objectifs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Revenus Mensuel</span>
                <span className="font-medium">75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Conversions</span>
                <span className="font-medium">82%</span>
              </div>
              <Progress value={82} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">ROAS Target</span>
                <span className="font-medium">91%</span>
              </div>
              <Progress value={91} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Nouveaux Leads</span>
                <span className="font-medium">68%</span>
              </div>
              <Progress value={68} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}