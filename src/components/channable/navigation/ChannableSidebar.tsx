/**
 * ChannableSidebar - Sidebar navigation avec design Premium Professionnel
 * Glassmorphism, gradients subtils, animations fluides, typographie premium
 */
import { useState, useMemo, useCallback, memo } from "react"
import shopoptiLogo from "@/assets/shopopti-logo.png"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronDown, ChevronRight, Search, Star, Lock, Crown,
  Home, Package, Store, ShoppingCart, BarChart3, Settings, Upload,
  Truck, Zap, Sparkles, Users, Brain, Shield, Plug, Rss,
  TrendingUp, Megaphone, Tag, CheckCircle, GitCompare, Workflow,
  Calculator, HelpCircle, GraduationCap, Video, Layers, RefreshCw,
  Clock, Activity, Database, Target, Mail, Bot, Globe, Wrench,
  LayoutDashboard, PackageCheck, Bell, Eye, Trophy, FileEdit, LogOut
} from "lucide-react"
import { 
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarRail, useSidebar, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { cn } from "@/lib/utils"
import { MODULE_REGISTRY, NAV_GROUPS, type NavGroupId } from "@/config/modules"
import { useModules } from "@/hooks/useModules"
import { useFavorites } from "@/stores/favoritesStore"
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"

// Map des icônes complète
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'Home': Home, 'LayoutDashboard': LayoutDashboard, 'Store': Store, 'Package': Package,
  'Upload': Upload, 'Truck': Truck, 'ShoppingCart': ShoppingCart, 'BarChart3': BarChart3,
  'Settings': Settings, 'Zap': Zap, 'Sparkles': Sparkles, 'Search': Search,
  'Link': Database, 'History': Clock, 'RefreshCw': RefreshCw, 'Layers': Layers,
  'Users': Users, 'Boxes': Package, 'Star': Star, 'Eye': Eye, 'GitBranch': GitCompare,
  'CheckCircle': CheckCircle, 'Bell': Bell, 'TrendingUp': TrendingUp,
  'Megaphone': Megaphone, 'Tag': Tag, 'Mail': Mail, 'FileText': FileEdit,
  'Rss': Rss, 'PackageCheck': PackageCheck, 'Plug': Plug, 'Puzzle': Plug,
  'PuzzlePiece': Plug, 'GraduationCap': GraduationCap, 'HelpCircle': HelpCircle,
  'Video': Video, 'Shield': Shield, 'Crown': Crown, 'Brain': Brain, 'Lock': Lock,
  'Workflow': Workflow, 'Bot': Bot, 'Calculator': Calculator, 'Globe': Globe,
  'Database': Database, 'Activity': Activity, 'Target': Target, 'Clock': Clock,
  'Trophy': Trophy, 'Wrench': Wrench, 'FileEdit': FileEdit, 'Plus': Zap, 'Wand2': Sparkles,
  'DollarSign': TrendingUp, 'Book': GraduationCap, 'RotateCcw': RefreshCw,
}

// Couleurs premium par groupe - Design professionnel avancé
const groupColors: Partial<Record<NavGroupId, { 
  bg: string; text: string; accent: string; border: string; icon: string; gradient: string 
}>> = {
  home: { 
    bg: 'bg-blue-500/8', 
    text: 'text-blue-600 dark:text-blue-400', 
    accent: 'hover:bg-blue-500/12', 
    border: 'border-blue-500/20',
    icon: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-500'
  },
  sources: { 
    bg: 'bg-violet-500/8', 
    text: 'text-violet-600 dark:text-violet-400', 
    accent: 'hover:bg-violet-500/12', 
    border: 'border-violet-500/20',
    icon: 'text-violet-500',
    gradient: 'from-violet-500 to-purple-500'
  },
  catalog: { 
    bg: 'bg-emerald-500/8', 
    text: 'text-emerald-600 dark:text-emerald-400', 
    accent: 'hover:bg-emerald-500/12', 
    border: 'border-emerald-500/20',
    icon: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-500'
  },
  channels: { 
    bg: 'bg-orange-500/8', 
    text: 'text-orange-600 dark:text-orange-400', 
    accent: 'hover:bg-orange-500/12', 
    border: 'border-orange-500/20',
    icon: 'text-orange-500',
    gradient: 'from-orange-500 to-amber-500'
  },
  orders: { 
    bg: 'bg-rose-500/8', 
    text: 'text-rose-600 dark:text-rose-400', 
    accent: 'hover:bg-rose-500/12', 
    border: 'border-rose-500/20',
    icon: 'text-rose-500',
    gradient: 'from-rose-500 to-pink-500'
  },
  marketing: { 
    bg: 'bg-pink-500/8', 
    text: 'text-pink-600 dark:text-pink-400', 
    accent: 'hover:bg-pink-500/12', 
    border: 'border-pink-500/20',
    icon: 'text-pink-500',
    gradient: 'from-pink-500 to-rose-500'
  },
  insights: { 
    bg: 'bg-cyan-500/8', 
    text: 'text-cyan-600 dark:text-cyan-400', 
    accent: 'hover:bg-cyan-500/12', 
    border: 'border-cyan-500/20',
    icon: 'text-cyan-500',
    gradient: 'from-cyan-500 to-blue-500'
  },
  tools: { 
    bg: 'bg-amber-500/8', 
    text: 'text-amber-600 dark:text-amber-400', 
    accent: 'hover:bg-amber-500/12', 
    border: 'border-amber-500/20',
    icon: 'text-amber-500',
    gradient: 'from-amber-500 to-yellow-500'
  },
  settings: { 
    bg: 'bg-slate-500/8', 
    text: 'text-slate-600 dark:text-slate-400', 
    accent: 'hover:bg-slate-500/12', 
    border: 'border-slate-500/20',
    icon: 'text-slate-500',
    gradient: 'from-slate-500 to-zinc-500'
  },
}

// Logo ShopOpti Premium avec effet glassmorphism
const ChannableLogo = memo(({ collapsed }: { collapsed: boolean }) => (
  <motion.div 
    className={cn("flex items-center gap-3", collapsed && "justify-center")}
    initial={false}
    animate={{ opacity: 1 }}
  >
    <motion.div
      className={cn(
        "relative flex items-center justify-center",
        collapsed ? "w-10 h-10" : "w-12 h-12"
      )}
      whileHover={{ scale: 1.05, rotate: 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-violet-500/30 rounded-2xl blur-xl opacity-60" />
      <motion.img
        src={shopoptiLogo}
        alt="ShopOpti"
        className={cn(
          "relative object-contain rounded-xl shadow-lg",
          collapsed ? "w-9 h-9" : "h-11 w-auto"
        )}
      />
    </motion.div>
    
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex flex-col"
        >
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            ShopOpti
          </span>
          <span className="text-[10px] font-medium text-muted-foreground/70 tracking-wider uppercase">
            E-Commerce Suite
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
))
ChannableLogo.displayName = 'ChannableLogo'

// Barre de recherche Premium avec glassmorphism
const ChannableSearch = memo(({ 
  value, 
  onChange, 
  collapsed 
}: { 
  value: string
  onChange: (value: string) => void 
  collapsed: boolean
}) => {
  if (collapsed) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-violet-500/5 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
      <Input
        placeholder="Rechercher un module..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="relative pl-10 pr-16 h-10 bg-sidebar-muted/50 dark:bg-sidebar-muted/30 border-sidebar-border/50 focus:border-primary/40 focus:bg-background/80 transition-all rounded-xl text-sm placeholder:text-muted-foreground/50 shadow-sm"
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded-md border border-sidebar-border/60 bg-sidebar-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 shadow-sm">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </div>
    </motion.div>
  )
})
ChannableSearch.displayName = 'ChannableSearch'

// Item de navigation Premium avec effets avancés
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
}: {
  module: any
  isActive: boolean
  hasAccess: boolean
  collapsed: boolean
  groupColor: typeof groupColors.home
  isFavorite: boolean
  onNavigate: (route: string) => void
  onFavoriteToggle: () => void
  subModules: any[]
  isSubOpen: boolean
  onSubToggle: () => void
}) => {
  const Icon = iconMap[module.icon] || Package
  const hasSubModules = subModules.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => hasSubModules ? onSubToggle() : hasAccess && onNavigate(module.route)}
          tooltip={collapsed ? module.name : undefined}
          className={cn(
            "w-full rounded-xl transition-all duration-200 group/item relative overflow-hidden",
            isActive 
              ? `bg-gradient-to-r ${groupColor?.gradient || 'from-primary to-primary/80'} text-white shadow-lg shadow-primary/20` 
              : "hover:bg-sidebar-accent/50 dark:hover:bg-sidebar-accent/30",
            !hasAccess && "opacity-40 cursor-not-allowed"
          )}
        >
          {/* Active indicator glow */}
          {isActive && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
          
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
            isActive 
              ? "bg-white/20" 
              : `${groupColor?.bg || 'bg-muted/50'}`,
            !collapsed && "mr-2"
          )}>
            <Icon className={cn(
              "h-4 w-4 transition-all",
              isActive 
                ? "text-white" 
                : groupColor?.icon || "text-foreground/70",
              isActive && "scale-110"
            )} />
          </div>
          
          {!collapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className={cn(
                "text-[13px] font-medium truncate",
                isActive ? "text-white" : "text-foreground/80"
              )}>
                {module.name}
              </span>
              
              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                {!hasAccess && <Lock className="h-3 w-3 text-muted-foreground/60" />}
                
                {module.badge && (
                  <Badge 
                    className={cn(
                      "text-[9px] px-1.5 py-0 h-4 font-bold border-0 uppercase tracking-wide",
                      module.badge === 'pro' && "bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white shadow-sm",
                      module.badge === 'new' && "bg-gradient-to-r from-emerald-500/90 to-green-500/90 text-white shadow-sm",
                      module.badge === 'beta' && "bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white shadow-sm"
                    )}
                  >
                    {module.badge}
                  </Badge>
                )}
                
                {hasSubModules && (
                  <ChevronRight className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    isActive ? "text-white/70" : "text-muted-foreground/60",
                    isSubOpen && "rotate-90"
                  )} />
                )}
                
                <button
                  onClick={(e) => { e.stopPropagation(); onFavoriteToggle() }}
                  className={cn(
                    "h-5 w-5 flex items-center justify-center rounded-md transition-all",
                    "opacity-0 group-hover/item:opacity-100",
                    isFavorite && "opacity-100"
                  )}
                >
                  <Star className={cn(
                    "h-3 w-3 transition-all",
                    isFavorite 
                      ? "fill-amber-400 text-amber-400 drop-shadow-sm" 
                      : isActive ? "text-white/60 hover:text-amber-300" : "text-muted-foreground/50 hover:text-amber-500"
                  )} />
                </button>
              </div>
            </div>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      {/* Sous-menus avec animation fluide */}
      <AnimatePresence>
        {hasSubModules && isSubOpen && !collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-5 mt-1 space-y-0.5 border-l-2 border-sidebar-border/40 pl-3"
          >
            {subModules.map(sub => {
              const SubIcon = iconMap[sub.icon] || Package
              return (
                <motion.button
                  key={sub.id}
                  onClick={() => onNavigate(sub.route)}
                  whileHover={{ x: 3 }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30 transition-all"
                >
                  <SubIcon className="h-3.5 w-3.5" />
                  <span className="truncate text-[12px]">{sub.name}</span>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})
ChannableNavItem.displayName = 'ChannableNavItem'

// Groupe de navigation Premium
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
}: {
  group: typeof NAV_GROUPS[0]
  modules: any[]
  isOpen: boolean
  onToggle: () => void
  collapsed: boolean
  activeRoute: (path: string) => boolean
  canAccess: (id: string) => boolean
  favorites: { isFavorite: (id: string) => boolean }
  onNavigate: (route: string) => void
  onFavoriteToggle: (id: string) => void
  openSubMenus: Record<string, boolean>
  onSubMenuToggle: (id: string) => void
  currentPlan: string
}) => {
  const Icon = iconMap[group.icon] || Package
  const color = groupColors[group.id] || groupColors.home
  const hasActiveModule = modules.some(m => activeRoute(m.route))

  return (
    <SidebarGroup className="py-0.5">
      <motion.button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-all",
          "hover:bg-sidebar-accent/40 dark:hover:bg-sidebar-accent/20",
          isOpen && "bg-sidebar-accent/30 dark:bg-sidebar-accent/15",
          hasActiveModule && `${color?.bg} ${color?.border} border`,
          collapsed && "justify-center px-0"
        )}
        whileHover={{ scale: collapsed ? 1.05 : 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className={cn(
          "flex items-center justify-center w-7 h-7 rounded-lg transition-all",
          hasActiveModule 
            ? `bg-gradient-to-br ${color?.gradient || 'from-primary to-primary/80'} shadow-sm` 
            : "bg-sidebar-muted/60 dark:bg-sidebar-muted/40"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            hasActiveModule ? "text-white" : color?.icon || "text-muted-foreground"
          )} />
        </div>
        
        {!collapsed && (
          <>
            <span className={cn(
              "flex-1 text-left text-[11px] font-semibold uppercase tracking-widest",
              hasActiveModule ? color?.text : "text-muted-foreground/70"
            )}>
              {group.label}
            </span>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-sidebar-muted/60 dark:bg-sidebar-muted/30 text-muted-foreground/70 border-0">
              {modules.length}
            </Badge>
            <ChevronDown className={cn(
              "h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </>
        )}
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="mt-1 space-y-0.5 px-1"
          >
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {modules.map(module => (
                  <ChannableNavItem
                    key={module.id}
                    module={module}
                    isActive={activeRoute(module.route)}
                    hasAccess={canAccess(module.id)}
                    collapsed={collapsed}
                    groupColor={color}
                    isFavorite={favorites.isFavorite(module.id)}
                    onNavigate={onNavigate}
                    onFavoriteToggle={() => onFavoriteToggle(module.id)}
                    subModules={module.subModules || []}
                    isSubOpen={openSubMenus[module.id] || false}
                    onSubToggle={() => onSubMenuToggle(module.id)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </motion.div>
        )}
      </AnimatePresence>
    </SidebarGroup>
  )
})
ChannableNavGroup.displayName = 'ChannableNavGroup'

// Section Favoris Premium
const FavoritesSection = memo(({
  favoriteModules,
  isActive,
  canAccess,
  collapsed,
  onNavigate,
  onFavoriteToggle,
  favorites,
}: {
  favoriteModules: any[]
  isActive: (path: string) => boolean
  canAccess: (id: string) => boolean
  collapsed: boolean
  onNavigate: (route: string) => void
  onFavoriteToggle: (id: string) => void
  favorites: { isFavorite: (id: string) => boolean }
}) => {
  if (favoriteModules.length === 0) return null

  return (
    <div className="mb-2">
      {!collapsed && (
        <div className="flex items-center gap-2 px-3 py-2">
          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Favoris
          </span>
        </div>
      )}
      <div className="space-y-0.5 px-1">
        {favoriteModules.slice(0, 5).map(module => {
          const Icon = iconMap[module.icon] || Star
          const active = isActive(module.route)
          
          return (
            <motion.button
              key={module.id}
              onClick={() => onNavigate(module.route)}
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all group",
                active 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md" 
                  : "hover:bg-sidebar-accent/40 dark:hover:bg-sidebar-accent/20"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-7 h-7 rounded-lg",
                active ? "bg-white/20" : "bg-amber-500/10"
              )}>
                <Icon className={cn(
                  "h-3.5 w-3.5",
                  active ? "text-white" : "text-amber-600 dark:text-amber-400"
                )} />
              </div>
              {!collapsed && (
                <span className={cn(
                  "flex-1 text-left text-[12px] font-medium truncate",
                  active ? "text-white" : "text-foreground/80"
                )}>
                  {module.name}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
      {!collapsed && <Separator className="mt-3 mb-1 bg-sidebar-border/40" />}
    </div>
  )
})
FavoritesSection.displayName = 'FavoritesSection'

// Footer Premium avec profil utilisateur
const ChannableFooter = memo(({ collapsed }: { collapsed: boolean }) => {
  const { profile, signOut } = useUnifiedAuth()
  
  const planStyles: Record<string, string> = {
    'ultra_pro': 'from-amber-500 to-orange-500',
    'pro': 'from-violet-500 to-purple-500',
    'standard': 'from-slate-500 to-zinc-500',
  }
  
  return (
    <SidebarFooter className="border-t border-sidebar-border/50 p-3 bg-sidebar-muted/20 dark:bg-sidebar-muted/10">
      <div className={cn(
        "flex items-center gap-3",
        collapsed && "justify-center"
      )}>
        <motion.div 
          className={cn(
            "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-lg",
            planStyles[profile?.plan || 'standard'] || planStyles.standard
          )}
          whileHover={{ scale: 1.05, rotate: 2 }}
        >
          {profile?.full_name?.[0]?.toUpperCase() || 'U'}
        </motion.div>
        
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-semibold truncate text-foreground">
                {profile?.full_name || 'Utilisateur'}
              </p>
              <div className="flex items-center gap-1.5">
                <Crown className="h-3 w-3 text-amber-500" />
                <p className="text-[11px] text-muted-foreground/70 capitalize">
                  {profile?.plan || 'Standard'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!collapsed && (
          <ThemeToggle variant="ghost" className="h-8 w-8 rounded-lg" />
        )}
      </div>
      
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 grid grid-cols-2 gap-2"
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs rounded-lg hover:bg-sidebar-accent/40 dark:hover:bg-sidebar-accent/20"
          >
            <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
            Aide
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs rounded-lg hover:bg-sidebar-accent/40 dark:hover:bg-sidebar-accent/20"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Config
          </Button>
        </motion.div>
      )}
    </SidebarFooter>
  )
})
ChannableFooter.displayName = 'ChannableFooter'

// Composant principal avec design premium
export function ChannableSidebar() {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  const location = useLocation()
  const navigate = useNavigate()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [openGroups, setOpenGroups] = useState<NavGroupId[]>(['home', 'catalog', 'channels', 'marketing'])
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({ marketing: true })
  
  const { availableModules, allModules, canAccess, isModuleEnabled, currentPlan, isAdminBypass } = useModules()
  const favorites = useFavorites()

  const isActive = useCallback((path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }, [location.pathname])

  const handleNavigate = useCallback((route: string) => {
    navigate(route)
  }, [navigate])

  const handleFavoriteToggle = useCallback((moduleId: string) => {
    if (favorites.isFavorite(moduleId)) {
      favorites.removeFavorite(moduleId)
    } else {
      favorites.addFavorite(moduleId)
    }
  }, [favorites])

  const toggleGroup = useCallback((groupId: NavGroupId) => {
    setOpenGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(g => g !== groupId) 
        : [...prev, groupId]
    )
  }, [])

  const toggleSubMenu = useCallback((moduleId: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }, [])

  // Calcul optimisé des modules par groupe et filtrage
  const { modulesByGroup, filteredGroups } = useMemo(() => {
    const searchLower = searchQuery.toLowerCase()
    const grouped: Record<string, any[]> = {}
    
    availableModules.forEach(module => {
      if (!module.groupId) return
      
      const matchesSearch = !searchQuery || 
        module.name.toLowerCase().includes(searchLower) ||
        module.groupId.toLowerCase().includes(searchLower)
      
      if (!grouped[module.groupId]) {
        grouped[module.groupId] = []
      }
      
      if (matchesSearch) {
        grouped[module.groupId].push(module)
      }
    })
    
    const filtered = NAV_GROUPS.filter(group => 
      grouped[group.id]?.length > 0
    )
    
    return { modulesByGroup: grouped, filteredGroups: filtered }
  }, [availableModules, searchQuery])

  const favoriteModules = useMemo(() => {
    return allModules.filter(m => favorites.isFavorite(m.id))
  }, [allModules, favorites])

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-sidebar-border/50 bg-sidebar-background"
    >
      {/* Header Premium avec glassmorphism */}
      <SidebarHeader className="border-b border-sidebar-border/40 bg-sidebar-muted/20 dark:bg-sidebar-muted/10 backdrop-blur-xl">
        <div className={cn("p-3", collapsed ? "px-2" : "px-4")}>
          <ChannableLogo collapsed={collapsed} />
        </div>
        
        {!collapsed && (
          <div className="px-3 pb-3">
            <ChannableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              collapsed={collapsed} 
            />
          </div>
        )}
      </SidebarHeader>

      {/* Contenu avec scroll personnalisé */}
      <SidebarContent className="bg-sidebar-background">
        <ScrollArea className="flex-1 px-2 py-3">
          {/* Favoris */}
          <FavoritesSection
            favoriteModules={favoriteModules}
            isActive={isActive}
            canAccess={canAccess}
            collapsed={collapsed}
            onNavigate={handleNavigate}
            onFavoriteToggle={handleFavoriteToggle}
            favorites={favorites}
          />
          
          {/* Groupes de navigation */}
          {filteredGroups.map(group => (
            <ChannableNavGroup
              key={group.id}
              group={group}
              modules={modulesByGroup[group.id] || []}
              isOpen={openGroups.includes(group.id)}
              onToggle={() => toggleGroup(group.id)}
              collapsed={collapsed}
              activeRoute={isActive}
              canAccess={canAccess}
              favorites={favorites}
              onNavigate={handleNavigate}
              onFavoriteToggle={handleFavoriteToggle}
              openSubMenus={openSubMenus}
              onSubMenuToggle={toggleSubMenu}
              currentPlan={currentPlan}
            />
          ))}
        </ScrollArea>
      </SidebarContent>
      
      {/* Footer Premium */}
      <ChannableFooter collapsed={collapsed} />
      
      <SidebarRail />
    </Sidebar>
  )
}
