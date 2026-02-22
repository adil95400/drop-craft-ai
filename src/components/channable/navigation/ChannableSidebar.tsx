/**
 * ChannableSidebar - Sidebar navigation avec design Premium Professionnel
 * Glassmorphism, gradients subtils, animations fluides, typographie premium
 * 
 * Optimisations appliquées:
 * - Constantes externalisées dans navigation-constants.ts
 * - Support prefers-reduced-motion
 * - Accessibilité WCAG 2.1 AA améliorée
 * - Debounce sur la recherche
 * - Memoization optimisée
 */
import { useState, useMemo, useCallback, memo } from "react";
import { useHeaderNotifications } from "@/hooks/useHeaderNotifications";
import shopoptiLogo from "@/assets/logo-shopopti.png";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, Search, Star, Lock, Crown, Package, Settings, HelpCircle, User } from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarRail, useSidebar, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, type NavGroupId } from "@/config/modules";
import { ICON_MAP, GROUP_COLORS, PLAN_STYLES } from "@/config/navigation-constants";
import { useModules } from "@/hooks/useModules";
import { useFavorites } from "@/stores/favoritesStore";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

// Logo ShopOpti Premium avec effet glassmorphism
const ChannableLogo = memo(({
  collapsed
}: {
  collapsed: boolean;
}) => {
  const prefersReducedMotion = useReducedMotion();
  return <motion.div className={cn("gap-3 flex items-center justify-center px-0", collapsed && "justify-center")} initial={false} animate={{
    opacity: 1
  }}>
      <motion.div className={cn("relative flex items-center justify-center", collapsed ? "w-10 h-10" : "w-12 h-12")} whileHover={prefersReducedMotion ? undefined : {
      scale: 1.05,
      rotate: 2
    }} transition={prefersReducedMotion ? undefined : {
      type: "spring",
      stiffness: 400,
      damping: 17
    }}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-violet-500/30 rounded-2xl blur-xl opacity-60" aria-hidden="true" />
        <motion.img src={shopoptiLogo} alt="ShopOpti Logo" className={cn("relative object-contain rounded-xl shadow-lg", collapsed ? "w-9 h-9" : "h-11 w-auto")} />
      </motion.div>
      
      <AnimatePresence>
        {!collapsed && <motion.div initial={prefersReducedMotion ? undefined : {
        opacity: 0,
        x: -10
      }} animate={prefersReducedMotion ? undefined : {
        opacity: 1,
        x: 0
      }} exit={prefersReducedMotion ? undefined : {
        opacity: 0,
        x: -10
      }} className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent tracking-tight">
              ShopOpti+
            </span>
            <span className="text-[10px] text-muted-foreground/70 font-medium tracking-wider uppercase">
              Premium Platform
            </span>
          </motion.div>}
      </AnimatePresence>
    </motion.div>;
});
ChannableLogo.displayName = 'ChannableLogo';

// Premium Search Bar with glassmorphism and debounce
const ChannableSearch = memo(({
  value,
  onChange,
  collapsed
}: {
  value: string;
  onChange: (value: string) => void;
  collapsed: boolean;
}) => {
  const { t } = useTranslation('common');
  if (collapsed) return null;
  return <motion.div initial={{
    opacity: 0,
    y: -5
  }} animate={{
    opacity: 1,
    y: 0
  }} className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-violet-500/5 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" aria-hidden="true" />
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" aria-hidden="true" />
      <Input placeholder={t('sidebar.searchModule')} value={value} onChange={e => onChange(e.target.value)} className="relative pl-10 pr-16 h-10 bg-sidebar-muted/50 dark:bg-sidebar-muted/30 border-sidebar-border/50 focus:border-primary/40 focus:bg-background/80 transition-all rounded-xl text-sm placeholder:text-muted-foreground/50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" aria-label={t('sidebar.searchModule')} />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1" aria-hidden="true">
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded-md border border-sidebar-border/60 bg-sidebar-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 shadow-sm">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </div>
    </motion.div>;
});
ChannableSearch.displayName = 'ChannableSearch';

// Premium Navigation Item with advanced effects
const ChannableNavItem = memo(({
  module,
  isActive,
  hasAccess,
  collapsed,
  groupColor,
  isFavorite,
  onNavigate,
  onFavoriteToggle,
  subModules,
  isSubOpen,
  onSubToggle,
  t,
  badgeCount
}: {
  module: any;
  isActive: boolean;
  hasAccess: boolean;
  collapsed: boolean;
  groupColor: typeof GROUP_COLORS.home;
  isFavorite: boolean;
  onNavigate: (route: string) => void;
  onFavoriteToggle: () => void;
  subModules: any[];
  isSubOpen: boolean;
  onSubToggle: () => void;
  t: (key: string) => string;
  badgeCount?: number;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const Icon = ICON_MAP[module.icon] || Package;
  const hasSubModules = subModules.length > 0;
  const isComingSoon = module.comingSoon === true;
  const isClickable = hasAccess && !isComingSoon;
  return <motion.div initial={prefersReducedMotion ? false : {
    opacity: 0,
    x: -8
  }} animate={prefersReducedMotion ? false : {
    opacity: 1,
    x: 0
  }} transition={prefersReducedMotion ? undefined : {
    duration: 0.2,
    ease: "easeOut"
  }}>
      <SidebarMenuItem className="group/menu-item">
        <SidebarMenuButton onClick={() => hasSubModules ? onSubToggle() : isClickable && onNavigate(module.route)} tooltip={collapsed ? module.name : undefined} className={cn("w-full rounded-xl transition-all duration-200 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 peer/menu-button", isActive ? `bg-gradient-to-r ${groupColor?.gradient || 'from-primary to-primary/80'} text-white shadow-lg shadow-primary/20` : "hover:bg-sidebar-accent/50 dark:hover:bg-sidebar-accent/30", (!hasAccess || isComingSoon) && "opacity-40 cursor-not-allowed")} aria-current={isActive ? "page" : undefined} aria-disabled={!isClickable} aria-expanded={hasSubModules ? isSubOpen : undefined}>
          {/* Active indicator glow */}
          {isActive && <motion.div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" initial={prefersReducedMotion ? false : {
          opacity: 0
        }} animate={prefersReducedMotion ? false : {
          opacity: 1
        }} aria-hidden="true" />}
          
          <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg transition-all", isActive ? "bg-white/20" : `${groupColor?.bg || 'bg-muted/50'}`, !collapsed && "mr-2")} aria-hidden="true">
            <Icon className={cn("h-4 w-4 transition-all", isActive ? "text-white" : groupColor?.icon || "text-foreground/70", isActive && "scale-110")} />
          </div>
          
          {!collapsed && <div className="flex items-center justify-between flex-1 min-w-0">
              <span className={cn("text-[13px] font-medium truncate", isActive ? "text-white" : "text-foreground/80")}>
                {module.name}
              </span>
              
              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0 pr-6">
                {badgeCount != null && badgeCount > 0 && (
                  <Badge className="text-[9px] px-1.5 py-0 h-4 font-bold border-0 bg-rose-500 text-white shadow-sm min-w-[1.25rem] text-center animate-pulse">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                )}
                
                {isComingSoon && (
                  <Badge className="text-[8px] px-1 py-0 h-3.5 font-bold border-0 uppercase tracking-wide bg-muted text-muted-foreground">
                    {t('sidebar.comingSoon')}
                  </Badge>
                )}
                
                {!hasAccess && !isComingSoon && <Lock className="h-3 w-3 text-muted-foreground/60" aria-label={t('errors.forbidden')} />}
                
                {module.badge && !isComingSoon && <Badge className={cn("text-[9px] px-1.5 py-0 h-4 font-bold border-0 uppercase tracking-wide", module.badge === 'pro' && "bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white shadow-sm", module.badge === 'new' && "bg-gradient-to-r from-emerald-500/90 to-green-500/90 text-white shadow-sm", module.badge === 'beta' && "bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white shadow-sm")}>
                    {module.badge}
                  </Badge>}
                
                {hasSubModules && <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200", isActive ? "text-white/70" : "text-muted-foreground/60", isSubOpen && "rotate-90")} aria-hidden="true" />}
              </div>
            </div>}
        </SidebarMenuButton>
        
        {/* Favorite action - using SidebarMenuAction to avoid button nesting */}
        {!collapsed && (
          <SidebarMenuAction
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
            showOnHover={!isFavorite}
            className={cn(isFavorite && "opacity-100")}
            aria-label={isFavorite ? t('sidebar.removeFromFavorites') : t('sidebar.addToFavorites')}
            aria-pressed={isFavorite}
          >
            <Star className={cn("h-3 w-3 transition-all", isFavorite ? "fill-amber-400 text-amber-400 drop-shadow-sm" : isActive ? "text-white/60 hover:text-amber-300" : "text-muted-foreground/50 hover:text-amber-500")} aria-hidden="true" />
          </SidebarMenuAction>
        )}
      </SidebarMenuItem>
      
      {/* Sous-menus avec animation fluide */}
      <AnimatePresence>
        {hasSubModules && isSubOpen && !collapsed && <motion.div initial={prefersReducedMotion ? undefined : {
        opacity: 0,
        height: 0
      }} animate={prefersReducedMotion ? undefined : {
        opacity: 1,
        height: 'auto'
      }} exit={prefersReducedMotion ? undefined : {
        opacity: 0,
        height: 0
      }} transition={prefersReducedMotion ? undefined : {
        duration: 0.2
      }} className="ml-5 mt-1 space-y-0.5 border-l-2 border-sidebar-border/40 pl-3" role="menu" aria-label={`Sous-menu de ${module.name}`}>
            {subModules.map(sub => {
          const SubIcon = ICON_MAP[sub.icon] || Package;
          return <motion.button key={sub.id} onClick={() => onNavigate(sub.route)} whileHover={prefersReducedMotion ? undefined : {
            x: 3
          }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" role="menuitem">
                  <SubIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="truncate text-[12px]">{sub.name}</span>
                </motion.button>;
        })}
          </motion.div>}
      </AnimatePresence>
    </motion.div>;
});
ChannableNavItem.displayName = 'ChannableNavItem';

// Premium Navigation Group
const ChannableNavGroup = memo(({
  group,
  modules,
  isOpen,
  onToggle,
  collapsed,
  activeRoute,
  canAccess,
  favorites,
  onNavigate,
  onFavoriteToggle,
  openSubMenus,
  onSubMenuToggle,
  currentPlan,
  t,
  badgeCounts
}: {
  group: typeof NAV_GROUPS[0];
  modules: any[];
  isOpen: boolean;
  onToggle: () => void;
  collapsed: boolean;
  activeRoute: (path: string) => boolean;
  canAccess: (id: string) => boolean;
  favorites: {
    isFavorite: (id: string) => boolean;
  };
  onNavigate: (route: string) => void;
  onFavoriteToggle: (id: string) => void;
  openSubMenus: Record<string, boolean>;
  onSubMenuToggle: (id: string) => void;
  currentPlan: string;
  t: (key: string) => string;
  badgeCounts?: Record<string, number>;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const Icon = ICON_MAP[group.icon] || Package;
  const color = GROUP_COLORS[group.id] || GROUP_COLORS.home;
  const hasActiveModule = modules.some(m => activeRoute(m.route));
  return <SidebarGroup className="py-0.5">
      <motion.button onClick={onToggle} className={cn("w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50", "hover:bg-sidebar-accent/40 dark:hover:bg-sidebar-accent/20", isOpen && "bg-sidebar-accent/30 dark:bg-sidebar-accent/15", hasActiveModule && `${color?.bg} ${color?.border} border`, collapsed && "justify-center px-0")} whileHover={prefersReducedMotion ? undefined : {
      scale: collapsed ? 1.05 : 1.01
    }} whileTap={prefersReducedMotion ? undefined : {
      scale: 0.98
    }} aria-expanded={isOpen} aria-label={`${group.label} - ${modules.length} modules`}>
        <div className={cn("flex items-center justify-center w-7 h-7 rounded-lg transition-all", hasActiveModule ? `bg-gradient-to-br ${color?.gradient || 'from-primary to-primary/80'} shadow-sm` : "bg-sidebar-muted/60 dark:bg-sidebar-muted/40")} aria-hidden="true">
          <Icon className={cn("h-4 w-4", hasActiveModule ? "text-white" : color?.icon || "text-muted-foreground")} />
        </div>
        
        {!collapsed && <>
            <span className={cn("flex-1 text-left text-[11px] font-semibold uppercase tracking-widest", hasActiveModule ? color?.text : "text-muted-foreground/70")}>
              {group.label}
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200", isOpen && "rotate-180")} aria-hidden="true" />
          </>}
      </motion.button>
      
      <AnimatePresence>
        {isOpen && <motion.div initial={prefersReducedMotion ? undefined : {
        opacity: 0,
        height: 0
      }} animate={prefersReducedMotion ? undefined : {
        opacity: 1,
        height: 'auto'
      }} exit={prefersReducedMotion ? undefined : {
        opacity: 0,
        height: 0
      }} transition={prefersReducedMotion ? undefined : {
        duration: 0.25,
        ease: "easeInOut"
      }} className="mt-1 space-y-0.5 px-1" role="group" aria-label={group.label}>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {modules.map(module => <ChannableNavItem key={module.id} module={module} isActive={activeRoute(module.route)} hasAccess={canAccess(module.id)} collapsed={collapsed} groupColor={color} isFavorite={favorites.isFavorite(module.id)} onNavigate={onNavigate} onFavoriteToggle={() => onFavoriteToggle(module.id)} subModules={module.subModules || []} isSubOpen={openSubMenus[module.id] || false} onSubToggle={() => onSubMenuToggle(module.id)} t={t} badgeCount={badgeCounts?.[module.id]} />)}
              </SidebarMenu>
            </SidebarGroupContent>
          </motion.div>}
      </AnimatePresence>
    </SidebarGroup>;
});
ChannableNavGroup.displayName = 'ChannableNavGroup';

// Section Favoris Premium
const FavoritesSection = memo(({
  favoriteModules,
  isActive,
  canAccess,
  collapsed,
  onNavigate,
  onFavoriteToggle,
  favorites
}: {
  favoriteModules: any[];
  isActive: (path: string) => boolean;
  canAccess: (id: string) => boolean;
  collapsed: boolean;
  onNavigate: (route: string) => void;
  onFavoriteToggle: (id: string) => void;
  favorites: {
    isFavorite: (id: string) => boolean;
  };
}) => {
  const prefersReducedMotion = useReducedMotion();
  if (favoriteModules.length === 0) return null;
  return <div className="mb-2" role="region" aria-label="Modules favoris">
      {!collapsed && <div className="flex items-center gap-2 px-3 py-2">
          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Favoris
          </span>
        </div>}
      <div className="space-y-0.5 px-1" role="list">
        {favoriteModules.slice(0, 5).map(module => {
        const Icon = ICON_MAP[module.icon] || Star;
        const active = isActive(module.route);
        return <motion.button key={module.id} onClick={() => onNavigate(module.route)} whileHover={prefersReducedMotion ? undefined : {
          scale: 1.01,
          x: 2
        }} whileTap={prefersReducedMotion ? undefined : {
          scale: 0.98
        }} className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50", active ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md" : "hover:bg-sidebar-accent/40 dark:hover:bg-sidebar-accent/20")} role="listitem" aria-current={active ? "page" : undefined}>
              <div className={cn("flex items-center justify-center w-7 h-7 rounded-lg", active ? "bg-white/20" : "bg-amber-500/10")} aria-hidden="true">
                <Icon className={cn("h-3.5 w-3.5", active ? "text-white" : "text-amber-600 dark:text-amber-400")} />
              </div>
              {!collapsed && <span className={cn("flex-1 text-left text-[12px] font-medium truncate", active ? "text-white" : "text-foreground/80")}>
                  {module.name}
                </span>}
            </motion.button>;
      })}
      </div>
      {!collapsed && <Separator className="mt-3 mb-1 bg-sidebar-border/40" />}
    </div>;
});
FavoritesSection.displayName = 'FavoritesSection';

// Footer Premium avec profil utilisateur cliquable
const ChannableFooter = memo(({
  collapsed
}: {
  collapsed: boolean;
}) => {
  const {
    profile,
    signOut
  } = useUnifiedAuth();
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const planStyle = PLAN_STYLES[profile?.plan || 'standard'] || PLAN_STYLES.standard;
  const planLabel = {
    'ultra_pro': 'Ultra Pro',
    'pro': 'Pro',
    'standard': 'Standard',
    'free': 'Free'
  }[profile?.plan || 'standard'] || 'Standard';
  return <SidebarFooter className="border-t border-sidebar-border/50 p-3 bg-sidebar-muted/20 dark:bg-sidebar-muted/10">
      <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
        {profile?.avatar_url ? (
          <motion.img
            src={profile.avatar_url}
            alt={profile?.full_name || 'Avatar'}
            className="w-10 h-10 rounded-xl object-cover shadow-lg cursor-pointer"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05, rotate: 2 }}
            onClick={() => navigate('/profile')}
            role="button"
            aria-label="Voir mon profil"
          />
        ) : (
          <motion.div 
            className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-lg cursor-pointer", planStyle.gradient)} 
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05, rotate: 2 }} 
            onClick={() => navigate('/profile')} 
            role="button" 
            aria-label="Voir mon profil"
          >
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </motion.div>
        )}
        
        <AnimatePresence>
          {!collapsed && <motion.div initial={prefersReducedMotion ? undefined : {
          opacity: 0,
          x: -10
        }} animate={prefersReducedMotion ? undefined : {
          opacity: 1,
          x: 0
        }} exit={prefersReducedMotion ? undefined : {
          opacity: 0,
          x: -10
        }} className="flex-1 min-w-0">
              <div 
                className="cursor-pointer group" 
                onClick={() => navigate('/profile')}
                role="button" 
                tabIndex={0}
                aria-label="Voir mon profil"
                onKeyDown={(e) => e.key === 'Enter' && navigate('/profile')}
              >
                <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                  {profile?.full_name || 'Utilisateur'}
                </p>
              </div>
              <div 
                onClick={() => navigate('/dashboard/subscription')} 
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer" 
                role="button"
                tabIndex={0}
                aria-label="Voir mon abonnement"
                onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard/subscription')}
              >
                <Crown className="h-3 w-3 text-amber-500" aria-hidden="true" />
                <p className="text-[11px] text-muted-foreground/70">
                  {planLabel}
                </p>
              </div>
            </motion.div>}
        </AnimatePresence>
        
        {!collapsed && <ThemeToggle variant="ghost" className="h-8 w-8 rounded-lg" />}
      </div>
      
      {!collapsed && <motion.div initial={prefersReducedMotion ? false : {
      opacity: 0
    }} animate={prefersReducedMotion ? false : {
      opacity: 1
    }} className="mt-3 grid grid-cols-3 gap-1.5">
          <Button variant="ghost" size="sm" className="h-8 text-xs rounded-lg hover:bg-sidebar-accent/40 dark:hover:bg-sidebar-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" aria-label="Mon profil" onClick={() => navigate('/profile')}>
            <User className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs rounded-lg hover:bg-sidebar-accent/40 dark:hover:bg-sidebar-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" aria-label="Aide et support" onClick={() => navigate('/support')}>
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs rounded-lg hover:bg-sidebar-accent/40 dark:hover:bg-sidebar-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" aria-label="Configuration" onClick={() => navigate('/settings')}>
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </motion.div>}
    </SidebarFooter>;
});
ChannableFooter.displayName = 'ChannableFooter';

// Main component with premium design
export function ChannableSidebar() {
  const {
    state
  } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<NavGroupId[]>([]);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    marketing: true
  });

  // Debounce search for better performance
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 150);
  
  // Notification unread count for badge
  const { unreadCount: notificationUnreadCount } = useHeaderNotifications();
  const badgeCounts = useMemo(() => ({
    notifications: notificationUnreadCount
  }), [notificationUnreadCount]);
  const {
    availableModules,
    allModules,
    canAccess,
    isModuleEnabled,
    currentPlan,
    isAdminBypass
  } = useModules();
  const favorites = useFavorites();
  const isActive = useCallback((path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);
  const handleNavigate = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);
  const handleFavoriteToggle = useCallback((moduleId: string) => {
    if (favorites.isFavorite(moduleId)) {
      favorites.removeFavorite(moduleId);
    } else {
      favorites.addFavorite(moduleId);
    }
  }, [favorites]);
  const toggleGroup = useCallback((groupId: NavGroupId) => {
    setOpenGroups(prev => prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]);
  }, []);
  const toggleSubMenu = useCallback((moduleId: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  }, []);

  // Calcul optimisé des modules par groupe et filtrage avec debounced search
  const {
    modulesByGroup,
    filteredGroups
  } = useMemo(() => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    const grouped: Record<string, any[]> = {};
    availableModules.forEach(module => {
      if (!module.groupId) return;
      const matchesSearch = !debouncedSearchQuery || module.name.toLowerCase().includes(searchLower) || module.groupId.toLowerCase().includes(searchLower);
      if (!grouped[module.groupId]) {
        grouped[module.groupId] = [];
      }
      if (matchesSearch) {
        grouped[module.groupId].push(module);
      }
    });
    const filtered = NAV_GROUPS.filter(group => grouped[group.id]?.length > 0);
    return {
      modulesByGroup: grouped,
      filteredGroups: filtered
    };
  }, [availableModules, debouncedSearchQuery]);
  const favoriteModules = useMemo(() => {
    return allModules.filter(m => favorites.isFavorite(m.id));
  }, [allModules, favorites]);
  return <Sidebar collapsible="icon" className="border-r border-sidebar-border/50 bg-sidebar-background">
      {/* Header Premium avec glassmorphism */}
      <SidebarHeader className="border-b border-sidebar-border/40 bg-sidebar-muted/20 dark:bg-sidebar-muted/10 backdrop-blur-xl">
        <div className={cn("p-3", collapsed ? "px-2" : "px-4")}>
          <ChannableLogo collapsed={collapsed} />
        </div>
        
        {!collapsed && <div className="px-3 pb-3">
            <ChannableSearch value={searchQuery} onChange={setSearchQuery} collapsed={collapsed} />
          </div>}
      </SidebarHeader>

      {/* Contenu avec scroll personnalisé */}
      <SidebarContent className="bg-sidebar-background">
        <ScrollArea className="flex-1 px-2 py-3">
          {/* Favoris */}
          <FavoritesSection favoriteModules={favoriteModules} isActive={isActive} canAccess={canAccess} collapsed={collapsed} onNavigate={handleNavigate} onFavoriteToggle={handleFavoriteToggle} favorites={favorites} />
          
          {/* Navigation Groups */}
          <nav aria-label={t('navigation', { ns: 'navigation' })}>
            {filteredGroups.map(group => <ChannableNavGroup key={group.id} group={group} modules={modulesByGroup[group.id] || []} isOpen={openGroups.includes(group.id)} onToggle={() => toggleGroup(group.id)} collapsed={collapsed} activeRoute={isActive} canAccess={canAccess} favorites={favorites} onNavigate={handleNavigate} onFavoriteToggle={handleFavoriteToggle} openSubMenus={openSubMenus} onSubMenuToggle={toggleSubMenu} currentPlan={currentPlan} t={t} badgeCounts={badgeCounts} />)}
          </nav>
        </ScrollArea>
      </SidebarContent>
      
      {/* Footer Premium */}
      <ChannableFooter collapsed={collapsed} />
      
      <SidebarRail />
    </Sidebar>;
}