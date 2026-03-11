/**
 * Provider unifié qui remplace tous les providers de plan dispersés
 * Initialise automatiquement le plan utilisateur au montage
 */

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { useToast } from '@/hooks/use-toast'

// Import only the context, not the hook to avoid the "must be within provider" error
import { UnifiedAuthContext } from '@/contexts/UnifiedAuthContext'

interface UnifiedProviderProps {
  children: React.ReactNode
}

// Context pour exposer les fonctions du plan (si nécessaire)
const UnifiedContext = createContext<{
  initialized: boolean
}>({ initialized: false })

export function UnifiedProvider({ children }: UnifiedProviderProps) {
  // Use the context directly to handle cases where it might not be provided
  const authContext = useContext(UnifiedAuthContext)
  const user = authContext?.user ?? null
  
  // Use selectors to avoid subscribing to full store (prevents infinite re-render loops)
  const loadUserPlan = useUnifiedPlan(s => s.loadUserPlan)
  const loading = useUnifiedPlan(s => s.loading)
  const error = useUnifiedPlan(s => s.error)
  const { toast } = useToast()
  const loadedRef = useRef(false)
  
  // Charger le plan utilisateur au montage (une seule fois)
  useEffect(() => {
    if (user?.id && !loadedRef.current) {
      loadedRef.current = true
      // Defer to avoid synchronous state updates during React commit phase
      queueMicrotask(() => loadUserPlan(user.id))
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
  const authContext = useContext(UnifiedAuthContext)
  const user = authContext?.user ?? null
  const authLoading = authContext?.loading ?? true
  // Use individual selectors to prevent full-store subscription loops
  const planLoading = useUnifiedPlan(s => s.loading)
  const effectivePlan = useUnifiedPlan(s => s.effectivePlan)
  const currentPlan = useUnifiedPlan(s => s.currentPlan)
  const hasFeature = useUnifiedPlan(s => s.hasFeature)
  const hasPlan = useUnifiedPlan(s => s.hasPlan)
  const isPro = useUnifiedPlan(s => s.isPro)
  const isUltraPro = useUnifiedPlan(s => s.isUltraPro)
  const isAdmin = useUnifiedPlan(s => s.isAdmin)
  const canBypass = useUnifiedPlan(s => s.canBypass)
  const { initialized } = useUnifiedContext()
  
  return {
    user,
    authLoading,
    planLoading,
    loading: authLoading || planLoading,
    initialized: initialized && !!user,
    effectivePlan,
    currentPlan,
    hasFeature,
    hasPlan,
    isPro,
    isUltraPro,
    isAdmin,
    canBypass,
  }
}