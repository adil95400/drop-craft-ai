import { useMemo } from 'react';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { useModules, useModuleFeatures } from '@/hooks/useModules';
// planStore removed - using unified-plan-system

/**
 * Hook unifié qui combine tous les systèmes de gestion des modules et plans
 * Évite la duplication et centralise la logique
 */
export function useUnifiedModules() {
  // Plans et fonctionnalités
  const { currentPlan, hasFeature: planHasFeature, hasPlan } = useUnifiedPlan();
  
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

  // Fonctions unifiées avec gestion admin
  const unifiedFeatureCheck = useMemo(() => {
    return (feature: string): boolean => {
      // Admin a accès à toutes les fonctionnalités
      if (currentPlan === 'ultra_pro') return true;
      
      // Vérifie dans le plan provider et les modules
      return (
        planHasFeature(feature) ||
        moduleHasFeature(feature) ||
        moduleFeatures.hasAnyFeature([feature])
      );
    };
  }, [planHasFeature, moduleHasFeature, moduleFeatures, currentPlan]);

  const unifiedAccessCheck = useMemo(() => {
    return (moduleOrFeature: string): boolean => {
      // Admin a accès à tout
      if (currentPlan === 'ultra_pro') return true;
      
      // Peut être un module ou une fonctionnalité
      return (
        moduleCanAccess(moduleOrFeature) ||
        unifiedFeatureCheck(moduleOrFeature)
      );
    };
  }, [moduleCanAccess, unifiedFeatureCheck, currentPlan]);

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
          current: currentPlan,
          canUpgrade: currentPlan !== 'ultra_pro',
          nextPlan: currentPlan === 'standard' ? 'pro' : currentPlan === 'pro' ? 'ultra_pro' : null
        }
      };
    };
  }, [
    getModuleConfig, isModuleEnabled, moduleCanAccess, 
    unifiedFeatureCheck, currentPlan
  ]);

  return {
    // Plan management
    plan: currentPlan,
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
    updatePlan: (newPlan: any) => {}, // Stub for backward compat
    
    // Utility
    isStandard: currentPlan === 'standard',
    isPro: hasPlan('pro'),
    isUltraPro: currentPlan === 'ultra_pro'
  };
}

// Raccourci pour la compatibilité
export const useFeatures = useUnifiedModules;