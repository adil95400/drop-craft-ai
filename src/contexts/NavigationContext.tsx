import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useModules } from '@/hooks/useModules';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { MODULE_REGISTRY, NAV_GROUPS, type ModuleConfig, type NavGroupConfig } from '@/config/modules';
import { getSubModules, type SubModule } from '@/config/sub-modules';

export interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
  isActive: boolean;
}

export interface NavigationGroup {
  category: NavGroupConfig;
  modules: ModuleConfig[];
  accessibleCount: number;
}

interface NavigationContextValue {
  // État actuel
  currentModule: ModuleConfig | null;
  currentSubModule: SubModule | null;
  breadcrumbs: BreadcrumbItem[];
  
  // Groupes de navigation
  navigationGroups: NavigationGroup[];
  
  // Actions
  navigateToModule: (moduleId: string) => void;
  navigateToPath: (path: string) => void;
  
  // Vérifications
  canAccessModule: (moduleId: string) => boolean;
  isActiveRoute: (path: string) => boolean;
  
  // Recherche
  searchModules: (query: string) => ModuleConfig[];
  
  // Statistiques
  totalAccessibleModules: number;
  planSpecificModules: ModuleConfig[];
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { availableModules, canAccess } = useModules();
  const { currentPlan } = useUnifiedPlan();

  // Module actuel basé sur l'URL
  const currentModule = useMemo(() => {
    return availableModules.find(module => 
      location.pathname === module.route || 
      location.pathname.startsWith(module.route + '/')
    ) || null;
  }, [location.pathname, availableModules]);

  // Sous-module actuel
  const currentSubModule = useMemo(() => {
    if (!currentModule) return null;
    const subModules = getSubModules(currentModule.id);
    return subModules.find(sub => 
      location.pathname === sub.route || 
      location.pathname.startsWith(sub.route + '/')
    ) || null;
  }, [currentModule, location.pathname]);

  // Génération des breadcrumbs
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const crumbs: BreadcrumbItem[] = [
      {
        label: 'Accueil',
        path: '/dashboard',
        icon: 'BarChart3',
        isActive: location.pathname === '/dashboard'
      }
    ];

    if (currentModule) {
      crumbs.push({
        label: currentModule.name,
        path: currentModule.route,
        icon: currentModule.icon,
        isActive: location.pathname === currentModule.route
      });

      if (currentSubModule) {
        crumbs.push({
          label: currentSubModule.name,
          path: currentSubModule.route,
          icon: currentSubModule.icon,
          isActive: location.pathname === currentSubModule.route
        });
      }
    }

    return crumbs;
  }, [location.pathname, currentModule, currentSubModule]);

  // Tous les modules activés (pour affichage)
  const allEnabledModules = useMemo(() => {
    return Object.values(MODULE_REGISTRY).filter(m => m.enabled);
  }, []);

  // Groupes de navigation par NAV_GROUPS (style Channable)
  // Affiche TOUS les modules enabled, pas seulement ceux accessibles
  const navigationGroups = useMemo<NavigationGroup[]>(() => {
    return NAV_GROUPS.map(navGroup => {
      const groupModules = allEnabledModules
        .filter(m => m.groupId === navGroup.id)
        .sort((a, b) => a.order - b.order);
      const accessibleCount = groupModules.filter(m => canAccess(m.id)).length;
      
      return {
        category: navGroup,
        modules: groupModules,
        accessibleCount
      };
    }).filter(group => group.modules.length > 0);
  }, [allEnabledModules, canAccess]);

  // Modules spécifiques au plan
  const planSpecificModules = useMemo(() => {
    return availableModules.filter(m => m.minPlan === currentPlan);
  }, [availableModules, currentPlan]);

  // Actions de navigation
  const navigateToModule = useCallback((moduleId: string) => {
    const module = MODULE_REGISTRY[moduleId];
    if (module && canAccess(moduleId)) {
      navigate(module.route);
    }
  }, [navigate, canAccess]);

  const navigateToPath = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const isActiveRoute = useCallback((path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  // Recherche de modules
  const searchModules = useCallback((query: string) => {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    return availableModules.filter(module => 
      module.name.toLowerCase().includes(lowerQuery) ||
      module.description.toLowerCase().includes(lowerQuery) ||
      module.features.some(f => f.toLowerCase().includes(lowerQuery))
    );
  }, [availableModules]);

  const value: NavigationContextValue = {
    currentModule,
    currentSubModule,
    breadcrumbs,
    navigationGroups,
    navigateToModule,
    navigateToPath,
    canAccessModule: canAccess,
    isActiveRoute,
    searchModules,
    totalAccessibleModules: availableModules.filter(m => canAccess(m.id)).length,
    planSpecificModules
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
