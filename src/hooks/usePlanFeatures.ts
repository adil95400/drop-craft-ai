import { useUnifiedPlan } from '@/components/plan/UnifiedPlanProvider'

export const usePlanFeatures = () => {
  const { plan, isUltraPro, isPro, hasFeature } = useUnifiedPlan()

  // Feature checks pour différents modules
  const features = {
    // Dashboard
    aiInsights: hasFeature('ai-analysis'),
    predictiveAnalytics: hasFeature('predictive-analytics'),
    
    // Import
    aiImport: hasFeature('ai-import'),
    bulkOperations: hasFeature('bulk-operations'),
    
    // Catalogue
    advancedFilters: hasFeature('advanced-filters'),
    advancedAnalytics: hasFeature('advanced-analytics'),
    
    // CRM
    prospects: hasFeature('crm-prospects'),
    automation: hasFeature('advanced-automation'),
    
    // Marketing
    marketingAutomation: hasFeature('marketing-automation'),
    
    // SEO
    advancedSeo: hasFeature('advanced-seo'),
    
    // Tracking
    advancedTracking: hasFeature('advanced-tracking'),
    
    // Analytics
    analyticsInsights: hasFeature('analytics-insights'),
    
    // Security
    securityMonitoring: hasFeature('security-monitoring'),
    
    // Integrations
    premiumIntegrations: hasFeature('premium-integrations')
  }

  const getFeatureConfig = (moduleName: string) => {
    switch (moduleName) {
      case 'dashboard':
        return {
          showAIInsights: features.aiInsights,
          showPredictive: features.predictiveAnalytics,
          title: isUltraPro ? 'Dashboard Ultra Pro' : 'Dashboard'
        }
      
      case 'import':
        return {
          showAIImport: features.aiImport,
          showBulkOps: features.bulkOperations,
          title: isUltraPro ? 'Import Ultra Pro' : 'Import'
        }
      
      case 'catalogue':
        return {
          showAdvancedFilters: features.advancedFilters,
          showAnalytics: features.advancedAnalytics,
          title: isUltraPro ? 'Catalogue Ultra Pro' : 'Catalogue'
        }
      
      default:
        return {
          title: moduleName,
          showAdvanced: isUltraPro
        }
    }
  }

  return {
    plan,
    isUltraPro,
    isPro,
    features,
    hasFeature,
    getFeatureConfig
  }
}