import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { subDays, format } from 'date-fns';
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';

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

  // Fetch saved reports via FastAPI
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['advanced-reports'],
    queryFn: async () => {
      const res = await shopOptiApi.request<ReportData[]>('/reports');
      if (!res.success) throw new Error(res.error || 'Failed to fetch reports');
      return res.data || [];
    },
  });

  // Fetch aggregated stats via FastAPI
  const fetchStats = async (days: number) => {
    const res = await shopOptiApi.getAnalyticsDashboard(`${days}d`);
    if (!res.success) throw new Error(res.error || 'Failed to fetch stats');
    return res.data || {
      revenue: 0,
      revenueChange: 0,
      orders: 0,
      products: 0,
      customers: 0,
    };
  };

  // Generate report via FastAPI (creates a background job)
  const generateReportMutation = useMutation({
    mutationFn: async ({ reportType, dateRange }: { reportType: string; dateRange: string }) => {
      const res = await shopOptiApi.generateReport(reportType, dateRange);
      if (!res.success) throw new Error(res.error || 'Failed to generate report');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reports'] });
      toast.success('Rapport généré avec succès');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la génération', { description: error.message });
    }
  });

  // Delete report via FastAPI
  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.request(`/reports/${id}`, { method: 'DELETE' });
      if (!res.success) throw new Error(res.error || 'Failed to delete report');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reports'] });
      toast.success('Rapport supprimé');
    }
  });

  // Export report as CSV (client-side from report_data)
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
