import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

// Real API calls to FastAPI backend
const apiCall = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  })
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }
  
  return response.json()
}

export const useImport = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Import from URL
  const importFromUrl = useMutation({
    mutationFn: async (url: string) => {
      return await apiCall('/import/url', {
        method: 'POST',
        body: JSON.stringify({ url })
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Import réussi",
        description: `${data.products_imported || 0} produits importés depuis l'URL.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'import",
        description: error.message || "Impossible d'importer depuis cette URL.",
        variant: "destructive",
      })
    }
  })

  // Import from CSV
  const importFromCsv = useMutation({
    mutationFn: async ({ file, mapping }: { file: File, mapping?: any }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mapping', JSON.stringify(mapping || {}))

      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`CSV import failed: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Import CSV réussi",
        description: `${data.products_imported || 0} produits importés depuis le fichier CSV.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'import CSV",
        description: error.message || "Impossible d'importer le fichier CSV.",
        variant: "destructive",
      })
    }
  })

  // Import from XML feed
  const importFromXml = useMutation({
    mutationFn: async ({ url, mapping }: { url: string, mapping?: any }) => {
      return await apiCall('/import/xml', {
        method: 'POST',
        body: JSON.stringify({ url, mapping: mapping || {} })
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Import XML réussi",
        description: `${data.products_imported || 0} produits importés depuis le feed XML.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'import XML",
        description: error.message || "Impossible d'importer le feed XML.",
        variant: "destructive",
      })
    }
  })

  // BigBuy sync
  const syncBigBuy = useMutation({
    mutationFn: async (options: { categories?: string[], limit?: number } = {}) => {
      return await apiCall('/suppliers/bigbuy/sync', {
        method: 'POST',
        body: JSON.stringify(options)
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Synchronisation BigBuy réussie",
        description: `${data.products_imported || 0} produits synchronisés depuis BigBuy.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur BigBuy",
        description: error.message || "Impossible de synchroniser avec BigBuy.",
        variant: "destructive",
      })
    }
  })

  // Get import history
  const { data: importHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      try {
        return await apiCall('/import/history')
      } catch (error) {
        console.warn('Import history not available')
        return []
      }
    }
  })

  return {
    importFromUrl: importFromUrl.mutate,
    importFromCsv: importFromCsv.mutate,
    importFromXml: importFromXml.mutate,
    syncBigBuy: syncBigBuy.mutate,
    importHistory,
    isImportingUrl: importFromUrl.isPending,
    isImportingCsv: importFromCsv.isPending,
    isImportingXml: importFromXml.isPending,
    isSyncingBigBuy: syncBigBuy.isPending,
    isLoadingHistory
  }
}