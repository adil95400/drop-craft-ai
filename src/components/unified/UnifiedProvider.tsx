/**
 * Provider unifié qui remplace tous les providers de plan dispersés
 * Initialise automatiquement le plan utilisateur au montage
 */

import React, { createContext, useContext, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { useToast } from '@/hooks/use-toast'

interface UnifiedProviderProps {
  children: React.ReactNode
}

// Context pour exposer les fonctions du plan (si nécessaire)
const UnifiedContext = createContext<{
  initialized: boolean
}>({ initialized: false })

export function UnifiedProvider({ children }: UnifiedProviderProps) {
  const { user } = useAuth()
  const { loadUserPlan, loading, error } = useUnifiedPlan()
  const { toast } = useToast()
  
  // Charger le plan utilisateur au montage
  useEffect(() => {
    if (user?.id) {
      loadUserPlan(user.id)
    }
  }, [user?.id, loadUserPlan])
  
  // Afficher les erreurs de plan
  useEffect(() => {
    if (error) {
      toast({
        title: "Erreur de plan",
        description: error,
        variant: "destructive"
      })
    }
  }, [error, toast])
  
  return (
    <UnifiedContext.Provider value={{ initialized: !loading && !!user }}>
      {children}
    </UnifiedContext.Provider>
  )
}

export function useUnifiedContext() {
  return useContext(UnifiedContext)
}

// Hook de convenance qui combine auth et plan
export function useAuthWithPlan() {
  const { user, loading: authLoading } = useAuth()
  const planStore = useUnifiedPlan()
  const { initialized } = useUnifiedContext()
  
  return {
    user,
    authLoading,
    planLoading: planStore.loading,
    loading: authLoading || planStore.loading,
    initialized: initialized && !!user,
    ...planStore
  }
}