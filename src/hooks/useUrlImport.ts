/**
 * useUrlImport - Shared hook for real URL-based product imports
 * Uses preview-first flow: scrape → preview page → confirm import
 */
import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export interface ImportResult {
  success: boolean
  data?: any
  product?: any
  saved_id?: string
  error?: string
}

export function useUrlImport(platformName: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')

  const importMutation = useMutation({
    mutationFn: async (url: string): Promise<ImportResult> => {
      setProgress(10)
      setProgressMessage('Connexion au serveur...')

      setProgress(25)
      setProgressMessage(`Extraction des données ${platformName}...`)

      // Step 1: Preview — scrape product data without saving
      const { data, error } = await supabase.functions.invoke('quick-import-url', {
        body: {
          url,
          action: 'preview',
          price_multiplier: 1.5,
        },
      })

      if (error) throw new Error(error.message || 'Erreur serveur')

      setProgress(80)
      setProgressMessage('Données extraites...')

      if (!data?.success) {
        throw new Error(data?.error || `Import ${platformName} échoué`)
      }

      setProgress(100)
      setProgressMessage('Redirection vers l\'aperçu...')

      return data as ImportResult
    },
    onSuccess: (data) => {
      // Navigate to preview page with extracted product data
      const productData = data.data || data.product
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
              platform_detected: productData.platform_detected || productData.platform || platformName.toLowerCase(),
              source_url: productData.source_url || '',
              variants: productData.variants || [],
              videos: productData.videos || [],
              extracted_reviews: productData.extracted_reviews || [],
              reviews: productData.reviews || { rating: null, count: null },
              specifications: productData.specifications || {},
              category: productData.category || productData.product_type || '',
              product_type: productData.product_type || '',
              tags: productData.tags || [],
              original_price: productData.original_price || null,
              handle: productData.handle || '',
              stock_quantity: productData.stock_quantity ?? 0,
            },
            returnTo: `/import/${platformName.toLowerCase().replace(/\s+/g, '-')}`,
          },
        })
      } else {
        toast.error('Aucune donnée produit extraite')
      }
    },
    onError: (error: Error) => {
      setProgress(0)
      setProgressMessage('')
      toast.error(`Erreur ${platformName}: ${error.message}`)
    },
  })

  const handleImport = useCallback(
    (url: string) => {
      if (!url.trim()) {
        toast.error(`Veuillez entrer une URL ${platformName}`)
        return
      }
      importMutation.mutate(url.trim())
    },
    [importMutation, platformName]
  )

  const reset = useCallback(() => {
    setProgress(0)
    setProgressMessage('')
    importMutation.reset()
  }, [importMutation])

  return {
    handleImport,
    isImporting: importMutation.isPending,
    progress,
    progressMessage,
    importResult: importMutation.data,
    error: importMutation.error,
    isSuccess: importMutation.isSuccess,
    reset,
  }
}
