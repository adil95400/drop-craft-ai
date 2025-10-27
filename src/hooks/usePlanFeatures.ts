import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { useMemo } from 'react'

export const usePlanFeatures = () => {
  const { currentPlan, isUltraPro, isPro, hasFeature } = useUnifiedPlan()

  // Memoize feature checks to avoid recalculation
  const features = useMemo(() => ({
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
  }), [hasFeature])

  const getFeatureConfig = useMemo(() => (moduleName: string) => {
    const configs: Record<string, any> = {
      dashboard: {
        showAIInsights: features.aiInsights,
        showPredictive: features.predictiveAnalytics,
        title: isUltraPro ? 'Dashboard Ultra Pro' : 'Dashboard'
      },
      import: {
        showAIImport: features.aiImport,
        showBulkOps: features.bulkOperations,
        title: isUltraPro ? 'Import Ultra Pro' : 'Import'
      },
      catalogue: {
        showAdvancedFilters: features.advancedFilters,
        showAnalytics: features.advancedAnalytics,
        title: isUltraPro ? 'Catalogue Ultra Pro' : 'Catalogue'
      }
    };

    return configs[moduleName] || {
      title: moduleName,
      showAdvanced: isUltraPro
    };
  }, [features, isUltraPro]);

  return {
    plan: currentPlan,
    isUltraPro,
    isPro,
    features,
    hasFeature,
    getFeatureConfig
  }
}