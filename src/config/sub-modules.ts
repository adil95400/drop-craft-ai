import type { PlanType } from '@/lib/unified-plan-system';
import { MODULE_REGISTRY, type SubModule } from './modules';

/**
 * Obtenir tous les sous-modules d'un module parent
 */
export function getSubModules(parentModuleId: string): SubModule[] {
  const module = MODULE_REGISTRY[parentModuleId];
  return module?.subModules || [];
}

/**
 * Obtenir un sous-module spécifique par son ID
 */
export function getSubModule(parentModuleId: string, subModuleId: string): SubModule | undefined {
  const subModules = getSubModules(parentModuleId);
  return subModules.find(sm => sm.id === subModuleId);
}

/**
 * Vérifier si un module a des sous-modules
 */
export function hasSubModules(parentModuleId: string): boolean {
  const module = MODULE_REGISTRY[parentModuleId];
  return (module?.subModules?.length || 0) > 0;
}

/**
 * Obtenir tous les sous-modules accessibles selon le plan
 * Note: Les sous-modules héritent du minPlan du module parent
 */
export function getAccessibleSubModules(
  parentModuleId: string, 
  currentPlan: PlanType
): SubModule[] {
  const planHierarchy: Record<PlanType, number> = {
    'free': 0,
    'standard': 1,
    'pro': 2,
    'ultra_pro': 3
  };

  const module = MODULE_REGISTRY[parentModuleId];
  if (!module) return [];
  
  // Vérifier si l'utilisateur a accès au module parent
  if (planHierarchy[currentPlan] < planHierarchy[module.minPlan]) {
    return [];
  }
  
  return module.subModules || [];
}

/**
 * Obtenir un sous-module par son ID seul (recherche dans tous les modules)
 */
export function getSubModuleById(subModuleId: string): SubModule | undefined {
  for (const moduleId in MODULE_REGISTRY) {
    const module = MODULE_REGISTRY[moduleId];
    if (module.subModules) {
      const subModule = module.subModules.find(sm => sm.id === subModuleId);
      if (subModule) return subModule;
    }
  }
  return undefined;
}

// Re-export SubModule type for convenience
export type { SubModule };
