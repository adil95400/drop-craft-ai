/**
 * useFinanceData — Connects to real financial data
 * Aggregates orders, transactions, and products into a FinancialData shape
 */
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns'

export interface FinancialData {
  revenue: {
    total: number
    growth: number
    target: number
    monthly: Array<{ month: string; amount: number }>
  }
  expenses: {
    total: number
    growth: number
    categories: Array<{ name: string; amount: number; percentage: number }>
  }
  profit: { gross: number; net: number; margin: number }
  cashFlow: { current: number; incoming: number; outgoing: number; projection: number }
  accounts: Array<{ name: string; balance: number; type: 'checking' | 'savings' | 'investment'; growth: number }>
  invoices: { pending: number; overdue: number; paid: number; draft: number }
}

export const useFinanceData = () => {
  const { toast } = useToast()
  const { user } = useAuth()

  const { data: financialData, isLoading, error } = useQuery({
    queryKey: ['real-finance', user?.id],
    queryFn: async (): Promise<FinancialData> => {
      if (!user) throw new Error('User not authenticated')

      const now = new Date()
      const sixMonthsAgo = subMonths(now, 6).toISOString()
      const currentMonthStart = startOfMonth(now).toISOString()
      const prevMonthStart = startOfMonth(subMonths(now, 1)).toISOString()
      const prevMonthEnd = endOfMonth(subMonths(now, 1)).toISOString()

      // Parallel fetch: orders, transactions, products, invoices
      const [ordersRes, txRes, productsRes, invoicesRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total_amount, subtotal, tax_amount, shipping_cost, status, created_at')
          .eq('user_id', user.id)
          .gte('created_at', sixMonthsAgo)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('financial_transactions')
          .select('id, transaction_type, category, amount, transaction_date')
          .eq('user_id', user.id)
          .gte('transaction_date', sixMonthsAgo)
          .limit(1000),
        supabase
          .from('products')
          .select('id, price, cost_price, stock_quantity')
          .eq('user_id', user.id)
          .not('price', 'is', null)
          .limit(500),
        supabase
          .from('orders')
          .select('id, status')
          .eq('user_id', user.id)
          .limit(500),
      ])

      const orders = ordersRes.data || []
      const txs = txRes.data || []
      const products = productsRes.data || []
      const allOrders = invoicesRes.data || []

      // Revenue by month
      const monthlyMap: Record<string, number> = {}
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i)
        monthlyMap[format(d, 'MMM yyyy')] = 0
      }
      for (const o of orders) {
        const key = format(new Date(o.created_at!), 'MMM yyyy')
        if (key in monthlyMap) monthlyMap[key] += (o.total_amount ?? 0)
      }
      const monthly = Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }))

      // Current vs previous month revenue
      const currentOrders = orders.filter(o => o.created_at! >= currentMonthStart)
      const prevOrders = orders.filter(o => o.created_at! >= prevMonthStart && o.created_at! <= prevMonthEnd)
      const currentRevenue = currentOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0)
      const prevRevenue = prevOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0)
      const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0

      // Expenses
      const expenses = txs.filter(t => t.transaction_type === 'expense')
      const currentExpenses = expenses.filter(t => t.transaction_date >= currentMonthStart.slice(0, 10))
      const totalExpenses = currentExpenses.reduce((s, t) => s + Math.abs(t.amount), 0)

      // Expense categories
      const catMap: Record<string, number> = {}
      for (const t of currentExpenses) {
        catMap[t.category] = (catMap[t.category] ?? 0) + Math.abs(t.amount)
      }
      const totalCatAmount = Object.values(catMap).reduce((s, v) => s + v, 0) || 1
      const categories = Object.entries(catMap)
        .map(([name, amount]) => ({ name, amount, percentage: Math.round((amount / totalCatAmount) * 100) }))
        .sort((a, b) => b.amount - a.amount)

      // COGS
      const totalCOGS = products.reduce((s, p) => s + ((p.cost_price ?? 0) * (p.stock_quantity ?? 0)), 0)
      const grossProfit = currentRevenue - totalCOGS
      const netProfit = currentRevenue - totalExpenses
      const margin = currentRevenue > 0 ? (netProfit / currentRevenue) * 100 : 0

      // Invoice-like status from orders
      const pending = allOrders.filter(o => o.status === 'pending').length
      const overdue = allOrders.filter(o => o.status === 'overdue' || o.status === 'payment_failed').length
      const paid = allOrders.filter(o => o.status === 'paid' || o.status === 'completed' || o.status === 'delivered').length
      const draft = allOrders.filter(o => o.status === 'draft').length

      return {
        revenue: {
          total: Math.round(currentRevenue * 100) / 100,
          growth: Math.round(revenueGrowth * 10) / 10,
          target: Math.round(currentRevenue * 1.15 * 100) / 100,
          monthly,
        },
        expenses: { total: Math.round(totalExpenses * 100) / 100, growth: 0, categories },
        profit: {
          gross: Math.round(grossProfit * 100) / 100,
          net: Math.round(netProfit * 100) / 100,
          margin: Math.round(margin * 10) / 10,
        },
        cashFlow: {
          current: Math.round(netProfit * 100) / 100,
          incoming: Math.round(currentRevenue * 100) / 100,
          outgoing: Math.round(totalExpenses * 100) / 100,
          projection: Math.round(netProfit * 1.05 * 100) / 100,
        },
        accounts: [
          { name: 'Principal', balance: Math.round(netProfit * 100) / 100, type: 'checking' as const, growth: revenueGrowth },
        ],
        invoices: { pending, overdue, paid, draft },
      }
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
    meta: {
      onError: () => {
        toast({ title: "Erreur de chargement", description: "Impossible de charger les données financières", variant: "destructive" })
      }
    }
  })

  const stats = {
    totalRevenue: financialData?.revenue.total || 0,
    totalExpenses: financialData?.expenses.total || 0,
    netProfit: financialData?.profit.net || 0,
    profitMargin: financialData?.profit.margin || 0,
    cashFlow: financialData?.cashFlow.current || 0,
    overdueInvoices: financialData?.invoices.overdue || 0
  }

  return { financialData, stats, isLoading, error }
}
