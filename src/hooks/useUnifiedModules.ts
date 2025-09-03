import { useMemo } from 'react';
import { useUnifiedPlan } from '@/components/plan/UnifiedPlanProvider';
import { useModules, useModuleFeatures } from '@/hooks/useModules';
import { usePlanStore } from '@/stores/planStore';

/**
 * Hook unifié qui combine tous les systèmes de gestion des modules et plans
 * Évite la duplication et centralise la logique
 */
export function useUnifiedModules() {
  // Plans et fonctionnalités
  const { plan, hasFeature: planHasFeature, hasPlan } = useUnifiedPlan();
  const planStore = usePlanStore();
  
  // Modules
  const {
    availableModules,
    canAccess: moduleCanAccess,
    hasFeature: moduleHasFeature,
    getModuleConfig,
    isModuleEnabled,
    getModulesByPlan
  } = useModules();
  
  // Fonctionnalités spécialisées
  const moduleFeatures = useModuleFeatures();

  // Fonctions unifiées
  const unifiedFeatureCheck = useMemo(() => {
    return (feature: string): boolean => {
      // Vérifie dans le store, le plan provider et les modules
      return (
        planStore.hasFeature(feature) ||
        planHasFeature(feature) ||
        moduleHasFeature(feature) ||
        moduleFeatures.hasAnyFeature([feature])
      );
    };
  }, [planStore, planHasFeature, moduleHasFeature, moduleFeatures]);

  const unifiedAccessCheck = useMemo(() => {
    return (moduleOrFeature: string): boolean => {
      // Peut être un module ou une fonctionnalité
      return (
        moduleCanAccess(moduleOrFeature) ||
        unifiedFeatureCheck(moduleOrFeature)
      );
    };
  }, [moduleCanAccess, unifiedFeatureCheck]);

  // Configuration unifiée des fonctionnalités
  const getUnifiedFeatureConfig = useMemo(() => {
    return (moduleName: string) => {
      const moduleConfig = getModuleConfig(moduleName);
      
      return {
        // Configuration du module
        module: moduleConfig,
        isEnabled: moduleConfig ? isModuleEnabled(moduleName) : false,
        canAccess: moduleCanAccess(moduleName),
        
        // Fonctionnalités spécifiques
        features: {
          // Import
          aiImport: unifiedFeatureCheck('ai-import'),
          bulkImport: unifiedFeatureCheck('bulk-import'),
          scheduledImport: unifiedFeatureCheck('scheduled-import'),
          
          // Analytics
          advancedAnalytics: unifiedFeatureCheck('advanced-analytics'),
          predictiveAnalytics: unifiedFeatureCheck('predictive-analytics'),
          aiInsights: unifiedFeatureCheck('ai-insights'),
          
          // Automation
          workflowBuilder: unifiedFeatureCheck('workflow-builder'),
          marketingAutomation: unifiedFeatureCheck('marketing-automation'),
          advancedAutomation: unifiedFeatureCheck('advanced-automation'),
          
          // CRM
          crmProspects: unifiedFeatureCheck('crm-prospects'),
          advancedCrm: unifiedFeatureCheck('advanced-crm'),
          
          // SEO
          advancedSeo: unifiedFeatureCheck('advanced-seo'),
          seoAutomation: unifiedFeatureCheck('seo-automation'),
          
          // Security & Integrations
          securityMonitoring: unifiedFeatureCheck('security-monitoring'),
          premiumIntegrations: unifiedFeatureCheck('premium-integrations'),
          advancedTracking: unifiedFeatureCheck('advanced-tracking')
        },
        
        // Plan info
        plan: {
          current: plan,
          canUpgrade: plan !== 'ultra_pro',
          nextPlan: plan === 'standard' ? 'pro' : plan === 'pro' ? 'ultra_pro' : null
        }
      };
    };
  }, [
    getModuleConfig, isModuleEnabled, moduleCanAccess, 
    unifiedFeatureCheck, plan
  ]);

  return {
    // Plan management
    plan,
    hasPlan,
    
    // Modules
    availableModules,
    getModulesByPlan,
    
    // Unified access checks
    hasFeature: unifiedFeatureCheck,
    canAccess: unifiedAccessCheck,
    
    // Configuration
    getFeatureConfig: getUnifiedFeatureConfig,
    
    // Module features (backward compatibility)
    ...moduleFeatures,
    
    // Store actions
    updatePlan: planStore.setPlan,
    
    // Utility
    isStandard: plan === 'standard',
    isPro: hasPlan('pro'),
    isUltraPro: plan === 'ultra_pro'
  };
}

// Raccourci pour la compatibilité
export const useFeatures = useUnifiedModules;