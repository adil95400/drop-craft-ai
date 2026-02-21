/**
 * useCatalogHealthEngine — Hook for the 6-pillar weighted health scoring
 * Uses CatalogHealthEngine for client-side analysis + optional backend persistence
 */
import { useMemo, useCallback, useState } from 'react'
import { useProductsUnified } from '@/hooks/unified'
import { CatalogHealthEngine, type ProductHealthReport, type CatalogHealthSummary } from '@/services/catalog/CatalogHealthEngine'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useCatalogHealthEngine() {
  const { products, isLoading } = useProductsUnified()
  const { toast } = useToast()
  const [isScanningBatch, setIsScanningBatch] = useState(false)

  const summary = useMemo<CatalogHealthSummary | null>(() => {
    if (!products || products.length === 0) return null
    return CatalogHealthEngine.analyzeCatalog(products as any[])
  }, [products])

  const productReports = useMemo<ProductHealthReport[]>(() => {
    if (!products || products.length === 0) return []
    return products.map(p => CatalogHealthEngine.analyzeProduct(p as any))
  }, [products])

  const getProductReport = useCallback((productId: string): ProductHealthReport | null => {
    return productReports.find(r => r.productId === productId) || null
  }, [productReports])

  // Persist scores to product_scores table via edge function
  const runBatchScan = useCallback(async () => {
    if (!products || products.length === 0) return
    setIsScanningBatch(true)
    try {
      const { data, error } = await supabase.functions.invoke('catalog-health-scan', {
        body: { action: 'batch_scan' }
      })
      if (error) throw error
      toast({
        title: 'Scan terminé',
        description: `${data?.scanned || 0} produits analysés — Score moyen : ${data?.averageScore || 0}%`
      })
    } catch (e) {
      toast({
        title: 'Erreur de scan',
        description: e instanceof Error ? e.message : 'Erreur inconnue',
        variant: 'destructive'
      })
    } finally {
      setIsScanningBatch(false)
    }
  }, [products, toast])

  // Worst products (most improvement potential)
  const worstProducts = useMemo(() => {
    return [...productReports]
      .sort((a, b) => a.globalScore - b.globalScore)
      .slice(0, 10)
  }, [productReports])

  // Fixable issues count
  const fixableIssuesCount = useMemo(() => {
    return productReports.reduce((count, r) => 
      count + r.issues.filter(i => i.fixable).length, 0)
  }, [productReports])

  return {
    summary,
    productReports,
    worstProducts,
    fixableIssuesCount,
    getProductReport,
    runBatchScan,
    isScanningBatch,
    isLoading,
  }
}
