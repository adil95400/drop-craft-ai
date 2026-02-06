/**
 * useApiImports - Hook pour les imports produits via FastAPI
 * Scraping URL, store, feed → tous créent des jobs
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export function useApiImports() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const invalidateAfterImport = () => {
    queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
  }

  // Scrape a single product URL
  const scrapeUrl = useMutation({
    mutationFn: (params: {
      url: string
      extractVariants?: boolean
      extractReviews?: boolean
      enrichWithAi?: boolean
    }) => shopOptiApi.scrapeUrl(params.url, {
      extractVariants: params.extractVariants,
      extractReviews: params.extractReviews,
      enrichWithAi: params.enrichWithAi,
    }),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: 'Import lancé', description: `Job: ${res.job_id || res.data?.job_id || 'en cours'}` })
        invalidateAfterImport()
      } else {
        toast({ title: 'Erreur import', description: res.error, variant: 'destructive' })
      }
    },
    onError: () => toast({ title: 'Erreur', description: 'Import impossible', variant: 'destructive' }),
  })

  // Scrape entire store
  const scrapeStore = useMutation({
    mutationFn: (params: {
      storeUrl: string
      maxProducts?: number
      categoryFilter?: string
    }) => shopOptiApi.scrapeStore(params.storeUrl, {
      maxProducts: params.maxProducts,
      categoryFilter: params.categoryFilter,
    }),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: 'Import boutique lancé', description: `Job: ${res.job_id || res.data?.job_id || 'en cours'}` })
        invalidateAfterImport()
      } else {
        toast({ title: 'Erreur', description: res.error, variant: 'destructive' })
      }
    },
  })

  // Import from feed (XML, CSV, JSON)
  const importFeed = useMutation({
    mutationFn: (params: {
      feedUrl: string
      feedType: 'xml' | 'csv' | 'json'
      mappingConfig?: Record<string, string>
    }) => shopOptiApi.importFeed(params.feedUrl, params.feedType, params.mappingConfig),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: 'Import feed lancé', description: `Job: ${res.job_id || res.data?.job_id || 'en cours'}` })
        invalidateAfterImport()
      } else {
        toast({ title: 'Erreur feed', description: res.error, variant: 'destructive' })
      }
    },
  })

  return {
    scrapeUrl,
    scrapeStore,
    importFeed,
    isScraping: scrapeUrl.isPending,
    isScrapingStore: scrapeStore.isPending,
    isImportingFeed: importFeed.isPending,
    isImporting: scrapeUrl.isPending || scrapeStore.isPending || importFeed.isPending,
  }
}
