/**
 * useProductEngine — Unified hook for the Product Data Engine
 * Handles scraping, preview, enrichment, and import via quick-import-url
 */
import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export interface ProductEngineResult {
  success: boolean
  data?: any
  error?: string
}

export interface QualityScore {
  score: number
  breakdown: Record<string, { score: number; max: number; label: string }>
}

export interface ReviewDistribution {
  distribution: Record<number, number>
  averageRating: number
  totalReviews: number
}

export function useProductEngine() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')

  const invalidateAfterImport = () => {
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
    queryClient.invalidateQueries({ queryKey: ['imported-products'] })
    queryClient.invalidateQueries({ queryKey: ['pipeline-jobs'] })
    queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
  }

  // Preview: scrape product data without saving
  const previewMutation = useMutation({
    mutationFn: async (url: string): Promise<ProductEngineResult> => {
      setProgress(10)
      setProgressMessage('Connexion au serveur...')

      setProgress(25)
      setProgressMessage('Extraction des données produit...')

      const { data, error } = await supabase.functions.invoke('quick-import-url', {
        body: { url, action: 'preview', price_multiplier: 1.5 },
      })

      if (error) throw new Error(error.message || 'Erreur serveur')

      setProgress(80)
      setProgressMessage('Données extraites...')

      if (!data?.success) throw new Error(data?.error || 'Extraction échouée')

      setProgress(100)
      setProgressMessage('Redirection vers l\'aperçu...')

      return data as ProductEngineResult
    },
    onSuccess: (data) => {
      const productData = data.data || data
      if (productData) {
        navigate('/import/preview', {
          state: {
            product: {
              title: productData.title || 'Produit importé',
              description: productData.description || '',
              price: productData.price || 0,
              currency: productData.currency || 'EUR',
              suggested_price: productData.suggested_price || Math.ceil((productData.price || 0) * 1.5 * 100) / 100,
              profit_margin: productData.profit_margin || 0,
              images: productData.images || [],
              brand: productData.brand || productData.vendor || '',
              vendor: productData.vendor || productData.brand || '',
              sku: productData.sku || '',
              platform_detected: productData.platform_detected || productData.platform || 'unknown',
              source_url: productData.source_url || '',
              variants: productData.variants || [],
              videos: productData.videos || [],
              extracted_reviews: productData.extracted_reviews || [],
              reviews: productData.reviews || { rating: null, count: null },
              specifications: productData.specifications || {},
              category: productData.category || productData.product_type || '',
              subcategory: productData.subcategory || '',
              product_type: productData.product_type || '',
              tags: productData.tags || [],
              original_price: productData.original_price || null,
              handle: productData.handle || '',
              stock_quantity: productData.stock_quantity ?? 0,
              breadcrumbs: productData.breadcrumbs || [],
              seo: productData.seo || null,
              quality_score: productData.quality_score || null,
              review_distribution: productData.review_distribution || null,
              shipping: productData.shipping || null,
              seller: productData.seller || null,
            },
            returnTo: '/import',
          },
        })
      } else {
        toast.error('Aucune donnée produit extraite')
      }
    },
    onError: (error: Error) => {
      setProgress(0)
      setProgressMessage('')
      toast.error(`Erreur d'extraction: ${error.message}`)
    },
  })

  // Import: scrape + save to database
  const importMutation = useMutation({
    mutationFn: async (params: { url: string; overrideData?: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke('quick-import-url', {
        body: { url: params.url, action: 'import', override_data: params.overrideData },
      })
      if (error) throw error
      return { success: true, data, product_id: data?.data?.id }
    },
    onSuccess: () => {
      toast.success('Produit importé avec succès')
      invalidateAfterImport()
    },
    onError: () => toast.error('Erreur lors de l\'import'),
  })

  const handlePreview = useCallback((url: string) => {
    if (!url.trim()) { toast.error('Veuillez entrer une URL'); return }
    previewMutation.mutate(url.trim())
  }, [previewMutation])

  const handleImport = useCallback((url: string, overrideData?: Record<string, unknown>) => {
    if (!url.trim()) { toast.error('Veuillez entrer une URL'); return }
    importMutation.mutate({ url: url.trim(), overrideData })
  }, [importMutation])

  const reset = useCallback(() => {
    setProgress(0)
    setProgressMessage('')
    previewMutation.reset()
    importMutation.reset()
  }, [previewMutation, importMutation])

  // Client-side quality score calculation for preview page editing
  const calculateClientQualityScore = useCallback((product: any): QualityScore => {
    const breakdown: Record<string, { score: number; max: number; label: string }> = {
      title: { score: 0, max: 15, label: 'Titre' },
      description: { score: 0, max: 15, label: 'Description' },
      images: { score: 0, max: 20, label: 'Images' },
      price: { score: 0, max: 10, label: 'Prix' },
      variants: { score: 0, max: 10, label: 'Variantes' },
      reviews: { score: 0, max: 10, label: 'Avis' },
      specifications: { score: 0, max: 5, label: 'Caractéristiques' },
      category: { score: 0, max: 5, label: 'Catégorie' },
      brand: { score: 0, max: 5, label: 'Marque' },
      seo: { score: 0, max: 5, label: 'SEO' },
    }
    if (product.title?.length > 10) breakdown.title.score = 10
    if (product.title?.length > 30) breakdown.title.score = 15
    if (product.description?.length > 20) breakdown.description.score = 8
    if (product.description?.length > 100) breakdown.description.score = 15
    const imgCount = product.images?.length || 0
    if (imgCount >= 1) breakdown.images.score = 5
    if (imgCount >= 3) breakdown.images.score = 10
    if (imgCount >= 5) breakdown.images.score = 15
    if (imgCount >= 8) breakdown.images.score = 20
    if (product.price > 0) breakdown.price.score = 10
    if ((product.variants?.length || 0) >= 1) breakdown.variants.score = 5
    if ((product.variants?.length || 0) >= 3) breakdown.variants.score = 10
    if ((product.extracted_reviews?.length || 0) >= 1) breakdown.reviews.score = 3
    if ((product.extracted_reviews?.length || 0) >= 3) breakdown.reviews.score = 6
    if ((product.extracted_reviews?.length || 0) >= 5) breakdown.reviews.score = 10
    if (Object.keys(product.specifications || {}).length >= 1) breakdown.specifications.score = 2
    if (Object.keys(product.specifications || {}).length >= 3) breakdown.specifications.score = 5
    if (product.category) breakdown.category.score = 3
    if (product.subcategory) breakdown.category.score = 5
    if (product.brand) breakdown.brand.score = 5
    if (product.seo?.metaTitle) breakdown.seo.score += 2
    if (product.seo?.metaDescription) breakdown.seo.score += 3
    const totalScore = Object.values(breakdown).reduce((sum, b) => sum + b.score, 0)
    const maxScore = Object.values(breakdown).reduce((sum, b) => sum + b.max, 0)
    return { score: Math.round((totalScore / maxScore) * 100), breakdown }
  }, [])

  // Client-side review distribution
  const calculateClientReviewDistribution = useCallback((reviews: any[]): ReviewDistribution => {
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    if (!reviews?.length) return { distribution, averageRating: 0, totalReviews: 0 }
    let totalRating = 0
    for (const r of reviews) {
      const rating = Math.min(5, Math.max(1, Math.round(r.rating || 5)))
      distribution[rating]++
      totalRating += rating
    }
    return { distribution, averageRating: Math.round((totalRating / reviews.length) * 10) / 10, totalReviews: reviews.length }
  }, [])

  return {
    handlePreview,
    handleImport,
    reset,
    calculateClientQualityScore,
    calculateClientReviewDistribution,
    isPreviewing: previewMutation.isPending,
    isImporting: importMutation.isPending,
    progress,
    progressMessage,
    previewResult: previewMutation.data,
    importResult: importMutation.data,
    error: previewMutation.error || importMutation.error,
    isSuccess: previewMutation.isSuccess || importMutation.isSuccess,
  }
}
