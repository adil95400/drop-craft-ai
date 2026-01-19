import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemService {
  id: string;
  service_name: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
  description: string | null;
  last_checked_at: string;
  updated_at: string;
}

export function useSystemStatus() {
  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_status')
        .select('*')
        .order('service_name');

      if (error) throw error;
      return data as SystemService[];
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });

  const overallStatus = services.length > 0
    ? services.every(s => s.status === 'operational')
      ? 'operational'
      : services.some(s => s.status === 'major_outage')
        ? 'major_outage'
        : services.some(s => s.status === 'partial_outage')
          ? 'partial_outage'
          : services.some(s => s.status === 'maintenance')
            ? 'maintenance'
            : 'degraded'
    : 'operational';

  const operationalCount = services.filter(s => s.status === 'operational').length;

  return {
    services,
    isLoading,
    error,
    overallStatus,
    operationalCount,
    totalServices: services.length,
  };
}
