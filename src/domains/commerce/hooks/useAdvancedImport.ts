/**
 * useAdvancedImport — Hook for advanced import operations via API V1
 * No connectors or test-connection (removed with importAdvancedService cleanup).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { importAdvancedService, ImportFromUrlOptions, ImportFromXmlOptions, ImportFromFtpOptions } from '../services/importAdvancedService'
import { useImport } from './useImport'

export const useAdvancedImport = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { jobs, products, refetch } = useImport()

  const urlImportMutation = useMutation({
    mutationFn: (options: ImportFromUrlOptions) => importAdvancedService.importFromUrl(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import'] })
      toast({ title: "Import URL démarré", description: "L'analyse de l'URL a commencé" })
    },
    onError: (error: Error) => {
      toast({ title: "Erreur d'import URL", description: error.message, variant: "destructive" })
    }
  })

  const xmlImportMutation = useMutation({
    mutationFn: (options: ImportFromXmlOptions) => importAdvancedService.importFromXml(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import'] })
      toast({ title: "Import XML démarré", description: "Le flux XML est en cours de traitement" })
    },
    onError: (error: Error) => {
      toast({ title: "Erreur d'import XML", description: error.message, variant: "destructive" })
    }
  })

  const ftpImportMutation = useMutation({
    mutationFn: (options: ImportFromFtpOptions) => importAdvancedService.importFromFtp(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import'] })
      toast({ title: "Import FTP démarré", description: "Le connecteur FTP a été configuré" })
    },
    onError: (error: Error) => {
      toast({ title: "Erreur FTP", description: error.message, variant: "destructive" })
    }
  })

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
    totalConnectors: 0
  }

  return {
    jobs, activeJobs, completedJobs, failedJobs,
    products,
    connectors: [],
    isLoadingConnectors: false,
    importFromUrl: urlImportMutation.mutate,
    importFromXml: xmlImportMutation.mutate,
    importFromFtp: ftpImportMutation.mutate,
    deleteConnector: (_id: string) => {},
    testConnection: (_id: string) => {},
    isImportingUrl: urlImportMutation.isPending,
    isImportingXml: xmlImportMutation.isPending,
    isImportingFtp: ftpImportMutation.isPending,
    isTestingConnection: false,
    stats,
    refetch
  }
}
