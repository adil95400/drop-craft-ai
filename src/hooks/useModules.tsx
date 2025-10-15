import { useMemo } from 'react';
import { usePlan } from './usePlan';
import { MODULE_REGISTRY, ModuleManager, type ModuleConfig } from '@/config/modules';

export function useModules() {
  const { plan } = usePlan();
  
  // Créer le ModuleManager avec le plan actuel
  const moduleManager = useMemo(() => {
    return new ModuleManager(plan);
  }, [plan]);

  // Obtenir tous les modules disponibles
  const availableModules = useMemo(() => {
    return moduleManager.getAvailableModules();
  }, [moduleManager]);

  // Obtenir tous les modules (pour affichage avec restrictions)
  const allModules = useMemo(() => {
    return Object.values(MODULE_REGISTRY);
  }, []);

  // Vérifier si un module est accessible
  const canAccess = (moduleId: string): boolean => {
    return moduleManager.canAccessModule(moduleId);
  };

  // Vérifier si un module est activé
  const isModuleEnabled = (moduleId: string): boolean => {
    const module = MODULE_REGISTRY[moduleId];
    return module ? module.enabled : false;
  };

  // Vérifier si une fonctionnalité est disponible
  const hasFeature = (feature: string): boolean => {
    return moduleManager.hasFeature(feature);
  };

  // Obtenir la configuration d'un module
  const getModuleConfig = (moduleId: string): ModuleConfig | null => {
    return moduleManager.getModuleConfig(moduleId);
  };

  // Obtenir les fonctionnalités disponibles
  const availableFeatures = useMemo(() => {
    return moduleManager.getAvailableFeatures();
  }, [moduleManager]);

  return {
    availableModules,
    allModules,
    canAccess,
    isModuleEnabled,
    hasFeature,
    getModuleConfig,
    availableFeatures,
    currentPlan: plan,
  };
}
