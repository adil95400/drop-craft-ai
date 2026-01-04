import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, TrendingDown, Mail, Users, Target, 
  Eye, MousePointer, ShoppingCart, DollarSign,
  BarChart3, Activity, Calendar, Award
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const performanceData = [
  { date: '01/01', envois: 1200, ouvertures: 320, clics: 89, conversions: 23 },
  { date: '02/01', envois: 1350, ouvertures: 405, clics: 134, conversions: 31 },
  { date: '03/01', envois: 1180, ouvertures: 295, clics: 76, conversions: 19 },
  { date: '04/01', envois: 1420, ouvertures: 486, clics: 142, conversions: 38 },
  { date: '05/01', envois: 1650, ouvertures: 578, clics: 178, conversions: 45 },
  { date: '06/01', envois: 1480, ouvertures: 503, clics: 156, conversions: 41 },
  { date: '07/01', envois: 1720, ouvertures: 688, clics: 221, conversions: 58 }
]

const segmentData = [
  { name: 'Nouveaux clients', value: 35, color: '#3b82f6' },
  { name: 'Clients VIP', value: 25, color: '#10b981' },
  { name: 'Clients inactifs', value: 20, color: '#f59e0b' },
  { name: 'Panier abandonné', value: 20, color: '#ef4444' }
]

const topCampaigns = [
  {
    name: 'Promo Été 2024',
    type: 'Email',
    revenue: 12450,
    roi: 245.5,
    conversion: 17.5,
    status: 'active'
  },
  {
    name: 'Abandon Cart Recovery',
    type: 'Email',
    revenue: 8920,
    roi: 189.2,
    conversion: 25.0,
    status: 'active'
  },
  {
    name: 'Flash Sale SMS',
    type: 'SMS',
    revenue: 5680,
    roi: 156.8,
    conversion: 12.3,
    status: 'completed'
  },
  {
    name: 'Welcome Series',
    type: 'Email',
    revenue: 4230,
    roi: 134.7,
    conversion: 8.9,
    status: 'active'
  }
]

export const MarketingAnalytics: React.FC = () => {
  const totalRevenue = performanceData.reduce((sum, day) => sum + (day.conversions * 89), 0)
  const totalConversions = performanceData.reduce((sum, day) => sum + day.conversions, 0)
  const avgConversionRate = totalConversions / performanceData.reduce((sum, day) => sum + day.envois, 0) * 100

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()}€</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +12.5% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +2.3% vs semaine dernière
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ROI moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">187.3%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +18.7% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34.2%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
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
              <AreaChart data={performanceData}>
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
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.1}
                />
                <Area 
                  type="monotone" 
                  dataKey="ouvertures" 
                  stackId="2" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="clics" 
                  stackId="3" 
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="conversions" 
                  stackId="4" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
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
            {topCampaigns.map((campaign, index) => (
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
                    <div>ROI: <span className="font-medium text-green-600">{campaign.roi}%</span></div>
                    <div>Conv: <span className="font-medium">{campaign.conversion}%</span></div>
                    <div>Rev: <span className="font-medium">{campaign.revenue.toLocaleString()}€</span></div>
                  </div>
                </div>
              </div>
            ))}
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
              <span className="font-medium">35.2%</span>
            </div>
            <Progress value={35.2} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span>Taux de clic</span>
              <span className="font-medium">12.8%</span>
            </div>
            <Progress value={12.8} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span>Désabonnements</span>
              <span className="font-medium text-red-600">0.8%</span>
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
              <span className="font-medium text-red-600">1.2%</span>
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