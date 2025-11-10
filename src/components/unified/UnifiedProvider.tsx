/**
 * Provider unifié qui remplace tous les providers de plan dispersés
 * Initialise automatiquement le plan utilisateur au montage
 */

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
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
  const { user } = useUnifiedAuth()
  const { loadUserPlan, loading, error } = useUnifiedPlan()
  const { toast } = useToast()
  const loadedRef = useRef(false)
  
  // Charger le plan utilisateur au montage (une seule fois)
  useEffect(() => {
    if (user?.id && !loadedRef.current) {
      loadedRef.current = true
      loadUserPlan(user.id)
    }
  }, [user?.id])
  
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
  const { user, loading: authLoading } = useUnifiedAuth()
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