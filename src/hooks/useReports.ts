import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { subDays, format } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';

interface ReportData {
  id: string;
  user_id: string;
  report_name: string;
  report_type: string;
  report_data: Record<string, unknown>;
  filters: Record<string, unknown>;
  status: string;
  is_favorite: boolean;
  schedule: string | null;
  last_generated_at: string | null;
  created_at: string;
}

export function useReports() {
  const queryClient = useQueryClient();

  // Fetch saved reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['advanced-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advanced_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReportData[];
    },
  });

  // Fetch aggregated stats based on date range
  const fetchStats = async (days: number) => {
    const startDate = subDays(new Date(), days).toISOString();

    // Get orders data
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_amount, created_at, status')
      .gte('created_at', startDate);

    if (ordersError) throw ordersError;

    // Get products count
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get customers count
    const { count: customersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Calculate revenue
    const totalRevenue = (orders || []).reduce((sum, order) => 
      sum + (Number(order.total_amount) || 0), 0
    );

    // Get previous period for comparison
    const previousStartDate = subDays(new Date(), days * 2).toISOString();
    const { data: previousOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', previousStartDate)
      .lt('created_at', startDate);

    const previousRevenue = (previousOrders || []).reduce((sum, order) => 
      sum + (Number(order.total_amount) || 0), 0
    );

    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : '0';

    return {
      revenue: totalRevenue,
      revenueChange: Number(revenueChange),
      orders: orders?.length || 0,
      products: productsCount || 0,
      customers: customersCount || 0,
    };
  };

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({ reportType, dateRange }: { reportType: string; dateRange: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const days = parseInt(dateRange);
      const startDate = subDays(new Date(), days).toISOString();
      
      let reportData: Record<string, unknown> = {};

      switch (reportType) {
        case 'sales': {
          const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .gte('created_at', startDate);
          
          reportData = {
            totalOrders: orders?.length || 0,
            totalRevenue: orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0,
            averageOrderValue: orders?.length 
              ? (orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) / orders.length).toFixed(2)
              : 0,
            ordersByStatus: orders?.reduce((acc, o) => {
              acc[o.status || 'unknown'] = (acc[o.status || 'unknown'] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          };
          break;
        }
        case 'products': {
          const { data: products } = await supabase
            .from('products')
            .select('*');
          
          reportData = {
            totalProducts: products?.length || 0,
            totalValue: products?.reduce((sum, p) => sum + (Number(p.price) || 0), 0) || 0,
            averagePrice: products?.length 
              ? (products.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / products.length).toFixed(2)
              : 0,
            productsByStatus: products?.reduce((acc, p) => {
              acc[p.status || 'unknown'] = (acc[p.status || 'unknown'] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          };
          break;
        }
        case 'customers': {
          const { data: customers } = await supabase
            .from('customers')
            .select('*')
            .gte('created_at', startDate);
          
          reportData = {
            newCustomers: customers?.length || 0,
            totalSpent: customers?.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0) || 0,
            averageOrders: customers?.length 
              ? (customers.reduce((sum, c) => sum + (c.total_orders || 0), 0) / customers.length).toFixed(1)
              : 0
          };
          break;
        }
        case 'inventory': {
          const { data: products } = await supabase
            .from('products')
            .select('title, stock_quantity, price');
          
          const lowStock = products?.filter(p => (p.stock_quantity || 0) < 10) || [];
          
          reportData = {
            totalProducts: products?.length || 0,
            totalStock: products?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0,
            lowStockItems: lowStock.length,
            stockValue: products?.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (Number(p.price) || 0)), 0) || 0
          };
          break;
        }
        case 'profit': {
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, subtotal, shipping_cost, tax_amount, discount_amount')
            .gte('created_at', startDate);
          
          const revenue = orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0;
          const shipping = orders?.reduce((sum, o) => sum + (Number(o.shipping_cost) || 0), 0) || 0;
          const discounts = orders?.reduce((sum, o) => sum + (Number(o.discount_amount) || 0), 0) || 0;
          
          reportData = {
            totalRevenue: revenue,
            totalShipping: shipping,
            totalDiscounts: discounts,
            netRevenue: revenue - shipping - discounts,
            ordersCount: orders?.length || 0
          };
          break;
        }
      }

      // Save report to database
      const { data, error } = await supabase
        .from('advanced_reports')
        .insert([{
          user_id: user.id,
          report_name: `Rapport ${reportType} - ${format(new Date(), 'dd/MM/yyyy')}`,
          report_type: reportType,
          report_data: reportData as Json,
          filters: { dateRange: days } as Json,
          status: 'ready',
          last_generated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reports'] });
      toast.success('Rapport généré avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la génération', { description: error.message });
    }
  });

  // Delete report
  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('advanced_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reports'] });
      toast.success('Rapport supprimé');
    }
  });

  // Export report as CSV
  const exportReport = (report: ReportData) => {
    const data = report.report_data as Record<string, unknown>;
    const rows = Object.entries(data).map(([key, value]) => `${key},${value}`);
    const csv = `Métrique,Valeur\n${rows.join('\n')}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_name}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Rapport exporté');
  };

  return {
    reports,
    recentReports: reports.filter(r => {
      const date = new Date(r.created_at);
      return date > subDays(new Date(), 7);
    }),
    scheduledReports: reports.filter(r => r.schedule),
    customReports: reports.filter(r => !r.schedule),
    isLoading: reportsLoading,
    fetchStats,
    generateReport: generateReportMutation.mutate,
    deleteReport: deleteReportMutation.mutate,
    exportReport,
    isGenerating: generateReportMutation.isPending
  };
}
