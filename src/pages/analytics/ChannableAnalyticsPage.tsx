/**
 * Page Analytics avec design Channable
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { 
  ChannableStatsGrid,
  ChannableCategoryFilter
} from '@/components/channable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Eye,
  MousePointer,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  PieChart
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'

const timeCategories = [
  { id: '7d', label: '7 jours', icon: Calendar },
  { id: '30d', label: '30 jours', icon: Calendar },
  { id: '90d', label: '90 jours', icon: Calendar },
  { id: '1y', label: '1 an', icon: Calendar },
]

const revenueData = [
  { name: 'Lun', value: 4000, orders: 24 },
  { name: 'Mar', value: 3000, orders: 18 },
  { name: 'Mer', value: 5000, orders: 32 },
  { name: 'Jeu', value: 2780, orders: 16 },
  { name: 'Ven', value: 6890, orders: 45 },
  { name: 'Sam', value: 8239, orders: 56 },
  { name: 'Dim', value: 4490, orders: 28 },
]

const channelData = [
  { name: 'Shopify', value: 45, color: '#95BF47' },
  { name: 'Amazon', value: 25, color: '#FF9900' },
  { name: 'eBay', value: 15, color: '#E53238' },
  { name: 'Autres', value: 15, color: '#6B7280' },
]

const topProducts = [
  { name: 'Casque Bluetooth Pro', sales: 234, revenue: 11700, trend: 'up' },
  { name: 'Montre Connectée X1', sales: 189, revenue: 9450, trend: 'up' },
  { name: 'Écouteurs Sans Fil', sales: 156, revenue: 4680, trend: 'down' },
  { name: 'Chargeur Rapide USB-C', sales: 142, revenue: 2840, trend: 'up' },
  { name: 'Support Téléphone', sales: 128, revenue: 1920, trend: 'down' },
]

export default function ChannableAnalyticsPage() {
  const navigate = useNavigate()
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  const stats = [
    {
      label: 'Chiffre d\'affaires',
      value: '45,231€',
      icon: DollarSign,
      trend: '+12.5%',
      color: 'primary' as const,
      onClick: () => navigate('/reports')
    },
    {
      label: 'Commandes',
      value: '1,234',
      icon: ShoppingCart,
      trend: '+8.2%',
      color: 'success' as const,
      onClick: () => navigate('/orders')
    },
    {
      label: 'Visiteurs',
      value: '12,456',
      icon: Users,
      trend: '+15.3%',
      color: 'warning' as const
    },
    {
      label: 'Taux de conversion',
      value: '3.2%',
      icon: Target,
      trend: '+0.8%',
      color: 'primary' as const
    }
  ]

  const secondaryStats = [
    { label: 'Panier moyen', value: '67.50€', icon: ShoppingCart, trend: '+5.2%' },
    { label: 'Produits vendus', value: '2,847', icon: Package, trend: '+18.4%' },
    { label: 'Taux de rebond', value: '42.3%', icon: MousePointer, trend: '-3.1%' },
    { label: 'Pages vues', value: '45,678', icon: Eye, trend: '+22.6%' },
  ]

  return (
    <>
      <Helmet>
        <title>Analytics Avancés | ShopOpti</title>
        <meta name="description" content="Tableau de bord analytique complet" />
      </Helmet>

      <ChannablePageWrapper
        title="Analytics & Performance"
        subtitle="Business Intelligence"
        description="Analysez vos données en temps réel et prenez des décisions éclairées"
        heroImage="analytics"
        badge={{ label: 'Temps réel', icon: BarChart3 }}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        }
      >
        {/* Period Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <ChannableCategoryFilter
            categories={timeCategories.map(c => ({ ...c, count: 0 }))}
            selectedCategory={selectedPeriod}
            onSelectCategory={setSelectedPeriod}
            variant="compact"
          />
        </div>

        {/* Main Stats */}
        <ChannableStatsGrid stats={stats} />

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Revenus & Commandes</CardTitle>
                    <p className="text-sm text-muted-foreground">Évolution sur la période</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Channel Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5">
                    <PieChart className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Canaux de vente</CardTitle>
                    <p className="text-sm text-muted-foreground">Répartition</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {channelData.map((channel) => (
                    <div key={channel.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: channel.color }}
                        />
                        <span className="text-sm">{channel.name}</span>
                      </div>
                      <span className="text-sm font-medium">{channel.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Secondary Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-md transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.trend.startsWith('+') ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {stat.trend}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Produits les plus performants</CardTitle>
                  <p className="text-sm text-muted-foreground">Top 5 par ventes</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <motion.div
                    key={product.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} ventes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{product.revenue.toLocaleString()}€</span>
                      {product.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </ChannablePageWrapper>
    </>
  )
}
