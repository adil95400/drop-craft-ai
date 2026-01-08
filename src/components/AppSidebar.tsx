/**
 * AppSidebar - Sidebar professionnelle et évolutive pour Shopopti
 * Architecture modulaire avec composants réutilisables
 */
import { useState, useMemo, useCallback, memo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"
import { useFavorites } from "@/stores/favoritesStore"
import { 
  Search, Bot, ShoppingCart, BarChart3, Truck, Upload, Trophy, TrendingUp, 
  Zap, Users, Brain, Shield, Plug, Settings, Package, Sparkles, 
  Crown, Calculator, Megaphone, FileText, Globe, Store, Puzzle, GitCompare, 
  Database, ShoppingBag, GraduationCap, HelpCircle, Activity, Building2, 
  Home, Boxes, CreditCard, LifeBuoy, Video, Tag, Rss, RefreshCw, Target,
  CheckCircle, Clock, Calendar, Star, Eye, Lock, Layers, Plus, Workflow, Play,
  Mail, Code, LayoutDashboard, PackageCheck
} from "lucide-react"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { 
  Sidebar, SidebarContent, SidebarHeader, SidebarRail, useSidebar 
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { MODULE_REGISTRY, NAV_GROUPS, type NavGroupId } from "@/config/modules"
import { useModules } from "@/hooks/useModules"
import { getAccessibleSubModules } from "@/config/sub-modules"

// Composants modulaires de la sidebar
import { SidebarLogo } from "@/components/sidebar/SidebarLogo"
import { SidebarSearch } from "@/components/sidebar/SidebarSearch"
import { SidebarNavGroup } from "@/components/sidebar/SidebarNavGroup"
import { SidebarNavItem } from "@/components/sidebar/SidebarNavItem"
import { SidebarFooterSection } from "@/components/sidebar/SidebarFooterSection"

// Map des icônes - Complète pour tous les modules
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Navigation principale
  'Home': Home, 'LayoutDashboard': LayoutDashboard, 'Store': Store, 'Package': Package,
  'Upload': Upload, 'Truck': Truck, 'ShoppingCart': ShoppingCart,
  'BarChart3': BarChart3, 'Settings': Settings,
  
  // Actions & outils
  'Zap': Zap, 'Sparkles': Sparkles, 'Search': Search, 'Plus': Plus,
  'Link': Database, 'History': Clock, 'RefreshCw': RefreshCw,
  'Layers': Layers,
  
  // Gestion
  'Users': Users, 'Boxes': Boxes, 'Star': Star, 'Eye': Eye,
  'GitBranch': GitCompare, 'CheckCircle': CheckCircle, 'Bell': Activity,
  'RotateCcw': RefreshCw,
  
  // Marketing & Analytics
  'TrendingUp': TrendingUp, 'Megaphone': Megaphone, 'Tag': Tag,
  'Mail': Mail, 'FileText': FileText,
  
  // Feeds & Exports
  'Rss': Rss, 'PackageCheck': PackageCheck,
  
  // Intégrations
  'Plug': Plug, 'Puzzle': Puzzle, 'PuzzlePiece': Puzzle,
  
  // Support & Formation
  'GraduationCap': GraduationCap, 'HelpCircle': HelpCircle,
  'LifeBuoy': LifeBuoy, 'Video': Video,
  
  // Admin & Enterprise
  'Shield': Shield, 'Crown': Crown, 'Brain': Brain, 'Lock': Lock,
  
  // Automation
  'Workflow': Workflow, 'Play': Play, 'Code': Code,
  
  // Autres
  'Bot': Bot, 'Calculator': Calculator, 'Globe': Globe,
  'Database': Database, 'ShoppingBag': ShoppingBag,
  'Activity': Activity, 'Building2': Building2,
  'CreditCard': CreditCard, 'Target': Target,
  'Clock': Clock, 'Calendar': Calendar, 'Trophy': Trophy,
}

// Section Favoris mémorisée
const FavoritesSection = memo<{
  favorites: Array<{ moduleId: string }>
  collapsed: boolean
  isActive: (path: string) => boolean
  canAccess: (moduleId: string) => boolean
  onNavigate: (route: string) => void
  onToggleFavorite: (moduleId: string) => void
}>(({ favorites, collapsed, isActive, canAccess, onNavigate, onToggleFavorite }) => {
  if (favorites.length === 0) return null

  return (
    <div className="px-2 py-2">
      {!collapsed && (
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Favoris
          </span>
          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-auto">
            {favorites.length}
          </Badge>
        </div>
      )}
      <div className="space-y-0.5">
        {favorites.slice(0, 5).map(fav => {
          const module = MODULE_REGISTRY[fav.moduleId]
          if (!module || !canAccess(module.id)) return null
          const Icon = iconMap[module.icon] || Settings
          
          return (
            <SidebarNavItem
              key={module.id}
              id={module.id}
              name={module.name}
              route={module.route}
              icon={Icon}
              isActive={isActive(module.route)}
              hasAccess={true}
              collapsed={collapsed}
              isFavorite={true}
              onFavoriteToggle={() => onToggleFavorite(module.id)}
              onNavigate={onNavigate}
            />
          )
        })}
      </div>
      <Separator className="my-3 bg-sidebar-border/50" />
    </div>
  )
})
FavoritesSection.displayName = 'FavoritesSection'

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useUnifiedAuth()
  
  // État local
  const [searchQuery, setSearchQuery] = useState("")
  const [openGroups, setOpenGroups] = useState<NavGroupId[]>(['home', 'catalog'])
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({})
  
  // Hooks
  const { availableModules, canAccess, isModuleEnabled, currentPlan, isAdminBypass } = useModules()
  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250)

  // Callbacks mémorisés
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

  // Modules groupés et filtrés
  const { modulesByGroup, filteredGroups } = useMemo(() => {
    const grouped: Record<NavGroupId, typeof availableModules> = {} as any
    
    availableModules.forEach(module => {
      if (!module.groupId || !isModuleEnabled(module.id)) return
      if (!grouped[module.groupId]) grouped[module.groupId] = []
      grouped[module.groupId].push(module)
    })

    Object.values(grouped).forEach(modules => {
      modules.sort((a, b) => a.order - b.order)
    })

    const groupsWithModules = NAV_GROUPS.filter(group => grouped[group.id]?.length > 0)
    
    if (!debouncedSearchQuery) {
      return { modulesByGroup: grouped, filteredGroups: groupsWithModules }
    }
    
    const query = debouncedSearchQuery.toLowerCase()
    const filtered = groupsWithModules.filter(group => {
      const groupModules = grouped[group.id] || []
      return groupModules.some(m => 
        m.name.toLowerCase().includes(query) || 
        m.description?.toLowerCase().includes(query)
      )
    })
    
    return { modulesByGroup: grouped, filteredGroups: filtered }
  }, [availableModules, isModuleEnabled, debouncedSearchQuery])

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-sidebar-border bg-sidebar transition-all duration-300"
    >
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border/50 bg-sidebar">
        <div className={cn("p-4", collapsed && "p-3")}>
          <SidebarLogo collapsed={collapsed} />
          
          {isAdminBypass && !collapsed && (
            <Badge className="w-full justify-center mt-3 bg-gradient-to-r from-warning to-destructive text-warning-foreground border-0">
              <Crown className="w-3 h-3 mr-1.5" />
              ADMIN
            </Badge>
          )}
        </div>
        
        {!collapsed && (
          <div className="px-4 pb-4">
            <SidebarSearch 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher un module..."
            />
          </div>
        )}
        
        <div className={cn("px-4 pb-3", collapsed && "px-2")}>
          <ThemeToggle collapsed={collapsed} variant="ghost" className={cn("w-full", collapsed && "mx-auto")} />
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-2 py-2 custom-scrollbar">
        {/* Favoris */}
        <FavoritesSection
          favorites={favorites}
          collapsed={collapsed}
          isActive={isActive}
          canAccess={canAccess}
          onNavigate={handleNavigate}
          onToggleFavorite={toggleFavorite}
        />

        {/* Groupes de navigation */}
        {filteredGroups.map(navGroup => {
          const groupModules = modulesByGroup[navGroup.id] || []
          if (groupModules.length === 0) return null

          const GroupIcon = iconMap[navGroup.icon] || Settings
          const isGroupOpen = openGroups.includes(navGroup.id)

          return (
            <SidebarNavGroup
              key={navGroup.id}
              id={navGroup.id}
              label={navGroup.label}
              icon={GroupIcon}
              isOpen={isGroupOpen}
              onToggle={() => toggleGroup(navGroup.id)}
              collapsed={collapsed}
              itemCount={groupModules.length}
            >
              {groupModules.map(module => {
                const Icon = iconMap[module.icon] || Settings
                const active = isActive(module.route)
                const accessible = canAccess(module.id)
                const subModules = getAccessibleSubModules(module.id, currentPlan)
                const hasSubModules = subModules.length > 0
                const isSubMenuOpen = openSubMenus[module.id]
                const favorite = isFavorite(module.id)

                return (
                  <SidebarNavItem
                    key={module.id}
                    id={module.id}
                    name={module.name}
                    route={module.route}
                    icon={Icon}
                    isActive={active}
                    hasAccess={accessible}
                    collapsed={collapsed}
                    planBadge={module.minPlan !== 'standard' ? module.minPlan as 'pro' | 'ultra_pro' : undefined}
                    isFavorite={favorite}
                    onFavoriteToggle={() => toggleFavorite(module.id)}
                    subItems={hasSubModules ? subModules.map(s => ({
                      id: s.id,
                      name: s.name,
                      route: s.route,
                      icon: s.icon
                    })) : undefined}
                    subItemsOpen={isSubMenuOpen}
                    onSubItemsToggle={() => toggleSubMenu(module.id)}
                    iconMap={iconMap}
                    onNavigate={handleNavigate}
                  />
                )
              })}
            </SidebarNavGroup>
          )
        })}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooterSection collapsed={collapsed} />

      <SidebarRail />
    </Sidebar>
  )
}
