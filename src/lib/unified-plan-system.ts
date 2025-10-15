/**
 * Système unifié de gestion des plans
 * Remplace tous les hooks, stores et contexts de plan dispersés
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/integrations/supabase/client'
import type { User } from '@supabase/supabase-js'

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
    'basic-analytics',
    'basic-import',
    'standard-catalog',
    'basic-dashboard'
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
    'products-import': 100,
    'ai-analysis': 10,
    'api-calls': 1000
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

const PLAN_HIERARCHY = { free: 0, standard: 0, pro: 1, ultra_pro: 2 }

function calculateEffectivePlan(plan: PlanType, role: UserRole, adminMode: AdminMode): PlanType {
  if (role !== 'admin' || !adminMode) return plan
  
  if (adminMode === 'bypass') return 'ultra_pro'
  
  if (adminMode.startsWith('preview:')) {
    return adminMode.split(':')[1] as PlanType
  }
  
  return plan
}

export const useUnifiedPlan = create<UnifiedPlanState>()(
  subscribeWithSelector((set, get) => ({
    // État initial
    currentPlan: 'standard',
    userRole: 'user',
    adminMode: null,
    effectivePlan: 'standard',
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
        
        const { data, error } = await supabase
          .from('profiles')
          .select('plan, is_admin, admin_mode')
          .eq('id', userId)
          .maybeSingle()
        
        if (error) throw error
        
        const profile: UserProfile = {
          plan: (data?.plan as PlanType) || 'standard',
          role: data?.is_admin ? 'admin' : 'user',
          admin_mode: (data?.admin_mode as AdminMode) || null
        }
        
        // Normaliser 'free' en 'standard'
        if (profile.plan === 'free') {
          profile.plan = 'standard';
        }
        
        const effectivePlan = calculateEffectivePlan(profile.plan, profile.role, profile.admin_mode)
        
        set({
          currentPlan: profile.plan,
          userRole: profile.role,
          adminMode: profile.admin_mode,
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
          .update({ plan })
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