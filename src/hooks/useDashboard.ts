import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardService } from '@/services/dashboard.service';

export function useDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: () => DashboardService.getDashboardStats(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard-alerts', user?.id],
    queryFn: () => DashboardService.getAlerts(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard-activities', user?.id],
    queryFn: () => DashboardService.getRecentActivities(user!.id, 10),
    enabled: !!user,
    staleTime: 1 * 60 * 1000 // 1 minute
  });

  const { data: topProducts, isLoading: topProductsLoading } = useQuery({
    queryKey: ['dashboard-top-products', user?.id],
    queryFn: () => DashboardService.getTopProducts(user!.id, 5),
    enabled: !!user,
    staleTime: 5 * 60 * 1000
  });

  return {
    stats,
    alerts,
    activities,
    topProducts,
    isLoading: statsLoading || alertsLoading || activitiesLoading || topProductsLoading
  };
}

export function useChartData(period: 'week' | 'month' | 'year' = 'month') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-chart', user?.id, period],
    queryFn: () => DashboardService.getChartData(user!.id, period),
    enabled: !!user,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
}
