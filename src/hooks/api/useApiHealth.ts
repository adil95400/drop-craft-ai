/**
 * useApiHealth - Hook pour vérifier la santé du backend FastAPI
 */
import { useQuery } from '@tanstack/react-query'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export function useApiHealth() {
  const { data, isLoading } = useQuery({
    queryKey: ['api-health'],
    queryFn: () => shopOptiApi.healthCheck(),
    staleTime: 60_000,
    retry: 1,
    refetchInterval: 5 * 60_000, // Check every 5 minutes
  })

  return {
    isApiAvailable: data?.success ?? false,
    apiStatus: data?.data,
    isChecking: isLoading,
  }
}
