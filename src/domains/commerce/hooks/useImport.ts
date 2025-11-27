import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { importService } from '../services/importService'
import { ImportFilters } from '../types'

// Clés de cache optimisées
export const IMPORT_CACHE_KEYS = {
  jobs: (filters?: ImportFilters) => ['import', 'jobs', filters],
  job: (id: string) => ['import', 'job', id],
  products: (importId?: string) => ['import', 'products', importId],
  stats: ['import', 'stats']
} as const

export const useImport = (filters?: ImportFilters) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Récupération des jobs d'import
  const jobsQuery = useQuery({
    queryKey: IMPORT_CACHE_KEYS.jobs(filters),
    queryFn: () => importService.getImportJobs(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10000 // Refresh toutes les 10s pour les jobs en cours
  })

  // Récupération des produits importés
  const productsQuery = useQuery({
    queryKey: IMPORT_CACHE_KEYS.products(),
    queryFn: () => importService.getImportedProducts(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })

  // Import par URL
  const urlImportMutation = useMutation({
    mutationFn: ({ url, config }: { url: string; config?: Record<string, any> }) => 
      importService.startUrlImport(url, config),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['import'] })
      toast({
        title: "Import démarré !",
        description: "L'analyse de l'URL a commencé"
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Import par fournisseur
  const supplierImportMutation = useMutation({
    mutationFn: ({ supplier, config }: { supplier: string; config?: Record<string, any> }) => 
      importService.startSupplierImport(supplier, config),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['import'] })
      toast({
        title: "Import démarré !",
        description: `Import depuis ${data.job_type || 'fournisseur'} en cours`
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'import",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Approbation de produit
  const approveMutation = useMutation({
    mutationFn: (productId: string) => importService.approveProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import'] })
      toast({
        title: "Produit approuvé !",
        description: "Le produit a été approuvé"
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'approbation",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Publication de produit
  const publishMutation = useMutation({
    mutationFn: (productId: string) => importService.publishProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Produit publié !",
        description: "Le produit a été ajouté à votre catalogue"
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de publication",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  return {
    // Data
    jobs: jobsQuery.data?.jobs || [],
    totalJobs: jobsQuery.data?.total || 0,
    products: productsQuery.data || [],
    
    // États
    isLoading: jobsQuery.isLoading,
    isProductsLoading: productsQuery.isLoading,
    isImportingUrl: urlImportMutation.isPending,
    isImportingSupplier: supplierImportMutation.isPending,
    isApproving: approveMutation.isPending,
    isPublishing: publishMutation.isPending,
    error: jobsQuery.error,
    
    // Actions
    importFromUrl: urlImportMutation.mutate,
    importFromSupplier: supplierImportMutation.mutate,
    approveProduct: approveMutation.mutate,
    publishProduct: publishMutation.mutate,
    
    // Utils
    refetch: jobsQuery.refetch,
    refetchProducts: productsQuery.refetch,
    clearCache: () => importService.clearCache()
  }
}

export const useImportProducts = (importId?: string) => {
  const productsQuery = useQuery({
    queryKey: IMPORT_CACHE_KEYS.products(importId),
    queryFn: () => importService.getImportedProducts(importId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!importId
  })

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    refetch: productsQuery.refetch
  }
}