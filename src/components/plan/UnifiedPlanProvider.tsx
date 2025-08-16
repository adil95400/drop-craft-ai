import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePlan as useSupabasePlan, PlanType } from '@/hooks/usePlan'

interface UnifiedPlanContextType {
  plan: PlanType
  isUltraPro: boolean
  isPro: boolean
  isFree: boolean
  hasPlan: (minPlan: PlanType) => boolean
  hasFeature: (feature: string) => boolean
  loading: boolean
  error: string | null
  updatePlan: (newPlan: PlanType) => Promise<boolean>
  refetch: () => void
}

const UnifiedPlanContext = createContext<UnifiedPlanContextType | undefined>(undefined)

// Configuration centralisée des fonctionnalités par plan
const PLAN_FEATURES = {
  free: [
    'basic-import',
    'basic-catalog',
    'email-support'
  ],
  pro: [
    'basic-import',
    'basic-catalog', 
    'email-support',
    'ai-analysis',
    'advanced-filters',
    'advanced-integrations',
    'workflow-builder',
    'ai-insights',
    'seo-automation',
    'real-time-tracking',
    'priority-support'
  ],
  ultra_pro: [
    'basic-import',
    'basic-catalog',
    'email-support',
    'ai-analysis',
    'advanced-filters',
    'advanced-integrations', 
    'workflow-builder',
    'ai-insights',
    'seo-automation',
    'real-time-tracking',
    'priority-support',
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
    'advanced-analytics',
    'bulk-import',
    'scheduled-import',
    'unlimited-everything'
  ]
} as const

export function UnifiedPlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { plan, hasPlan, isUltraPro, isPro, loading, error, updatePlan, refetch } = useSupabasePlan(user)

  const hasFeature = (feature: string): boolean => {
    return PLAN_FEATURES[plan].includes(feature as any)
  }

  const isFree = plan === 'free'

  const value: UnifiedPlanContextType = {
    plan,
    isUltraPro: isUltraPro(),
    isPro: isPro(),
    isFree,
    hasPlan,
    hasFeature,
    loading,
    error,
    updatePlan,
    refetch
  }

  return (
    <UnifiedPlanContext.Provider value={value}>
      {children}
    </UnifiedPlanContext.Provider>
  )
}

export function useUnifiedPlan() {
  const context = useContext(UnifiedPlanContext)
  if (context === undefined) {
    throw new Error('useUnifiedPlan must be used within a UnifiedPlanProvider')
  }
  return context
}

// Hook de compatibilité pour les composants existants
export { useUnifiedPlan as usePlanContext }