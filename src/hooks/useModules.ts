import { useMemo } from 'react';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { ModuleManager, MODULE_REGISTRY, type ModuleConfig } from '@/config/modules';

export interface UseModulesReturn {
  availableModules: ModuleConfig[];
  allModules: ModuleConfig[];
  canAccess: (moduleId: string) => boolean;
  hasFeature: (feature: string) => boolean;
  getModuleConfig: (moduleId: string) => ModuleConfig | null;
  moduleManager: ModuleManager;
  isModuleEnabled: (moduleId: string) => boolean;
  getModulesByPlan: (plan?: string) => ModuleConfig[];
  availableFeatures: string[];
  currentPlan: any;
  isAdminBypass: boolean;
}

export function useModules(): UseModulesReturn {
  const { currentPlan, hasFeature: planHasFeature } = useUnifiedPlan();
  const { profile } = useUnifiedAuth();

  // Vérifier si l'utilisateur est admin avec bypass
  const isAdminBypass = useMemo(() => {
    return profile?.is_admin && profile?.admin_mode === 'bypass';
  }, [profile]);

  const moduleManager = useMemo(() => {
    return new ModuleManager(currentPlan);
  }, [currentPlan]);

  // Obtenir tous les modules disponibles
  const availableModules = useMemo(() => {
    // Si admin en mode bypass, tous les modules sont disponibles
    if (isAdminBypass) {
      return Object.values(MODULE_REGISTRY);
    }
    return moduleManager.getAvailableModules();
  }, [moduleManager, isAdminBypass]);

  // Obtenir tous les modules (pour affichage avec restrictions)
  const allModules = useMemo(() => {
    return Object.values(MODULE_REGISTRY);
  }, []);

  const canAccess = (moduleId: string): boolean => {
    // Admin bypass a accès à TOUT
    if (isAdminBypass) {
      return true;
    }
    return moduleManager.canAccessModule(moduleId);
  };

  const hasFeature = (feature: string): boolean => {
    // Admin bypass a accès à toutes les fonctionnalités
    if (isAdminBypass) {
      return true;
    }
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

  // Obtenir les fonctionnalités disponibles
  const availableFeatures = useMemo(() => {
    // Admin bypass a toutes les fonctionnalités
    if (isAdminBypass) {
      return Object.values(MODULE_REGISTRY).flatMap(m => m.features);
    }
    return moduleManager.getAvailableFeatures();
  }, [moduleManager, isAdminBypass]);

  return {
    availableModules,
    allModules,
    canAccess,
    hasFeature,
    getModuleConfig,
    moduleManager,
    isModuleEnabled,
    getModulesByPlan,
    availableFeatures,
    currentPlan,
    isAdminBypass,
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