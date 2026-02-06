/**
 * useApiImports - Hook pour les imports produits via Edge Functions
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
  }

  const scrapeUrl = useMutation({
    mutationFn: async (params: {
      url: string
      extractVariants?: boolean
      extractReviews?: boolean
      enrichWithAi?: boolean
    }) => {
      const { data, error } = await supabase.functions.invoke('url-scraper', {
        body: {
          url: params.url,
          config: {
            extract_variants: params.extractVariants ?? true,
            extract_reviews: params.extractReviews ?? false,
            enrich_with_ai: params.enrichWithAi ?? true,
          },
        },
      })
      if (error) throw error
      return { success: true, data, job_id: data?.job_id }
    },
    onSuccess: () => {
      toast({ title: 'Import lancé' })
      invalidateAfterImport()
    },
    onError: () => toast({ title: 'Erreur', description: 'Import impossible', variant: 'destructive' }),
  })

  const scrapeStore = useMutation({
    mutationFn: async (params: {
      storeUrl: string
      maxProducts?: number
      categoryFilter?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('shopify-store-import', {
        body: {
          storeUrl: params.storeUrl,
          maxProducts: params.maxProducts ?? 100,
          categoryFilter: params.categoryFilter,
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

  const importFeed = useMutation({
    mutationFn: async (params: {
      feedUrl: string
      feedType: 'xml' | 'csv' | 'json'
      mappingConfig?: Record<string, string>
    }) => {
      const { data, error } = await supabase.functions.invoke('xml-json-import', {
        body: {
          feed_url: params.feedUrl,
          feed_type: params.feedType,
          mapping_config: params.mappingConfig || {},
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
    scrapeUrl,
    scrapeStore,
    importFeed,
    isScraping: scrapeUrl.isPending,
    isScrapingStore: scrapeStore.isPending,
    isImportingFeed: importFeed.isPending,
    isImporting: scrapeUrl.isPending || scrapeStore.isPending || importFeed.isPending,
  }
}
