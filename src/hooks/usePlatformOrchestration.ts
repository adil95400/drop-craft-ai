/**
 * Hook pour utiliser le service d'orchestration de la plateforme
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { platformOrchestrationService, type PlatformHealth, type PlatformInsights } from '@/services/PlatformOrchestrationService'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'

export const usePlatformOrchestration = () => {
  const { user } = useUnifiedAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialiser la plateforme lors du login
  useEffect(() => {
    if (user && !isInitialized) {
      platformOrchestrationService.initializePlatform(user.id)
        .then(() => {
          setIsInitialized(true)
          console.log('Platform initialized for user:', user.id)
        })
        .catch((error) => {
          console.error('Failed to initialize platform:', error)
          toast({
            title: "Erreur d'initialisation",
            description: "Impossible d'initialiser la plateforme. Veuillez recharger la page.",
            variant: "destructive"
          })
        })
    }
  }, [user, isInitialized, toast])

  // Récupérer la santé de la plateforme
  const { data: platformHealth, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['platform-health'],
    queryFn: () => platformOrchestrationService.checkPlatformHealth(),
    refetchInterval: 5 * 60 * 1000, // Rafraîchir toutes les 5 minutes
    enabled: isInitialized
  })

  // Récupérer les insights de la plateforme
  const { data: platformInsights, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['platform-insights', user?.id],
    queryFn: () => user ? platformOrchestrationService.generatePlatformInsights(user.id) : null,
    refetchInterval: 30 * 60 * 1000, // Rafraîchir toutes les 30 minutes
    enabled: isInitialized && !!user
  })

  // Orchestrer un workflow de commande
  const orchestrateOrderWorkflow = useMutation({
    mutationFn: async (orderId: string) => {
      return platformOrchestrationService.orchestrateOrderWorkflow(orderId)
    },
    onSuccess: () => {
      toast({
        title: "Workflow exécuté",
        description: "Le workflow de commande a été exécuté avec succès"
      })
      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['platform-insights'] })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de workflow",
        description: error.message || "Impossible d'exécuter le workflow",
        variant: "destructive"
      })
    }
  })

  // Forcer un health check
  const refreshHealthCheck = useMutation({
    mutationFn: async () => {
      return platformOrchestrationService.checkPlatformHealth()
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['platform-health'], data)
      toast({
        title: "Vérification terminée",
        description: `Statut de la plateforme: ${data.overall}`
      })
    }
  })

  // Calculer le score de santé global
  const healthScore = platformHealth ? 
    Object.values(platformHealth.services)
      .reduce((acc, service) => acc + service.performance, 0) / 
    Object.keys(platformHealth.services).length : 0

  // Déterminer si la plateforme est en bonne santé
  const isPlatformHealthy = platformHealth?.overall === 'healthy'
  const hasCriticalIssues = platformHealth?.overall === 'critical'
  const hasWarnings = platformHealth?.overall === 'warning'

  return {
    // État
    isInitialized,
    isPlatformHealthy,
    hasCriticalIssues,
    hasWarnings,
    healthScore,
    
    // Données
    platformHealth,
    platformInsights,
    
    // États de chargement
    isLoadingHealth,
    isLoadingInsights,
    
    // Actions
    orchestrateOrderWorkflow: orchestrateOrderWorkflow.mutate,
    isOrchestrating: orchestrateOrderWorkflow.isPending,
    
    refreshHealthCheck: refreshHealthCheck.mutate,
    isRefreshingHealth: refreshHealthCheck.isPending,
    
    // Utilitaires
    getServiceStatus: (serviceName: string) => 
      platformHealth?.services[serviceName]?.status || 'unknown',
    
    getServicePerformance: (serviceName: string) => 
      platformHealth?.services[serviceName]?.performance || 0,
      
    getRecommendations: () => 
      platformInsights?.recommendations || []
  }
}