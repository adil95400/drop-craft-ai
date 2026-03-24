import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const API_VERSION = 'v1';

interface VersionInfo {
  api_version: string;
  supported_versions: string[];
  deprecated_versions: string[];
  endpoints: string[];
  changelog: Record<string, string>;
}

export function useApiVersion() {
  return useQuery<VersionInfo>({
    queryKey: ['api-version-info'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('api-gateway-v2', {
        body: { resource: 'info' },
        headers: { 'x-api-version': API_VERSION },
      });
      if (error) throw error;
      return data.data as VersionInfo;
    },
    staleTime: 30 * 60_000,
  });
}

export function useBackupStatus() {
  return useQuery({
    queryKey: ['backup-verification'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('backup-verification');
      if (error) throw error;
      return data.data;
    },
    staleTime: 10 * 60_000,
    refetchInterval: 30 * 60_000,
  });
}

export { API_VERSION };
