/**
 * Composant unifié qui remplace les versions Standard/Pro/Ultra-Pro dupliquées
 */

import React from 'react'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { UnifiedFeatureGate } from './UnifiedFeatureGate'

interface UnifiedComponentProps {
  children: React.ReactNode
  standardVersion?: React.ReactNode
  proVersion?: React.ReactNode
  ultraProVersion?: React.ReactNode
  className?: string
}

export function UnifiedComponent({
  children,
  standardVersion,
  proVersion,
  ultraProVersion,
  className = ''
}: UnifiedComponentProps) {
  const { effectivePlan, hasFeature } = useUnifiedPlan()
  
  // Rendu conditionnel basé sur le plan effectif
  const renderVersion = () => {
    if (effectivePlan === 'ultra_pro' && ultraProVersion) {
      return ultraProVersion
    }
    
    if (effectivePlan === 'pro' && proVersion) {
      return proVersion
    }
    
    if (standardVersion) {
      return standardVersion
    }
    
    // Version par défaut avec fonctionnalités conditionnelles
    return children
  }
  
  return (
    <div className={className}>
      {renderVersion()}
    </div>
  )
}

// Hook pour composants qui veulent adapter leur rendu selon le plan
export function usePlanConditionalRender() {
  const { effectivePlan, hasFeature, isPro, isUltraPro } = useUnifiedPlan()
  
  return {
    effectivePlan,
    hasFeature,
    isPro: isPro(),
    isUltraPro: isUltraPro(),
    renderIf: (condition: boolean, component: React.ReactNode) => 
      condition ? component : null,
    renderByPlan: (components: {
      standard?: React.ReactNode
      pro?: React.ReactNode
      ultra_pro?: React.ReactNode
    }) => {
      if (effectivePlan === 'ultra_pro' && components.ultra_pro) {
        return components.ultra_pro
      }
      if (effectivePlan === 'pro' && components.pro) {
        return components.pro
      }
      return components.standard || null
    }
  }
}

// Composant d'aide pour les features conditionnelles
interface ConditionalFeatureProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ConditionalFeature({ feature, children, fallback }: ConditionalFeatureProps) {
  const { hasFeature } = useUnifiedPlan()
  
  if (hasFeature(feature)) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}