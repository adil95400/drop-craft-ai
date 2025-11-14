import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Expense } from '@/types/database'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RealTimeProfitChart } from '@/components/profit/RealTimeProfitChart'
import { ROICalculator } from '@/components/profit/ROICalculator'
import { ExpenseTracker } from '@/components/profit/ExpenseTracker'
import { TrendingUp, DollarSign, Percent, AlertTriangle } from 'lucide-react'

export default function ProfitDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  // Fetch profit data
  const { data: profitData, isLoading } = useQuery({
    queryKey: ['profit-data', timeRange],
    queryFn: async () => {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('created_at', startDate.toISOString())

      if (ordersError) throw ordersError

      // Fetch expenses
      const { data: expenses, error: expensesError } = (await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate.toISOString())) as any

      if (expensesError) throw expensesError

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      const totalExpenses = (expenses as Expense[])?.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) || 0
      const netProfit = totalRevenue - totalExpenses
      const avgMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0

      // Calculate daily profit
      const dailyProfit: any[] = []
      orders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('fr-FR')
        const existing = dailyProfit.find(d => d.date === date)
        
        if (existing) {
          existing.revenue += order.total_amount
        } else {
          dailyProfit.push({ date, revenue: order.total_amount, expenses: 0, profit: 0 })
        }
      })

      // Add expenses to daily profit
      (expenses as Expense[])?.forEach(expense => {
        const date = new Date(expense.date).toLocaleDateString('fr-FR')
        const existing = dailyProfit?.find(d => d.date === date)
        
        if (existing) {
          existing.expenses += Number(expense.amount || 0)
        } else {
          dailyProfit?.push({ date, revenue: 0, expenses: Number(expense.amount || 0), profit: 0 })
        }
      })

      // Calculate daily net profit
      dailyProfit?.forEach(day => {
        day.profit = day.revenue - day.expenses
      })

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        avgMargin,
        dailyProfit: dailyProfit || [],
        orders: orders || [],
        expenses: expenses || []
      }
    }
  })

  const KPICard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    format = 'currency' 
  }: { 
    title: string
    value: number
    icon: any
    trend?: number
    format?: 'currency' | 'percent'
  }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">
            {format === 'currency' 
              ? `${value.toFixed(2)} €` 
              : `${value.toFixed(1)} %`
            }
          </p>
          {trend !== undefined && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend).toFixed(1)}% vs période précédente
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${
          value > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Dashboard Profit</h1>
          <p className="text-muted-foreground mt-2">
            Suivi temps réel de vos marges et rentabilité
          </p>
        </div>

        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList>
            <TabsTrigger value="7d">7 jours</TabsTrigger>
            <TabsTrigger value="30d">30 jours</TabsTrigger>
            <TabsTrigger value="90d">90 jours</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Revenu Total"
          value={profitData?.totalRevenue || 0}
          icon={DollarSign}
          trend={12.5}
        />
        <KPICard
          title="Dépenses Totales"
          value={profitData?.totalExpenses || 0}
          icon={AlertTriangle}
          trend={-5.2}
        />
        <KPICard
          title="Profit Net"
          value={profitData?.netProfit || 0}
          icon={TrendingUp}
          trend={18.3}
        />
        <KPICard
          title="Marge Moyenne"
          value={profitData?.avgMargin || 0}
          icon={Percent}
          format="percent"
          trend={3.7}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="roi">Calculateur ROI</TabsTrigger>
          <TabsTrigger value="expenses">Suivi Dépenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <RealTimeProfitChart data={profitData?.dailyProfit || []} />
        </TabsContent>

        <TabsContent value="roi">
          <ROICalculator />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpenseTracker expenses={(profitData?.expenses as Expense[]) || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
