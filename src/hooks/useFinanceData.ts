import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { financeApi } from '@/services/api/client'

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
      return await financeApi.stats() as FinancialData
    },
    enabled: !!user,
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
