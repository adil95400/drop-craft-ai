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
import { TrendingUp, ShoppingCart, Users, Package, DollarSign } from 'lucide-react'

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

  const statusData = Object.entries(ordersByStatus || {}).map(([name, value]) => ({
    name,
    value,
  }))

  const revenueByMonth = orders?.reduce((acc: any, order) => {
    const month = new Date(order.created_at).toLocaleString('default', { month: 'short' })
    if (!acc[month]) acc[month] = 0
    acc[month] += order.total_amount
    return acc
  }, {})

  const revenueData = Object.entries(revenueByMonth || {}).map(([month, revenue]) => ({
    month,
    revenue,
  }))

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track your business performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Package className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{totalCustomers}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Avg Order Value</span>
            </div>
            <p className="text-2xl font-bold">
              €{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Customer LTV</span>
            </div>
            <p className="text-2xl font-bold">
              €{totalCustomers > 0 ? (totalRevenue / totalCustomers).toFixed(2) : '0.00'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
            </div>
            <p className="text-2xl font-bold">
              {totalCustomers > 0
                ? ((totalOrders / totalCustomers) * 100).toFixed(1)
                : '0.0'}
              %
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
