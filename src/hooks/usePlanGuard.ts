import { useAuth } from '@/hooks/useAuth'
import { usePlan, PlanType } from '@/hooks/usePlan'

export const usePlanGuard = () => {
  const { user } = useAuth()
  const { plan, hasPlan, loading, error } = usePlan(user)

  const requirePlan = (minPlan: PlanType): boolean => {
    return hasPlan(minPlan)
  }

  const canAccess = (feature: string): boolean => {
    const featureRequirements: Record<string, PlanType> = {
      // Import features
      'ai-import': 'ultra_pro',
      'bulk-import': 'ultra_pro',
      'scheduled-import': 'ultra_pro',
      'advanced-import': 'pro',
      
      // Analytics features
      'advanced-analytics': 'ultra_pro',
      'predictive-analytics': 'ultra_pro',
      'ai-insights': 'pro',
      
      // Automation features
      'marketing-automation': 'ultra_pro',
      'advanced-automation': 'ultra_pro',
      'workflow-builder': 'pro',
      
      // CRM features
      'crm-prospects': 'ultra_pro',
      'advanced-crm': 'pro',
      
      // SEO features
      'advanced-seo': 'ultra_pro',
      'seo-automation': 'pro',
      
      // Security features
      'security-monitoring': 'ultra_pro',
      'advanced-security': 'pro',
      
      // Integration features
      'premium-integrations': 'ultra_pro',
      'advanced-integrations': 'pro',
      
      // Tracking features
      'advanced-tracking': 'ultra_pro',
      'real-time-tracking': 'pro'
    }

    const requiredPlan = featureRequirements[feature]
    if (!requiredPlan) return true // Feature doesn't require specific plan
    
    return hasPlan(requiredPlan)
  }

  const getPlanStatus = () => ({
    plan,
    isUltraPro: plan === 'ultra_pro',
    isPro: plan === 'pro' || plan === 'ultra_pro',
    isStandard: plan === 'standard',
    loading,
    error
  })

  return {
    requirePlan,
    canAccess,
    getPlanStatus,
    hasPlan,
    plan,
    loading,
    error
  }
}