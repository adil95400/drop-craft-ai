/**
 * ChannableSidebar - Sidebar navigation avec design Channable
 * Structure claire, couleurs vibrantes, animations fluides
 */
import { useState, useMemo, useCallback, memo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronDown, ChevronRight, Search, Star, Lock, Crown,
  Home, Package, Store, ShoppingCart, BarChart3, Settings, Upload,
  Truck, Zap, Sparkles, Users, Brain, Shield, Plug, Rss,
  TrendingUp, Megaphone, Tag, CheckCircle, GitCompare, Workflow,
  Calculator, HelpCircle, GraduationCap, Video, Layers, RefreshCw,
  Clock, Activity, Database, Target, Mail, Bot, Globe, Wrench,
  LayoutDashboard, PackageCheck, Bell, Eye, Trophy, FileEdit
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
import { getAccessibleSubModules } from "@/config/sub-modules"
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

// Couleurs par groupe - Style Channable
const groupColors: Record<NavGroupId, { bg: string; text: string; accent: string; border: string }> = {
  home: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', accent: 'hover:bg-blue-500/20', border: 'border-blue-500/30' },
  sources: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', accent: 'hover:bg-violet-500/20', border: 'border-violet-500/30' },
  catalog: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', accent: 'hover:bg-emerald-500/20', border: 'border-emerald-500/30' },
  channels: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', accent: 'hover:bg-orange-500/20', border: 'border-orange-500/30' },
  orders: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', accent: 'hover:bg-rose-500/20', border: 'border-rose-500/30' },
  insights: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', accent: 'hover:bg-cyan-500/20', border: 'border-cyan-500/30' },
  tools: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', accent: 'hover:bg-amber-500/20', border: 'border-amber-500/30' },
  settings: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', accent: 'hover:bg-slate-500/20', border: 'border-slate-500/30' },
}

// Hexagone SVG animé
function HexagonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z" />
    </svg>
  )
}

// Logo Channable Style
const ChannableLogo = memo(({ collapsed }: { collapsed: boolean }) => (
  <motion.div 
    className={cn("flex items-center gap-3", collapsed && "justify-center")}
    initial={false}
    animate={{ opacity: 1 }}
  >
    <div className="relative">
      <motion.div
        className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25"
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <HexagonIcon className="w-6 h-6 text-primary-foreground" />
      </motion.div>
      <motion.div
        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </div>
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex flex-col"
        >
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            ShopOpti
          </span>
          <span className="text-[10px] text-muted-foreground -mt-0.5">
            by Channable Style
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
))
ChannableLogo.displayName = 'ChannableLogo'

// Barre de recherche Channable
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
      className="relative"
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Rechercher..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 h-9 bg-muted/50 border-transparent focus:border-primary/50 focus:bg-background transition-all rounded-xl text-sm"
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        ⌘K
      </kbd>
    </motion.div>
  )
})
ChannableSearch.displayName = 'ChannableSearch'

// Item de navigation Channable
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
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
    >
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => hasSubModules ? onSubToggle() : hasAccess && onNavigate(module.route)}
          tooltip={collapsed ? module.name : undefined}
          className={cn(
            "w-full rounded-xl transition-all duration-200 group/item",
            "hover:shadow-sm",
            isActive 
              ? `${groupColor.bg} ${groupColor.text} ${groupColor.border} border shadow-sm` 
              : "hover:bg-muted/50",
            !hasAccess && "opacity-40 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
            isActive ? groupColor.bg : "bg-muted/50",
            !collapsed && "mr-1"
          )}>
            <Icon className={cn(
              "h-4 w-4 transition-transform",
              isActive ? groupColor.text : "text-foreground",
              isActive && "scale-110"
            )} />
          </div>
          
          {!collapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className={cn(
                "text-sm font-medium truncate",
                isActive && groupColor.text
              )}>
                {module.name}
              </span>
              
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                {!hasAccess && <Lock className="h-3 w-3 text-muted-foreground" />}
                
                {module.badge && (
                  <Badge 
                    className={cn(
                      "text-[9px] px-1.5 py-0 h-4 font-bold border-0",
                      module.badge === 'pro' && "bg-primary/15 text-primary",
                      module.badge === 'new' && "bg-emerald-500/15 text-emerald-600",
                      module.badge === 'beta' && "bg-amber-500/15 text-amber-600"
                    )}
                  >
                    {module.badge.toUpperCase()}
                  </Badge>
                )}
                
                {hasSubModules && (
                  <ChevronRight className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    isSubOpen && "rotate-90"
                  )} />
                )}
                
                <button
                  onClick={(e) => { e.stopPropagation(); onFavoriteToggle() }}
                  className={cn(
                    "h-5 w-5 flex items-center justify-center rounded-md",
                    "opacity-0 group-hover/item:opacity-100 transition-opacity",
                    isFavorite && "opacity-100"
                  )}
                >
                  <Star className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-amber-400"
                  )} />
                </button>
              </div>
            </div>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      {/* Sous-menus */}
      <AnimatePresence>
        {hasSubModules && isSubOpen && !collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-4 mt-1 space-y-0.5 border-l-2 border-muted pl-3"
          >
            {subModules.map(sub => {
              const SubIcon = iconMap[sub.icon] || Package
              return (
                <motion.button
                  key={sub.id}
                  onClick={() => onNavigate(sub.route)}
                  whileHover={{ x: 2 }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <SubIcon className="h-3.5 w-3.5" />
                  <span className="truncate">{sub.name}</span>
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

// Groupe de navigation Channable
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
    <SidebarGroup className="py-1">
      <motion.button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-all",
          "hover:bg-muted/50",
          isOpen && "bg-muted/30",
          hasActiveModule && `${color.bg} ${color.border} border`,
          collapsed && "justify-center px-0"
        )}
        whileHover={{ scale: collapsed ? 1.05 : 1 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className={cn(
          "flex items-center justify-center w-7 h-7 rounded-lg",
          hasActiveModule ? color.bg : "bg-muted/50"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            hasActiveModule ? color.text : "text-muted-foreground"
          )} />
        </div>
        
        {!collapsed && (
          <>
            <span className={cn(
              "flex-1 text-left text-xs font-semibold uppercase tracking-wider",
              hasActiveModule ? color.text : "text-muted-foreground"
            )}>
              {group.label}
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-muted">
              {modules.length}
            </Badge>
            <ChevronDown className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
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
            className="mt-1 space-y-0.5"
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
                    subModules={getAccessibleSubModules(module.id, currentPlan as any)}
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

// Footer Channable
const ChannableFooter = memo(({ collapsed }: { collapsed: boolean }) => {
  const { profile } = useUnifiedAuth()
  
  return (
    <SidebarFooter className="border-t border-border/50 p-3">
      <div className={cn(
        "flex items-center gap-3",
        collapsed && "justify-center"
      )}>
        <motion.div 
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md"
          whileHover={{ scale: 1.05 }}
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
              <p className="text-sm font-medium truncate">
                {profile?.full_name || 'Utilisateur'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.plan || 'Standard'} Plan
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!collapsed && (
          <ThemeToggle variant="ghost" className="h-8 w-8" />
        )}
      </div>
      
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex gap-2"
        >
          <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs rounded-lg">
            <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
            Aide
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs rounded-lg">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Config
          </Button>
        </motion.div>
      )}
    </SidebarFooter>
  )
})
ChannableFooter.displayName = 'ChannableFooter'

// Composant principal
export function ChannableSidebar() {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  const location = useLocation()
  const navigate = useNavigate()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [openGroups, setOpenGroups] = useState<NavGroupId[]>(['home', 'catalog', 'channels'])
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({})
  
  const { availableModules, canAccess, isModuleEnabled, currentPlan, isAdminBypass } = useModules()
  const favorites = useFavorites()

  const isActive = useCallback((path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }, [location.pathname])

  const handleNavigate = useCallback((route: string) => {
    navigate(route)
  }, [navigate])

  const toggleGroup = useCallback((groupId: NavGroupId) => {
    setOpenGroups(prev => 
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    )
  }, [])

  const toggleSubMenu = useCallback((moduleId: string) => {
    setOpenSubMenus(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }, [])

  // Modules groupés
  const modulesByGroup = useMemo(() => {
    const grouped: Record<NavGroupId, typeof availableModules> = {} as any
    
    availableModules.forEach(module => {
      if (!module.groupId || !isModuleEnabled(module.id)) return
      if (!grouped[module.groupId]) grouped[module.groupId] = []
      
      // Filtrer par recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!module.name.toLowerCase().includes(query) && 
            !module.description?.toLowerCase().includes(query)) {
          return
        }
      }
      
      grouped[module.groupId].push(module)
    })

    Object.values(grouped).forEach(modules => {
      modules.sort((a, b) => a.order - b.order)
    })
    
    return grouped
  }, [availableModules, isModuleEnabled, searchQuery])

  // Favoris section
  const favoriteModules = useMemo(() => {
    return favorites.favorites
      .slice(0, 5)
      .map(f => MODULE_REGISTRY[f.moduleId])
      .filter(Boolean)
  }, [favorites.favorites])

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border/50 bg-background/95 backdrop-blur transition-all duration-300 z-40"
    >
      <SidebarHeader className="p-4 border-b border-border/50">
        <ChannableLogo collapsed={collapsed} />
        
        {isAdminBypass && !collapsed && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3"
          >
            <Badge className="w-full justify-center bg-gradient-to-r from-amber-500 to-rose-500 text-white border-0 shadow-md">
              <Crown className="w-3 h-3 mr-1.5" />
              Mode Admin
            </Badge>
          </motion.div>
        )}
        
        <div className="mt-4">
          <ChannableSearch 
            value={searchQuery} 
            onChange={setSearchQuery} 
            collapsed={collapsed} 
          />
        </div>
        
        {collapsed && (
          <div className="mt-3 flex justify-center">
            <ThemeToggle variant="ghost" className="h-8 w-8" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <ScrollArea className="h-full">
          {/* Favoris */}
          {favoriteModules.length > 0 && (
            <div className="mb-2">
              {!collapsed && (
                <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Favoris
                  </span>
                </div>
              )}
              <SidebarMenu className="gap-0.5">
                {favoriteModules.map(module => {
                  if (!module) return null
                  const Icon = iconMap[module.icon] || Package
                  const color = groupColors[module.groupId] || groupColors.home
                  
                  return (
                    <SidebarMenuItem key={module.id}>
                      <SidebarMenuButton
                        onClick={() => handleNavigate(module.route)}
                        tooltip={collapsed ? module.name : undefined}
                        className={cn(
                          "rounded-xl",
                          isActive(module.route) && `${color.bg} ${color.text} ${color.border} border`
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-7 h-7 rounded-lg",
                          isActive(module.route) ? color.bg : "bg-amber-500/10"
                        )}>
                          <Icon className={cn(
                            "h-4 w-4",
                            isActive(module.route) ? color.text : "text-amber-600"
                          )} />
                        </div>
                        {!collapsed && (
                          <span className="text-sm font-medium truncate">{module.name}</span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
              <Separator className="my-3" />
            </div>
          )}

          {/* Groupes de navigation */}
          {NAV_GROUPS.map(group => {
            const modules = modulesByGroup[group.id] || []
            if (modules.length === 0) return null

            return (
              <ChannableNavGroup
                key={group.id}
                group={group}
                modules={modules}
                isOpen={openGroups.includes(group.id)}
                onToggle={() => toggleGroup(group.id)}
                collapsed={collapsed}
                activeRoute={isActive}
                canAccess={canAccess}
                favorites={favorites}
                onNavigate={handleNavigate}
                onFavoriteToggle={favorites.toggleFavorite}
                openSubMenus={openSubMenus}
                onSubMenuToggle={toggleSubMenu}
                currentPlan={currentPlan}
              />
            )
          })}
        </ScrollArea>
      </SidebarContent>

      <ChannableFooter collapsed={collapsed} />
      <SidebarRail />
    </Sidebar>
  )
}
