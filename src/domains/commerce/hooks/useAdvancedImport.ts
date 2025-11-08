import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { importAdvancedService, ImportFromUrlOptions, ImportFromXmlOptions, ImportFromFtpOptions } from '../services/importAdvancedService'
import { useImport } from './useImport'

export const useAdvancedImport = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { jobs, products, refetch } = useImport()

  // Get connectors with real-time updates
  const connectorsQuery = useQuery({
    queryKey: ['import-connectors'],
    queryFn: () => importAdvancedService.getImportConnectors(),
    staleTime: 10 * 1000, // 10s
    refetchInterval: 30 * 1000 // 30s
  })

  // Import mutations
  const urlImportMutation = useMutation({
    mutationFn: (options: ImportFromUrlOptions) => importAdvancedService.importFromUrl(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import'] })
      toast({
        title: "Import URL démarré",
        description: "L'analyse de l'URL a commencé avec succès"
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'import URL",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const xmlImportMutation = useMutation({
    mutationFn: (options: ImportFromXmlOptions) => importAdvancedService.importFromXml(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import'] })
      toast({
        title: "Import XML démarré",
        description: "Le flux XML est en cours de traitement"
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'import XML",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const ftpImportMutation = useMutation({
    mutationFn: (options: ImportFromFtpOptions) => importAdvancedService.importFromFtp(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import'] })
      queryClient.invalidateQueries({ queryKey: ['import-connectors'] })
      toast({
        title: "Connecteur FTP créé",
        description: "Le connecteur FTP a été configuré et l'import démarré"
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur FTP",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const deleteConnectorMutation = useMutation({
    mutationFn: (connectorId: string) => importAdvancedService.deleteConnector(connectorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-connectors'] })
      toast({
        title: "Connecteur supprimé",
        description: "Le connecteur a été supprimé avec succès"
      })
    }
  })

  const testConnectionMutation = useMutation({
    mutationFn: (connectorId: string) => importAdvancedService.testConnection(connectorId),
    onSuccess: (data) => {
      toast({
        title: "Test réussi",
        description: data?.message || "La connexion fonctionne correctement"
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Test échoué",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Calculate stats
  const activeJobs = jobs.filter(j => j.status === 'processing' || j.status === 'pending')
  const completedJobs = jobs.filter(j => j.status === 'completed')
  const failedJobs = jobs.filter(j => j.status === 'failed')
  
  const successRate = jobs.length > 0 
    ? Math.round((completedJobs.length / jobs.length) * 100) 
    : 0

  const stats = {
    totalImports: jobs.length,
    successRate,
    productsImported: products.length,
    activeImports: activeJobs.length,
    completedImports: completedJobs.length,
    failedImports: failedJobs.length,
    totalConnectors: connectorsQuery.data?.length || 0
  }

  return {
    // Jobs & History
    jobs,
    activeJobs,
    completedJobs,
    failedJobs,
    
    // Products
    products,
    
    // Connectors
    connectors: connectorsQuery.data || [],
    isLoadingConnectors: connectorsQuery.isLoading,
    
    // Actions
    importFromUrl: urlImportMutation.mutate,
    importFromXml: xmlImportMutation.mutate,
    importFromFtp: ftpImportMutation.mutate,
    deleteConnector: deleteConnectorMutation.mutate,
    testConnection: testConnectionMutation.mutate,
    
    // States
    isImportingUrl: urlImportMutation.isPending,
    isImportingXml: xmlImportMutation.isPending,
    isImportingFtp: ftpImportMutation.isPending,
    isTestingConnection: testConnectionMutation.isPending,
    
    // Stats
    stats,
    
    // Utils
    refetch
  }
}
