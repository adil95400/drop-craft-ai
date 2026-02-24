/**
 * Système unifié de gestion des plans
 * Remplace tous les hooks, stores et contexts de plan dispersés
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/integrations/supabase/client'

export type PlanType = 'standard' | 'pro' | 'ultra_pro' | 'free'
export type UserRole = 'admin' | 'user'
export type AdminMode = 'bypass' | 'preview:standard' | 'preview:pro' | 'preview:ultra_pro' | null

export interface UserProfile {
  plan: PlanType
  role: UserRole
  admin_mode: AdminMode
}

// Configuration des fonctionnalités par plan
export const PLAN_FEATURES = {
  free: [
    'basic-dashboard',
    'basic-catalog-view'
  ],
  standard: [
    'basic-analytics',
    'basic-import',
    'standard-catalog',
    'basic-dashboard'
  ],
  pro: [
    'basic-analytics',
    'basic-import', 
    'standard-catalog',
    'basic-dashboard',
    'advanced-analytics',
    'ai-analysis',
    'advanced-filters',
    'workflow-builder',
    'ai-insights',
    'seo-automation',
    'real-time-tracking'
  ],
  ultra_pro: [
    'basic-analytics',
    'basic-import',
    'standard-catalog', 
    'basic-dashboard',
    'advanced-analytics',
    'ai-analysis',
    'advanced-filters',
    'workflow-builder',
    'ai-insights',
    'seo-automation',
    'real-time-tracking',
    'predictive-analytics',
    'advanced-automation',
    'bulk-operations',
    'premium-integrations',
    'advanced-seo',
    'crm-prospects',
    'inventory-management',
    'advanced-tracking',
    'ai-import',
    'marketing-automation',
    'security-monitoring',
    'analytics-insights',
    'bulk-import',
    'scheduled-import'
  ]
} as const

// Configuration des quotas par plan
export const PLAN_QUOTAS = {
  free: {
    'products-import': 10,
    'ai-analysis': 0,
    'api-calls': 100
  },
  standard: {
    'products-import': 100,
    'ai-analysis': 10,
    'api-calls': 1000
  },
  pro: {
    'products-import': 1000,
    'ai-analysis': 100,
    'api-calls': 10000
  },
  ultra_pro: {
    'products-import': -1, // illimité
    'ai-analysis': -1,
    'api-calls': -1
  }
} as const

interface UnifiedPlanState {
  // État du plan
  currentPlan: PlanType
  userRole: UserRole
  adminMode: AdminMode
  effectivePlan: PlanType
  loading: boolean
  error: string | null
  
  // Actions de base
  setPlan: (plan: PlanType) => void
  setUserRole: (role: UserRole) => void
  setAdminMode: (mode: AdminMode) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Vérifications de plan
  hasPlan: (minPlan: PlanType) => boolean
  isPro: () => boolean
  isUltraPro: () => boolean
  isStandard: () => boolean
  
  // Gestion des fonctionnalités
  hasFeature: (feature: string) => boolean
  getAvailableFeatures: () => string[]
  
  // Gestion des quotas
  getQuotaLimit: (quotaKey: string) => number
  
  // Actions async
  loadUserPlan: (userId: string) => Promise<void>
  updateUserPlan: (userId: string, plan: PlanType) => Promise<void>
  
  // Utilitaires admin
  getEffectivePlan: () => PlanType
  isAdmin: () => boolean
  canBypass: () => boolean
}

const PLAN_HIERARCHY = { free: 0, standard: 1, pro: 2, ultra_pro: 3 }

function calculateEffectivePlan(plan: PlanType, role: UserRole, adminMode: AdminMode): PlanType {
  // Les admins en mode bypass ont toujours le plan ultra_pro
  if (role === 'admin' && adminMode === 'bypass') {
    return 'ultra_pro';
  }
  
  if (role === 'admin' && adminMode && adminMode.startsWith('preview:')) {
    return adminMode.split(':')[1] as PlanType;
  }
  
  return plan;
}

export const useUnifiedPlan = create<UnifiedPlanState>()(
  subscribeWithSelector((set, get) => ({
    // État initial
    currentPlan: 'free',
    userRole: 'user',
    adminMode: null,
    effectivePlan: 'free',
    loading: false,
    error: null,
    
    // Actions de base
    setPlan: (plan) => set((state) => ({
      currentPlan: plan,
      effectivePlan: calculateEffectivePlan(plan, state.userRole, state.adminMode)
    })),
    
    setUserRole: (role) => set((state) => ({
      userRole: role,
      effectivePlan: calculateEffectivePlan(state.currentPlan, role, state.adminMode)
    })),
    
    setAdminMode: (mode) => set((state) => ({
      adminMode: mode,
      effectivePlan: calculateEffectivePlan(state.currentPlan, state.userRole, mode)
    })),
    
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    
    // Vérifications de plan
    hasPlan: (minPlan) => {
      const { effectivePlan } = get()
      return PLAN_HIERARCHY[effectivePlan] >= PLAN_HIERARCHY[minPlan]
    },
    
    isPro: () => get().hasPlan('pro'),
    isUltraPro: () => get().effectivePlan === 'ultra_pro',
    isStandard: () => get().effectivePlan === 'standard',
    
    // Gestion des fonctionnalités
    hasFeature: (feature) => {
      const { effectivePlan } = get()
      return PLAN_FEATURES[effectivePlan].includes(feature as any)
    },
    
    getAvailableFeatures: () => {
      const { effectivePlan } = get()
      return [...PLAN_FEATURES[effectivePlan]]
    },
    
    // Gestion des quotas
    getQuotaLimit: (quotaKey) => {
      const { effectivePlan } = get()
      return PLAN_QUOTAS[effectivePlan][quotaKey as keyof typeof PLAN_QUOTAS.standard] || 0
    },
    
    // Actions async
    loadUserPlan: async (userId) => {
      try {
        set({ loading: true, error: null })
        
        // Get profile with subscription_plan
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_plan, admin_mode')
          .eq('id', userId)
          .maybeSingle()
        
        if (profileError) throw profileError
        
        // Check if user is admin via has_role
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'admin'
        })
        
        // Map subscription_plan to PlanType
        let plan: PlanType = 'free'
        const subPlan = profile?.subscription_plan?.toLowerCase()
        if (subPlan === 'standard') plan = 'standard'
        else if (subPlan === 'pro') plan = 'pro'
        else if (subPlan === 'ultra_pro' || subPlan === 'ultra-pro') plan = 'ultra_pro'
        
        const role: UserRole = isAdmin ? 'admin' : 'user'
        const adminMode = (profile?.admin_mode as AdminMode) || null
        
        const effectivePlan = calculateEffectivePlan(plan, role, adminMode)
        
        set({
          currentPlan: plan,
          userRole: role,
          adminMode,
          effectivePlan,
          loading: false
        })
      } catch (error: any) {
        set({
          error: error.message || 'Erreur lors du chargement du plan',
          loading: false
        })
      }
    },
    
    updateUserPlan: async (userId, plan) => {
      try {
        set({ loading: true, error: null })
        
        const { error } = await supabase
          .from('profiles')
          .update({ subscription_plan: plan } as any)
          .eq('id', userId)
        
        if (error) throw error
        
        get().setPlan(plan)
        set({ loading: false })
      } catch (error: any) {
        set({
          error: error.message || 'Erreur lors de la mise à jour du plan',
          loading: false
        })
      }
    },
    
    // Utilitaires admin
    getEffectivePlan: () => get().effectivePlan,
    isAdmin: () => get().userRole === 'admin',
    canBypass: () => get().userRole === 'admin' && get().adminMode === 'bypass'
  }))
)

// Hook de convenance pour les composants
export function usePlanSystem() {
  return useUnifiedPlan()
}
