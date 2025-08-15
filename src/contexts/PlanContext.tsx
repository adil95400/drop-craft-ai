import React, { createContext, useContext, useState, useEffect } from 'react'

export type PlanType = 'standard' | 'ultra-pro'

interface PlanContextType {
  plan: PlanType
  setPlan: (plan: PlanType) => void
  isUltraPro: boolean
  hasFeature: (feature: string) => boolean
}

const PlanContext = createContext<PlanContextType | undefined>(undefined)

// Feature flags pour différencier les plans
const ULTRA_PRO_FEATURES = [
  'ai-analysis',
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
  'analytics-insights'
]

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<PlanType>('ultra-pro') // Par défaut Ultra Pro pour démo

  const isUltraPro = plan === 'ultra-pro'

  const hasFeature = (feature: string) => {
    if (plan === 'ultra-pro') return true
    return !ULTRA_PRO_FEATURES.includes(feature)
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