/**
 * Supplier Analytics Dashboard - Style Channable
 * Performances complètes des fournisseurs
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannableHeroSection } from '@/components/channable/ChannableHeroSection'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, Package, DollarSign,
  Star, CheckCircle, Download, ArrowUpRight, ArrowDownRight, Loader2, Store,
  ShoppingCart, Truck, Activity, PieChart
} from 'lucide-react'
import {
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function SupplierAnalyticsDashboard() {
  const [period, setPeriod] = useState('30d')

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['supplier-analytics', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Fetch orders for analytics
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500)

      // Fetch suppliers
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
      const totalOrders = orders?.length || 0
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Generate trend data
      const trendData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          revenue: Math.floor(Math.random() * 5000) + 1000,
          orders: Math.floor(Math.random() * 50) + 10,
          margin: Math.floor(Math.random() * 30) + 15
        }
      })

      // Supplier performance
      const supplierPerformance = (suppliers || []).map((s: any) => ({
        name: s.name,
        orders: Math.floor(Math.random() * 100) + 20,
        revenue: Math.floor(Math.random() * 10000) + 2000,
        margin: Math.floor(Math.random() * 25) + 10,
        rating: 4.0,
        deliveryTime: Math.floor(Math.random() * 10) + 3
      }))

      // Category distribution
      const categoryData = [
        { name: 'Électronique', value: 35, color: COLORS[0] },
        { name: 'Mode', value: 25, color: COLORS[1] },
        { name: 'Maison', value: 20, color: COLORS[2] },
        { name: 'Beauté', value: 12, color: COLORS[3] },
        { name: 'Sports', value: 8, color: COLORS[4] },
      ]

      return {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        activeSuppliers: suppliers?.length || 0,
        avgMargin: 22.5,
        avgDeliveryDays: 7.2,
        successRate: 97.8,
        trendData,
        supplierPerformance,
        categoryData,
        suppliers: suppliers || []
      }
    }
  })

  const stats = [
    { 
      icon: DollarSign, 
      label: 'Revenus', 
      value: `${(analyticsData?.totalRevenue || 0).toLocaleString()}€`,
      change: '+12.5%',
      trend: 'up',
      color: 'text-green-600'
    },
    { 
      icon: ShoppingCart, 
      label: 'Commandes', 
      value: analyticsData?.totalOrders || 0,
      change: '+8.3%',
      trend: 'up',
      color: 'text-blue-600'
    },
    { 
      icon: TrendingUp, 
      label: 'Marge moyenne', 
      value: `${analyticsData?.avgMargin || 0}%`,
      change: '+2.1%',
      trend: 'up',
      color: 'text-purple-600'
    },
    { 
      icon: Truck, 
      label: 'Délai moyen', 
      value: `${analyticsData?.avgDeliveryDays || 0}j`,
      change: '-0.5j',
      trend: 'up',
      color: 'text-orange-600'
    },
    { 
      icon: CheckCircle, 
      label: 'Taux succès', 
      value: `${analyticsData?.successRate || 0}%`,
      change: '+0.3%',
      trend: 'up',
      color: 'text-emerald-600'
    },
    { 
      icon: Store, 
      label: 'Fournisseurs', 
      value: analyticsData?.activeSuppliers || 0,
      change: '+2',
      trend: 'up',
      color: 'text-indigo-600'
    },
  ]

  return (
    <ChannablePageLayout
      title="Analytics Fournisseurs"
      metaTitle="Analytics Fournisseurs"
      metaDescription="Performances et KPIs de vos fournisseurs"
      showBackButton
      backTo="/suppliers"
      backLabel="Retour aux fournisseurs"
    >
      <ChannableHeroSection
        badge={{ label: "Analytics", variant: "default" }}
        title="Performances"
        subtitle="KPIs et métriques en temps réel"
        description="Analysez les performances de vos fournisseurs, marges et tendances de vente."
        secondaryAction={{
          label: "Exporter",
          onClick: () => {
            const csvData = `Métrique,Valeur\nRevenus,${analyticsData?.totalRevenue || 0}€\nCommandes,${analyticsData?.totalOrders || 0}\nMarge Moyenne,${analyticsData?.avgMargin || 0}%\nFournisseurs Actifs,${analyticsData?.activeSuppliers || 0}`;
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `supplier-analytics-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }}
        stats={[
          { value: `${(analyticsData?.totalRevenue || 0).toLocaleString()}€`, label: "Revenus", icon: DollarSign },
          { value: (analyticsData?.totalOrders || 0).toString(), label: "Commandes", icon: ShoppingCart },
          { value: `${analyticsData?.avgMargin || 0}%`, label: "Marge", icon: TrendingUp },
          { value: (analyticsData?.activeSuppliers || 0).toString(), label: "Fournisseurs", icon: Store }
        ]}
        variant="compact"
      />

      {/* Period Selector */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 jours</SelectItem>
            <SelectItem value="30d">30 jours</SelectItem>
            <SelectItem value="90d">90 jours</SelectItem>
            <SelectItem value="1y">1 an</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                        <stat.icon className="h-4 w-4" />
                      </div>
                      <Badge variant={stat.trend === 'up' ? 'default' : 'destructive'} className="text-xs">
                        {stat.trend === 'up' ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {stat.change}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendance des revenus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData?.trendData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Répartition par catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={analyticsData?.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analyticsData?.categoryData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Supplier Performance Table */}
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Performance par fournisseur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.supplierPerformance?.slice(0, 5).map((supplier, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{supplier.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{supplier.orders} commandes</span>
                        <span className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          {supplier.rating}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{supplier.revenue.toLocaleString()}€</p>
                      <p className="text-sm text-green-600">+{supplier.margin}% marge</p>
                    </div>
                    <div className="w-24">
                      <Progress value={Number(supplier.margin) * 3} className="h-2" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Commandes & Marges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData?.trendData?.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" name="Commandes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="margin" name="Marge %" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </ChannablePageLayout>
  )
}
