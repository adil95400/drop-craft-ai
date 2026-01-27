/**
 * useMediaAudit - Hook pour l'audit des médias produits
 * Analyse réelle des images et vidéos du catalogue
 */
import { useMemo } from 'react'
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified'

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
}

export function useMediaAudit() {
  const { products, isLoading } = useProductsUnified()

  // Statistiques des médias
  const stats = useMemo<MediaStats>(() => {
    if (!products || products.length === 0) {
      return { total: 0, withImages: 0, withoutImages: 0, withMultipleImages: 0, withVideos: 0, nonCompliant: 0, score: 0 }
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
      if (!p.image_url) return false
      // Détecter URLs de mauvaise qualité (placeholders, trop petites, etc.)
      const url = p.image_url.toLowerCase()
      return url.includes('placeholder') || 
             url.includes('no-image') || 
             url.includes('default') ||
             url.includes('50x50') ||
             url.includes('thumbnail')
    }).length

    const score = Math.round((withImages / total) * 100)

    return { total, withImages, withoutImages, withMultipleImages, withVideos, nonCompliant, score }
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
          suggestedAction: 'Ajouter une image depuis le fournisseur ou uploader'
        })
        return // Une seule issue critique par produit
      }

      // Image non conforme
      const url = product.image_url.toLowerCase()
      if (url.includes('placeholder') || url.includes('no-image') || url.includes('default')) {
        issueList.push({
          product,
          issueType: 'non_compliant',
          severity: 'warning',
          description: 'Image placeholder détectée',
          suggestedAction: 'Remplacer par une vraie image produit'
        })
      }

      // Pas de vidéo (info seulement)
      const videos = (product as any).videos || []
      if (videos.length === 0 && product.price && product.price > 50) {
        issueList.push({
          product,
          issueType: 'missing_video',
          severity: 'info',
          description: 'Pas de vidéo (produit premium)',
          suggestedAction: 'Ajouter une vidéo pour améliorer la conversion'
        })
      }
    })

    // Trier par sévérité
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

  // Produits à optimiser (ont image mais pourraient être améliorés)
  const productsToOptimize = useMemo(() => 
    products?.filter(p => {
      if (!p.image_url) return false
      const images = p.image_urls || (p as any).images || []
      return images.length < 3 // Moins de 3 images = à optimiser
    }) || [],
    [products]
  )

  return {
    stats,
    issues,
    productsWithoutImage,
    productsToOptimize,
    isLoading,
    products
  }
}
