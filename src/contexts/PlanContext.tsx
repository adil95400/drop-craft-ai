import React, { createContext, useContext, useState, useEffect } from 'react'

export type PlanType = 'free' | 'pro' | 'ultra_pro'

interface PlanContextType {
  plan: PlanType
  setPlan: (plan: PlanType) => void
  isUltraPro: boolean
  isPro: boolean
  hasFeature: (feature: string) => boolean
}

const PlanContext = createContext<PlanContextType | undefined>(undefined)

// Feature flags pour différencier les plans
const PRO_FEATURES = [
  'ai-analysis',
  'advanced-filters',
  'advanced-integrations',
  'workflow-builder',
  'ai-insights',
  'seo-automation',
  'real-time-tracking'
]

const ULTRA_PRO_FEATURES = [
  ...PRO_FEATURES,
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
  'scheduled-import'
]

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<PlanType>('ultra_pro') // Par défaut Ultra Pro pour démo

  const isUltraPro = plan === 'ultra_pro'
  const isPro = plan === 'pro' || plan === 'ultra_pro'

  const hasFeature = (feature: string) => {
    if (plan === 'ultra_pro') return true
    if (plan === 'pro') return PRO_FEATURES.includes(feature)
    return false // plan free
  }

  // Simuler la récupération du plan depuis l'API/subscription
  useEffect(() => {
    const savedPlan = localStorage.getItem('user-plan') as PlanType
    if (savedPlan) {
      setPlan(savedPlan)
    }
  }, [])

  const updatePlan = (newPlan: PlanType) => {
    setPlan(newPlan)
    localStorage.setItem('user-plan', newPlan)
  }

  return (
    <PlanContext.Provider value={{ 
      plan, 
      setPlan: updatePlan, 
      isUltraPro, 
      isPro,
      hasFeature 
    }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  const context = useContext(PlanContext)
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider')
  }
  return context
}