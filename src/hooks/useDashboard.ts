/**
 * useDashboard — Unified dashboard hook
 */
export { useDashboardData as useDashboard } from './useDashboardData'

// Re-export useChartData using DashboardService for backward compatibility
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardService } from '@/services/dashboard.service';

export function useChartData(period: 'week' | 'month' | 'year' = 'month') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-chart', user?.id, period],
    queryFn: () => DashboardService.getChartData(user!.id, period),
    enabled: !!user,
    staleTime: 10 * 60 * 1000
  });
}
