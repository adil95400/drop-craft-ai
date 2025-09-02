import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

// Imports des composants modulaires
import { SidebarHeaderContent } from "./SidebarHeader";
import { SidebarFooterContent } from "./SidebarFooter";
import { SidebarNavigationItem } from "./SidebarComponents";
import { QuickActions } from "./QuickActions";

// Configuration centralisée
import { 
  navigationConfig, 
  quickActionsConfig, 
  defaultGroupStates,
  animationConfig 
} from "./SidebarConfig";

// Hook personnalisé pour la recherche avec debounce
const useSearchFilter = (query: string, delay: number = 300) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(handler);
  }, [query, delay]);

  return debouncedQuery;
};

// Hook pour la gestion des groupes avec persistance
const useGroupState = () => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(defaultGroupStates);

  // Charger l'état depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-groups-v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        setOpenGroups(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des groupes:', error);
    }
  }, []);

  // Sauvegarder l'état dans localStorage
  const toggleGroup = useCallback((title: string) => {
    setOpenGroups(prev => {
      const newState = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem('sidebar-groups-v2', JSON.stringify(newState));
      } catch (error) {
        console.warn('Erreur lors de la sauvegarde des groupes:', error);
      }
      return newState;
    });
  }, []);

  return { openGroups, toggleGroup };
};

export function OptimizedSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  // State management optimisé
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [recentActions, setRecentActions] = useState<string[]>([]);
  
  // Hooks personnalisés
  const debouncedSearch = useSearchFilter(searchQuery);
  const { openGroups, toggleGroup } = useGroupState();

  // Détection optimisée de la route active
  const isActive = useCallback((url?: string) => {
    if (!url) return false;
    return location.pathname === url || location.pathname.startsWith(url + '/');
  }, [location.pathname]);

  // Filtrage intelligent de la navigation avec memoization
  const filteredNavigation = useMemo(() => {
    if (!debouncedSearch.trim()) return navigationConfig;
    
    const query = debouncedSearch.toLowerCase();
    return navigationConfig.map(group => ({
      ...group,
      items: group.items?.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.url?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        group.title.toLowerCase().includes(query)
      )
    })).filter(group => group.items && group.items.length > 0);
  }, [debouncedSearch]);

  // Gestionnaire d'actions rapides optimisé
  const handleQuickAction = useCallback(async (action: string) => {
    // Actions spéciales
    switch (action) {
      case 'sync':
        setSyncStatus('syncing');
        toast.loading("Synchronisation en cours...", { id: 'sync-action' });
        
        // Simulation de synchronisation
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          setSyncStatus('success');
          toast.success("✅ Synchronisation terminée", { id: 'sync-action' });
          setTimeout(() => setSyncStatus('idle'), 3000);
        } catch (error) {
          setSyncStatus('error');
          toast.error("❌ Erreur de synchronisation", { id: 'sync-action' });
          setTimeout(() => setSyncStatus('idle'), 3000);
        }
        break;
        
      case 'ai-assistant':
        toast.success("🤖 Assistant IA activé");
        navigate('/ai');
        break;
        
      default:
        navigate(`/${action}`);
        break;
    }
    
    // Enregistrer l'action récente
    setRecentActions(prev => 
      [action, ...prev.filter(a => a !== action)].slice(0, 5)
    );
  }, [navigate]);

  // Gestionnaire de raccourcis clavier optimisé
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Éviter les conflits avec les champs de saisie
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
          setSearchQuery('');
        }
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const shortcuts: Record<string, (e: KeyboardEvent) => void> = {
          'k': (e) => {
            e.preventDefault();
            document.getElementById('sidebar-search')?.focus();
            setIsSearchFocused(true);
          },
          'i': (e) => {
            e.preventDefault();
            handleQuickAction('ai-assistant');
          },
          'n': (e) => {
            e.preventDefault();
            handleQuickAction('catalogue-ultra-pro?action=add');
          },
          'r': (e) => {
            e.preventDefault();
            handleQuickAction('sync');
          }
        };

        const handler = shortcuts[e.key.toLowerCase()];
        if (handler) {
          handler(e);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleQuickAction]);

  // Gestionnaires d'événements de recherche
  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    setIsSearchFocused(false);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  return (
    <Sidebar
      className={cn(
        "border-r bg-background/95 backdrop-blur-md transition-all duration-300",
        "shadow-lg shadow-black/5",
        collapsed && "w-16"
      )}
      collapsible="icon"
    >
      {/* Header avec recherche intelligente */}
      <SidebarHeaderContent
        collapsed={collapsed}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchFocus={handleSearchFocus}
        onSearchBlur={handleSearchBlur}
        isSearchFocused={isSearchFocused}
      />

      {/* Contenu principal */}
      <SidebarContent className="px-2 py-4 space-y-4">
        {/* Actions rapides */}
        {!collapsed && (
          <QuickActions
            actions={quickActionsConfig}
            onAction={handleQuickAction}
            syncStatus={syncStatus}
            recentActions={recentActions}
          />
        )}

        {/* Navigation principale */}
        <div className="space-y-2">
          {filteredNavigation.map((group) => (
            <SidebarGroup key={group.title}>
              {!collapsed && (
                <SidebarGroupLabel className={cn(
                  "group/label flex items-center justify-between px-2 py-2 text-xs",
                  "text-muted-foreground hover:text-foreground",
                  "transition-colors duration-200 cursor-pointer",
                  "hover:bg-sidebar-accent/50 rounded-md"
                )}>
                  <div className="flex items-center gap-2">
                    <group.icon className="h-4 w-4" />
                    <span className="font-medium">{group.title}</span>
                    {group.badge && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        "bg-primary/10 text-primary border border-primary/20"
                      )}>
                        {group.badge.text}
                      </span>
                    )}
                  </div>
                </SidebarGroupLabel>
              )}
              
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {group.items?.map((item) => (
                    <SidebarNavigationItem
                      key={item.url || item.title}
                      item={item}
                      isActive={isActive}
                      collapsed={collapsed}
                      isOpen={openGroups[item.title]}
                      onToggle={() => toggleGroup(item.title)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>

        {/* Message de recherche vide */}
        {debouncedSearch && filteredNavigation.length === 0 && (
          <div className={cn(
            "text-center py-8 text-muted-foreground",
            !collapsed && "animate-in fade-in-50 duration-300"
          )}>
            <p className="text-sm">Aucun résultat trouvé</p>
            <p className="text-xs mt-1">
              Essayez un autre terme de recherche
            </p>
          </div>
        )}
      </SidebarContent>

      {/* Footer avec profil utilisateur */}
      <SidebarFooterContent
        collapsed={collapsed}
        syncStatus={syncStatus}
        onQuickAction={handleQuickAction}
      />
    </Sidebar>
  );
}