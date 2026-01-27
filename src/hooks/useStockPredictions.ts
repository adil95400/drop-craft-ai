/**
 * Hook pour récupérer les prédictions de stock depuis la table stock_predictions
 * Fournit des alertes de rupture et recommandations de réapprovisionnement
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface StockPrediction {
  id: string
  product_id: string
  store_id: string | null
  current_stock: number
  predicted_stockout_date: string | null
  predicted_days_until_stockout: number | null
  confidence_score: number
  daily_sale_velocity: number
  trend_direction: 'increasing' | 'decreasing' | 'stable'
  recommendation: string | null
  reorder_quantity: number | null
  reorder_urgency: 'critical' | 'high' | 'medium' | 'low'
  last_calculated_at: string
}

export interface StockAlert {
  productId: string
  daysUntilStockout: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
  recommendation: string
  reorderQuantity: number
}

export function useStockPredictions() {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: ['stock-predictions', user?.id],
    queryFn: async (): Promise<StockPrediction[]> => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('stock_predictions')
        .select('*')
        .eq('user_id', user.id)
        .order('predicted_days_until_stockout', { ascending: true, nullsFirst: false })

      if (error) {
        console.error('Error fetching stock predictions:', error)
        throw error
      }

      return (data || []).map(row => ({
        id: row.id,
        product_id: row.product_id || '',
        store_id: row.store_id,
        current_stock: row.current_stock || 0,
        predicted_stockout_date: row.predicted_stockout_date,
        predicted_days_until_stockout: row.predicted_days_until_stockout,
        confidence_score: row.confidence_score || 0,
        daily_sale_velocity: Number(row.daily_sale_velocity) || 0,
        trend_direction: (row.trend_direction as StockPrediction['trend_direction']) || 'stable',
        recommendation: row.recommendation,
        reorder_quantity: row.reorder_quantity,
        reorder_urgency: (row.reorder_urgency as StockPrediction['reorder_urgency']) || 'low',
        last_calculated_at: row.last_calculated_at || row.created_at || ''
      }))
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })

  // Calculer les alertes critiques
  const criticalAlerts: StockAlert[] = (query.data || [])
    .filter(p => p.predicted_days_until_stockout !== null && p.predicted_days_until_stockout <= 7)
    .map(p => ({
      productId: p.product_id,
      daysUntilStockout: p.predicted_days_until_stockout || 0,
      urgency: p.reorder_urgency,
      recommendation: p.recommendation || 'Réapprovisionner dès que possible',
      reorderQuantity: p.reorder_quantity || 0
    }))

  // Stats agrégées
  const stats = {
    totalPredictions: query.data?.length || 0,
    criticalCount: criticalAlerts.filter(a => a.urgency === 'critical').length,
    highCount: criticalAlerts.filter(a => a.urgency === 'high').length,
    avgDaysToStockout: query.data?.length 
      ? Math.round(
          query.data
            .filter(p => p.predicted_days_until_stockout !== null)
            .reduce((sum, p) => sum + (p.predicted_days_until_stockout || 0), 0) / 
          query.data.filter(p => p.predicted_days_until_stockout !== null).length
        )
      : 0
  }

  return {
    predictions: query.data || [],
    criticalAlerts,
    stats,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}

/**
 * Hook pour obtenir la prédiction d'un produit spécifique
 */
export function useProductStockPrediction(productId: string) {
  const { predictions, isLoading } = useStockPredictions()
  
  const prediction = predictions.find(p => p.product_id === productId)
  
  return {
    prediction,
    isLoading,
    hasAlert: prediction ? (prediction.predicted_days_until_stockout || 999) <= 14 : false
  }
}
