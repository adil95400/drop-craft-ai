import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export function useFinancialManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Financial transactions
  const transactions = useQuery({
    queryKey: ['financial-transactions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', userId!)
        .order('transaction_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Orders for revenue calculation
  const orders = useQuery({
    queryKey: ['financial-orders', userId],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 6).toISOString();
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, subtotal, tax_amount, shipping_cost, discount_amount, status, created_at, currency')
        .eq('user_id', userId!)
        .gte('created_at', sixMonthsAgo)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Tax configurations
  const taxConfigs = useQuery({
    queryKey: ['tax-configurations', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_configurations')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Add transaction
  const addTransaction = useMutation({
    mutationFn: async (tx: {
      transaction_type: string;
      category: string;
      description?: string;
      amount: number;
      transaction_date?: string;
      is_recurring?: boolean;
      recurrence_period?: string;
      tags?: string[];
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({ ...tx, user_id: userId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Transaction ajoutée');
    },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  });

  // Delete transaction
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Transaction supprimée');
    },
  });

  // Add tax config
  const addTaxConfig = useMutation({
    mutationFn: async (config: { tax_name: string; tax_rate: number; country?: string; region?: string; applies_to?: string }) => {
      const { data, error } = await supabase
        .from('tax_configurations')
        .insert({ ...config, user_id: userId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-configurations'] });
      toast.success('Configuration fiscale ajoutée');
    },
  });

  // Compute P&L from real data
  const computePnL = () => {
    const now = new Date();
    const currentMonthOrders = orders.data?.filter(o => {
      const d = new Date(o.created_at!);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }) ?? [];

    const prevMonthOrders = orders.data?.filter(o => {
      const prev = subMonths(now, 1);
      const d = new Date(o.created_at!);
      return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
    }) ?? [];

    const currentExpenses = transactions.data?.filter(t => {
      const d = new Date(t.transaction_date);
      return t.transaction_type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }) ?? [];

    const revenue = currentMonthOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
    const prevRevenue = prevMonthOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
    const expenses = currentExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const taxes = currentMonthOrders.reduce((sum, o) => sum + (o.tax_amount ?? 0), 0);
    const shipping = currentMonthOrders.reduce((sum, o) => sum + (o.shipping_cost ?? 0), 0);
    const refunds = (transactions.data?.filter(t => {
      const d = new Date(t.transaction_date);
      return t.transaction_type === 'refund' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }) ?? []).reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netProfit = revenue - expenses - refunds;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

    return {
      revenue,
      prevRevenue,
      expenses,
      taxes,
      shipping,
      refunds,
      netProfit,
      margin,
      revenueGrowth,
      orderCount: currentMonthOrders.length,
      avgOrderValue: currentMonthOrders.length > 0 ? revenue / currentMonthOrders.length : 0,
    };
  };

  // Monthly breakdown for chart
  const monthlyBreakdown = () => {
    const months: { month: string; revenue: number; expenses: number; profit: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const target = subMonths(now, i);
      const label = format(target, 'MMM yyyy');
      const monthOrders = orders.data?.filter(o => {
        const d = new Date(o.created_at!);
        return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
      }) ?? [];
      const monthExpenses = transactions.data?.filter(t => {
        const d = new Date(t.transaction_date);
        return t.transaction_type === 'expense' && d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
      }) ?? [];

      const rev = monthOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0);
      const exp = monthExpenses.reduce((s, t) => s + Math.abs(t.amount), 0);

      months.push({ month: label, revenue: rev, expenses: exp, profit: rev - exp });
    }
    return months;
  };

  // Expense breakdown by category
  const expensesByCategory = () => {
    const catMap: Record<string, number> = {};
    transactions.data?.filter(t => t.transaction_type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] ?? 0) + Math.abs(t.amount);
    });
    return Object.entries(catMap).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  };

  return {
    transactions,
    orders,
    taxConfigs,
    addTransaction,
    deleteTransaction,
    addTaxConfig,
    pnl: computePnL(),
    monthlyBreakdown: monthlyBreakdown(),
    expensesByCategory: expensesByCategory(),
  };
}
