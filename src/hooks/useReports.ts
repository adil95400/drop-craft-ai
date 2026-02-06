import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

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
  const { user } = useUnifiedAuth();

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['advanced-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('advanced_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ReportData[];
    },
    enabled: !!user?.id,
  });

  const fetchStats = async (days: number) => {
    if (!user?.id) return { revenue: 0, revenueChange: 0, orders: 0, products: 0, customers: 0 };
    
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return {
      revenue: 0,
      revenueChange: 0,
      orders: orderCount || 0,
      products: productCount || 0,
      customers: 0,
    };
  };

  const generateReportMutation = useMutation({
    mutationFn: async ({ reportType, dateRange }: { reportType: string; dateRange: string }) => {
      if (!user?.id) throw new Error('Non authentifié');
      const { data, error } = await supabase
        .from('advanced_reports')
        .insert({
          user_id: user.id,
          report_name: `Rapport ${reportType} - ${dateRange}j`,
          report_type: reportType,
          report_data: {},
          filters: { days: dateRange },
          status: 'completed',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reports'] });
      toast.success('Rapport généré avec succès');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la génération', { description: error.message });
    }
  });

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
