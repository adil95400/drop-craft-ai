import { useMemo } from 'react';
import { usePlan } from './usePlan';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { MODULE_REGISTRY, ModuleManager, type ModuleConfig } from '@/config/modules';


export interface UseModulesReturn {
  availableModules: ModuleConfig[];
  allModules: ModuleConfig[];
  canAccess: (moduleId: string) => boolean;
  isModuleEnabled: (moduleId: string) => boolean;
  hasFeature: (feature: string) => boolean;
  getModuleConfig: (moduleId: string) => ModuleConfig | null;
  availableFeatures: string[];
  currentPlan: any;
  isAdminBypass: boolean;
}

export function useModules(): UseModulesReturn {
  const { plan } = usePlan();
  const { profile } = useUnifiedAuth();
  
  // Vérifier si l'utilisateur est admin avec bypass
  const isAdminBypass = useMemo(() => {
    return profile?.is_admin && profile?.admin_mode === 'bypass';
  }, [profile]);
  
  // Créer le ModuleManager avec le plan actuel
  const moduleManager = useMemo(() => {
    return new ModuleManager(plan);
  }, [plan]);

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

  // Vérifier si un module est accessible
  const canAccess = (moduleId: string): boolean => {
    // Admin bypass a accès à TOUT
    if (isAdminBypass) {
      return true;
    }
    return moduleManager.canAccessModule(moduleId);
  };

  // Vérifier si un module est activé
  const isModuleEnabled = (moduleId: string): boolean => {
    const module = MODULE_REGISTRY[moduleId];
    return module ? module.enabled : false;
  };

  // Vérifier si une fonctionnalité est disponible
  const hasFeature = (feature: string): boolean => {
    // Admin bypass a accès à toutes les fonctionnalités
    if (isAdminBypass) {
      return true;
    }
    return moduleManager.hasFeature(feature);
  };

  // Obtenir la configuration d'un module
  const getModuleConfig = (moduleId: string): ModuleConfig | null => {
    return moduleManager.getModuleConfig(moduleId);
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
    isModuleEnabled,
    hasFeature,
    getModuleConfig,
    availableFeatures,
    currentPlan: plan,
    isAdminBypass, // Expose le statut admin bypass
  };
}
