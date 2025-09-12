import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Package,
  DollarSign,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  Target
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const userGrowthData = [
  { month: 'Jan', users: 1200, active: 800, premium: 120 },
  { month: 'Fév', users: 1350, active: 920, premium: 145 },
  { month: 'Mar', users: 1580, active: 1100, premium: 180 },
  { month: 'Avr', users: 1420, active: 980, premium: 165 },
  { month: 'Mai', users: 1680, active: 1250, premium: 220 },
  { month: 'Jun', users: 1890, active: 1420, premium: 280 },
]

const salesData = [
  { day: 'Lun', sales: 2400, orders: 45, avg: 53 },
  { day: 'Mar', sales: 1398, orders: 32, avg: 44 },
  { day: 'Mer', sales: 9800, orders: 78, avg: 126 },
  { day: 'Jeu', sales: 3908, orders: 56, avg: 70 },
  { day: 'Ven', sales: 4800, orders: 65, avg: 74 },
  { day: 'Sam', sales: 3800, orders: 58, avg: 66 },
  { day: 'Dim', sales: 4300, orders: 62, avg: 69 },
]

const deviceData = [
  { name: 'Desktop', value: 45, color: '#8884d8' },
  { name: 'Mobile', value: 40, color: '#82ca9d' },
  { name: 'Tablet', value: 15, color: '#ffc658' },
]

const trafficSources = [
  { source: 'Organique', sessions: 12500, bounce: 32, duration: '2:45' },
  { source: 'Payant', sessions: 8200, bounce: 28, duration: '3:12' },
  { source: 'Social', sessions: 5600, bounce: 45, duration: '1:58' },
  { source: 'Email', sessions: 3200, bounce: 22, duration: '4:05' },
  { source: 'Direct', sessions: 9800, bounce: 35, duration: '2:28' },
]

const topProducts = [
  { name: 'Produit A', sales: 1250, revenue: 45600, growth: 12.5 },
  { name: 'Produit B', sales: 980, revenue: 38200, growth: 8.2 },
  { name: 'Produit C', sales: 875, revenue: 29800, growth: -2.1 },
  { name: 'Produit D', sales: 720, revenue: 25400, growth: 15.8 },
  { name: 'Produit E', sales: 650, revenue: 22100, growth: 6.3 },
]

export const SystemAnalytics = () => {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState('7d')
  const { toast } = useToast()

  const handleExport = () => {
    toast({
      title: "Export en cours",
      description: "Le rapport d'analytics sera téléchargé dans quelques instants",
    })
  }

  const refreshData = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Données actualisées",
        description: "Les analytics ont été mises à jour",
      })
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Avancées</h2>
          <p className="text-muted-foreground">
            Analysez les performances détaillées de votre plateforme
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="traffic">Trafic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions Totales</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42,547</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12.5%</span> vs période précédente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.24%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+0.3%</span> vs période précédente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Durée Moyenne</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2:43</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-600">-0:12</span> vs période précédente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Rebond</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">34.2%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">-2.1%</span> vs période précédente
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Croissance Utilisateurs (6 mois)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="active" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Appareil</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ventes par Jour (Cette Semaine)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#8884d8" />
                  <Bar dataKey="orders" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">{product.sales} ventes</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">€{product.revenue.toLocaleString()}</div>
                      <div className={`text-sm ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.growth > 0 ? '+' : ''}{product.growth}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sources de Trafic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{source.source}</h4>
                      <p className="text-sm text-muted-foreground">{source.sessions.toLocaleString()} sessions</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Rebond: {source.bounce}%</div>
                      <div className="text-sm">Durée: {source.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}