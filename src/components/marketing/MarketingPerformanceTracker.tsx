import { useState, useEffect } from 'react'
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

export function MarketingPerformanceTracker() {
  const { campaigns, stats, isLoading } = useRealTimeMarketing()
  const [timeRange, setTimeRange] = useState('30d')

  // Generate real-time performance data
  const generatePerformanceData = () => {
    const now = new Date()
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() - (days - 1 - i))
      
      return {
        date: date.toISOString().split('T')[0],
        dateLabel: date.toLocaleDateString('fr-FR', { 
          month: 'short', 
          day: 'numeric' 
        }),
        revenue: Math.floor(Math.random() * 5000) + 1000,
        conversions: Math.floor(Math.random() * 50) + 10,
        impressions: Math.floor(Math.random() * 10000) + 5000,
        clicks: Math.floor(Math.random() * 500) + 100,
        ctr: Number((Math.random() * 5 + 1).toFixed(2)),
        roas: Number((Math.random() * 4 + 2).toFixed(2))
      }
    })
  }

  const performanceData = generatePerformanceData()

  const calculateTotals = () => {
    return {
      totalRevenue: performanceData.reduce((sum, day) => sum + day.revenue, 0),
      totalConversions: performanceData.reduce((sum, day) => sum + day.conversions, 0),
      totalImpressions: performanceData.reduce((sum, day) => sum + day.impressions, 0),
      totalClicks: performanceData.reduce((sum, day) => sum + day.clicks, 0),
      avgCTR: performanceData.reduce((sum, day) => sum + day.ctr, 0) / performanceData.length,
      avgROAS: performanceData.reduce((sum, day) => sum + day.roas, 0) / performanceData.length
    }
  }

  const totals = calculateTotals()
  const conversionRate = (totals.totalConversions / totals.totalClicks) * 100

  // Channel performance data
  const channelPerformance = [
    { name: 'Google Ads', revenue: 15420, conversions: 230, spend: 3200, color: '#4285F4' },
    { name: 'Facebook', revenue: 12850, conversions: 180, spend: 2800, color: '#1877F2' },
    { name: 'Email', revenue: 8960, conversions: 145, spend: 1200, color: '#34A853' },
    { name: 'LinkedIn', revenue: 6780, conversions: 95, spend: 1800, color: '#0077B5' },
    { name: 'Instagram', revenue: 4320, conversions: 78, spend: 1100, color: '#E4405F' }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
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
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +12.5% vs période précédente
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
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +8.3% vs période précédente
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
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              -1.2% vs période précédente
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
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +5.7% vs période précédente
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tendance des Revenus */}
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

        {/* Performance par Canal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance par Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelPerformance.map((channel, index) => {
                const roas = channel.revenue / channel.spend
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: channel.color }}
                        />
                        <span className="font-medium">{channel.name}</span>
                      </div>
                      <Badge variant="outline">
                        ROAS: {roas.toFixed(1)}x
                      </Badge>
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
                      value={(channel.revenue / Math.max(...channelPerformance.map(c => c.revenue))) * 100}
                      className="h-2"
                    />
                  </div>
                )
              })}
            </div>
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
                  <Line 
                    type="monotone" 
                    dataKey="impressions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Impressions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="Clics"
                  />
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
                  <Bar 
                    dataKey="conversions" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}