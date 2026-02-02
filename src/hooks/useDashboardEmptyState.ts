/**
 * useDashboardEmptyState - Détermine si le dashboard doit afficher l'état vide
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'

export function useDashboardEmptyState() {
  const { user } = useUnifiedAuth()

  const { data: hasData, isLoading } = useQuery({
    queryKey: ['dashboard-has-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return false

      // Vérifier s'il y a des produits
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Vérifier s'il y a des intégrations actives
      const { count: integrationsCount } = await supabase
        .from('integrations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true)

      // Vérifier s'il y a des commandes
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // A des données si au moins 1 produit OU 1 intégration OU 1 commande
      return (productsCount || 0) > 0 || 
             (integrationsCount || 0) > 0 || 
             (ordersCount || 0) > 0
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  return {
    isEmpty: !hasData && !isLoading,
    isLoading,
    hasData: !!hasData
  }
}
