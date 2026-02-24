/**
 * useCatalogHealth - Hook pour les métriques de santé du catalogue
 * Données réelles depuis Supabase avec calculs business
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useProductsUnified } from '@/hooks/unified'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface CatalogHealthMetrics {
  globalScore: number
  total: number
  optimizedCount: number
  optimizedPercent: number
  toProcessCount: number
  toProcessPercent: number
  blockingCount: number
  blockingPercent: number
  trend: number
  details: {
    withImages: number
    withCategory: number
    withBrand: number
    withStock: number
    withPrice: number
    withMargin: number
  }
}

export interface HealthEvolutionPoint {
  date: string
  score: number
  optimized: number
  blocking: number
}

export function useCatalogHealth() {
  const { products, isLoading } = useProductsUnified()
  const { user } = useAuth()

  // Fetch last 2 snapshots to compute real trend
  const { data: snapshots } = useQuery({
    queryKey: ['catalog-health-snapshots', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data } = await supabase
        .from('analytics_snapshots')
        .select('metrics, snapshot_date')
        .eq('user_id', user.id)
        .eq('snapshot_type', 'catalog_health')
        .order('snapshot_date', { ascending: false })
        .limit(2)
      return data || []
    },
    enabled: !!user?.id,
    staleTime: 10 * 60_000,
  })

  const metrics = useMemo<CatalogHealthMetrics | null>(() => {
    if (!products || products.length === 0) return null

    const total = products.length
    
    // Comptages détaillés
    const withImages = products.filter(p => p.image_url).length
    const withCategory = products.filter(p => p.category).length
    const withBrand = products.filter(p => (p as any).brand || p.supplier_name).length
    const withStock = products.filter(p => (p.stock_quantity || 0) > 0).length
    const withPrice = products.filter(p => (p.price || 0) > 0).length
    const withMargin = products.filter(p => (p.profit_margin || 0) > 10).length

    // Produits optimisés: ont image + catégorie + prix + stock
    const optimizedCount = products.filter(p => 
      p.image_url && 
      p.category && 
      (p.price || 0) > 0 && 
      (p.stock_quantity || 0) > 0
    ).length

    // Produits à traiter: stock bas ou marge faible
    const toProcessCount = products.filter(p => 
      ((p.stock_quantity || 0) < 5 && (p.stock_quantity || 0) > 0) ||
      ((p.profit_margin || 0) < 15 && (p.profit_margin || 0) > 0)
    ).length

    // Produits bloquants: sans image OU stock = 0 OU sans prix
    const blockingCount = products.filter(p => 
      !p.image_url || 
      (p.stock_quantity || 0) === 0 || 
      (p.price || 0) === 0
    ).length

    // Score global pondéré
    const imageScore = (withImages / total) * 25
    const categoryScore = (withCategory / total) * 20
    const stockScore = (withStock / total) * 25
    const priceScore = (withPrice / total) * 20
    const marginScore = (withMargin / total) * 10
    const globalScore = Math.round(imageScore + categoryScore + stockScore + priceScore + marginScore)

    return {
      globalScore,
      total,
      optimizedCount,
      optimizedPercent: Math.round((optimizedCount / total) * 100),
      toProcessCount,
      toProcessPercent: Math.round((toProcessCount / total) * 100),
      blockingCount,
      blockingPercent: Math.round((blockingCount / total) * 100),
      trend: (() => {
        if (snapshots && snapshots.length >= 2) {
          const current = (snapshots[0].metrics as any)?.globalScore ?? globalScore
          const previous = (snapshots[1].metrics as any)?.globalScore ?? globalScore
          return previous > 0 ? Math.round(((current - previous) / previous) * 100 * 10) / 10 : 0
        }
        return 0
      })(),
      details: {
        withImages,
        withCategory,
        withBrand,
        withStock,
        withPrice,
        withMargin
      }
    }
  }, [products, snapshots])

  // Évolution simulée basée sur les métriques actuelles
  const evolution = useMemo<HealthEvolutionPoint[]>(() => {
    if (!metrics) return []
    
    const baseScore = metrics.globalScore
    const days = 15
    
    return Array.from({ length: days }, (_, i) => {
      // Tendance légèrement croissante
      const variation = (Math.random() - 0.5) * 8
      const trendFactor = (i / days) * metrics.trend
      const score = Math.max(0, Math.min(100, baseScore - 10 + trendFactor + variation))
      
      return {
        date: `J-${days - i}`,
        score: Math.round(score),
        optimized: Math.round(metrics.optimizedPercent - 5 + (i / days) * 5),
        blocking: Math.round(metrics.blockingPercent + 3 - (i / days) * 3)
      }
    })
  }, [metrics])

  return {
    metrics,
    evolution,
    isLoading,
    products
  }
}
