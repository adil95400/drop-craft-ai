import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Globe,
  Megaphone,
  Mail,
  Share2,
  MousePointer,
  Users,
  DollarSign,
  ShoppingCart,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts'
import { toast } from 'sonner'

interface ChannelData {
  channel: string
  icon: any
  color: string
  revenue: number
  revenueChange: number
  orders: number
  ordersChange: number
  visitors: number
  visitorsChange: number
  conversionRate: number
  conversionChange: number
  avgOrderValue: number
  costPerAcquisition: number
  roi: number
}

const channelData: ChannelData[] = [
  {
    channel: 'Organic Search',
    icon: Globe,
    color: '#22c55e',
    revenue: 45230,
    revenueChange: 12.5,
    orders: 892,
    ordersChange: 8.3,
    visitors: 28500,
    visitorsChange: 15.2,
    conversionRate: 3.13,
    conversionChange: 0.4,
    avgOrderValue: 50.7,
    costPerAcquisition: 0,
    roi: 100
  },
  {
    channel: 'Paid Ads',
    icon: Megaphone,
    color: '#3b82f6',
    revenue: 32150,
    revenueChange: -5.2,
    orders: 645,
    ordersChange: -3.1,
    visitors: 15200,
    visitorsChange: 2.8,
    conversionRate: 4.24,
    conversionChange: -0.6,
    avgOrderValue: 49.8,
    costPerAcquisition: 12.5,
    roi: 298
  },
  {
    channel: 'Email Marketing',
    icon: Mail,
    color: '#a855f7',
    revenue: 18920,
    revenueChange: 22.1,
    orders: 423,
    ordersChange: 18.5,
    visitors: 8900,
    visitorsChange: 10.2,
    conversionRate: 4.75,
    conversionChange: 0.8,
    avgOrderValue: 44.7,
    costPerAcquisition: 2.8,
    roi: 1596
  },
  {
    channel: 'Social Media',
    icon: Share2,
    color: '#f97316',
    revenue: 12450,
    revenueChange: 35.8,
    orders: 298,
    ordersChange: 28.4,
    visitors: 22100,
    visitorsChange: 42.1,
    conversionRate: 1.35,
    conversionChange: 0.2,
    avgOrderValue: 41.8,
    costPerAcquisition: 8.5,
    roi: 392
  },
  {
    channel: 'Direct',
    icon: MousePointer,
    color: '#6b7280',
    revenue: 8750,
    revenueChange: 5.4,
    orders: 175,
    ordersChange: 4.2,
    visitors: 5200,
    visitorsChange: 3.8,
    conversionRate: 3.37,
    conversionChange: 0.1,
    avgOrderValue: 50.0,
    costPerAcquisition: 0,
    roi: 100
  }
]

const trendData = [
  { date: 'Lun', organic: 6200, paid: 4500, email: 2800, social: 1800, direct: 1200 },
  { date: 'Mar', organic: 6800, paid: 4200, email: 2600, social: 2100, direct: 1350 },
  { date: 'Mer', organic: 7100, paid: 4800, email: 3100, social: 1950, direct: 1180 },
  { date: 'Jeu', organic: 6500, paid: 4600, email: 2900, social: 2200, direct: 1290 },
  { date: 'Ven', organic: 7800, paid: 5100, email: 3400, social: 2450, direct: 1420 },
  { date: 'Sam', organic: 5200, paid: 3200, email: 1800, social: 1650, direct: 980 },
  { date: 'Dim', organic: 4800, paid: 2900, email: 1500, social: 1400, direct: 850 }
]

const pieData = channelData.map(c => ({
  name: c.channel,
  value: c.revenue,
  color: c.color
}))

export function ChannelSegmentationAnalytics() {
  const [period, setPeriod] = useState('7d')
  const [refreshing, setRefreshing] = useState(false)

  const totalRevenue = channelData.reduce((sum, c) => sum + c.revenue, 0)
  const totalOrders = channelData.reduce((sum, c) => sum + c.orders, 0)
  const totalVisitors = channelData.reduce((sum, c) => sum + c.visitors, 0)

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setRefreshing(false)
    toast.success('Données actualisées')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Segmentation par Canal
          </h2>
          <p className="text-muted-foreground">
            Analysez les performances de chaque canal d'acquisition
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">Cette année</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenu Total</p>
                <p className="text-2xl font-bold text-green-500">
                  {totalRevenue.toLocaleString('fr-FR')}€
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commandes Totales</p>
                <p className="text-2xl font-bold text-blue-500">
                  {totalOrders.toLocaleString('fr-FR')}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visiteurs Totaux</p>
                <p className="text-2xl font-bold text-purple-500">
                  {totalVisitors.toLocaleString('fr-FR')}
                </p>
              </div>
              <Eye className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="comparison">Comparaison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Répartition du Revenu</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${value.toLocaleString()}€`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {pieData.map((item, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      style={{ borderColor: item.color, color: item.color }}
                    >
                      {item.name.split(' ')[0]}: {((item.value / totalRevenue) * 100).toFixed(1)}%
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Channel Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Détails par Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {channelData.map((channel, idx) => {
                    const Icon = channel.icon
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div 
                            className="p-2 rounded-lg" 
                            style={{ backgroundColor: `${channel.color}20` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: channel.color }} />
                          </div>
                          <div>
                            <p className="font-medium">{channel.channel}</p>
                            <p className="text-sm text-muted-foreground">
                              {channel.orders} commandes • {channel.visitors.toLocaleString()} visiteurs
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{channel.revenue.toLocaleString()}€</p>
                            <p className={`text-xs flex items-center justify-end gap-1 ${channel.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {channel.revenueChange >= 0 ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {Math.abs(channel.revenueChange)}%
                            </p>
                          </div>
                          <Badge 
                            className={channel.conversionRate >= 3 ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}
                          >
                            CVR: {channel.conversionRate}%
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Évolution du Revenu par Canal</CardTitle>
              <CardDescription>Performance quotidienne des différents canaux</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEmail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => `${value.toLocaleString()}€`}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="organic" name="Organic" stroke="#22c55e" fillOpacity={1} fill="url(#colorOrganic)" />
                  <Area type="monotone" dataKey="paid" name="Paid Ads" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPaid)" />
                  <Area type="monotone" dataKey="email" name="Email" stroke="#a855f7" fillOpacity={1} fill="url(#colorEmail)" />
                  <Area type="monotone" dataKey="social" name="Social" stroke="#f97316" fillOpacity={0.3} fill="#f97316" />
                  <Area type="monotone" dataKey="direct" name="Direct" stroke="#6b7280" fillOpacity={0.3} fill="#6b7280" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparaison des Métriques</CardTitle>
              <CardDescription>ROI et CPA par canal</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="channel" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="roi" name="ROI (%)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costPerAcquisition" name="CPA (€)" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
