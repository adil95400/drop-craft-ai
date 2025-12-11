/**
 * Hook personnalisé pour la gestion du rafraîchissement du dashboard
 */

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useDashboardRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const queryClient = useQueryClient()

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    const toastId = toast.loading('Actualisation des données...')

    try {
      // Invalider toutes les requêtes du dashboard
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] })
      await queryClient.invalidateQueries({ queryKey: ['pending-orders-alerts'] })
      await queryClient.invalidateQueries({ queryKey: ['revenue-alerts'] })
      
      setLastUpdate(new Date())
      toast.success('Données actualisées', { id: toastId })
    } catch (error) {
      console.error('Refresh failed:', error)
      toast.error('Échec de l\'actualisation', { id: toastId })
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient])

  return {
    isRefreshing,
    lastUpdate,
    refresh,
    setLastUpdate
  }
}
