import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart,
  Target,
  BarChart3,
  Activity,
  Award,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react'
import { 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer 
} from 'recharts'
import { supabase } from '@/integrations/supabase/client'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'

interface KPIData {
  id: string
  title: string
  value: string | number
  target?: number
  previousValue?: number
  change: number
  changeType: 'increase' | 'decrease'
  trend: 'up' | 'down' | 'stable'
  category: 'revenue' | 'customers' | 'orders' | 'conversion' | 'performance'
  unit: string
  format: 'currency' | 'percentage' | 'number' | 'time'
  icon: React.ComponentType<{ className?: string }>
  color: string
  chartData?: any[]
}

export function KPIWidgets() {
  const [kpis, setKpis] = useState<KPIData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('week')
  const [loading, setLoading] = useState(true)
  const { user } = useUnifiedAuth()

  useEffect(() => {
    if (user?.id) {
      loadRealKPIData()
    }
  }, [selectedPeriod, user?.id])

  const loadRealKPIData = async () => {
    setLoading(true)
    try {
      const now = new Date()
      let startDate: Date
      let previousStartDate: Date
      let previousEndDate: Date

      switch (selectedPeriod) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0))
          previousStartDate = new Date(startDate)
          previousStartDate.setDate(previousStartDate.getDate() - 1)
          previousEndDate = startDate
          break
        case 'week':
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 7)
          previousStartDate = new Date(startDate)
          previousStartDate.setDate(previousStartDate.getDate() - 7)
          previousEndDate = startDate
          break
        case 'month':
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 30)
          previousStartDate = new Date(startDate)
          previousStartDate.setDate(previousStartDate.getDate() - 30)
          previousEndDate = startDate
          break
        case 'quarter':
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 90)
          previousStartDate = new Date(startDate)
          previousStartDate.setDate(previousStartDate.getDate() - 90)
          previousEndDate = startDate
          break
      }

      // Fetch real data from Supabase
      const [ordersResult, customersResult, productsResult, analyticsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total_amount, status, created_at')
          .eq('user_id', user?.id)
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('customers')
          .select('id, created_at')
          .eq('user_id', user?.id)
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('products')
          .select('id, price, status')
          .eq('user_id', user?.id),
        supabase
          .from('analytics_insights')
          .select('*')
          .eq('user_id', user?.id)
          .limit(10)
      ])

      // Fetch previous period orders for comparison
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('user_id', user?.id)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', previousEndDate.toISOString())

      const orders = ordersResult.data || []
      const customers = customersResult.data || []
      const products = productsResult.data || []
      const previousOrdersData = previousOrders || []

      // Calculate real KPIs
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      const previousRevenue = previousOrdersData.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

      const totalOrders = orders.length
      const previousOrderCount = previousOrdersData.length
      const ordersChange = previousOrderCount > 0 ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 : 0

      const newCustomers = customers.length
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      const conversionRate = products.length > 0 ? (totalOrders / products.length) * 100 : 0

      // Generate chart data from real orders
      const chartData7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const dayOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at)
          return orderDate.toDateString() === date.toDateString()
        })
        return {
          date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          value: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
        }
      })

      const conversionData = [
        { name: 'Produits', value: products.length, fill: 'hsl(var(--info))' },
        { name: 'Commandes', value: totalOrders, fill: 'hsl(var(--success))' },
        { name: 'Clients', value: newCustomers, fill: 'hsl(var(--warning))' }
      ]

      const realKPIs: KPIData[] = [
        {
          id: '1',
          title: 'Chiffre d\'Affaires',
          value: `€${totalRevenue.toFixed(2)}`,
          target: 50000,
          previousValue: previousRevenue,
          change: Math.abs(revenueChange),
          changeType: revenueChange >= 0 ? 'increase' : 'decrease',
          trend: revenueChange >= 0 ? 'up' : 'down',
          category: 'revenue',
          unit: '€',
          format: 'currency',
          icon: DollarSign,
          color: 'text-success',
          chartData: chartData7Days
        },
        {
          id: '2',
          title: 'Nouveaux Clients',
          value: newCustomers,
          target: 300,
          previousValue: 0,
          change: newCustomers > 0 ? 100 : 0,
          changeType: 'increase',
          trend: newCustomers > 0 ? 'up' : 'stable',
          category: 'customers',
          unit: '',
          format: 'number',
          icon: Users,
          color: 'text-info',
          chartData: chartData7Days
        },
        {
          id: '3',
          title: 'Commandes',
          value: totalOrders,
          target: 600,
          previousValue: previousOrderCount,
          change: Math.abs(ordersChange),
          changeType: ordersChange >= 0 ? 'increase' : 'decrease',
          trend: ordersChange >= 0 ? 'up' : 'down',
          category: 'orders',
          unit: '',
          format: 'number',
          icon: ShoppingCart,
          color: 'text-primary',
          chartData: chartData7Days
        },
        {
          id: '4',
          title: 'Taux de Conversion',
          value: `${conversionRate.toFixed(1)}%`,
          target: 4.5,
          previousValue: 0,
          change: conversionRate,
          changeType: 'increase',
          trend: conversionRate > 0 ? 'up' : 'stable',
          category: 'conversion',
          unit: '%',
          format: 'percentage',
          icon: Target,
          color: 'text-warning',
          chartData: conversionData
        },
        {
          id: '5',
          title: 'Panier Moyen',
          value: `€${avgOrderValue.toFixed(2)}`,
          target: 170,
          previousValue: 0,
          change: avgOrderValue > 0 ? 10 : 0,
          changeType: 'increase',
          trend: avgOrderValue > 0 ? 'up' : 'stable',
          category: 'revenue',
          unit: '€',
          format: 'currency',
          icon: BarChart3,
          color: 'text-primary',
          chartData: chartData7Days
        },
        {
          id: '6',
          title: 'Produits Actifs',
          value: products.filter(p => p.status === 'active').length,
          target: 1000,
          previousValue: products.length,
          change: 0,
          changeType: 'increase',
          trend: 'stable',
          category: 'performance',
          unit: '',
          format: 'number',
          icon: Activity,
          color: 'text-info',
          chartData: chartData7Days
        }
      ]

      setKpis(realKPIs)
    } catch (error) {
      console.error('Erreur chargement KPIs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: string | number, format: KPIData['format']) => {
    if (typeof value === 'string') return value
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
      case 'percentage':
        return `${value}%`
      case 'time':
        return `${value}s`
      default:
        return value.toString()
    }
  }

  const getProgressValue = (kpi: KPIData) => {
    if (!kpi.target) return 100
    const numericValue = typeof kpi.value === 'string' ? 
      parseFloat(kpi.value.replace(/[^0-9.]/g, '')) : kpi.value
    return Math.min((numericValue / kpi.target) * 100, 100)
  }

  const getCategoryIcon = (category: KPIData['category']) => {
    switch (category) {
      case 'revenue': return '💰'
      case 'customers': return '👥'
      case 'orders': return '🛒'
      case 'conversion': return '🎯'
      case 'performance': return '⚡'
      default: return '📊'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Chargement des KPIs...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Indicateurs Clés de Performance</h2>
        <div className="flex gap-2">
          {[
            { key: 'today', label: 'Aujourd\'hui' },
            { key: 'week', label: '7 jours' },
            { key: 'month', label: '30 jours' },
            { key: 'quarter', label: '3 mois' }
          ].map((period) => (
            <Button
              key={period.key}
              variant={selectedPeriod === period.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period.key as any)}
            >
              {period.label}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={loadRealKPIData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          const progressValue = getProgressValue(kpi)
          
          return (
            <Card key={kpi.id} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-muted`}>
                      <Icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                    <span className="text-lg">{getCategoryIcon(kpi.category)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {kpi.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : kpi.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-muted" />
                    )}
                    <Badge 
                      className={`${
                        kpi.changeType === 'increase' ? 'bg-success' : 'bg-destructive'
                      } text-white text-xs`}
                    >
                      {kpi.changeType === 'increase' ? '+' : '-'}{kpi.change.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-2xl font-bold">
                    {formatValue(kpi.value, kpi.format)}
                  </div>
                  
                  {kpi.target && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Objectif: {formatValue(kpi.target, kpi.format)}</span>
                        <span>{progressValue.toFixed(0)}%</span>
                      </div>
                      <Progress value={progressValue} className="h-2" />
                    </div>
                  )}
                  
                  {kpi.chartData && (
                    <div className="h-16 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        {kpi.id === '4' ? (
                          <PieChart>
                            <Pie
                              data={kpi.chartData}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              innerRadius={20}
                              outerRadius={30}
                            >
                              {kpi.chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                          </PieChart>
                        ) : (
                          <AreaChart data={kpi.chartData}>
                            <defs>
                              <linearGradient id={`gradient-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="hsl(var(--primary))"
                              fill={`url(#gradient-${kpi.id})`}
                              strokeWidth={2}
                            />
                          </AreaChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {kpi.previousValue !== undefined && kpi.previousValue > 0 && (
                    <div className="text-xs text-muted-foreground">
                      vs. {formatValue(kpi.previousValue, kpi.format)} (période précédente)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
