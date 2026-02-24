/**
 * useMediaAudit - Hook pour l'audit des médias produits
 * Analyse réelle des images et vidéos du catalogue + Actions IA
 */
import { useMemo, useCallback, useState } from 'react'
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface MediaIssue {
  product: UnifiedProduct
  issueType: 'missing_image' | 'non_compliant' | 'missing_video' | 'low_quality'
  severity: 'critical' | 'warning' | 'info'
  description: string
  suggestedAction: string
}

export interface MediaStats {
  total: number
  withImages: number
  withoutImages: number
  withMultipleImages: number
  withVideos: number
  nonCompliant: number
  score: number
  estimatedImpactWithImages: number
}

export function useMediaAudit() {
  const { products, isLoading, refetch } = useProductsUnified()
  const { toast } = useToast()
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichProgress, setEnrichProgress] = useState({ current: 0, total: 0 })

  // Statistiques des médias
  const stats = useMemo<MediaStats>(() => {
    if (!products || products.length === 0) {
      return { 
        total: 0, withImages: 0, withoutImages: 0, withMultipleImages: 0, 
        withVideos: 0, nonCompliant: 0, score: 0, estimatedImpactWithImages: 0 
      }
    }

    const total = products.length
    const withImages = products.filter(p => p.image_url).length
    const withoutImages = total - withImages
    
    // Produits avec plusieurs images (images array)
    const withMultipleImages = products.filter(p => {
      const images = p.image_urls || (p as any).images || []
      return images.length > 1
    }).length

    // Produits avec vidéos
    const withVideos = products.filter(p => {
      const videos = (p as any).videos || []
      return videos.length > 0
    }).length

    // Non conformes (estimation basée sur URL patterns)
    const nonCompliant = products.filter(p => {
      if (!p.image_url || typeof p.image_url !== 'string') return false
      const url = p.image_url.toLowerCase()
      return url.includes('placeholder') || 
             url.includes('no-image') || 
             url.includes('default') ||
             url.includes('50x50') ||
             url.includes('thumbnail')
    }).length

    const score = total > 0 ? Math.round((withImages / total) * 100) : 0
    
    // Impact estimé: +30% conversions avec images
    const avgPrice = products.reduce((s, p) => s + (p.price || 0), 0) / (total || 1)
    const estimatedImpactWithImages = Math.round(withoutImages * avgPrice * 0.3)

    return { 
      total, withImages, withoutImages, withMultipleImages, 
      withVideos, nonCompliant, score, estimatedImpactWithImages 
    }
  }, [products])

  // Liste des problèmes médias
  const issues = useMemo<MediaIssue[]>(() => {
    if (!products) return []

    const issueList: MediaIssue[] = []

    products.forEach(product => {
      // Image manquante
      if (!product.image_url) {
        issueList.push({
          product,
          issueType: 'missing_image',
          severity: 'critical',
          description: 'Aucune image principale',
          suggestedAction: 'Enrichir via IA'
        })
        return
      }

      // Image non conforme
      const url = product.image_url.toLowerCase()
      if (url.includes('placeholder') || url.includes('no-image') || url.includes('default')) {
        issueList.push({
          product,
          issueType: 'non_compliant',
          severity: 'warning',
          description: 'Image placeholder détectée',
          suggestedAction: 'Remplacer via IA'
        })
      }

      // Pas de vidéo (info seulement pour produits premium)
      const videos = (product as any).videos || []
      if (videos.length === 0 && product.price && product.price > 50) {
        issueList.push({
          product,
          issueType: 'missing_video',
          severity: 'info',
          description: 'Pas de vidéo (produit premium)',
          suggestedAction: 'Générer une vidéo IA'
        })
      }
    })

    return issueList.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 }
      return order[a.severity] - order[b.severity]
    })
  }, [products])

  // Produits sans image
  const productsWithoutImage = useMemo(() => 
    products?.filter(p => !p.image_url) || [],
    [products]
  )

  // Produits à optimiser
  const productsToOptimize = useMemo(() => 
    products?.filter(p => {
      if (!p.image_url) return false
      const images = p.image_urls || (p as any).images || []
      return images.length < 3
    }) || [],
    [products]
  )

  // Action: Enrichir les images d'un produit via IA
  const enrichProductImages = useCallback(async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Non authentifié')

      const response = await fetch(
        (await import('@/lib/supabase-env')).edgeFunctionUrl('enrich-product-images'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
                  body: JSON.stringify({ productId: productId }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Échec enrichissement images')
      }

      const result = await response.json()
      toast({
        title: 'Images enrichies',
        description: `${result.images_found || 0} image(s) trouvée(s)`
      })
      
      await refetch()
      return result
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec enrichissement',
        variant: 'destructive'
      })
      throw error
    }
  }, [toast, refetch])

  // Action: Enrichir en masse les images
  const bulkEnrichImages = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return { success: 0, failed: 0 }
    
    setIsEnriching(true)
    setEnrichProgress({ current: 0, total: productIds.length })
    
    let success = 0
    let failed = 0

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Non authentifié')

      // Traiter par lots de 5
      const batchSize = 5
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize)
        
        const promises = batch.map(async (productId) => {
          try {
            const response = await fetch(
              (await import('@/lib/supabase-env')).edgeFunctionUrl('enrich-product-images'),
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId: productId }),
              }
            )
            if (response.ok) {
              success++
            } else {
              failed++
            }
          } catch {
            failed++
          }
        })

        await Promise.all(promises)
        setEnrichProgress({ current: Math.min(i + batchSize, productIds.length), total: productIds.length })
      }

      toast({
        title: 'Enrichissement terminé',
        description: `${success} produit(s) enrichi(s), ${failed} échec(s)`
      })

      await refetch()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de l\'enrichissement en masse',
        variant: 'destructive'
      })
    } finally {
      setIsEnriching(false)
      setEnrichProgress({ current: 0, total: 0 })
    }

    return { success, failed }
  }, [toast, refetch])

  return {
    stats,
    issues,
    productsWithoutImage,
    productsToOptimize,
    isLoading,
    products,
    // Actions
    enrichProductImages,
    bulkEnrichImages,
    isEnriching,
    enrichProgress
  }
}
