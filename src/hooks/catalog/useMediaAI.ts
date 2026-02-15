/**
 * useMediaAI - Hook IA pour l'optimisation des médias
 * Analyse avancée et recommandations automatisées
 */
import { useMemo, useCallback } from 'react'
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface MediaAIStats {
  optimizationScore: number
  potentialConversionGain: number
  potentialRevenueGain: number
  coverageMetrics: {
    mainImage: number
    gallery: number
    video: number
    altText: number
  }
  priorityActions: number
}

export interface MediaRecommendation {
  id: string
  type: 'missing_main' | 'incomplete_gallery' | 'missing_alt' | 'low_resolution' | 'add_video' | 'optimize_format'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  estimatedGain: number
  productIds: string[]
  productCount: number
  action: {
    label: string
    type: 'enrich_ai' | 'scrape' | 'generate' | 'optimize'
  }
}

export function useMediaAIStats() {
  const { products, isLoading } = useProductsUnified()

  const stats = useMemo<MediaAIStats>(() => {
    if (!products || products.length === 0) {
      return {
        optimizationScore: 0,
        potentialConversionGain: 0,
        potentialRevenueGain: 0,
        coverageMetrics: { mainImage: 0, gallery: 0, video: 0, altText: 0 },
        priorityActions: 0
      }
    }

    const total = products.length
    
    // Coverage calculations
    const withMainImage = products.filter(p => p.image_url && !isPlaceholder(p.image_url)).length
    const withGallery = products.filter(p => {
      const images = p.image_urls || (p as any).images || []
      return images.length >= 3
    }).length
    const withVideo = products.filter(p => {
      const videos = (p as any).videos || []
      return videos.length > 0
    }).length
    const withAltText = products.filter(p => {
      // Estimate based on structured data
      return p.image_url && p.name && p.name.length > 10
    }).length

    const mainImageCoverage = (withMainImage / total) * 100
    const galleryCoverage = (withGallery / total) * 100
    const videoCoverage = (withVideo / total) * 100
    const altTextCoverage = (withAltText / total) * 100

    // Weighted optimization score
    const optimizationScore = Math.round(
      mainImageCoverage * 0.4 +
      galleryCoverage * 0.25 +
      videoCoverage * 0.15 +
      altTextCoverage * 0.2
    )

    // Business impact calculations
    const avgPrice = products.reduce((s, p) => s + (p.price || 0), 0) / total
    const productsWithoutImage = total - withMainImage
    const productsWithoutGallery = total - withGallery

    // Products with images convert 30% better
    const potentialConversionGain = Math.round(productsWithoutImage * 0.30)
    // Products with gallery convert 15% better than single image
    const galleryGain = Math.round(productsWithoutGallery * 0.15)
    const potentialRevenueGain = Math.round((productsWithoutImage * avgPrice * 0.30) + (productsWithoutGallery * avgPrice * 0.15))

    // Priority actions count
    const priorityActions = productsWithoutImage + Math.floor(productsWithoutGallery / 2)

    return {
      optimizationScore,
      potentialConversionGain: potentialConversionGain + galleryGain,
      potentialRevenueGain,
      coverageMetrics: {
        mainImage: Math.round(mainImageCoverage),
        gallery: Math.round(galleryCoverage),
        video: Math.round(videoCoverage),
        altText: Math.round(altTextCoverage)
      },
      priorityActions
    }
  }, [products])

  return { stats, isLoading }
}

export function useMediaRecommendations() {
  const { products, isLoading } = useProductsUnified()

  const recommendations = useMemo<MediaRecommendation[]>(() => {
    if (!products || products.length === 0) return []

    const recs: MediaRecommendation[] = []
    
    // 1. Missing main image (critical)
    const noMainImage = products.filter(p => !p.image_url)
    if (noMainImage.length > 0) {
      const avgPrice = noMainImage.reduce((s, p) => s + (p.price || 0), 0) / noMainImage.length
      recs.push({
        id: 'missing_main',
        type: 'missing_main',
        priority: 'critical',
        title: 'Images principales manquantes',
        description: `${noMainImage.length} produits n'ont aucune image. Impact majeur sur les conversions.`,
        impact: '+30% conversions attendues',
        estimatedGain: Math.round(noMainImage.length * avgPrice * 0.3),
        productIds: noMainImage.slice(0, 50).map(p => p.id),
        productCount: noMainImage.length,
        action: { label: 'Enrichir via IA', type: 'enrich_ai' }
      })
    }

    // 2. Placeholder images
    const placeholders = products.filter(p => p.image_url && isPlaceholder(p.image_url))
    if (placeholders.length > 0) {
      recs.push({
        id: 'placeholder_images',
        type: 'low_resolution',
        priority: 'critical',
        title: 'Images placeholder détectées',
        description: `${placeholders.length} produits utilisent des images génériques ou placeholder.`,
        impact: 'Perception qualité produit',
        estimatedGain: Math.round(placeholders.length * 15),
        productIds: placeholders.slice(0, 50).map(p => p.id),
        productCount: placeholders.length,
        action: { label: 'Remplacer', type: 'scrape' }
      })
    }

    // 3. Incomplete gallery
    const incompleteGallery = products.filter(p => {
      if (!p.image_url) return false
      const images = p.image_urls || (p as any).images || []
      return images.length < 3
    })
    if (incompleteGallery.length > 0) {
      recs.push({
        id: 'incomplete_gallery',
        type: 'incomplete_gallery',
        priority: 'high',
        title: 'Galeries incomplètes',
        description: `${incompleteGallery.length} produits ont moins de 3 images. Les galeries complètes augmentent les conversions.`,
        impact: '+15% conversions avec galerie',
        estimatedGain: Math.round(incompleteGallery.length * 20),
        productIds: incompleteGallery.slice(0, 50).map(p => p.id),
        productCount: incompleteGallery.length,
        action: { label: 'Compléter galerie', type: 'enrich_ai' }
      })
    }

    // 4. Missing video for premium products
    const premiumNoVideo = products.filter(p => {
      if (!p.price || p.price < 50) return false
      const videos = (p as any).videos || []
      return videos.length === 0
    })
    if (premiumNoVideo.length > 0) {
      recs.push({
        id: 'missing_video',
        type: 'add_video',
        priority: 'medium',
        title: 'Vidéos produits premium',
        description: `${premiumNoVideo.length} produits premium (>50€) sans vidéo. Les vidéos augmentent l'engagement.`,
        impact: '+40% temps sur page',
        estimatedGain: Math.round(premiumNoVideo.length * 35),
        productIds: premiumNoVideo.slice(0, 30).map(p => p.id),
        productCount: premiumNoVideo.length,
        action: { label: 'Générer vidéo IA', type: 'generate' }
      })
    }

    // 5. Format optimization
    const needsOptimization = products.filter(p => {
      if (!p.image_url) return false
      const url = p.image_url.toLowerCase()
      // Not using WebP/AVIF modern formats
      return !url.includes('.webp') && !url.includes('.avif')
    }).slice(0, 100)
    if (needsOptimization.length >= 10) {
      recs.push({
        id: 'optimize_format',
        type: 'optimize_format',
        priority: 'low',
        title: 'Optimisation format images',
        description: `${needsOptimization.length}+ images non optimisées. WebP réduit la taille de 30%.`,
        impact: '-30% temps de chargement',
        estimatedGain: Math.round(needsOptimization.length * 5),
        productIds: needsOptimization.map(p => p.id),
        productCount: needsOptimization.length,
        action: { label: 'Optimiser', type: 'optimize' }
      })
    }

    return recs.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    })
  }, [products])

  return { recommendations, isLoading }
}

export function useApplyMediaRecommendation() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recommendation: MediaRecommendation) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Non authentifié')

      // Process in batches
      const batchSize = 10
      let success = 0
      let failed = 0

      for (let i = 0; i < recommendation.productIds.length; i += batchSize) {
        const batch = recommendation.productIds.slice(i, i + batchSize)
        
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
                body: JSON.stringify({ 
                  product_id: productId,
                  action_type: recommendation.action.type 
                }),
              }
            )
            if (response.ok) success++
            else failed++
          } catch {
            failed++
          }
        })

        await Promise.all(promises)
      }

      return { success, failed, total: recommendation.productIds.length }
    },
    onSuccess: (result) => {
      toast({
        title: 'Enrichissement terminé',
        description: `${result.success}/${result.total} produits traités avec succès`
      })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Échec de l\'enrichissement',
        variant: 'destructive'
      })
    }
  })
}

function isPlaceholder(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.includes('placeholder') ||
         lower.includes('no-image') ||
         lower.includes('default') ||
         lower.includes('noimage') ||
         lower.includes('/50x50') ||
         lower.includes('/100x100') ||
         lower.includes('thumbnail')
}
