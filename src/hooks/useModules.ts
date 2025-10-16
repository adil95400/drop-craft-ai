import { useMemo } from 'react';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { ModuleManager, MODULE_REGISTRY, type ModuleConfig } from '@/config/modules';

export interface UseModulesReturn {
  availableModules: ModuleConfig[];
  canAccess: (moduleId: string) => boolean;
  hasFeature: (feature: string) => boolean;
  getModuleConfig: (moduleId: string) => ModuleConfig | null;
  moduleManager: ModuleManager;
  isModuleEnabled: (moduleId: string) => boolean;
  getModulesByPlan: (plan?: string) => ModuleConfig[];
}

export function useModules(): UseModulesReturn {
  const { plan, hasFeature: planHasFeature } = useUnifiedPlan();

  const moduleManager = useMemo(() => {
    return new ModuleManager(plan);
  }, [plan]);

  const availableModules = useMemo(() => {
    return moduleManager.getAvailableModules();
  }, [moduleManager]);

  const canAccess = (moduleId: string): boolean => {
    return moduleManager.canAccessModule(moduleId);
  };

  const hasFeature = (feature: string): boolean => {
    // Utilise à la fois le système de modules et le système de plans existant
    return moduleManager.hasFeature(feature) || planHasFeature(feature);
  };

  const getModuleConfig = (moduleId: string): ModuleConfig | null => {
    return moduleManager.getModuleConfig(moduleId);
  };

  const isModuleEnabled = (moduleId: string): boolean => {
    const module = MODULE_REGISTRY[moduleId];
    return module ? canAccess(moduleId) && module.enabled : false;
  };

  const getModulesByPlan = (targetPlan?: string): ModuleConfig[] => {
    if (!targetPlan) return availableModules;
    
    return Object.values(MODULE_REGISTRY).filter(
      module => module.minPlan === targetPlan
    );
  };

  return {
    availableModules,
    canAccess,
    hasFeature,
    getModuleConfig,
    moduleManager,
    isModuleEnabled,
    getModulesByPlan
  };
}

// Hook spécialisé pour les fonctionnalités
export function useModuleFeatures() {
  const { hasFeature, availableModules } = useModules();
  
  return {
    // Analytics
    hasAdvancedAnalytics: () => hasFeature('advanced-analytics'),
    hasPredictiveAnalytics: () => hasFeature('predictive-analytics'),
    hasAIInsights: () => hasFeature('ai-insights'),
    
    // Import & AI
    hasAIImport: () => hasFeature('ai-import'),
    hasBulkImport: () => hasFeature('bulk-import'),
    hasScheduledImport: () => hasFeature('scheduled-import'),
    
    // Automation
    hasWorkflowBuilder: () => hasFeature('workflow-builder'),
    hasMarketingAutomation: () => hasFeature('marketing-automation'),
    hasAdvancedAutomation: () => hasFeature('advanced-automation'),
    
    // CRM
    hasCRMProspects: () => hasFeature('crm-prospects'),
    hasAdvancedCRM: () => hasFeature('advanced-crm'),
    
    // SEO
    hasAdvancedSEO: () => hasFeature('advanced-seo'),
    hasSEOAutomation: () => hasFeature('seo-automation'),
    
    // Security & Integrations
    hasSecurityMonitoring: () => hasFeature('security-monitoring'),
    hasPremiumIntegrations: () => hasFeature('premium-integrations'),
    hasAdvancedTracking: () => hasFeature('advanced-tracking'),
    
    // Utility
    getAllFeatures: () => availableModules.flatMap(m => m.features),
    hasAnyFeature: (features: string[]) => features.some(f => hasFeature(f))
  };
}