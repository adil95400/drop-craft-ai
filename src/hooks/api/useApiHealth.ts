/**
 * useApiHealth - Toujours retourner disponible (pas de FastAPI externe)
 */
import { useQuery } from '@tanstack/react-query'

export function useApiHealth() {
  const { data, isLoading } = useQuery({
    queryKey: ['api-health'],
    queryFn: async () => ({ success: true, data: { status: 'ok', backend: 'supabase' } }),
    staleTime: 60_000,
  })

  return {
    isApiAvailable: true,
    apiStatus: data?.data,
    isChecking: isLoading,
  }
}
