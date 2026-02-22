/**
 * useApiImports - Unified import hook
 * All imports route through robust-import-pipeline or quick-import-url (preview)
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export function useApiImports() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const invalidateAfterImport = () => {
    queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
    queryClient.invalidateQueries({ queryKey: ['imported-products'] })
    queryClient.invalidateQueries({ queryKey: ['pipeline-jobs'] })
  }

  // Preview a URL before importing (uses quick-import-url)
  const previewUrl = useMutation({
    mutationFn: async (params: { url: string; priceMultiplier?: number }) => {
      const { data, error } = await supabase.functions.invoke('quick-import-url', {
        body: {
          url: params.url,
          action: 'preview',
          price_multiplier: params.priceMultiplier ?? 1.5,
        },
      })
      if (error) throw error
      return data
    },
  })

  // Import a single URL (uses quick-import-url action=import → writes to products canon)
  const scrapeUrl = useMutation({
    mutationFn: async (params: {
      url: string
      extractVariants?: boolean
      extractReviews?: boolean
      enrichWithAi?: boolean
      overrideData?: Record<string, unknown>
    }) => {
      const { data, error } = await supabase.functions.invoke('quick-import-url', {
        body: {
          url: params.url,
          action: 'import',
          override_data: params.overrideData,
        },
      })
      if (error) throw error
      return { success: true, data, product_id: data?.data?.id }
    },
    onSuccess: () => {
      toast({ title: 'Import réussi' })
      invalidateAfterImport()
    },
    onError: () => toast({ title: 'Erreur', description: 'Import impossible', variant: 'destructive' }),
  })

  // Bulk import via robust-import-pipeline
  const scrapeStore = useMutation({
    mutationFn: async (params: {
      storeUrl: string
      maxProducts?: number
      categoryFilter?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('robust-import-pipeline', {
        body: {
          action: 'start',
          source: 'store',
          items: [{ url: params.storeUrl, max_products: params.maxProducts ?? 100, category: params.categoryFilter }],
        },
      })
      if (error) throw error
      return { success: true, data, job_id: data?.job_id }
    },
    onSuccess: () => {
      toast({ title: 'Import boutique lancé' })
      invalidateAfterImport()
    },
  })

  // Feed import via robust-import-pipeline
  const importFeed = useMutation({
    mutationFn: async (params: {
      feedUrl: string
      feedType: 'xml' | 'csv' | 'json'
      mappingConfig?: Record<string, string>
    }) => {
      const { data, error } = await supabase.functions.invoke('robust-import-pipeline', {
        body: {
          action: 'start',
          source: params.feedType,
          items: [{ feed_url: params.feedUrl, mapping_config: params.mappingConfig || {} }],
        },
      })
      if (error) throw error
      return { success: true, data, job_id: data?.job_id }
    },
    onSuccess: () => {
      toast({ title: 'Import feed lancé' })
      invalidateAfterImport()
    },
  })

  return {
    previewUrl,
    scrapeUrl,
    scrapeStore,
    importFeed,
    isPreviewing: previewUrl.isPending,
    isScraping: scrapeUrl.isPending,
    isScrapingStore: scrapeStore.isPending,
    isImportingFeed: importFeed.isPending,
    isImporting: scrapeUrl.isPending || scrapeStore.isPending || importFeed.isPending,
  }
}
