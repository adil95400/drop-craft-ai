import { Card } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, ShoppingCart, Users, Package, DollarSign, BarChart3 } from 'lucide-react'
import { ChannablePageLayout, ChannablePageHero, ChannableStatsGrid } from '@/components/channable'

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))']

export default function AnalyticsDashboard() {
  const { data: orders } = useQuery({
    queryKey: ['analytics-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: products } = useQuery({
    queryKey: ['analytics-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*')
      if (error) throw error
      return data
    },
  })

  const { data: customers } = useQuery({
    queryKey: ['analytics-customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*')
      if (error) throw error
      return data
    },
  })

  const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
  const totalOrders = orders?.length || 0
  const totalProducts = products?.length || 0
  const totalCustomers = customers?.length || 0

  const ordersByStatus = orders?.reduce((acc: any, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {})

  const statusData = Object.entries(ordersByStatus || {}).map(([name, value]) => ({ name, value }))

  const revenueByMonth = orders?.reduce((acc: any, order) => {
    const month = new Date(order.created_at).toLocaleString('default', { month: 'short' })
    if (!acc[month]) acc[month] = 0
    acc[month] += order.total_amount
    return acc
  }, {})

  const revenueData = Object.entries(revenueByMonth || {}).map(([month, revenue]) => ({ month, revenue }))

  const statsItems = [
    {
      label: 'Revenu Total',
      value: `€${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      change: 12,
      changeLabel: 'vs mois dernier',
      color: 'success' as const
    },
    {
      label: 'Commandes',
      value: totalOrders.toString(),
      icon: ShoppingCart,
      change: 8,
      changeLabel: 'vs mois dernier',
      color: 'primary' as const
    },
    {
      label: 'Produits',
      value: totalProducts.toString(),
      icon: Package,
      change: 5,
      changeLabel: 'nouveaux ce mois',
      color: 'info' as const
    },
    {
      label: 'Clients',
      value: totalCustomers.toString(),
      icon: Users,
      change: 15,
      changeLabel: 'vs mois dernier',
      color: 'warning' as const
    }
  ]

  return (
    <ChannablePageLayout title="Analytics Dashboard" maxWidth="2xl">
      {/* Hero Section */}
      <ChannablePageHero
        title="Analytics Dashboard"
        subtitle="Business Intelligence"
        description="Suivez les performances de votre boutique en temps réel avec des métriques détaillées et des visualisations avancées."
        icon={BarChart3}
        category="analytics"
        badge={{ label: "Temps réel", icon: TrendingUp }}
      />

      {/* Stats Grid */}
      <ChannableStatsGrid stats={statsItems} columns={4} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 border-border/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Tendance des revenus
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 border-border/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Commandes par statut
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={100}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="p-6 border-border/50">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Métriques de performance
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Panier moyen</span>
            </div>
            <p className="text-3xl font-bold">
              €{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">LTV Client</span>
            </div>
            <p className="text-3xl font-bold">
              €{totalCustomers > 0 ? (totalRevenue / totalCustomers).toFixed(2) : '0.00'}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Taux conversion</span>
            </div>
            <p className="text-3xl font-bold">
              {totalCustomers > 0 ? ((totalOrders / totalCustomers) * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
        </div>
      </Card>
    </ChannablePageLayout>
  )
}
