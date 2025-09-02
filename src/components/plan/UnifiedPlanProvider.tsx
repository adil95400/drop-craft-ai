import React, { createContext, useContext, ReactNode, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePlan as useSupabasePlan, PlanType } from '@/hooks/usePlan'
import { usePlanStore } from '@/stores'

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
  
  // Enhanced feature flags
  getFeatureConfig: (moduleName: string) => {
    enabled: boolean;
    features: Record<string, boolean>;
    title: string;
  }
}

const UnifiedPlanContext = createContext<UnifiedPlanContextType | undefined>(undefined)

// Configuration centralisée des fonctionnalités par plan
const PLAN_FEATURES = {
  standard: [
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
  const planStore = usePlanStore()

  // Sync plan with store
  useEffect(() => {
    if (plan && plan !== planStore.currentPlan) {
      planStore.setPlan(plan)
    }
  }, [plan, planStore])

  const hasFeature = (feature: string): boolean => {
    return PLAN_FEATURES[plan].includes(feature as any) || planStore.hasFeature(feature)
  }

  const getFeatureConfig = (moduleName: string) => {
    const moduleConfigs = {
      'import': {
        enabled: true,
        features: {
          'basic-import': true,
          'ai-import': hasFeature('ai-import'),
          'bulk-import': hasFeature('bulk-import'),
          'scheduled-import': hasFeature('scheduled-import'),
          'advanced-import': hasFeature('advanced-import'),
        },
        title: isUltraPro() ? 'Import Ultra Pro' : isPro() ? 'Import Pro' : 'Import'
      },
      'crm': {
        enabled: isPro() || isUltraPro(),
        features: {
          'basic-crm': isPro() || isUltraPro(),
          'crm-prospects': hasFeature('crm-prospects'),
          'advanced-crm': hasFeature('advanced-crm'),
        },
        title: isUltraPro() ? 'CRM Ultra Pro' : 'CRM Pro'
      },
      'analytics': {
        enabled: true,
        features: {
          'basic-analytics': true,
          'advanced-analytics': hasFeature('advanced-analytics'),
          'predictive-analytics': hasFeature('predictive-analytics'),
          'ai-insights': hasFeature('ai-insights'),
        },
        title: isUltraPro() ? 'Analytics Ultra Pro' : isPro() ? 'Analytics Pro' : 'Analytics'
      },
      'seo': {
        enabled: isPro() || isUltraPro(),
        features: {
          'basic-seo': isPro() || isUltraPro(),
          'advanced-seo': hasFeature('advanced-seo'),
          'seo-automation': hasFeature('seo-automation'),
        },
        title: isUltraPro() ? 'SEO Ultra Pro' : 'SEO Pro'
      }
    }
    
    return moduleConfigs[moduleName as keyof typeof moduleConfigs] || {
      enabled: false,
      features: {},
      title: moduleName
    }
  }

  const isFree = plan === 'standard'

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
    refetch,
    getFeatureConfig
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